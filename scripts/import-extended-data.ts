import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

config({ path: '.env.local' })

const prisma = new PrismaClient()

// Excel date conversion
function excelDateToJS(excelDate: number | string): Date | null {
  if (!excelDate) return null
  if (typeof excelDate === 'string') return new Date(excelDate)
  return new Date((excelDate - 25569) * 86400 * 1000)
}

// Normalize delivery type
function normalizeDeliveryType(value: any): string | null {
  if (!value) return null
  const str = String(value).toLowerCase().trim()
  if (str.includes('presencial')) return 'Presencial'
  if (str.includes('delivery')) return 'Delivery'
  return null
}

// Parse boolean from Excel
function parseBoolean(value: any): boolean {
  if (value === null || value === undefined || value === '') return false
  const str = String(value).toLowerCase().trim()
  return str === 'si' || str === 'sí' || str === 'yes' || str === 'true' || str === '1'
}

// Calculate response rate from deviation
function calculateResponseRate(deviationDays: number | null): string {
  if (deviationDays === null) return 'PENDING'
  const absDev = Math.abs(deviationDays)
  if (absDev <= 7) return 'EXCELLENT'
  if (absDev <= 14) return 'GOOD'
  if (absDev <= 30) return 'FAIR'
  return 'POOR'
}

async function importExtendedData() {
  console.log('🚀 Starting extended data import...\n')

  const workbook = XLSX.readFile('./data/Clientes_AMAWA_Hogar.xlsx')
  const sheet = workbook.Sheets['Clientes']
  const data = XLSX.utils.sheet_to_json(sheet, { defval: null })

  console.log(`📊 Found ${data.length} rows in Excel\n`)

  let updatedCount = 0
  let maintenancesCreated = 0
  let errors = 0

  for (const [index, row] of data.entries()) {
    try {
      const rowData = row as any

      // Extract all fields from Excel
      const firstName = rowData['Nombre']?.trim() || null
      const lastName = rowData['Apellido']?.trim() || null
      const fullName = rowData['Nombre completo']?.trim() || `${firstName || ''} ${lastName || ''}`.trim()
      const email = rowData['Correo']?.trim().toLowerCase() || null
      const rut = rowData['Rut']?.trim() || null

      // Find existing client by email or phone
      let client = email ? await prisma.client.findUnique({ where: { email } }) : null

      if (!client) {
        const phone = rowData['Celular']?.toString().trim() || null
        if (phone) {
          client = await prisma.client.findFirst({ where: { phone } })
        }
      }

      if (!client) {
        console.log(`⚠️  Row ${index + 2}: Client not found (${fullName})`)
        continue
      }

      // Parse maintenance dates
      const maintenanceDates = []
      const maint6m = excelDateToJS(rowData['Fecha primera mantención (6 Meses)'])
      const maint12m = excelDateToJS(rowData['Fecha segunda mantención (12 Meses)'])
      const maint18m = excelDateToJS(rowData['Fecha Tercera Mantención (18 Meses)'])
      const maint24m = excelDateToJS(rowData['Fecha Cuarta Mantención'])

      if (maint6m) maintenanceDates.push(maint6m.toISOString())
      if (maint12m) maintenanceDates.push(maint12m.toISOString())
      if (maint18m) maintenanceDates.push(maint18m.toISOString())
      if (maint24m) maintenanceDates.push(maint24m.toISOString())

      // Update client with all extended fields
      await prisma.client.update({
        where: { id: client.id },
        data: {
          // Personal
          firstName,
          lastName,
          name: fullName,
          rut,

          // Address
          propertyType: rowData['Depto/casa/empresa']?.trim() || null,
          propertyNumber: rowData['Numero Depto/casa']?.toString().trim() || null,

          // Account
          generalComments: rowData['Comentarios generales']?.trim() || null,
          contactChannel: rowData['Canal de contacto']?.trim() || null,
          needsInvoice: parseBoolean(rowData['Necesita Factura']),
          freeUntilDate: excelDateToJS(rowData['Gratis hasta']),

          // Equipment details
          serialNumber: rowData['Numero de serie equipo']?.toString().trim() || null,
          color: rowData['Color']?.trim() || null,
          filterType: rowData['Tipo de filtrado']?.trim() || null,
          deliveryType: normalizeDeliveryType(rowData['Delivery/presencial']),
          installerTech: rowData['Tecnico instalador']?.trim() || null,

          // Plan & Pricing
          planCode: rowData['Codigo Plan']?.toString().trim() || null,
          planType: rowData['Tipo de Plan']?.trim() || null,
          planCurrency: rowData['UF - CLP']?.toString().toUpperCase().trim() || null,
          planValueCLP: rowData['Valor plan (CLP)'] ? parseInt(rowData['Valor plan (CLP)']) : null,
          monthlyValueCLP: rowData['Valor mensual (CLP)'] ? parseInt(rowData['Valor mensual (CLP)']) : null,
          monthlyValueUF: rowData['Valor mensual (UF)'] ? parseFloat(rowData['Valor mensual (UF)']) : null,
          discountPercent: rowData['Descuento'] ? parseFloat(rowData['Descuento']) : null,

          // Payment
          tokuEnabled: parseBoolean(rowData['TOKU']),

          // Technical
          technicianNote: rowData['Nota tecnico'] ? String(rowData['Nota tecnico']).trim() : null,

          // Metadata
          uniqueId: rowData['ID Unico']?.toString().trim() || null,
          startYear: rowData['Año'] ? parseInt(rowData['Año']) : null,
          startMonth: rowData['Mes'] ? parseInt(rowData['Mes']) : null,

          // Maintenance dates array
          maintenanceDates: maintenanceDates.length > 0 ? maintenanceDates : null,
        },
      })

      updatedCount++

      // Create maintenance records if they don't exist
      const maintenanceTypes = [
        { date: maint6m, type: '6_months', cycle: 1 },
        { date: maint12m, type: '12_months', cycle: 2 },
        { date: maint18m, type: '18_months', cycle: 3 },
        { date: maint24m, type: '24_months', cycle: 4 },
      ]

      for (const maint of maintenanceTypes) {
        if (!maint.date) continue

        // Check if maintenance already exists for this cycle
        const exists = await prisma.maintenance.findFirst({
          where: {
            clientId: client.id,
            cycleNumber: maint.cycle,
          },
        })

        if (!exists) {
          await prisma.maintenance.create({
            data: {
              clientId: client.id,
              scheduledDate: maint.date,
              type: maint.type,
              cycleNumber: maint.cycle,
              status: 'PENDING',
              observations: rowData['Observaciones']?.trim() || null,
            },
          })
          maintenancesCreated++
        }
      }

      if ((index + 1) % 50 === 0) {
        console.log(`✅ Processed ${index + 1}/${data.length} rows...`)
      }
    } catch (error: any) {
      errors++
      console.error(`❌ Error on row ${index + 2}:`, error.message)
    }
  }

  console.log(`\n📈 Import Summary:`)
  console.log(`   ✅ Clients updated: ${updatedCount}`)
  console.log(`   ✅ Maintenances created: ${maintenancesCreated}`)
  console.log(`   ❌ Errors: ${errors}`)

  await prisma.$disconnect()
}

importExtendedData().catch((e) => {
  console.error('💥 Fatal error:', e)
  prisma.$disconnect()
  process.exit(1)
})
