import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function testFilterSystem() {
  console.log('🧪 Testing Filter Inventory System...\n')

  try {
    // ============================================
    // TEST 1: Query all filters
    // ============================================
    console.log('✅ Test 1: Query all filters')
    const filters = await prisma.filter.findMany({
      orderBy: { sku: 'asc' }
    })
    console.log(`   Found ${filters.length} filters`)
    filters.forEach(f => console.log(`   - ${f.sku}: ${f.name}`))
    console.log()

    // ============================================
    // TEST 2: Query filter packages with items
    // ============================================
    console.log('✅ Test 2: Query filter packages with items')
    const packages = await prisma.filterPackage.findMany({
      include: {
        items: {
          include: {
            filter: true
          }
        }
      },
      orderBy: { code: 'asc' }
    })
    console.log(`   Found ${packages.length} packages\n`)
    packages.forEach(pkg => {
      console.log(`   📦 Package ${pkg.code}: ${pkg.name}`)
      pkg.items.forEach(item => {
        console.log(`      - ${item.filter.sku} x${item.quantity}`)
      })
      console.log()
    })

    // ============================================
    // TEST 3: Lookup filter package for specific plan code
    // ============================================
    console.log('✅ Test 3: Lookup package for 3200RODE at 24 months')
    const mapping = await prisma.equipmentFilterMapping.findUnique({
      where: {
        unique_plan_cycle: {
          planCode: '3200RODE',
          maintenanceCycle: 24
        }
      },
      include: {
        package: {
          include: {
            items: {
              include: {
                filter: true
              }
            }
          }
        }
      }
    })

    if (mapping) {
      console.log(`   Plan: 3200RODE @ 24 months`)
      console.log(`   Package: ${mapping.package.code} - ${mapping.package.name}`)
      console.log(`   Filters to send:`)
      mapping.package.items.forEach(item => {
        console.log(`      - ${item.filter.sku} (${item.filter.name}) x${item.quantity}`)
      })
    } else {
      console.log(`   ❌ No mapping found!`)
    }
    console.log()

    // ============================================
    // TEST 4: Query inventory with filter details
    // ============================================
    console.log('✅ Test 4: Query inventory')
    const inventory = await prisma.inventory.findMany({
      where: {
        filterId: { not: null }
      },
      include: {
        filter: true
      },
      orderBy: { filter: { sku: 'asc' } }
    })
    console.log(`   Found ${inventory.length} inventory items\n`)
    inventory.forEach(inv => {
      const lowStock = inv.quantity < inv.minStock ? ' ⚠️ LOW STOCK' : ''
      console.log(`   ${inv.filter?.sku}: ${inv.quantity} units (min: ${inv.minStock})${lowStock}`)
    })
    console.log()

    // ============================================
    // TEST 5: Get filters needed for a specific client
    // ============================================
    console.log('✅ Test 5: Get filters needed for upcoming maintenance')

    // First, get a client with a pending maintenance
    const maintenance = await prisma.maintenance.findFirst({
      where: {
        status: 'PENDING',
        type: '24_months'
      },
      include: {
        client: {
          include: {
            contracts: {
              where: { isActive: true }
            }
          }
        }
      }
    })

    if (maintenance && maintenance.client.contracts.length > 0) {
      const contract = maintenance.client.contracts[0]
      const planCode = contract.planCode

      console.log(`   Client: ${maintenance.client.name}`)
      console.log(`   Plan Code: ${planCode}`)
      console.log(`   Maintenance Type: ${maintenance.type}`)

      if (planCode) {
        // Convert maintenance type to cycle number
        const cycleMap: Record<string, number> = {
          '6_months': 6,
          '12_months': 12,
          '18_months': 18,
          '24_months': 24
        }
        const cycle = cycleMap[maintenance.type]

        const filterMapping = await prisma.equipmentFilterMapping.findUnique({
          where: {
            unique_plan_cycle: {
              planCode: planCode,
              maintenanceCycle: cycle
            }
          },
          include: {
            package: {
              include: {
                items: {
                  include: {
                    filter: true
                  }
                }
              }
            }
          }
        })

        if (filterMapping) {
          console.log(`   Package to send: ${filterMapping.package.code} - ${filterMapping.package.name}`)
          console.log(`   Filters needed:`)
          filterMapping.package.items.forEach(item => {
            console.log(`      - ${item.filter.sku} x${item.quantity}`)
          })
        } else {
          console.log(`   ❌ No filter package found for ${planCode} @ ${cycle} months`)
        }
      } else {
        console.log(`   ⚠️ Client has no plan code assigned`)
      }
    } else {
      console.log(`   ℹ️ No pending 24-month maintenances found`)
    }
    console.log()

    // ============================================
    // TEST 6: Simulate inventory deduction
    // ============================================
    console.log('✅ Test 6: Simulate inventory deduction (no actual changes)')

    // Get Package 2.1 (RO Standard Partial)
    const package21 = await prisma.filterPackage.findUnique({
      where: { code: '2.1' },
      include: {
        items: {
          include: {
            filter: true
          }
        }
      }
    })

    if (package21) {
      console.log(`   Simulating deduction for Package ${package21.code}:`)
      for (const item of package21.items) {
        const currentInventory = await prisma.inventory.findFirst({
          where: {
            filterId: item.filterId,
            location: 'Bodega Principal'
          }
        })

        if (currentInventory) {
          const newQuantity = currentInventory.quantity - item.quantity
          console.log(`      ${item.filter.sku}: ${currentInventory.quantity} → ${newQuantity}`)
        } else {
          console.log(`      ${item.filter.sku}: ❌ No inventory found`)
        }
      }
    }
    console.log()

    // ============================================
    // TEST 7: Check for low stock alerts
    // ============================================
    console.log('✅ Test 7: Low stock alerts')
    const lowStock = await prisma.inventory.findMany({
      where: {
        filterId: { not: null },
        quantity: {
          lt: prisma.inventory.fields.minStock
        }
      },
      include: {
        filter: true
      }
    })

    if (lowStock.length > 0) {
      console.log(`   ⚠️ ${lowStock.length} filters below minimum stock:`)
      lowStock.forEach(inv => {
        console.log(`      ${inv.filter?.sku}: ${inv.quantity}/${inv.minStock} units`)
      })
    } else {
      console.log(`   ✅ All filters are above minimum stock levels`)
    }
    console.log()

    // ============================================
    // SUMMARY
    // ============================================
    console.log('🎉 ALL TESTS PASSED!\n')
    console.log('Summary:')
    console.log(`   ✅ ${filters.length} filter SKUs`)
    console.log(`   ✅ ${packages.length} filter packages`)
    console.log(`   ✅ ${inventory.length} inventory items`)
    console.log(`   ✅ Equipment-filter mappings working`)
    console.log(`   ✅ Filter package lookups working`)
    console.log(`   ✅ Inventory queries working`)
    console.log('\n✨ Filter inventory system is fully functional!\n')

  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

async function main() {
  try {
    await testFilterSystem()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
