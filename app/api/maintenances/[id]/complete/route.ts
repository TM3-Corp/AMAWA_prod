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

    // Get maintenance
    const maintenance = await prisma.maintenance.findUnique({
      where: { id: maintenanceId }
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

    // Update maintenance to COMPLETED
    // Note: Inventory is already deducted when the work order is confirmed (DRAFT → GENERATED)
    // So we just change the status here
    const completedMaintenance = await prisma.maintenance.update({
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

    return NextResponse.json({
      success: true,
      maintenance: completedMaintenance,
      message: 'Mantención completada exitosamente'
    })

  } catch (error: any) {
    console.error('Error completing maintenance:', error)
    return NextResponse.json(
      { error: error.message || 'Error al completar mantención' },
      { status: 500 }
    )
  }
}
