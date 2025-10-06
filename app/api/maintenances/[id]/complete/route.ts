import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const maintenanceId = params.id
    const data = await request.json()

    // Get maintenance with client and contract info
    const maintenance = await prisma.maintenance.findUnique({
      where: { id: maintenanceId },
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
      return NextResponse.json(
        { error: 'Mantención no encontrada' },
        { status: 404 }
      )
    }

    if (maintenance.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Mantención ya está completada' },
        { status: 400 }
      )
    }

    const contract = maintenance.client.contracts[0]

    if (!contract?.planCode) {
      return NextResponse.json(
        { error: 'Cliente no tiene plan code asignado' },
        { status: 400 }
      )
    }

    // Get filter package for this maintenance
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
      return NextResponse.json(
        { error: `No se encontró paquete de filtros para ${contract.planCode} @ ${cycle} meses` },
        { status: 400 }
      )
    }

    // Start transaction for completion + filter deduction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update maintenance to COMPLETED
      const completedMaintenance = await tx.maintenance.update({
        where: { id: maintenanceId },
        data: {
          status: 'COMPLETED',
          completedDate: new Date(),
          actualDate: data.actualDate ? new Date(data.actualDate) : new Date(),
          notes: data.notes,
          technicianId: data.technicianId,
          observations: data.observations
        }
      })

      // 2. Deduct filters from inventory and record usage
      const deductedFilters = []
      const lowStockWarnings = []

      for (const item of mapping.package.items) {
        // Get current inventory
        const inventory = await tx.inventory.findFirst({
          where: {
            filterId: item.filterId,
            location: 'Bodega Principal'
          }
        })

        if (!inventory) {
          throw new Error(`No se encontró inventario para filtro ${item.filter.sku}`)
        }

        if (inventory.quantity < item.quantity) {
          throw new Error(
            `Stock insuficiente para ${item.filter.sku}: ${inventory.quantity} < ${item.quantity}`
          )
        }

        // Deduct from inventory
        const updatedInventory = await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: {
              decrement: item.quantity
            }
          }
        })

        // Record usage
        await tx.maintenanceFilterUsage.create({
          data: {
            maintenanceId: maintenanceId,
            filterId: item.filterId,
            quantityUsed: item.quantity,
            notes: `Auto-deducted from package ${mapping.package.code}`
          }
        })

        deductedFilters.push({
          sku: item.filter.sku,
          name: item.filter.name,
          quantityUsed: item.quantity,
          previousStock: inventory.quantity,
          newStock: updatedInventory.quantity
        })

        // Check for low stock
        if (updatedInventory.quantity < updatedInventory.minStock) {
          lowStockWarnings.push({
            sku: item.filter.sku,
            name: item.filter.name,
            currentStock: updatedInventory.quantity,
            minStock: updatedInventory.minStock,
            shortage: updatedInventory.minStock - updatedInventory.quantity
          })
        }
      }

      return {
        maintenance: completedMaintenance,
        deductedFilters,
        lowStockWarnings,
        packageUsed: {
          code: mapping.package.code,
          name: mapping.package.name
        }
      }
    })

    return NextResponse.json({
      success: true,
      ...result,
      message: 'Mantención completada y filtros deducidos del inventario'
    })

  } catch (error: any) {
    console.error('Error completing maintenance:', error)
    return NextResponse.json(
      { error: error.message || 'Error al completar mantención' },
      { status: 500 }
    )
  }
}
