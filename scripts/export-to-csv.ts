import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as fs from 'fs'

config({ path: '.env.local' })

const prisma = new PrismaClient()

// Excel date conversion
function excelDateToJS(excelDate: number | string): Date | null {
  if (!excelDate) return null
  if (typeof excelDate === 'string') return new Date(excelDate)
  return new Date((excelDate - 25569) * 86400 * 1000)
}

// Format date for SQL
function formatDate(date: Date | null): string {
  if (!date) return 'NULL'
  try {
    return `'${date.toISOString()}'`
  } catch {
    return 'NULL'
  }
}

// Safe string conversion
function toStr(value: any): string | null {
  if (value === null || value === undefined || value === '') return null
  return String(value).trim()
}

// Escape for SQL
function escapeSql(value: any): string {
  const str = toStr(value)
  if (!str) return 'NULL'
  // Escape single quotes for SQL
  const escaped = str.replace(/'/g, "''")
  return `'${escaped}'`
}

// Normalize delivery type
function normalizeDeliveryType(value: any): string {
  if (!value) return 'NULL'
  const str = String(value).toLowerCase().trim()
  if (str.includes('presencial')) return "'Presencial'"
  if (str.includes('delivery')) return "'Delivery'"
  return 'NULL'
}

// Parse boolean for SQL
function parseBoolean(value: any): string {
  if (value === null || value === undefined || value === '') return 'false'
  const str = String(value).toLowerCase().trim()
  return (str === 'si' || str === 'sí' || str === 'yes' || str === 'true' || str === '1') ? 'true' : 'false'
}

async function exportToCsv() {
  console.log('📊 Reading Excel file...\n')

  const workbook = XLSX.readFile('./data/Clientes_AMAWA_Hogar.xlsx')
  const sheet = workbook.Sheets['Clientes']
  const data = XLSX.utils.sheet_to_json(sheet, { defval: null })

  console.log(`Found ${data.length} rows in Excel\n`)

  // Get all existing clients
  const clients = await prisma.client.findMany({
    select: { id: true, email: true, phone: true }
  })

  console.log(`Found ${clients.length} clients in database\n`)

  // Create email and phone lookup maps
  const emailMap = new Map(clients.filter(c => c.email).map(c => [c.email!.toLowerCase(), c.id]))
  const phoneMap = new Map(clients.filter(c => c.phone).map(c => [c.phone!, c.id]))

  const updates: string[] = []
  const maintenances: string[] = []

  console.log('Processing rows...\n')

  for (const row of data) {
    const rowData = row as any

    const email = rowData['Correo']?.trim().toLowerCase() || null
    const phone = rowData['Celular']?.toString().trim() || null

    // Find client ID
    let clientId = email ? emailMap.get(email) : null
    if (!clientId && phone) clientId = phoneMap.get(phone)
    if (!clientId) continue

    const firstName = escapeSql(rowData['Nombre'])
    const lastName = escapeSql(rowData['Apellido'])
    const rut = escapeSql(rowData['Rut'])
    const propertyType = escapeSql(rowData['Depto/casa/empresa'])
    const propertyNumber = escapeSql(rowData['Numero Depto/casa'])
    const generalComments = escapeSql(rowData['Comentarios generales'])
    const contactChannel = escapeSql(rowData['Canal de contacto'])
    const needsInvoice = parseBoolean(rowData['Necesita Factura'])
    const freeUntilDate = formatDate(excelDateToJS(rowData['Gratis hasta']))
    const serialNumber = escapeSql(rowData['Numero de serie equipo'])
    const color = escapeSql(rowData['Color'])
    const filterType = escapeSql(rowData['Tipo de filtrado'])
    const deliveryType = normalizeDeliveryType(rowData['Delivery/presencial'])
    const installerTech = escapeSql(rowData['Tecnico instalador'])
    const planCode = escapeSql(rowData['Codigo Plan'])
    const planType = escapeSql(rowData['Tipo de Plan'])
    const planCurrency = escapeSql(rowData['UF - CLP'])
    const planValueCLPRaw = parseInt(rowData['Valor plan (CLP)'])
    const monthlyValueCLPRaw = parseInt(rowData['Valor mensual (CLP)'])
    const monthlyValueUFRaw = parseFloat(rowData['Valor mensual (UF)'])
    const discountPercentRaw = parseFloat(rowData['Descuento'])

    const planValueCLP = (!isNaN(planValueCLPRaw)) ? planValueCLPRaw : 'NULL'
    const monthlyValueCLP = (!isNaN(monthlyValueCLPRaw)) ? monthlyValueCLPRaw : 'NULL'
    const monthlyValueUF = (!isNaN(monthlyValueUFRaw)) ? monthlyValueUFRaw : 'NULL'
    const discountPercent = (!isNaN(discountPercentRaw)) ? discountPercentRaw : 'NULL'
    const tokuEnabled = parseBoolean(rowData['TOKU'])
    const technicianNote = escapeSql(rowData['Nota tecnico'])
    const uniqueId = escapeSql(rowData['ID Unico'])
    const startYearRaw = parseInt(rowData['Año'])
    const startMonthRaw = parseInt(rowData['Mes'])
    const startYear = (!isNaN(startYearRaw)) ? startYearRaw : 'NULL'
    const startMonth = (!isNaN(startMonthRaw)) ? startMonthRaw : 'NULL'

    // Build maintenance dates JSON
    const maintenanceDates: string[] = []
    const maint6m = excelDateToJS(rowData['Fecha primera mantención (6 Meses)'])
    const maint12m = excelDateToJS(rowData['Fecha segunda mantención (12 Meses)'])
    const maint18m = excelDateToJS(rowData['Fecha Tercera Mantención (18 Meses)'])
    const maint24m = excelDateToJS(rowData['Fecha Cuarta Mantención'])

    if (maint6m) maintenanceDates.push(`"${maint6m.toISOString()}"`)
    if (maint12m) maintenanceDates.push(`"${maint12m.toISOString()}"`)
    if (maint18m) maintenanceDates.push(`"${maint18m.toISOString()}"`)
    if (maint24m) maintenanceDates.push(`"${maint24m.toISOString()}"`)

    const maintDatesJson = maintenanceDates.length > 0 ? `'[${maintenanceDates.join(',')}]'` : 'NULL'

    // SQL UPDATE statement
    updates.push(`UPDATE clients SET
      first_name = ${firstName},
      last_name = ${lastName},
      rut = ${rut},
      property_type = ${propertyType},
      property_number = ${propertyNumber},
      general_comments = ${generalComments},
      contact_channel = ${contactChannel},
      needs_invoice = ${needsInvoice},
      free_until_date = ${freeUntilDate},
      serial_number = ${serialNumber},
      color = ${color},
      filter_type = ${filterType},
      delivery_type = ${deliveryType},
      installer_technician = ${installerTech},
      plan_code = ${planCode},
      plan_type = ${planType},
      plan_currency = ${planCurrency},
      plan_value_clp = ${planValueCLP},
      monthly_value_clp = ${monthlyValueCLP},
      monthly_value_uf = ${monthlyValueUF},
      discount_percent = ${discountPercent},
      toku_enabled = ${tokuEnabled},
      technician_note = ${technicianNote},
      unique_id = ${uniqueId},
      start_year = ${startYear},
      start_month = ${startMonth},
      maintenance_dates = ${maintDatesJson}
    WHERE id = '${clientId}';`)

    // Create maintenance records
    const observations = escapeSql(rowData['Observaciones'])
    const maintenanceTypes = [
      { date: maint6m, type: '6_months', cycle: 1 },
      { date: maint12m, type: '12_months', cycle: 2 },
      { date: maint18m, type: '18_months', cycle: 3 },
      { date: maint24m, type: '24_months', cycle: 4 },
    ]

    for (const maint of maintenanceTypes) {
      if (!maint.date) continue
      maintenances.push(
        `('${clientId}', '${maint.date.toISOString()}', '${maint.type}', ${maint.cycle}, 'PENDING', ${observations})`
      )
    }
  }

  console.log(`✅ Processed ${updates.length} client updates`)
  console.log(`✅ Prepared ${maintenances.length} maintenance records\n`)

  // Write SQL file
  const sql = `
-- Bulk update all clients with extended data
-- Generated: ${new Date().toISOString()}

BEGIN;

${updates.join('\n\n')}

-- Insert maintenances (ignore duplicates)
INSERT INTO maintenances (client_id, scheduled_date, type, cycle_number, status, observations)
VALUES
${maintenances.join(',\n')}
ON CONFLICT DO NOTHING;

COMMIT;
`

  fs.writeFileSync('./scripts/bulk-update.sql', sql)
  console.log('📝 Written to scripts/bulk-update.sql')
  console.log('\nRun with: psql "YOUR_CONNECTION_STRING" -f scripts/bulk-update.sql\n')

  await prisma.$disconnect()
}

exportToCsv().catch((e) => {
  console.error('Error:', e)
  process.exit(1)
})
