import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Update delivery date for a work order
 * POST /api/work-orders/[id]/update-date
 * Body: { deliveryDate: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { deliveryDate } = await request.json()

    if (!deliveryDate) {
      return NextResponse.json(
        { error: 'Fecha de entrega es requerida' },
        { status: 400 }
      )
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id: params.id }
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }

    const updatedWorkOrder = await prisma.workOrder.update({
      where: { id: params.id },
      data: {
        deliveryDate: new Date(deliveryDate)
      }
    })

    return NextResponse.json(updatedWorkOrder)
  } catch (error) {
    console.error('Error updating delivery date:', error)
    return NextResponse.json(
      { error: 'Error al actualizar fecha de entrega' },
      { status: 500 }
    )
  }
}
