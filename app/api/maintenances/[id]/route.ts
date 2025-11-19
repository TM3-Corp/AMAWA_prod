import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const maintenanceId = params.id

    const maintenance = await prisma.maintenance.findUnique({
      where: { id: maintenanceId },
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
        },
        incidents: {
          select: {
            id: true,
            category: true,
            status: true,
            createdAt: true,
            vtDate: true,
            vtReason: true,
            comments: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Mantención no encontrada' },
        { status: 404 }
      )
    }

    // Get required filter package if available
    const contract = maintenance.client.contracts[0]
    let requiredFilters = null

    if (contract?.planCode) {
      const cycleMap: Record<string, number> = {
        '6_months': 6,
        '12_months': 12,
        '18_months': 18,
        '24_months': 24
      }
      const cycle = cycleMap[maintenance.type]

      const mapping = await prisma.equipmentFilterMapping.findUnique({
        where: {
          unique_plan_cycle: {
            planCode: contract.planCode,
            maintenanceCycle: cycle
          }
        },
        include: {
          package: {
            include: {
              items: {
                include: {
                  filter: true
                }
              }
            }
          }
        }
      })

      if (mapping) {
        requiredFilters = {
          packageCode: mapping.package.code,
          packageName: mapping.package.name,
          filters: mapping.package.items.map(item => ({
            sku: item.filter.sku,
            name: item.filter.name,
            quantity: item.quantity
          }))
        }
      }
    }

    // Get all maintenances for this client for the history timeline
    const clientMaintenances = await prisma.maintenance.findMany({
      where: {
        clientId: maintenance.clientId
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    return NextResponse.json({
      maintenance,
      requiredFilters,
      clientMaintenances,
      isOverdue: maintenance.status === 'PENDING' && new Date(maintenance.scheduledDate) < new Date()
    })
  } catch (error) {
    console.error('Error fetching maintenance:', error)
    return NextResponse.json(
      { error: 'Error al obtener mantención' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const maintenanceId = params.id
    const data = await request.json()

    const updateData: any = {}

    if (data.scheduledDate !== undefined) updateData.scheduledDate = new Date(data.scheduledDate)
    if (data.actualDate !== undefined) updateData.actualDate = data.actualDate ? new Date(data.actualDate) : null
    if (data.completedDate !== undefined) updateData.completedDate = data.completedDate ? new Date(data.completedDate) : null
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.observations !== undefined) updateData.observations = data.observations
    if (data.technicianId !== undefined) updateData.technicianId = data.technicianId
    if (data.deviationDays !== undefined) updateData.deviationDays = data.deviationDays
    if (data.responseRate !== undefined) updateData.responseRate = data.responseRate

    const maintenance = await prisma.maintenance.update({
      where: { id: maintenanceId },
      data: updateData,
      include: {
        client: true
      }
    })

    return NextResponse.json(maintenance)
  } catch (error) {
    console.error('Error updating maintenance:', error)
    return NextResponse.json(
      { error: 'Error al actualizar mantención' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const maintenanceId = params.id

    await prisma.maintenance.delete({
      where: { id: maintenanceId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting maintenance:', error)
    return NextResponse.json(
      { error: 'Error al eliminar mantención' },
      { status: 500 }
    )
  }
}
