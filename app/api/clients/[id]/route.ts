import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id

    // Fetch client with all related data (normalized schema)
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        maintenances: {
          orderBy: { scheduledDate: 'desc' },
        },
        incidents: {
          orderBy: { createdAt: 'desc' },
        },
        equipment: {
          where: { isActive: true },  // Only fetch active equipment
          orderBy: { createdAt: 'desc' },
        },
        contracts: {
          where: { isActive: true },  // Only fetch active contract
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

    // Calculate maintenance stats with health metrics
    const completedMaintenances = client.maintenances.filter(m => m.status === 'COMPLETED')
    const avgDeviation = completedMaintenances.length > 0
      ? completedMaintenances.reduce((sum, m) => sum + (m.deviationDays || 0), 0) / completedMaintenances.length
      : 0

    // Calculate response rate distribution
    const responseRates = {
      excellent: client.maintenances.filter(m => m.responseRate === 'EXCELLENT').length,
      good: client.maintenances.filter(m => m.responseRate === 'GOOD').length,
      fair: client.maintenances.filter(m => m.responseRate === 'FAIR').length,
      poor: client.maintenances.filter(m => m.responseRate === 'POOR').length,
    }

    const maintenanceStats = {
      total: client.maintenances.length,
      completed: completedMaintenances.length,
      pending: client.maintenances.filter(m => m.status === 'PENDING').length,
      complianceRate: client.maintenances.length > 0
        ? Math.round((completedMaintenances.length / client.maintenances.length) * 100)
        : 0,
      avgDeviationDays: Math.round(avgDeviation),
      responseRates,
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

    // Get active equipment and contract (first in array since we only fetch active ones)
    const activeEquipment = client.equipment[0] || null
    const activeContract = client.contracts[0] || null

    // Calculate client tenure from equipment installation date
    const tenure = activeEquipment?.installationDate
      ? Math.floor(
          (new Date().getTime() - new Date(activeEquipment.installationDate).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        )
      : 0

    // Calculate overall health score (0-100)
    const healthScore = Math.round(
      (maintenanceStats.complianceRate * 0.6) + // 60% weight on compliance
      ((100 - Math.min(Math.abs(avgDeviation) * 3, 100)) * 0.3) + // 30% weight on punctuality
      ((100 - (incidentStats.open / (incidentStats.total || 1)) * 100) * 0.1) // 10% weight on incidents
    )

    // Flatten equipment and contract data into client object for UI compatibility
    const clientWithNormalizedData = {
      ...client,
      // Equipment fields (from Equipment table)
      equipmentType: activeEquipment?.equipmentType || null,
      serialNumber: activeEquipment?.serialNumber || null,
      color: activeEquipment?.color || null,
      filterType: activeEquipment?.filterType || null,
      installationDate: activeEquipment?.installationDate || null,
      deliveryType: activeEquipment?.deliveryType || null,
      installerTech: activeEquipment?.installerTechnician || null,
      // Contract fields (from Contracts table)
      planCode: activeContract?.planCode || null,
      planType: activeContract?.planType || null,
      planCurrency: activeContract?.planCurrency || null,
      planValueCLP: activeContract?.planValueCLP || null,
      monthlyValueCLP: activeContract?.monthlyValueCLP || null,
      monthlyValueUF: activeContract?.monthlyValueUF || null,
      discountPercent: activeContract?.discountPercent || null,
      tokuEnabled: activeContract?.tokuEnabled ?? false,
      needsInvoice: activeContract?.needsInvoice ?? null,
    }

    return NextResponse.json({
      client: clientWithNormalizedData,
      stats: {
        maintenance: maintenanceStats,
        incidents: incidentStats,
        tenure,
      },
      healthScore,
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

    // Build update object with only provided fields
    const updateData: any = {}

    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.address !== undefined) updateData.address = data.address
    if (data.comuna !== undefined) updateData.comuna = data.comuna
    if (data.equipmentType !== undefined) updateData.equipmentType = data.equipmentType
    if (data.status !== undefined) updateData.status = data.status
    if (data.generalComments !== undefined) updateData.generalComments = data.generalComments

    if (data.installationDate !== undefined) {
      updateData.installationDate = data.installationDate ? new Date(data.installationDate) : null
    }

    const client = await prisma.client.update({
      where: { id: clientId },
      data: updateData,
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
