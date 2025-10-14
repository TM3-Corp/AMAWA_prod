import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { calculateEffectiveCycle } from '@/lib/calculate-effective-cycle'

const prisma = new PrismaClient()

/**
 * Generate a work order for a specific month/year and delivery type
 *
 * POST /api/work-orders/generate
 * Body: { month: number, year: number, deliveryType: string }
 *
 * Steps:
 * 1. Get all PENDING maintenances for the specified month/year/deliveryType
 * 2. Calculate filter needs using equipment-filter mappings
 * 3. Create work order with summary data
 * 4. Link maintenances to work order
 * 5. Return work order details
 */
export async function POST(request: NextRequest) {
  try {
    const { month, year, deliveryType } = await request.json()

    // Validation
    if (!month || !year || !deliveryType) {
      return NextResponse.json(
        { error: 'Mes, año y tipo de entrega son requeridos' },
        { status: 400 }
      )
    }

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Mes debe estar entre 1 y 12' },
        { status: 400 }
      )
    }

    if (!['DOMICILIO', 'PRESENCIAL', 'Delivery', 'Presencial'].includes(deliveryType)) {
      return NextResponse.json(
        { error: 'Tipo de entrega debe ser DOMICILIO o PRESENCIAL' },
        { status: 400 }
      )
    }

    // Check if work order already exists for this period
    const existingWorkOrder = await prisma.workOrder.findUnique({
      where: {
        unique_period_delivery: {
          year,
          month,
          deliveryType
        }
      }
    })

    if (existingWorkOrder) {
      return NextResponse.json(
        {
          error: 'Ya existe una orden de trabajo para este período',
          workOrderId: existingWorkOrder.id
        },
        { status: 409 }
      )
    }

    // Get maintenances scheduled for this month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59) // Last day of month

    const maintenances = await prisma.maintenance.findMany({
      where: {
        status: 'PENDING',
        deliveryType: deliveryType,
        workOrderId: null, // Not already in a work order
        scheduledDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        client: {
          include: {
            contracts: {
              where: { isActive: true },
              take: 1
            }
          }
        }
      }
    })

    if (maintenances.length === 0) {
      return NextResponse.json(
        { error: 'No hay mantenciones pendientes para este período' },
        { status: 404 }
      )
    }

    // Calculate filter needs
    const { packageSummary, filterSummary } = await calculateFilterNeeds(maintenances)

    // Calculate delivery date (15th of the month by default)
    const deliveryDate = new Date(year, month - 1, 15, 12, 0, 0)

    // Create work order (DRAFT status)
    const workOrder = await prisma.workOrder.create({
      data: {
        month,
        year,
        deliveryType,
        status: 'DRAFT',
        totalMaintenances: maintenances.length,
        packageSummary,
        filterSummary,
        deliveryDate
      }
    })

    // Link maintenances to work order
    await prisma.maintenance.updateMany({
      where: {
        id: {
          in: maintenances.map(m => m.id)
        }
      },
      data: {
        workOrderId: workOrder.id
      }
    })

    // Return work order with maintenances
    const workOrderWithDetails = await prisma.workOrder.findUnique({
      where: { id: workOrder.id },
      include: {
        maintenances: {
          include: {
            client: {
              include: {
                contracts: {
                  where: { isActive: true }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(workOrderWithDetails, { status: 201 })
  } catch (error) {
    console.error('Error generating work order:', error)
    return NextResponse.json(
      { error: 'Error al generar orden de trabajo' },
      { status: 500 }
    )
  }
}

/**
 * Calculate filter needs for a set of maintenances
 * Returns package summary and filter summary
 */
async function calculateFilterNeeds(maintenances: any[]) {
  // Get all equipment filter mappings
  const mappings = await prisma.equipmentFilterMapping.findMany({
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

  // Group maintenances by plan code and cycle
  const maintenancesByPlanAndCycle: Record<string, number> = {}

  maintenances.forEach(maintenance => {
    const planCode = maintenance.client.contracts[0]?.planCode
    const cycle = calculateEffectiveCycle(maintenance.cycleNumber)

    if (planCode && cycle) {
      const key = `${planCode}-${cycle}`
      maintenancesByPlanAndCycle[key] = (maintenancesByPlanAndCycle[key] || 0) + 1
    }
  })

  // Calculate package needs (e.g., "2.1": 28)
  const packageCounts: Record<string, number> = {}
  const filterCounts: Record<string, number> = {}

  Object.entries(maintenancesByPlanAndCycle).forEach(([key, count]) => {
    const [planCode, cycle] = key.split('-')
    const cycleNum = parseInt(cycle)

    // Find matching mapping
    const mapping = mappings.find(
      m => m.planCode === planCode && m.maintenanceCycle === cycleNum
    )

    if (mapping && mapping.package) {
      // Count packages
      const packageCode = mapping.package.code
      packageCounts[packageCode] = (packageCounts[packageCode] || 0) + count

      // Count individual filters
      mapping.package.items.forEach(item => {
        const filterSku = item.filter.sku
        filterCounts[filterSku] = (filterCounts[filterSku] || 0) + (item.quantity * count)
      })
    }
  })

  return {
    packageSummary: packageCounts,
    filterSummary: filterCounts
  }
}
