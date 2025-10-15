import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/filter-inventory
 * List all filter inventory records
 */
export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      where: {
        filterId: { not: null } // Only filter inventory records
      },
      include: {
        filter: true // Include filter details (sku, name, category, etc.)
      },
      orderBy: [
        { filter: { category: 'asc' } },
        { filter: { sku: 'asc' } }
      ]
    })

    // Calculate "in-use" count for each filter
    // Sum up quantities from MaintenanceFilterUsage and WorkOrderFilterUsage
    const filterUsageCounts = await Promise.all(
      inventory.map(async (item) => {
        if (!item.filterId) return { filterId: null, inUse: 0 }

        // Get usage from completed maintenances
        const maintenanceUsage = await prisma.maintenanceFilterUsage.aggregate({
          where: { filterId: item.filterId },
          _sum: { quantityUsed: true }
        })

        // Get usage from active work orders (not cancelled)
        const workOrderUsage = await prisma.workOrderFilterUsage.aggregate({
          where: {
            filterId: item.filterId,
            restoredAt: null // Only count non-restored usage
          },
          _sum: { quantityUsed: true }
        })

        return {
          filterId: item.filterId,
          inUse: (maintenanceUsage._sum.quantityUsed || 0) + (workOrderUsage._sum.quantityUsed || 0)
        }
      })
    )

    // Map usage counts to inventory
    const inventoryWithUsage = inventory.map(item => {
      const usageData = filterUsageCounts.find(u => u.filterId === item.filterId)

      return {
        ...item,
        inUseCount: usageData?.inUse || 0,
        status: item.quantity < item.minStock ? 'LOW' :
               item.quantity < item.minStock * 2 ? 'WARNING' : 'OK'
      }
    })

    return NextResponse.json({
      success: true,
      data: inventoryWithUsage
    })

  } catch (error) {
    console.error('Error fetching filter inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch filter inventory' },
      { status: 500 }
    )
  }
}
