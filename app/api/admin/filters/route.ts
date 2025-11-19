import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/filters
 * List all filters
 */
export async function GET() {
  try {
    const filters = await prisma.filter.findMany({
      orderBy: { sku: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: filters
    })
  } catch (error) {
    console.error('Error fetching filters:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch filters' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/filters
 * Create a new filter
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { sku, name, description, category, unitCost } = body

    // Validation
    if (!sku || !name || !category) {
      return NextResponse.json(
        { success: false, error: 'SKU, nombre y categoría son requeridos' },
        { status: 400 }
      )
    }

    // Check if SKU already exists
    const existing = await prisma.filter.findUnique({
      where: { sku }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: `El filtro con SKU "${sku}" ya existe` },
        { status: 400 }
      )
    }

    const filter = await prisma.filter.create({
      data: {
        sku,
        name,
        description: description || null,
        category,
        unitCost: unitCost ? parseFloat(unitCost) : null
      }
    })

    return NextResponse.json({
      success: true,
      data: filter
    })
  } catch (error) {
    console.error('Error creating filter:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create filter' },
      { status: 500 }
    )
  }
}
