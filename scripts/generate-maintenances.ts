import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

config({ path: '.env.local' })

const prisma = new PrismaClient()

// Maintenance cycles configuration
const MAINTENANCE_CYCLES = [
  { cycle: 1, type: '6_months', monthsOffset: 6 },
  { cycle: 2, type: '12_months', monthsOffset: 12 },
  { cycle: 3, type: '18_months', monthsOffset: 18 },
  { cycle: 4, type: '24_months', monthsOffset: 24 },
]

// Add months to a date
function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

async function generateMaintenances() {
  console.log('🔧 Generating missing maintenance records...\n')

  // Get all active equipment with installation dates
  const equipment = await prisma.equipment.findMany({
    where: {
      isActive: true,
      installationDate: { not: null },
    },
    include: {
      client: {
        include: {
          maintenances: {
            orderBy: { cycleNumber: 'asc' },
          },
        },
      },
    },
  })

  console.log(`📊 Found ${equipment.length} equipment with installation dates\n`)

  let created = 0
  let skipped = 0
  let errors = 0

  for (const equip of equipment) {
    try {
      const { client, installationDate } = equip

      if (!installationDate) {
        skipped++
        continue
      }

      // Get existing maintenance cycles for this client
      const existingCycles = new Set(
        client.maintenances
          .filter(m => m.cycleNumber !== null)
          .map(m => m.cycleNumber)
      )

      // Calculate and create missing maintenance cycles
      for (const cycle of MAINTENANCE_CYCLES) {
        // Skip if this cycle already exists
        if (existingCycles.has(cycle.cycle)) {
          continue
        }

        // Calculate scheduled date
        // If previous cycle has actualDate, use that as base
        // Otherwise, use installation date
        let baseDate = installationDate
        const previousCycle = client.maintenances.find(
          m => m.cycleNumber === cycle.cycle - 1 && m.actualDate
        )

        if (previousCycle?.actualDate) {
          baseDate = previousCycle.actualDate
          // Add 6 months from previous actual date
          baseDate = addMonths(baseDate, 6)
        } else {
          // Use installation date + total months
          baseDate = addMonths(installationDate, cycle.monthsOffset)
        }

        // Determine status based on scheduled date
        const now = new Date()
        let status = 'PENDING'
        if (baseDate < now) {
          // Past date - should have been done
          const daysPast = Math.floor((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24))
          if (daysPast > 90) {
            status = 'CANCELLED' // Too old, likely missed
          } else {
            status = 'PENDING' // Still actionable
          }
        }

        // Create the maintenance record
        await prisma.maintenance.create({
          data: {
            clientId: client.id,
            scheduledDate: baseDate,
            type: cycle.type,
            cycleNumber: cycle.cycle,
            status,
            notes: 'Auto-generated from installation date',
          },
        })

        created++
      }

      if ((created + skipped) % 50 === 0) {
        console.log(`✅ Processed ${created + skipped} equipment...`)
      }
    } catch (error: any) {
      errors++
      console.error(`❌ Error processing equipment ${equip.id}:`, error.message)
    }
  }

  console.log(`\n📈 Generation Summary:`)
  console.log(`   ✅ Maintenances created: ${created}`)
  console.log(`   ⚠️  Skipped (no installation date): ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)

  // Show final counts
  const totalMaintenances = await prisma.maintenance.count()
  console.log(`\n📊 Total maintenances in database: ${totalMaintenances}`)

  await prisma.$disconnect()
}

generateMaintenances().catch((e) => {
  console.error('💥 Fatal error:', e)
  process.exit(1)
})
