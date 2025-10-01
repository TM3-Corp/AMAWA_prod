import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all statistics in parallel
    // NOTE: Using string literals instead of Prisma enums because database uses TEXT columns
    // See supabase/fix-enums.sql for converting to proper ENUM types
    const [
      totalClients,
      activeClients,
      pendingMaintenances,
      completedMaintenances,
      inventoryItems,
      openIncidents,
      clientsByComuna,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({ where: { status: 'ACTIVE' as any } }),
      prisma.maintenance.count({ where: { status: 'PENDING' as any } }),
      prisma.maintenance.count({ where: { status: 'COMPLETED' as any } }),
      prisma.inventory.findMany(),
      prisma.incident.count({ where: { status: 'OPEN' as any } }),
      prisma.client.groupBy({
        by: ['comuna'],
        _count: true,
        orderBy: { _count: { comuna: 'desc' } },
        take: 5,
      }),
    ])

    // Calculate maintenance compliance rate
    const totalMaintenances = pendingMaintenances + completedMaintenances
    const complianceRate = totalMaintenances > 0
      ? Math.round((completedMaintenances / totalMaintenances) * 100)
      : 0

    // Calculate total inventory value
    const totalInventoryItems = inventoryItems.reduce((sum, item) => sum + item.quantity, 0)

    // Filter low stock items in JavaScript
    const lowStockItems = inventoryItems.filter(item => item.quantity <= item.minStock)

    return NextResponse.json({
      clients: {
        total: totalClients,
        active: activeClients,
        inactive: totalClients - activeClients,
      },
      maintenances: {
        pending: pendingMaintenances,
        completed: completedMaintenances,
        complianceRate,
        nextMonth: pendingMaintenances, // TODO: Filter by date
      },
      inventory: {
        totalItems: totalInventoryItems,
        lowStock: lowStockItems.length,
        categories: inventoryItems.length,
      },
      incidents: {
        open: openIncidents,
      },
      topComunas: clientsByComuna.map(item => ({
        name: item.comuna || 'Sin Comuna',
        count: item._count,
      })),
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    )
  }
}