import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/mappings
 * List all equipment-filter-package mappings
 */
export async function GET() {
  try {
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
      },
      orderBy: [
        { planCode: 'asc' },
        { maintenanceCycle: 'asc' }
      ]
    })

    // Get all available packages for dropdown options
    const availablePackages = await prisma.filterPackage.findMany({
      include: {
        items: {
          include: {
            filter: true
          }
        }
      },
      orderBy: { code: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: {
        mappings,
        availablePackages
      }
    })

  } catch (error) {
    console.error('Error fetching mappings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mappings' },
      { status: 500 }
    )
  }
}
