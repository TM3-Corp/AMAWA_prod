import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/incidents
 * Fetch all incidents with optional filtering
 *
 * Query params:
 * - category: Filter by category
 * - status: Filter by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
 * - month: Filter by month
 * - clientId: Filter by client ID
 * - search: Search across client name, technician, equipment, filter type, vtReason, comments
 * - limit: Number of records to return
 * - offset: Number of records to skip
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Build filter object
    const where: any = {}

    const category = searchParams.get('category')
    if (category) {
      where.category = category
    }

    const status = searchParams.get('status')
    if (status) {
      where.status = status
    }

    const month = searchParams.get('month')
    if (month) {
      where.month = month
    }

    const clientId = searchParams.get('clientId')
    if (clientId) {
      where.clientId = clientId
    }

    // Search functionality - search across multiple fields
    const search = searchParams.get('search')
    if (search) {
      where.OR = [
        { technicianName: { contains: search, mode: 'insensitive' } },
        { equipmentType: { contains: search, mode: 'insensitive' } },
        { filterType: { contains: search, mode: 'insensitive' } },
        { vtReason: { contains: search, mode: 'insensitive' } },
        { comments: { contains: search, mode: 'insensitive' } },
        { client: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch incidents with client and maintenance data
    const incidents = await prisma.incident.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            comuna: true,
          }
        },
        maintenance: {
          select: {
            id: true,
            scheduledDate: true,
            type: true,
            cycleNumber: true,
            status: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    })

    // Get total count for pagination
    const total = await prisma.incident.count({ where })

    return NextResponse.json({
      incidents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      }
    })
  } catch (error) {
    console.error('Error fetching incidents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/incidents
 * Create a new incident
 *
 * Body:
 * {
 *   clientId: string (required)
 *   category: string
 *   equipmentType: string
 *   color: string
 *   filterType: string
 *   installationDate: string (ISO date)
 *   deliveryType: string
 *   technicianName: string
 *   vtDate: string (ISO date)
 *   vtReason: string
 *   month: string
 *   comments: string
 *   status: string (OPEN | IN_PROGRESS | RESOLVED | CLOSED)
 *   priority: string (LOW | MEDIUM | HIGH | CRITICAL)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { clientId, ...incidentData } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Convert date strings to Date objects if present
    if (incidentData.installationDate) {
      incidentData.installationDate = new Date(incidentData.installationDate)
    }
    if (incidentData.vtDate) {
      incidentData.vtDate = new Date(incidentData.vtDate)
    }

    // Create incident and update maintenance status if linked
    const incident = await prisma.incident.create({
      data: {
        clientId,
        ...incidentData,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            comuna: true,
          }
        },
        maintenance: {
          select: {
            id: true,
            scheduledDate: true,
            type: true,
            cycleNumber: true,
            status: true,
          }
        }
      }
    })

    // If incident is linked to a maintenance, update the maintenance status
    // Incidents ALWAYS override the maintenance status, regardless of current status
    if (incidentData.maintenanceId && incidentData.category) {
      await prisma.maintenance.update({
        where: { id: incidentData.maintenanceId },
        data: {
          status: incidentData.category // Use incident category as maintenance status
        }
      })
    }

    return NextResponse.json(incident, { status: 201 })
  } catch (error) {
    console.error('Error creating incident:', error)
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    )
  }
}
