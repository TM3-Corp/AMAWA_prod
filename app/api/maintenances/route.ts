import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse filters from query params
    const status = searchParams.get('status') // PENDING, SCHEDULED, IN_PROGRESS, COMPLETED, OVERDUE
    const type = searchParams.get('type') // 6_months, 12_months, etc.
    const technicianId = searchParams.get('technicianId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search') // Search by client name
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}

    // Status filter (handle OVERDUE as special case)
    if (status) {
      if (status === 'OVERDUE') {
        where.status = 'PENDING'
        where.scheduledDate = {
          lt: new Date()
        }
      } else {
        where.status = status
      }
    }

    // Type filter
    if (type) {
      where.type = type
    }

    // Technician filter
    if (technicianId) {
      where.technicianId = technicianId
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.scheduledDate = {}
      if (dateFrom) {
        where.scheduledDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.scheduledDate.lte = new Date(dateTo)
      }
    }

    // Client name search
    if (search) {
      where.client = {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      }
    }

    // Get maintenances with related data
    const maintenances = await prisma.maintenance.findMany({
      where,
      include: {
        client: {
          include: {
            equipment: {
              where: { isActive: true }
            },
            contracts: {
              where: { isActive: true }
            }
          }
        },
        filterUsage: {
          include: {
            filter: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const total = await prisma.maintenance.count({ where })

    // Calculate if overdue
    const maintenancesWithOverdue = maintenances.map(m => ({
      ...m,
      isOverdue: m.status === 'PENDING' && new Date(m.scheduledDate) < new Date()
    }))

    return NextResponse.json({
      maintenances: maintenancesWithOverdue,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Error fetching maintenances:', error)
    return NextResponse.json(
      { error: 'Error al obtener mantenciones' },
      { status: 500 }
    )
  }
}

// Create new maintenance
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const maintenance = await prisma.maintenance.create({
      data: {
        clientId: data.clientId,
        scheduledDate: new Date(data.scheduledDate),
        type: data.type,
        cycleNumber: data.cycleNumber,
        status: data.status || 'PENDING',
        notes: data.notes,
        technicianId: data.technicianId,
        observations: data.observations
      },
      include: {
        client: true
      }
    })

    return NextResponse.json(maintenance, { status: 201 })
  } catch (error) {
    console.error('Error creating maintenance:', error)
    return NextResponse.json(
      { error: 'Error al crear mantención' },
      { status: 500 }
    )
  }
}
