import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    // Fetch client with all related data
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        maintenances: {
          orderBy: { scheduledDate: 'desc' },
        },
        incidents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Calculate maintenance stats
    const maintenanceStats = {
      total: client.maintenances.length,
      completed: client.maintenances.filter(m => m.status === 'COMPLETED').length,
      pending: client.maintenances.filter(m => m.status === 'PENDING').length,
      nextMaintenance: client.maintenances.find(
        m => m.status === 'PENDING' && m.scheduledDate > new Date()
      ),
    }

    // Calculate incident stats
    const incidentStats = {
      total: client.incidents.length,
      open: client.incidents.filter(i => i.status === 'OPEN').length,
      resolved: client.incidents.filter(i => i.status === 'RESOLVED').length,
    }

    // Calculate client tenure
    const tenure = client.installationDate
      ? Math.floor(
          (new Date().getTime() - client.installationDate.getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        )
      : 0

    return NextResponse.json({
      client,
      stats: {
        maintenance: maintenanceStats,
        incidents: incidentStats,
        tenure,
      },
    })
  } catch (error) {
    console.error('Error fetching client details:', error)
    return NextResponse.json(
      { error: 'Error al obtener detalles del cliente' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id
    const data = await request.json()

    const client = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        comuna: data.comuna,
        equipmentType: data.equipmentType,
        installationDate: data.installationDate
          ? new Date(data.installationDate)
          : undefined,
        status: data.status,
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    await prisma.client.delete({
      where: { id: clientId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    )
  }
}
