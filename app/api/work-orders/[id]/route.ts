import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get work order details by ID
 * GET /api/work-orders/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: params.id },
      include: {
        maintenances: {
          include: {
            client: {
              include: {
                contracts: {
                  where: { isActive: true }
                },
                equipment: {
                  where: { isActive: true }
                }
              }
            }
          },
          orderBy: {
            scheduledDate: 'asc'
          }
        },
        filterUsage: {
          include: {
            filter: true
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

    return NextResponse.json(workOrder)
  } catch (error) {
    console.error('Error fetching work order:', error)
    return NextResponse.json(
      { error: 'Error al obtener orden de trabajo' },
      { status: 500 }
    )
  }
}

/**
 * Delete work order
 * DELETE /api/work-orders/[id]
 * Only allowed for DRAFT status
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: params.id }
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }

    if (workOrder.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar órdenes en estado DRAFT' },
        { status: 400 }
      )
    }

    // Unlink maintenances before deleting
    await prisma.maintenance.updateMany({
      where: { workOrderId: params.id },
      data: { workOrderId: null }
    })

    // Delete work order (cascade will delete filter usage)
    await prisma.workOrder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting work order:', error)
    return NextResponse.json(
      { error: 'Error al eliminar orden de trabajo' },
      { status: 500 }
    )
  }
}
