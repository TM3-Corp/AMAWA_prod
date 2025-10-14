import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { calculateEffectiveCycle } from '@/lib/calculate-effective-cycle'

const prisma = new PrismaClient()

/**
 * Preview work order generation (validation phase)
 *
 * POST /api/work-orders/preview
 * Body: { month: number, year: number, deliveryType: string }
 *
 * Returns:
 * - Total maintenances found
 * - Maintenances with valid package mappings
 * - Unmapped maintenances (need reconciliation)
 * - Package and filter summaries
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

    // Get maintenances scheduled for this month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const maintenances = await prisma.maintenance.findMany({
      where: {
        status: 'PENDING',
        deliveryType: deliveryType,
        workOrderId: null,
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

    // Analyze maintenances
    const mappedMaintenances: any[] = []
    const unmappedMaintenances: any[] = []
    const packageCounts: Record<string, number> = {}
    const filterCounts: Record<string, number> = {}

    maintenances.forEach(maintenance => {
      const contract = maintenance.client.contracts[0]
      const planCode = contract?.planCode
      const cycle = calculateEffectiveCycle(maintenance.cycleNumber)

      // Find matching mapping
      const mapping = mappings.find(
        m => m.planCode === planCode && m.maintenanceCycle === cycle
      )

      if (mapping && mapping.package) {
        // Mapped successfully
        mappedMaintenances.push({
          maintenanceId: maintenance.id,
          clientName: maintenance.client.name,
          planCode,
          cycle,
          packageCode: mapping.package.code,
          packageName: mapping.package.name
        })

        // Count packages
        const packageCode = mapping.package.code
        packageCounts[packageCode] = (packageCounts[packageCode] || 0) + 1

        // Count individual filters
        mapping.package.items.forEach(item => {
          const filterSku = item.filter.sku
          filterCounts[filterSku] = (filterCounts[filterSku] || 0) + item.quantity
        })
      } else {
        // Unmapped - needs reconciliation
        unmappedMaintenances.push({
          maintenanceId: maintenance.id,
          clientId: maintenance.client.id,
          clientName: maintenance.client.name,
          planCode: planCode || 'SIN PLAN',
          cycle,
          reason: !planCode
            ? 'Contrato sin código de plan'
            : 'Plan no mapeado a paquete de filtros'
        })
      }
    })

    return NextResponse.json({
      summary: {
        totalMaintenances: maintenances.length,
        mappedCount: mappedMaintenances.length,
        unmappedCount: unmappedMaintenances.length,
        canGenerate: unmappedMaintenances.length === 0
      },
      mapped: mappedMaintenances,
      unmapped: unmappedMaintenances,
      packageSummary: packageCounts,
      filterSummary: filterCounts,
      month,
      year,
      deliveryType
    })
  } catch (error) {
    console.error('Error previewing work order:', error)
    return NextResponse.json(
      { error: 'Error al validar orden de trabajo' },
      { status: 500 }
    )
  }
}
