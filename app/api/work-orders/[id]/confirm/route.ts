import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Confirm a work order (DRAFT → GENERATED)
 * Deducts inventory and locks the work order
 *
 * POST /api/work-orders/[id]/confirm
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: params.id },
      include: {
        filterUsage: true
      }
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }

    if (workOrder.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Solo se pueden confirmar órdenes en estado DRAFT' },
        { status: 400 }
      )
    }

    // Check if already has filter usage (inventory already deducted)
    if (workOrder.filterUsage && workOrder.filterUsage.length > 0) {
      return NextResponse.json(
        { error: 'El inventario ya fue deducido para esta orden' },
        { status: 400 }
      )
    }

    const filterSummary = workOrder.filterSummary as Record<string, number> || {}

    // Get all filters to deduct
    const filters = await prisma.filter.findMany({
      where: {
        sku: {
          in: Object.keys(filterSummary)
        }
      },
      include: {
        inventoryItems: true
      }
    })

    // Check if we have enough stock
    const stockCheck: { sku: string; needed: number; available: number; sufficient: boolean }[] = []

    for (const [sku, quantityNeeded] of Object.entries(filterSummary)) {
      const filter = filters.find(f => f.sku === sku)
      const totalStock = filter?.inventoryItems.reduce((sum, item) => sum + item.quantity, 0) || 0

      stockCheck.push({
        sku,
        needed: quantityNeeded,
        available: totalStock,
        sufficient: totalStock >= quantityNeeded
      })
    }

    const insufficientStock = stockCheck.filter(check => !check.sufficient)

    if (insufficientStock.length > 0) {
      return NextResponse.json(
        {
          error: 'Stock insuficiente para algunos filtros',
          insufficientStock
        },
        { status: 400 }
      )
    }

    // Deduct inventory and create usage records
    for (const [sku, quantityNeeded] of Object.entries(filterSummary)) {
      const filter = filters.find(f => f.sku === sku)
      if (!filter) continue

      let remainingToDeduct = quantityNeeded

      // Deduct from each location until we reach the needed quantity
      for (const inventoryItem of filter.inventoryItems) {
        if (remainingToDeduct <= 0) break

        const deductAmount = Math.min(remainingToDeduct, inventoryItem.quantity)

        // Update inventory
        await prisma.inventory.update({
          where: { id: inventoryItem.id },
          data: {
            quantity: inventoryItem.quantity - deductAmount
          }
        })

        remainingToDeduct -= deductAmount
      }

      // Create work order filter usage record
      await prisma.workOrderFilterUsage.create({
        data: {
          workOrderId: workOrder.id,
          filterId: filter.id,
          quantityUsed: quantityNeeded
        }
      })
    }

    // Update work order status to GENERATED
    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: params.id },
      data: {
        status: 'GENERATED',
        generatedAt: new Date()
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
      inventoryDeducted: stockCheck
    })
  } catch (error) {
    console.error('Error confirming work order:', error)
    return NextResponse.json(
      { error: 'Error al confirmar orden de trabajo' },
      { status: 500 }
    )
  }
}
