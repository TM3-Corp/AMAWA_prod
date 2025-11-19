import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get monthly statistics for executive calendar view
 * GET /api/calendar/monthly-stats?startYear=2024&endYear=2026
 *
 * Returns array of month objects with:
 * - Total maintenances
 * - Package breakdown
 * - % Delivery vs Presencial
 * - Work order status and link
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startYear = parseInt(searchParams.get('startYear') || new Date().getFullYear().toString())
    const endYear = parseInt(searchParams.get('endYear') || (new Date().getFullYear() + 1).toString())

    // Get all maintenances in the date range
    const startDate = new Date(startYear, 0, 1)
    const endDate = new Date(endYear, 11, 31, 23, 59, 59)

    const maintenances = await prisma.maintenance.findMany({
      where: {
        scheduledDate: {
          gte: startDate,
          lte: endDate
        },
        client: {
          status: 'ACTIVE' // Only show maintenances for active clients (consistent with maintenances API)
        }
      },
      include: {
        client: {
          include: {
            contracts: {
              where: { isActive: true },
              take: 1
            }
          }
        }
      }
    })

    // Get all work orders in the range
    const workOrders = await prisma.workOrder.findMany({
      where: {
        year: {
          gte: startYear,
          lte: endYear
        }
      }
    })

    // Get all equipment filter mappings for package calculation
    const mappings = await prisma.equipmentFilterMapping.findMany({
      include: {
        package: true
      }
    })

    // Group maintenances by month
    const monthlyData: Record<string, {
      year: number
      month: number
      totalMaintenances: number
      deliveryCount: number
      presencialCount: number
      packageSummary: Record<string, number>
      workOrder: {
        id: string
        status: string
        deliveryType: string
      } | null
    }> = {}

    // Process maintenances
    maintenances.forEach(maintenance => {
      const date = new Date(maintenance.scheduledDate)
      const year = date.getFullYear()
      const month = date.getMonth() + 1 // 1-12
      const key = `${year}-${month}-${maintenance.deliveryType || 'UNKNOWN'}`

      if (!monthlyData[key]) {
        monthlyData[key] = {
          year,
          month,
          totalMaintenances: 0,
          deliveryCount: 0,
          presencialCount: 0,
          packageSummary: {},
          workOrder: null
        }
      }

      monthlyData[key].totalMaintenances++

      // Count by delivery type
      if (maintenance.deliveryType === 'Delivery' || maintenance.deliveryType === 'DOMICILIO') {
        monthlyData[key].deliveryCount++
      } else if (maintenance.deliveryType === 'Presencial' || maintenance.deliveryType === 'PRESENCIAL') {
        monthlyData[key].presencialCount++
      }

      // Calculate package type for this maintenance
      const planCode = maintenance.client.contracts[0]?.planCode
      const cycleMonths = maintenance.cycleNumber ? maintenance.cycleNumber * 6 : 6

      if (planCode && cycleMonths) {
        const mapping = mappings.find(
          m => m.planCode === planCode && m.maintenanceCycle === cycleMonths
        )

        if (mapping && mapping.package) {
          const packageCode = mapping.package.code
          monthlyData[key].packageSummary[packageCode] =
            (monthlyData[key].packageSummary[packageCode] || 0) + 1
        }
      }
    })

    // Add work order information
    workOrders.forEach(wo => {
      const key = `${wo.year}-${wo.month}-${wo.deliveryType}`
      if (monthlyData[key]) {
        monthlyData[key].workOrder = {
          id: wo.id,
          status: wo.status,
          deliveryType: wo.deliveryType
        }
      }
    })

    // Convert to array and sort by date
    const result = Object.values(monthlyData)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.month - b.month
      })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching monthly calendar stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas mensuales' },
      { status: 500 }
    )
  }
}
