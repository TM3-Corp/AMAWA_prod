import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function importEquipmentInventory() {
  console.log('📦 Importing Equipment Inventory from Excel...\n')

  // Read Excel file from parent AMAWA folder
  const filePath = path.join(process.cwd(), '..', 'AMAWA', 'Clientes AMAWA Hogar.xlsx')
  console.log(`Reading file: ${filePath}`)

  try {
    const workbook = XLSX.readFile(filePath)

    // Check if "Inventario de Equipos" sheet exists
    const sheetName = 'Inventario de Equipos'
    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      console.error(`❌ Sheet "${sheetName}" not found in Excel file`)
      console.log('Available sheets:', workbook.SheetNames.join(', '))
      return
    }

    // Parse with header:1 to skip the title row and use row 2 as headers
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
    console.log(`Found ${data.length} rows total\n`)

    // Row 1 (index 1) contains actual headers
    const headers = data[1] as any[]
    console.log('📋 Headers:', headers.filter(h => h).join(' | '))
    console.log()

    // Find column indices
    const productoIdx = headers.findIndex(h => String(h).includes('PRODUCTO'))
    const colorIdx = headers.findIndex(h => String(h).includes('COLOR'))
    const filtracionIdx = headers.findIndex(h => String(h).includes('FILTRACIÓN'))
    const stockIdx = headers.findIndex(h => String(h).includes('STOCK ACTUAL'))
    const equiposInstaladosIdx = headers.findIndex(h => String(h).includes('EQUIPOS INSTALADOS'))

    console.log(`Column indices - Producto: ${productoIdx}, Stock: ${stockIdx}, Color: ${colorIdx}, Filtración: ${filtracionIdx}\n`)

    let imported = 0
    let updated = 0
    let errors = 0
    let skipped = 0

    // Start from row 2 (index 2) - skip title and header rows
    for (let i = 2; i < data.length; i++) {
      const row = data[i] as any[]

      try {
        // Extract fields by index
        const producto = row[productoIdx] ? String(row[productoIdx]).trim() : ''
        const color = row[colorIdx] ? String(row[colorIdx]).trim() : ''
        const filtracion = row[filtracionIdx] ? String(row[filtracionIdx]).trim() : ''
        const stockActual = row[stockIdx] ? parseInt(String(row[stockIdx])) : 0
        const equiposInstalados = row[equiposInstaladosIdx] ? parseInt(String(row[equiposInstaladosIdx])) : 0

        // Skip empty rows
        if (!producto || producto === '') {
          skipped++
          continue
        }

        // Build equipment model name
        let equipmentModel = producto
        if (color) {
          equipmentModel += ` ${color}`
        }
        if (filtracion) {
          equipmentModel += ` (${filtracion})`
        }

        // Skip header-like rows
        if (producto.toUpperCase() === 'PRODUCTO' || equipmentModel.includes('INVENTARIO')) {
          skipped++
          continue
        }

        // Use stock actual as quantity, calculate min stock as 20% of current
        const quantity = stockActual
        const minStock = Math.max(2, Math.floor(stockActual * 0.2))
        const location = 'Bodega Principal'

        // Check if record exists
        const existing = await prisma.equipmentInventory.findFirst({
          where: {
            equipmentModel: equipmentModel,
            location: location
          }
        })

        if (existing) {
          // Update existing record
          await prisma.equipmentInventory.update({
            where: { id: existing.id },
            data: {
              quantity,
              minStock,
              lastRestocked: new Date()
            }
          })
          console.log(`✓ Updated: ${equipmentModel.padEnd(40)} → Stock: ${quantity}, In-use: ${equiposInstalados}`)
          updated++
        } else {
          // Create new record
          await prisma.equipmentInventory.create({
            data: {
              equipmentModel: equipmentModel,
              quantity,
              minStock,
              location,
              lastRestocked: new Date()
            }
          })
          console.log(`✓ Created: ${equipmentModel.padEnd(40)} → Stock: ${quantity}, In-use: ${equiposInstalados}`)
          imported++
        }

      } catch (error) {
        console.error(`❌ Error processing row ${i}:`, error)
        errors++
      }
    }

    console.log(`\n✨ Import complete!`)
    console.log(`✅ Created: ${imported}`)
    console.log(`🔄 Updated: ${updated}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`❌ Errors: ${errors}`)

    // Show summary
    await showInventorySummary()

  } catch (error) {
    console.error('❌ Error reading Excel file:', error)
    throw error
  }
}

async function showInventorySummary() {
  console.log('\n📊 Equipment Inventory Summary:')

  const inventory = await prisma.equipmentInventory.findMany({
    orderBy: { equipmentModel: 'asc' }
  })

  if (inventory.length === 0) {
    console.log('   No equipment inventory records found.')
    return
  }

  console.log('\n┌─────────────────────────────────┬──────────┬───────────┬──────────────────────┐')
  console.log('│ Equipment Model                 │ Quantity │ Min Stock │ Location             │')
  console.log('├─────────────────────────────────┼──────────┼───────────┼──────────────────────┤')

  for (const item of inventory) {
    const status = item.quantity < item.minStock ? '🔴' : '🟢'
    console.log(
      `│ ${item.equipmentModel.padEnd(31)} │ ${String(item.quantity).padStart(8)} │ ${String(item.minStock).padStart(9)} │ ${item.location.padEnd(20)} │ ${status}`
    )
  }

  console.log('└─────────────────────────────────┴──────────┴───────────┴──────────────────────┘\n')

  const lowStock = inventory.filter(i => i.quantity < i.minStock)
  if (lowStock.length > 0) {
    console.log(`⚠️  Warning: ${lowStock.length} equipment models are below minimum stock!`)
  }

  // Calculate total in-use equipment from clients
  const inUseCount = await prisma.equipment.count({
    where: { isActive: true }
  })

  console.log(`\n📈 Statistics:`)
  console.log(`   Total equipment models: ${inventory.length}`)
  console.log(`   Total units in stock: ${inventory.reduce((sum, i) => sum + i.quantity, 0)}`)
  console.log(`   Equipment assigned to clients: ${inUseCount}`)
  console.log(`   Low stock warnings: ${lowStock.length}`)
}

async function main() {
  try {
    console.log('🚀 Starting Equipment Inventory Import...\n')

    await prisma.$connect()
    console.log('✅ Database connected\n')

    await importEquipmentInventory()

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
