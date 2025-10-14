import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get available packages for a specific plan code
 *
 * GET /api/plans/[planCode]/packages?cycle=12
 *
 * Returns all packages mapped to this plan code
 * If cycle is specified, returns the specific package for that cycle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { planCode: string } }
) {
  try {
    const planCode = params.planCode
    const searchParams = request.nextUrl.searchParams
    const cycle = searchParams.get('cycle')

    // Get mappings for this plan code
    const mappings = await prisma.equipmentFilterMapping.findMany({
      where: {
        planCode,
        ...(cycle && { maintenanceCycle: parseInt(cycle) })
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
      },
      orderBy: {
        maintenanceCycle: 'asc'
      }
    })

    if (mappings.length === 0) {
      return NextResponse.json(
        { error: `No se encontraron paquetes para el plan ${planCode}` },
        { status: 404 }
      )
    }

    // Format response
    const packages = mappings.map(mapping => ({
      cycle: mapping.maintenanceCycle,
      packageCode: mapping.package.code,
      packageName: mapping.package.name,
      filters: mapping.package.items.map(item => ({
        sku: item.filter.sku,
        name: item.filter.name,
        quantity: item.quantity
      }))
    }))

    return NextResponse.json({
      planCode,
      packages,
      ...(cycle && packages.length === 1 && { selectedPackage: packages[0] })
    })
  } catch (error) {
    console.error('Error getting plan packages:', error)
    return NextResponse.json(
      { error: 'Error al obtener paquetes del plan' },
      { status: 500 }
    )
  }
}
