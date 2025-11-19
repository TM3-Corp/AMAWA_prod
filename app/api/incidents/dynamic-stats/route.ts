import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/incidents/dynamic-stats
 * Get dynamic statistics by any field with filters
 *
 * Query params:
 * - groupBy: Field to group by (category, equipmentType, filterType, technicianName, deliveryType, status)
 * - limit: Top N results (default: 10)
 * - filterField: Optional filter field
 * - filterValue: Optional filter value
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const groupBy = searchParams.get('groupBy') || 'category'
    const limit = parseInt(searchParams.get('limit') || '10')
    const filterField = searchParams.get('filterField')
    const filterValue = searchParams.get('filterValue')

    // Validate groupBy field
    const validFields = ['category', 'equipmentType', 'filterType', 'technicianName', 'deliveryType', 'status', 'month']
    if (!validFields.includes(groupBy)) {
      return NextResponse.json(
        { error: `Invalid groupBy field. Must be one of: ${validFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Build where clause for filters
    const where: any = {}
    if (filterField && filterValue) {
      // Validate filter field
      if (!validFields.includes(filterField)) {
        return NextResponse.json(
          { error: `Invalid filterField. Must be one of: ${validFields.join(', ')}` },
          { status: 400 }
        )
      }
      where[filterField] = filterValue
    }

    // Get grouped data
    const groupedData = await prisma.incident.groupBy({
      by: [groupBy as any],
      where,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    })

    // Format the data
    const formattedData = groupedData.map(item => ({
      label: (item as any)[groupBy] || 'Sin especificar',
      count: item._count.id
    }))

    // Get total count
    const total = await prisma.incident.count({ where })

    return NextResponse.json({
      success: true,
      groupBy,
      filterField: filterField || null,
      filterValue: filterValue || null,
      limit,
      total,
      data: formattedData
    })
  } catch (error) {
    console.error('Error fetching dynamic stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dynamic statistics' },
      { status: 500 }
    )
  }
}
