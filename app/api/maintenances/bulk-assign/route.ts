import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/maintenances/bulk-assign
 *
 * Bulk assign technician to multiple maintenances
 *
 * Body: {
 *   maintenanceIds: string[],
 *   technicianId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { maintenanceIds, technicianId } = body

    // Validation
    if (!Array.isArray(maintenanceIds) || maintenanceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'maintenanceIds debe ser un array no vacío' },
        { status: 400 }
      )
    }

    if (!technicianId || typeof technicianId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'technicianId es requerido' },
        { status: 400 }
      )
    }

    // Verify technician exists
    const technician = await prisma.user.findFirst({
      where: {
        id: technicianId,
        role: 'TECHNICIAN',
        isActive: true
      }
    })

    if (!technician) {
      return NextResponse.json(
        { success: false, error: 'Técnico no encontrado o inactivo' },
        { status: 404 }
      )
    }

    // Bulk update maintenances
    const result = await prisma.maintenance.updateMany({
      where: {
        id: {
          in: maintenanceIds
        },
        // Only update PENDING maintenances
        status: 'PENDING'
      },
      data: {
        technicianId: technicianId,
        status: 'SCHEDULED' // Change status to SCHEDULED when assigned
      }
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} mantención(es) asignada(s) a ${technician.name}`,
      assignedCount: result.count,
      technician: {
        id: technician.id,
        name: technician.name,
        email: technician.email
      }
    })

  } catch (error) {
    console.error('Error bulk assigning maintenances:', error)
    return NextResponse.json(
      { success: false, error: 'Error al asignar mantenciones' },
      { status: 500 }
    )
  }
}
