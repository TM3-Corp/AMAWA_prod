import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function checkInventoryData() {
  console.log('🔍 Checking Inventory Data...\n')

  try {
    // Check Filters
    const filters = await prisma.filter.findMany({
      include: {
        inventoryItems: true,
        packageItems: {
          include: {
            package: true
          }
        }
      }
    })
    console.log(`✅ Filters: ${filters.length} records`)
    if (filters.length > 0) {
      console.log('   Sample:', filters.slice(0, 3).map(f => `${f.sku} (${f.category})`).join(', '))
    }

    // Check Filter Packages
    const packages = await prisma.filterPackage.findMany({
      include: {
        items: {
          include: {
            filter: true
          }
        }
      }
    })
    console.log(`✅ Filter Packages: ${packages.length} records`)
    if (packages.length > 0) {
      console.log('   Sample:', packages.slice(0, 3).map(p => `${p.code} - ${p.name}`).join(', '))
    }

    // Check Inventory Stock
    const inventory = await prisma.inventory.findMany({
      include: {
        filter: true
      }
    })
    console.log(`✅ Inventory: ${inventory.length} records`)
    if (inventory.length > 0) {
      console.log('   Stock levels:')
      inventory.forEach(item => {
        const filterName = item.filter?.sku || item.equipmentType || 'Unknown'
        const status = item.quantity < item.minStock ? '🔴 LOW' : '🟢 OK'
        console.log(`   - ${filterName}: ${item.quantity} units (min: ${item.minStock}) ${status}`)
      })
    }

    // Check Equipment Filter Mappings
    const mappings = await prisma.equipmentFilterMapping.findMany({
      include: {
        package: true
      }
    })
    console.log(`✅ Equipment Filter Mappings: ${mappings.length} records`)
    if (mappings.length > 0) {
      console.log('   Sample:', mappings.slice(0, 3).map(m => `${m.planCode} @ ${m.maintenanceCycle}mo → ${m.package.code}`).join(', '))
    }

    // Check Maintenance Filter Usage
    const usageRecords = await prisma.maintenanceFilterUsage.findMany({
      include: {
        filter: true,
        maintenance: {
          include: {
            client: true
          }
        }
      }
    })
    console.log(`✅ Maintenance Filter Usage: ${usageRecords.length} records`)
    if (usageRecords.length > 0) {
      console.log('   Recent usage:')
      usageRecords.slice(0, 5).forEach(record => {
        console.log(`   - ${record.filter.sku}: ${record.quantityUsed} units (${new Date(record.deductedAt).toLocaleDateString()})`)
      })
    }

    // Summary
    console.log('\n📊 SUMMARY:')
    console.log(`   Filters: ${filters.length}`)
    console.log(`   Packages: ${packages.length}`)
    console.log(`   Inventory Items: ${inventory.length}`)
    console.log(`   Mappings: ${mappings.length}`)
    console.log(`   Usage Records: ${usageRecords.length}`)

    // Calculate forecasted needs
    const pendingMaintenances = await prisma.maintenance.count({
      where: {
        status: 'PENDING'
      }
    })
    console.log(`\n🔮 FORECAST:`)
    console.log(`   Pending Maintenances: ${pendingMaintenances}`)

    // Check if we can calculate forecast
    const clientsWithContracts = await prisma.client.findMany({
      where: {
        contracts: {
          some: {
            isActive: true
          }
        },
        maintenances: {
          some: {
            status: 'PENDING'
          }
        }
      },
      include: {
        contracts: {
          where: {
            isActive: true
          },
          take: 1
        },
        maintenances: {
          where: {
            status: 'PENDING'
          },
          take: 1
        }
      },
      take: 5
    })

    console.log(`   Clients with active contracts & pending maintenances: ${clientsWithContracts.length}`)
    if (clientsWithContracts.length > 0) {
      console.log('   Sample plan codes:', clientsWithContracts.map(c => c.contracts[0]?.planCode || 'N/A').join(', '))
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkInventoryData()
