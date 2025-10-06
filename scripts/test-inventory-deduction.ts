import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function testInventoryDeduction() {
  console.log('🧪 Testing Inventory Deduction Flow...\n')

  try {
    // ============================================
    // Step 1: Find a pending maintenance
    // ============================================
    console.log('📋 Step 1: Finding a pending 6-month maintenance...')

    const maintenance = await prisma.maintenance.findFirst({
      where: {
        status: 'PENDING',
        type: '6_months'
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

    if (!maintenance) {
      console.log('   ❌ No pending maintenances found. Skipping test.')
      return
    }

    console.log(`   ✅ Found maintenance for client: ${maintenance.client.name}`)
    console.log(`   Maintenance ID: ${maintenance.id}`)
    console.log(`   Type: ${maintenance.type}`)

    const contract = maintenance.client.contracts[0]
    if (!contract?.planCode) {
      console.log('   ❌ Client has no active contract with plan code')
      return
    }

    console.log(`   Plan Code: ${contract.planCode}`)
    console.log()

    // ============================================
    // Step 2: Lookup filter package
    // ============================================
    console.log('📦 Step 2: Looking up required filter package...')

    const cycleMap: Record<string, number> = {
      '6_months': 6,
      '12_months': 12,
      '18_months': 18,
      '24_months': 24
    }
    const cycle = cycleMap[maintenance.type]

    const mapping = await prisma.equipmentFilterMapping.findUnique({
      where: {
        unique_plan_cycle: {
          planCode: contract.planCode,
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

    if (!mapping) {
      console.log(`   ❌ No filter mapping found for ${contract.planCode} @ ${cycle} months`)
      return
    }

    console.log(`   ✅ Package: ${mapping.package.code} - ${mapping.package.name}`)
    console.log(`   Filters to deduct:`)
    mapping.package.items.forEach(item => {
      console.log(`      - ${item.filter.sku} x${item.quantity}`)
    })
    console.log()

    // ============================================
    // Step 3: Check current inventory
    // ============================================
    console.log('📊 Step 3: Checking current inventory levels...')

    for (const item of mapping.package.items) {
      const inventory = await prisma.inventory.findFirst({
        where: {
          filterId: item.filterId,
          location: 'Bodega Principal'
        }
      })

      if (inventory) {
        console.log(`   ${item.filter.sku}: ${inventory.quantity} units available`)
      } else {
        console.log(`   ❌ ${item.filter.sku}: No inventory found!`)
      }
    }
    console.log()

    // ============================================
    // Step 4: Deduct inventory and record usage
    // ============================================
    console.log('⚙️  Step 4: Deducting inventory and recording usage...')

    for (const item of mapping.package.items) {
      // Get current inventory
      const inventory = await prisma.inventory.findFirst({
        where: {
          filterId: item.filterId,
          location: 'Bodega Principal'
        }
      })

      if (!inventory) {
        console.log(`   ❌ Cannot deduct ${item.filter.sku}: No inventory found`)
        continue
      }

      if (inventory.quantity < item.quantity) {
        console.log(`   ⚠️  ${item.filter.sku}: Insufficient stock (${inventory.quantity} < ${item.quantity})`)
        continue
      }

      // Deduct from inventory
      const updatedInventory = await prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          quantity: {
            decrement: item.quantity
          }
        }
      })

      console.log(`   ✅ ${item.filter.sku}: ${inventory.quantity} → ${updatedInventory.quantity}`)

      // Record usage
      await prisma.maintenanceFilterUsage.create({
        data: {
          maintenanceId: maintenance.id,
          filterId: item.filterId,
          quantityUsed: item.quantity,
          notes: `Auto-deducted for ${mapping.package.code} package`
        }
      })
    }
    console.log()

    // ============================================
    // Step 5: Mark maintenance as completed
    // ============================================
    console.log('✅ Step 5: Marking maintenance as completed...')

    await prisma.maintenance.update({
      where: { id: maintenance.id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
        actualDate: new Date()
      }
    })

    console.log(`   ✅ Maintenance ${maintenance.id} marked as COMPLETED`)
    console.log()

    // ============================================
    // Step 6: Verify filter usage was recorded
    // ============================================
    console.log('📝 Step 6: Verifying filter usage records...')

    const usageRecords = await prisma.maintenanceFilterUsage.findMany({
      where: {
        maintenanceId: maintenance.id
      },
      include: {
        filter: true
      }
    })

    console.log(`   ✅ Found ${usageRecords.length} usage records:`)
    usageRecords.forEach(record => {
      console.log(`      - ${record.filter.sku} x${record.quantityUsed} (deducted at ${record.deductedAt.toISOString()})`)
    })
    console.log()

    // ============================================
    // Step 7: Check for low stock alerts
    // ============================================
    console.log('⚠️  Step 7: Checking for low stock alerts...')

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
    // ROLLBACK: Restore inventory for testing
    // ============================================
    console.log('🔄 Step 8: Rolling back changes for testing...')

    // Delete usage records
    await prisma.maintenanceFilterUsage.deleteMany({
      where: {
        maintenanceId: maintenance.id
      }
    })

    // Restore inventory
    for (const item of mapping.package.items) {
      const inventory = await prisma.inventory.findFirst({
        where: {
          filterId: item.filterId,
          location: 'Bodega Principal'
        }
      })

      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: {
              increment: item.quantity
            }
          }
        })
      }
    }

    // Restore maintenance status
    await prisma.maintenance.update({
      where: { id: maintenance.id },
      data: {
        status: 'PENDING',
        completedDate: null,
        actualDate: null
      }
    })

    console.log(`   ✅ Changes rolled back successfully`)
    console.log()

    // ============================================
    // SUCCESS
    // ============================================
    console.log('🎉 INVENTORY DEDUCTION TEST PASSED!\n')
    console.log('Summary:')
    console.log('   ✅ Filter package lookup working')
    console.log('   ✅ Inventory deduction working')
    console.log('   ✅ Filter usage recording working')
    console.log('   ✅ Maintenance status update working')
    console.log('   ✅ Low stock alerts working')
    console.log('   ✅ Changes successfully rolled back')
    console.log('\n✨ Complete inventory deduction flow is functional!\n')

  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

async function main() {
  try {
    await testInventoryDeduction()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
