import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/incidents/[id]
 * Get a single incident by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
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

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(incident)
  } catch (error) {
    console.error('Error fetching incident:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incident' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/incidents/[id]
 * Update an incident
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Convert date strings to Date objects if present
    if (body.installationDate) {
      body.installationDate = new Date(body.installationDate)
    }
    if (body.vtDate) {
      body.vtDate = new Date(body.vtDate)
    }
    if (body.resolvedAt) {
      body.resolvedAt = new Date(body.resolvedAt)
    }

    // If status is being changed to RESOLVED or CLOSED, set resolvedAt
    if ((body.status === 'RESOLVED' || body.status === 'CLOSED') && !body.resolvedAt) {
      body.resolvedAt = new Date()
    }

    const incident = await prisma.incident.update({
      where: { id: params.id },
      data: body,
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
    if (incident.maintenanceId && incident.category) {
      await prisma.maintenance.update({
        where: { id: incident.maintenanceId },
        data: {
          status: incident.category // Use incident category as maintenance status
        }
      })
    }

    return NextResponse.json(incident)
  } catch (error) {
    console.error('Error updating incident:', error)
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/incidents/[id]
 * Delete an incident
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.incident.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting incident:', error)
    return NextResponse.json(
      { error: 'Failed to delete incident' },
      { status: 500 }
    )
  }
}
