import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get all inventory items with filter details
    const inventory = await prisma.inventory.findMany({
      include: {
        filter: true
      },
      orderBy: {
        quantity: 'asc' // Show low stock first
      }
    })

    // Get all filters with their inventory
    const filters = await prisma.filter.findMany({
      include: {
        inventoryItems: true,
        usageRecords: {
          orderBy: {
            deductedAt: 'desc'
          },
          take: 10,
          include: {
            maintenance: {
              include: {
                client: true
              }
            }
          }
        }
      }
    })

    // Calculate total stock by filter
    const stockByFilter = filters.map(filter => {
      const totalStock = filter.inventoryItems.reduce((sum, item) => sum + item.quantity, 0)
      const minStock = filter.inventoryItems.reduce((sum, item) => sum + item.minStock, 0)
      const totalUsage = filter.usageRecords.reduce((sum, record) => sum + record.quantityUsed, 0)

      return {
        id: filter.id,
        sku: filter.sku,
        name: filter.name,
        category: filter.category,
        totalStock,
        minStock,
        totalUsage,
        status: totalStock < minStock ? 'LOW' : totalStock < minStock * 2 ? 'WARNING' : 'OK',
        locations: filter.inventoryItems.map(item => ({
          location: item.location,
          quantity: item.quantity,
          minStock: item.minStock,
          lastRestocked: item.lastRestocked
        })),
        recentUsage: filter.usageRecords
      }
    })

    // Calculate forecast based on pending maintenances
    const pendingMaintenances = await prisma.maintenance.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        client: {
          include: {
            contracts: {
              where: {
                isActive: true
              },
              take: 1
            }
          }
        }
      }
    })

    // Group by maintenance cycle and plan code to calculate needed filters
    const forecastData = await calculateForecast(pendingMaintenances)

    // Get usage statistics
    const usageStats = await prisma.maintenanceFilterUsage.groupBy({
      by: ['filterId'],
      _sum: {
        quantityUsed: true
      },
      _count: {
        id: true
      }
    })

    const stats = {
      totalFilters: filters.length,
      lowStockCount: stockByFilter.filter(f => f.status === 'LOW').length,
      warningStockCount: stockByFilter.filter(f => f.status === 'WARNING').length,
      totalPendingMaintenances: pendingMaintenances.length,
      totalUsageRecords: usageStats.reduce((sum, stat) => sum + (stat._count.id || 0), 0)
    }

    return NextResponse.json({
      inventory,
      stockByFilter,
      forecast: forecastData,
      stats
    })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    )
  }
}

async function calculateForecast(pendingMaintenances: any[]) {
  // Get all equipment filter mappings
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

  // Group maintenances by plan code and cycle
  const maintenancesByPlanAndCycle: Record<string, number> = {}

  pendingMaintenances.forEach(maintenance => {
    const planCode = maintenance.client.contracts[0]?.planCode
    const cycle = maintenance.cycleNumber ? maintenance.cycleNumber * 6 : 6 // Convert cycle to months

    if (planCode && cycle) {
      const key = `${planCode}-${cycle}`
      maintenancesByPlanAndCycle[key] = (maintenancesByPlanAndCycle[key] || 0) + 1
    }
  })

  // Calculate filter needs
  const filterNeeds: Record<string, { sku: string, name: string, quantity: number, maintenances: number }> = {}

  Object.entries(maintenancesByPlanAndCycle).forEach(([key, count]) => {
    const [planCode, cycle] = key.split('-')
    const cycleNum = parseInt(cycle)

    // Find matching mapping
    const mapping = mappings.find(
      m => m.planCode === planCode && m.maintenanceCycle === cycleNum
    )

    if (mapping && mapping.package) {
      // Add filter quantities from this package
      mapping.package.items.forEach(item => {
        const filterKey = item.filter.sku

        if (!filterNeeds[filterKey]) {
          filterNeeds[filterKey] = {
            sku: item.filter.sku,
            name: item.filter.name,
            quantity: 0,
            maintenances: 0
          }
        }

        filterNeeds[filterKey].quantity += item.quantity * count
        filterNeeds[filterKey].maintenances += count
      })
    }
  })

  return Object.values(filterNeeds).sort((a, b) => b.quantity - a.quantity)
}
