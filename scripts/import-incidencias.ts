import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'

// Load environment variables from .env.local
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

// Helper to convert Excel date numbers to JS Date
function excelDateToJS(excelDate: number): Date | null {
  if (!excelDate || isNaN(excelDate)) return null
  // Excel dates start from 1900-01-01, JS from 1970-01-01
  // 25569 days difference
  return new Date((excelDate - 25569) * 86400 * 1000)
}

async function importIncidenciasFromExcel() {
  console.log('📚 Reading Excel file (Incidencias sheet)...')
  const filePath = path.join(process.cwd(), 'data', 'Clientes_AMAWA_Hogar.xlsx')
  const workbook = XLSX.readFile(filePath)

  // Use the "Incidencias" sheet
  const worksheet = workbook.Sheets['Incidencias']
  if (!worksheet) {
    throw new Error('Sheet "Incidencias" not found in Excel file')
  }

  const data = XLSX.utils.sheet_to_json(worksheet)
  console.log(`Found ${data.length} incident records to process\n`)

  let imported = 0
  let skipped = 0
  let errors = 0
  let clientNotFound = 0

  // Stats tracking
  const categoryCounts: Record<string, number> = {}

  for (const row of data as any[]) {
    try {
      // Build client full name from row
      const clientName = row['Nombre completo'] ||
                         (row.Nombre && row.Apellido ? `${row.Nombre} ${row.Apellido}` : null)

      if (!clientName) {
        console.log('⚠️  Skipping row without client name')
        skipped++
        continue
      }

      // Find matching client in database
      const client = await prisma.client.findFirst({
        where: {
          OR: [
            { name: { contains: clientName, mode: 'insensitive' } },
            { email: row.Correo || undefined },
            { phone: row.Celular || undefined }
          ]
        }
      })

      if (!client) {
        console.log(`❌ Client not found: ${clientName}`)
        clientNotFound++
        continue
      }

      // Convert Excel dates
      const installationDate = row['Fecha instalacion'] ?
        excelDateToJS(row['Fecha instalacion']) : null

      const vtDate = row['Fecha de VT'] ?
        excelDateToJS(row['Fecha de VT']) : null

      // Extract category for stats
      const category = row['Categoría'] || 'Sin categoría'
      categoryCounts[category] = (categoryCounts[category] || 0) + 1

      // Create incident record
      await prisma.incident.create({
        data: {
          clientId: client.id,

          // Equipment details
          equipmentType: row.Equipo || null,
          color: row.Color || null,
          filterType: row['Tipo de Filtro'] || null,
          installationDate,

          // Service details
          deliveryType: row['Tipo de entrega'] || null,
          technicianName: row['Técnico instalador'] || null,

          // VT (Visita Técnica) details
          vtDate,
          vtReason: row['Razón de VT'] || null,

          // Categorization
          category: row['Categoría'] || null,
          month: row.Mes || null,
          comments: row.Comentarios || null,

          // Default status and priority
          status: 'OPEN',
          priority: 'MEDIUM',
        }
      })

      imported++

      if (imported % 20 === 0) {
        console.log(`✅ Imported ${imported} incidents...`)
      }
    } catch (error) {
      console.error(`❌ Error processing incident for ${(row as any).Nombre}:`, error)
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
  console.log(`📈 Total processed: ${data.length}`)

  console.log('\n' + '='.repeat(60))
  console.log('📊 INCIDENTS BY CATEGORY')
  console.log('='.repeat(60))

  // Sort categories by count
  const sortedCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Top 10

  sortedCategories.forEach(([category, count]) => {
    console.log(`${category}: ${count}`)
  })
}

async function main() {
  try {
    await importIncidenciasFromExcel()
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
