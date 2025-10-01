import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

config({ path: '.env.local' })

const prisma = new PrismaClient()

async function testStats() {
  try {
    console.log('Testing stats queries...\n')

    console.log('1. Total clients...')
    const totalClients = await prisma.client.count()
    console.log(`   ✓ Total: ${totalClients}`)

    console.log('2. Active clients...')
    const activeClients = await prisma.client.count({ where: { status: 'ACTIVE' } })
    console.log(`   ✓ Active: ${activeClients}`)

    console.log('3. Pending maintenances...')
    const pendingMaintenances = await prisma.maintenance.count({ where: { status: 'PENDING' } })
    console.log(`   ✓ Pending: ${pendingMaintenances}`)

    console.log('4. Completed maintenances...')
    const completedMaintenances = await prisma.maintenance.count({ where: { status: 'COMPLETED' } })
    console.log(`   ✓ Completed: ${completedMaintenances}`)

    console.log('5. Inventory items...')
    const inventoryItems = await prisma.inventory.findMany()
    console.log(`   ✓ Items: ${inventoryItems.length}`)

    console.log('6. Open incidents...')
    const openIncidents = await prisma.incident.count({ where: { status: 'OPEN' } })
    console.log(`   ✓ Open: ${openIncidents}`)

    console.log('7. Clients by comuna (groupBy)...')
    const clientsByComuna = await prisma.client.groupBy({
      by: ['comuna'],
      _count: true,
      orderBy: { _count: { comuna: 'desc' } },
      take: 5,
    })
    console.log(`   ✓ Top comunas: ${clientsByComuna.length}`)
    clientsByComuna.forEach((item, i) => {
      console.log(`      ${i + 1}. ${item.comuna || 'Sin Comuna'}: ${item._count}`)
    })

    console.log('\n✅ All queries succeeded!')

  } catch (error) {
    console.error('\n❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testStats()
