import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

function excelDateToJS(excelDate: number): Date | null {
  if (!excelDate || isNaN(excelDate)) return null
  return new Date((excelDate - 25569) * 86400 * 1000)
}

async function importIncidenciasFixed() {
  console.log('📚 Reading Excel file (Incidencias sheet)...')
  const filePath = path.join(process.cwd(), 'data', 'Clientes_AMAWA_Hogar.xlsx')
  const workbook = XLSX.readFile(filePath)

  const worksheet = workbook.Sheets['Incidencias']
  if (!worksheet) {
    throw new Error('Sheet "Incidencias" not found')
  }

  // Get as array of arrays to handle the unusual structure
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })

  console.log(`Found ${rawData.length} total rows\n`)

  let imported = 0
  let skipped = 0
  let errors = 0
  let clientNotFound = 0

  const technicianCounts: Record<string, number> = {}
  const equipmentCounts: Record<string, number> = {}
  const filterTypeCounts: Record<string, number> = {}

  const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                     'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE']

  let currentMonth = ''

  // Start from row 1 (skip first header row 0)
  for (let i = 1; i < rawData.length; i++) {
    try {
      const row = rawData[i]
      const firstCell = String(row[0] || '').trim()

      // Check if this is a month header row
      if (monthNames.includes(firstCell.toUpperCase())) {
        currentMonth = firstCell.toUpperCase()
        console.log(`\n📅 Processing month: ${currentMonth}`)
        continue
      }

      // Skip if it's a column header row (contains "Nombre" in first column and "Apellido" in second)
      if (firstCell.toLowerCase().includes('nombre') && String(row[1] || '').toLowerCase().includes('apellido')) {
        continue
      }

      // Skip empty rows
      if (!firstCell || firstCell === '') {
        continue
      }

      // Extract all fields from the row
      const nombre = firstCell
      const apellido = String(row[1] || '').trim()
      const direccion = String(row[2] || '').trim()
      const comuna = String(row[3] || '').trim()
      const fechaInstalacion = row[5]
      const color = String(row[6] || '').trim()
      const equipo = String(row[7] || '').trim()  // CRITICAL FIELD
      const tipoFiltrado = String(row[8] || '').trim()  // CRITICAL FIELD
      const deliveryPresencial = String(row[9] || '').trim()
      const tecnicoInstalador = String(row[10] || '').trim()  // CRITICAL FIELD
      const fechaVT = row[11]
      const razonVT = String(row[12] || '').trim()
      const comentarios = String(row[13] || '').trim()
      const categoria = String(row[15] || '').trim()  // CATEGORY from column 15!

      // Build full name
      const clientName = apellido ? `${nombre} ${apellido}` : nombre

      // Find matching client
      const client = await prisma.client.findFirst({
        where: {
          OR: [
            { name: { contains: clientName, mode: 'insensitive' } },
            { name: { contains: nombre, mode: 'insensitive' } }
          ]
        }
      })

      if (!client) {
        console.log(`❌ Client not found: ${clientName}`)
        clientNotFound++
        continue
      }

      // Convert dates
      const installationDate = fechaInstalacion ? excelDateToJS(fechaInstalacion) : null
      const vtDate = fechaVT ? excelDateToJS(fechaVT) : null

      // Stats - keep data as it is in Excel, don't derive category
      if (tecnicoInstalador) technicianCounts[tecnicoInstalador] = (technicianCounts[tecnicoInstalador] || 0) + 1
      if (equipo) equipmentCounts[equipo] = (equipmentCounts[equipo] || 0) + 1
      if (tipoFiltrado) filterTypeCounts[tipoFiltrado] = (filterTypeCounts[tipoFiltrado] || 0) + 1

      // Create incident - keep data as it is in Excel
      await prisma.incident.create({
        data: {
          clientId: client.id,
          equipmentType: equipo || null,
          color: color || null,
          filterType: tipoFiltrado || null,
          installationDate,
          deliveryType: deliveryPresencial || null,
          technicianName: tecnicoInstalador || null,
          vtDate,
          vtReason: razonVT || null,
          category: categoria || null, // Category from column [15]
          month: currentMonth || null,
          comments: comentarios || null,
          status: 'CLOSED', // Historical data - mark as closed
          priority: 'MEDIUM',
        }
      })

      imported++

      if (imported % 20 === 0) {
        console.log(`✅ Imported ${imported} incidents...`)
      }

    } catch (error) {
      console.error(`❌ Error processing row ${i}:`, error)
      errors++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 IMPORT SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Successfully imported: ${imported}`)
  console.log(`⚠️  Skipped (no client name): ${skipped}`)
  console.log(`❌ Client not found: ${clientNotFound}`)
  console.log(`❌ Errors: ${errors}`)
  console.log(`📈 Total processed: ${rawData.length}`)
  console.log(`📝 All incidents marked as CLOSED (historical data)`)

  console.log('\n' + '='.repeat(60))
  console.log('📊 TOP TECHNICIANS')
  console.log('='.repeat(60))
  Object.entries(technicianCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([tech, count]) => console.log(`${tech}: ${count}`))

  console.log('\n' + '='.repeat(60))
  console.log('📊 TOP EQUIPMENT TYPES')
  console.log('='.repeat(60))
  Object.entries(equipmentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([equip, count]) => console.log(`${equip}: ${count}`))

  console.log('\n' + '='.repeat(60))
  console.log('📊 FILTER TYPES')
  console.log('='.repeat(60))
  Object.entries(filterTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([filter, count]) => console.log(`${filter}: ${count}`))
}

async function main() {
  try {
    // First, delete existing incidents to re-import with correct data
    console.log('🗑️  Deleting existing incidents...')
    const deleted = await prisma.incident.deleteMany({})
    console.log(`Deleted ${deleted.count} existing incidents\n`)

    await importIncidenciasFixed()
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
