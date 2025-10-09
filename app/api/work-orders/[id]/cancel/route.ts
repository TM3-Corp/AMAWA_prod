import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Cancel a work order (GENERATED → CANCELLED)
 * Restores inventory that was deducted
 *
 * POST /api/work-orders/[id]/cancel
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: params.id },
      include: {
        filterUsage: {
          include: {
            filter: {
              include: {
                inventoryItems: true
              }
            }
          }
        }
      }
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }

    if (workOrder.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Esta orden ya está cancelada' },
        { status: 400 }
      )
    }

    if (workOrder.status !== 'GENERATED') {
      return NextResponse.json(
        { error: 'Solo se pueden cancelar órdenes en estado GENERATED' },
        { status: 400 }
      )
    }

    // Restore inventory for each filter usage
    for (const usage of workOrder.filterUsage) {
      if (usage.restoredAt) {
        // Already restored, skip
        continue
      }

      const filter = usage.filter

      // Find the first available inventory location to restore to
      // Prefer the location with the most stock (likely the main warehouse)
      const inventoryItems = filter.inventoryItems.sort((a, b) => b.quantity - a.quantity)

      if (inventoryItems.length === 0) {
        // Create new inventory item if none exist
        await prisma.inventory.create({
          data: {
            filterId: filter.id,
            quantity: usage.quantityUsed,
            location: 'Bodega Principal'
          }
        })
      } else {
        // Restore to the primary location
        const primaryLocation = inventoryItems[0]

        await prisma.inventory.update({
          where: { id: primaryLocation.id },
          data: {
            quantity: primaryLocation.quantity + usage.quantityUsed
          }
        })
      }

      // Mark usage as restored
      await prisma.workOrderFilterUsage.update({
        where: { id: usage.id },
        data: {
          restoredAt: new Date()
        }
      })
    }

    // Unlink maintenances from this work order
    await prisma.maintenance.updateMany({
      where: { workOrderId: workOrder.id },
      data: { workOrderId: null }
    })

    // Update work order status to CANCELLED
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      },
      include: {
        maintenances: {
          include: {
            client: true
          }
        },
        filterUsage: {
          include: {
            filter: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      workOrder: updatedWorkOrder,
      inventoryRestored: workOrder.filterUsage.map(usage => ({
        sku: usage.filter.sku,
        quantityRestored: usage.quantityUsed
      }))
    })
  } catch (error) {
    console.error('Error cancelling work order:', error)
    return NextResponse.json(
      { error: 'Error al cancelar orden de trabajo' },
      { status: 500 }
    )
  }
}
