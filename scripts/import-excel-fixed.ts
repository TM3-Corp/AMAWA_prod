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

async function importClientsFromExcel() {
  console.log('📚 Reading Excel file...')
  const filePath = path.join(process.cwd(), 'data', 'Clientes_AMAWA_Hogar.xlsx')
  const workbook = XLSX.readFile(filePath)
  
  // Use the "Clientes" sheet specifically
  const worksheet = workbook.Sheets['Clientes']
  if (!worksheet) {
    throw new Error('Sheet "Clientes" not found in Excel file')
  }
  
  const data = XLSX.utils.sheet_to_json(worksheet)
  console.log(`Found ${data.length} records to process`)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const row of data as any[]) {
    try {
      // Skip rows without a name
      if (!row.Nombre) {
        skipped++
        continue
      }

      // Build full name
      const fullName = row['Nombre completo'] || `${row.Nombre} ${row.Apellido || ''}`.trim()
      
      // Convert Excel dates
      const installationDate = row['Fecha instalacion'] ? 
        excelDateToJS(row['Fecha instalacion']) : null

      // Check if client already exists (by email or phone)
      const existingClient = await prisma.client.findFirst({
        where: {
          OR: [
            { email: row.Correo || null },
            { phone: row.Celular || null }
          ].filter(condition => condition.email || condition.phone)
        }
      })

      if (existingClient) {
        console.log(`⚠️  Client already exists: ${fullName}`)
        skipped++
        continue
      }

      // Insert into database
      const client = await prisma.client.create({
        data: {
          name: fullName,
          email: row.Correo || null,
          phone: row.Celular || null,
          address: row.Direccion || null,
          comuna: row.Comuna || null,
          equipmentType: row.Equipo || null,
          installationDate,
          status: 'ACTIVE',
        },
      })

      // Create maintenance records based on maintenance dates
      const maintenanceDates = [
        { date: row['Fecha primera mantención (6 Meses)'], type: 'SIX_MONTHS' },
        { date: row['Fecha segunda mantención (12 Meses)'], type: 'TWELVE_MONTHS' },
        { date: row['Fecha Tercera Mantención (18 Meses)'], type: 'EIGHTEEN_MONTHS' },
        { date: row['Fecha Cuarta Mantención'], type: 'TWENTY_FOUR_MONTHS' },
      ]

      for (const maintenance of maintenanceDates) {
        if (maintenance.date) {
          const scheduledDate = excelDateToJS(maintenance.date)
          if (scheduledDate && scheduledDate > new Date()) {
            await prisma.maintenance.create({
              data: {
                clientId: client.id,
                scheduledDate,
                type: maintenance.type as any,
                status: 'PENDING',
              },
            })
          }
        }
      }

      imported++
      if (imported % 50 === 0) {
        console.log(`✅ Imported ${imported} clients...`)
      }
    } catch (error) {
      console.error(`❌ Error importing ${row.Nombre}:`, (error as Error).message)
      errors++
    }
  }

  console.log(`\n✨ Import complete!`)
  console.log(`✅ Successfully imported: ${imported} clients`)
  console.log(`⚠️  Skipped: ${skipped} (already exist or no name)`)
  console.log(`❌ Errors: ${errors}`)
}

async function importInventory() {
  console.log('\n📦 Importing inventory data...')
  
  const inventoryItems = [
    { equipmentType: 'WHP-3200', quantity: 45, minStock: 10, location: 'Bodega Principal' },
    { equipmentType: 'WHP-4200S Negro', quantity: 187, minStock: 20, location: 'Bodega Principal' },
    { equipmentType: 'WHP-4200S Blanco', quantity: 23, minStock: 15, location: 'Bodega Principal' },
    { equipmentType: 'Filtro Sedimento', quantity: 450, minStock: 100, location: 'Bodega Principal' },
    { equipmentType: 'Filtro Carbón', quantity: 380, minStock: 100, location: 'Bodega Principal' },
  ]

  for (const item of inventoryItems) {
    await prisma.inventory.upsert({
      where: {
        equipmentType_location: {
          equipmentType: item.equipmentType,
          location: item.location,
        },
      },
      update: {
        quantity: item.quantity,
        minStock: item.minStock,
      },
      create: item,
    })
  }
  
  console.log(`✅ Inventory data imported`)
}

async function showStats() {
  console.log('\n📊 Database Statistics:')
  
  const [clientCount, maintenanceCount, inventoryCount] = await Promise.all([
    prisma.client.count(),
    prisma.maintenance.count(),
    prisma.inventory.count(),
  ])
  
  console.log(`   - Clients: ${clientCount}`)
  console.log(`   - Scheduled Maintenances: ${maintenanceCount}`)
  console.log(`   - Inventory Items: ${inventoryCount}`)
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting AMAWA data import...\n')
    
    // Check database connection
    await prisma.$connect()
    console.log('✅ Database connected\n')
    
    // Import clients and maintenances
    await importClientsFromExcel()
    
    // Import inventory
    await importInventory()
    
    // Show final stats
    await showStats()
    
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}