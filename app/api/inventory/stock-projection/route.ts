import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateEffectiveCycle } from '@/lib/calculate-effective-cycle'

/**
 * GET /api/inventory/stock-projection
 *
 * Calculates month-by-month stock projection for the next 6 months
 * showing how current inventory will be consumed by pending maintenances
 *
 * Returns:
 * - Current stock levels
 * - Monthly consumption forecast
 * - Months until stockout per filter
 * - Critical warnings for filters with < 4 months coverage
 */
export async function GET() {
  try {
    const now = new Date()
    const monthsToProject = 6

    // Get current inventory for all filters
    const inventory = await prisma.inventory.findMany({
      where: {
        filterId: { not: null } // Only get inventory items with a linked filter
      },
      include: {
        filter: true
      }
    })

    // Group by filter and sum quantities across locations
    const currentStock: Record<string, {
      filterId: string
      sku: string
      name: string
      totalStock: number
    }> = {}

    inventory.forEach(item => {
      // Skip if filter is null (shouldn't happen with the where clause, but safety check)
      if (!item.filter) return

      if (!currentStock[item.filter.sku]) {
        currentStock[item.filter.sku] = {
          filterId: item.filter.id,
          sku: item.filter.sku,
          name: item.filter.name,
          totalStock: 0
        }
      }
      currentStock[item.filter.sku].totalStock += item.quantity
    })

    // Get pending maintenances for next 6 months
    const endDate = new Date(now.getFullYear(), now.getMonth() + monthsToProject, 0, 23, 59, 59)

    const maintenances = await prisma.maintenance.findMany({
      where: {
        status: 'PENDING',
        scheduledDate: {
          gte: now,
          lte: endDate
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
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    // Get equipment filter mappings
    const mappings = await prisma.equipmentFilterMapping.findMany({
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

    // Group maintenances by month
    const maintenancesByMonth: Record<string, any[]> = {}

    for (let i = 0; i < monthsToProject; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      maintenancesByMonth[key] = []
    }

    maintenances.forEach(maintenance => {
      const date = new Date(maintenance.scheduledDate)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (maintenancesByMonth[key]) {
        maintenancesByMonth[key].push(maintenance)
      }
    })

    // Calculate monthly consumption
    const monthlyProjection: Array<{
      year: number
      month: number
      monthName: string
      maintenancesCount: number
      filterConsumption: Record<string, number>
      remainingStock: Record<string, number>
      criticalFilters: string[]
    }> = []

    // Track running stock levels
    const runningStock: Record<string, number> = {}
    Object.entries(currentStock).forEach(([sku, data]) => {
      runningStock[sku] = data.totalStock
    })

    // Process each month
    Object.entries(maintenancesByMonth).forEach(([key, monthMaintenances]) => {
      const [year, month] = key.split('-').map(Number)
      const monthDate = new Date(year, month - 1, 1)
      const monthName = monthDate.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

      const filterConsumption: Record<string, number> = {}

      // Calculate required filters for this month
      monthMaintenances.forEach(maintenance => {
        const planCode = maintenance.client.contracts[0]?.planCode
        const cycle = calculateEffectiveCycle(maintenance.cycleNumber || 1)

        if (planCode && cycle) {
          const mapping = mappings.find(
            m => m.planCode === planCode && m.maintenanceCycle === cycle
          )

          if (mapping && mapping.package) {
            mapping.package.items.forEach(item => {
              const sku = item.filter.sku
              filterConsumption[sku] = (filterConsumption[sku] || 0) + item.quantity
            })
          }
        }
      })

      // Deduct from running stock
      const remainingStockThisMonth: Record<string, number> = {}
      const criticalFilters: string[] = []

      Object.entries(filterConsumption).forEach(([sku, consumption]) => {
        const beforeStock = runningStock[sku] || 0
        const afterStock = beforeStock - consumption
        runningStock[sku] = Math.max(0, afterStock)
        remainingStockThisMonth[sku] = runningStock[sku]

        // Mark as critical if stock goes negative or very low
        if (afterStock < 0) {
          criticalFilters.push(sku)
        }
      })

      // Also include filters not consumed this month but tracked
      Object.keys(currentStock).forEach(sku => {
        if (!remainingStockThisMonth[sku]) {
          remainingStockThisMonth[sku] = runningStock[sku]
        }
      })

      monthlyProjection.push({
        year,
        month,
        monthName,
        maintenancesCount: monthMaintenances.length,
        filterConsumption,
        remainingStock: remainingStockThisMonth,
        criticalFilters
      })
    })

    // Calculate months of coverage per filter
    const filterCoverage: Record<string, {
      sku: string
      name: string
      currentStock: number
      monthsUntilStockout: number
      isCritical: boolean // < 4 months
      totalFutureConsumption: number
    }> = {}

    Object.entries(currentStock).forEach(([sku, data]) => {
      let cumulativeConsumption = 0
      let monthsUntilStockout = monthsToProject

      // Find when we run out
      for (let i = 0; i < monthlyProjection.length; i++) {
        const monthData = monthlyProjection[i]
        const consumption = monthData.filterConsumption[sku] || 0
        cumulativeConsumption += consumption

        if (cumulativeConsumption > data.totalStock) {
          monthsUntilStockout = i
          break
        }
      }

      const totalFutureConsumption = monthlyProjection.reduce(
        (sum, month) => sum + (month.filterConsumption[sku] || 0),
        0
      )

      filterCoverage[sku] = {
        sku,
        name: data.name,
        currentStock: data.totalStock,
        monthsUntilStockout,
        isCritical: monthsUntilStockout < 4,
        totalFutureConsumption
      }
    })

    // Summary stats
    const criticalFiltersCount = Object.values(filterCoverage).filter(f => f.isCritical).length
    const hasCriticalWarning = criticalFiltersCount > 0

    return NextResponse.json({
      success: true,
      summary: {
        totalFilters: Object.keys(currentStock).length,
        criticalFiltersCount,
        hasCriticalWarning,
        projectionMonths: monthsToProject,
        message: hasCriticalWarning
          ? `⚠️ ${criticalFiltersCount} filtro(s) con menos de 4 meses de cobertura`
          : '✅ Stock suficiente para los próximos 4 meses'
      },
      currentStock,
      monthlyProjection,
      filterCoverage
    })

  } catch (error) {
    console.error('Error calculating stock projection:', error)

    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Error al calcular proyección de stock',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}
