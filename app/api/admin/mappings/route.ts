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

/**
 * POST /api/admin/mappings
 * Create new equipment mappings with cycles
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { planCode, cycles } = body

    // Validation
    if (!planCode || !cycles || cycles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Plan code y ciclos son requeridos' },
        { status: 400 }
      )
    }

    // Check if any cycle mapping already exists for this plan
    const existing = await prisma.equipmentFilterMapping.findFirst({
      where: { planCode }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Ya existen configuraciones para el plan "${planCode}"` },
        { status: 400 }
      )
    }

    // Create all cycle mappings
    const createdMappings = await Promise.all(
      cycles.map((cycle: any) =>
        prisma.equipmentFilterMapping.create({
          data: {
            planCode,
            maintenanceCycle: parseInt(cycle.maintenanceCycle),
            packageId: cycle.packageId
          },
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
      )
    )

    return NextResponse.json({
      success: true,
      data: createdMappings
    })
  } catch (error) {
    console.error('Error creating mappings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create mappings' },
      { status: 500 }
    )
  }
}
