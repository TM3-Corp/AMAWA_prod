import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/filters
 * List all filter master records
 */
export async function GET() {
  try {
    const filters = await prisma.filter.findMany({
      orderBy: [
        { category: 'asc' },
        { sku: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: filters
    })

  } catch (error) {
    console.error('Error fetching filters:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener filtros' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/filters
 * Create a new filter master record
 *
 * Body: {
 *   sku: string (required, unique)
 *   name: string (required)
 *   description?: string (optional)
 *   category: "UF" | "RO" (required)
 *   unitCost?: number (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sku, name, description, category, unitCost } = body

    // Validate required fields
    if (!sku || sku.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El SKU es requerido' },
        { status: 400 }
      )
    }

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    if (!category || !['UF', 'RO'].includes(category)) {
      return NextResponse.json(
        { success: false, error: 'La categoría debe ser "UF" o "RO"' },
        { status: 400 }
      )
    }

    // Validate unit cost if provided
    const parsedUnitCost = unitCost ? parseFloat(unitCost) : null
    if (parsedUnitCost !== null && (isNaN(parsedUnitCost) || parsedUnitCost < 0)) {
      return NextResponse.json(
        { success: false, error: 'El costo unitario debe ser un número válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    // Check for existing SKU (unique constraint)
    const existingFilter = await prisma.filter.findUnique({
      where: { sku: sku.trim().toUpperCase() }
    })

    if (existingFilter) {
      return NextResponse.json(
        { success: false, error: `Ya existe un filtro con el SKU "${sku.toUpperCase()}"` },
        { status: 409 }
      )
    }

    // Create the filter
    const newFilter = await prisma.filter.create({
      data: {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        description: description?.trim() || null,
        category,
        unitCost: parsedUnitCost
      }
    })

    return NextResponse.json({
      success: true,
      data: newFilter,
      message: 'Filtro creado exitosamente'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating filter:', error)

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un filtro con este SKU' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Error al crear el filtro' },
      { status: 500 }
    )
  }
}
