import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all work orders with optional filters
 * GET /api/work-orders?status=DRAFT&year=2025&month=10
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const status = searchParams.get('status')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const deliveryType = searchParams.get('deliveryType')

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (year) {
      where.year = parseInt(year)
    }

    if (month) {
      where.month = parseInt(month)
    }

    if (deliveryType) {
      where.deliveryType = deliveryType
    }

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        maintenances: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                address: true,
                comuna: true
              }
            }
          }
        },
        filterUsage: {
          include: {
            filter: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json(workOrders)
  } catch (error) {
    console.error('Error fetching work orders:', error)
    return NextResponse.json(
      { error: 'Error al obtener órdenes de trabajo' },
      { status: 500 }
    )
  }
}
