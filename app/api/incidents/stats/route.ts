import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/incidents/stats
 * Get incident statistics and analytics
 *
 * Returns:
 * - Total incidents
 * - Incidents by category
 * - Incidents by status
 * - Incidents by month
 * - Incidents by technician
 * - Recent incidents
 */
export async function GET(request: NextRequest) {
  try {
    // Total incidents
    const total = await prisma.incident.count()

    // Incidents by category
    const byCategory = await prisma.incident.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Incidents by status
    const byStatus = await prisma.incident.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    // Incidents by month
    const byMonth = await prisma.incident.groupBy({
      by: ['month'],
      _count: {
        id: true
      },
      where: {
        month: {
          not: null
        }
      },
      orderBy: {
        month: 'asc'
      }
    })

    // Incidents by technician
    const byTechnician = await prisma.incident.groupBy({
      by: ['technicianName'],
      _count: {
        id: true
      },
      where: {
        technicianName: {
          not: null
        }
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Recent incidents (last 10)
    const recent = await prisma.incident.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            comuna: true,
          }
        }
      }
    })

    // Format the data for charts
    const categoryData = byCategory.map(item => ({
      category: item.category || 'Sin categoría',
      count: item._count.id
    }))

    const statusData = byStatus.map(item => ({
      status: item.status,
      count: item._count.id
    }))

    const monthData = byMonth.map(item => ({
      month: item.month || 'Sin mes',
      count: item._count.id
    }))

    const technicianData = byTechnician.map(item => ({
      technician: item.technicianName || 'Sin técnico',
      count: item._count.id
    }))

    return NextResponse.json({
      total,
      byCategory: categoryData,
      byStatus: statusData,
      byMonth: monthData,
      byTechnician: technicianData,
      recent,
    })
  } catch (error) {
    console.error('Error fetching incident stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incident statistics' },
      { status: 500 }
    )
  }
}
