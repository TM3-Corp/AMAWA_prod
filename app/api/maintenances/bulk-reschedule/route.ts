import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { maintenanceIds, newDate, notes } = body

    // Validation
    if (!Array.isArray(maintenanceIds) || maintenanceIds.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere un array de IDs de mantenciones' },
        { status: 400 }
      )
    }

    if (!newDate) {
      return NextResponse.json(
        { error: 'Se requiere una nueva fecha' },
        { status: 400 }
      )
    }

    // Update all selected maintenances
    const result = await prisma.maintenance.updateMany({
      where: {
        id: {
          in: maintenanceIds
        },
        // Only allow rescheduling pending or scheduled maintenances
        status: {
          in: ['PENDING', 'SCHEDULED']
        }
      },
      data: {
        scheduledDate: new Date(newDate),
        status: 'RESCHEDULED',
        notes: notes || null,
        updatedAt: new Date()
      }
    })

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'No se pudieron reprogramar las mantenciones seleccionadas' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `${result.count} mantención(es) reprogramada(s) exitosamente`
    })

  } catch (error) {
    console.error('Error rescheduling maintenances:', error)
    return NextResponse.json(
      { error: 'Error al reprogramar mantenciones' },
      { status: 500 }
    )
  }
}
