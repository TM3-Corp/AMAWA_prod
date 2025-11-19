import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    // Fetch all maintenances for this client
    const maintenances = await prisma.maintenance.findMany({
      where: {
        clientId,
        // Only show pending or scheduled maintenances (not completed)
        status: {
          in: ['PENDING', 'SCHEDULED', 'NO_RESPONDE', 'RESCHEDULED']
        }
      },
      select: {
        id: true,
        scheduledDate: true,
        type: true,
        cycleNumber: true,
        status: true,
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    return NextResponse.json({ maintenances })
  } catch (error) {
    console.error('Error fetching client maintenances:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenances' },
      { status: 500 }
    )
  }
}
