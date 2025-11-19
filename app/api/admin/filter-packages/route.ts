import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/filter-packages
 * List all filter packages with their items
 */
export async function GET() {
  try {
    const packages = await prisma.filterPackage.findMany({
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
      data: packages
    })
  } catch (error) {
    console.error('Error fetching filter packages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch filter packages' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/filter-packages
 * Create a new filter package with items
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, name, description, items } = body

    // Validation
    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: 'Código y nombre son requeridos' },
        { status: 400 }
      )
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Debe incluir al menos un filtro' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existing = await prisma.filterPackage.findUnique({
      where: { code }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: `El paquete con código "${code}" ya existe` },
        { status: 400 }
      )
    }

    // Create package with items
    const filterPackage = await prisma.filterPackage.create({
      data: {
        code,
        name,
        description: description || null,
        items: {
          create: items.map((item: any) => ({
            filterId: item.filterId,
            quantity: parseInt(item.quantity) || 1
          }))
        }
      },
      include: {
        items: {
          include: {
            filter: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: filterPackage
    })
  } catch (error) {
    console.error('Error creating filter package:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create filter package' },
      { status: 500 }
    )
  }
}
