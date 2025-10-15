import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/admin/filter-inventory/[id]
 * Update a single field in filter inventory record
 *
 * Body: { field: string, value: any }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { field, value } = body

    // Validate field is allowed to be updated
    const allowedFields = ['quantity', 'minStock', 'location', 'lastRestocked']
    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { success: false, error: `Field '${field}' is not allowed to be updated` },
        { status: 400 }
      )
    }

    // Validate value type based on field
    let processedValue = value
    if (field === 'quantity' || field === 'minStock') {
      processedValue = parseInt(value)
      if (isNaN(processedValue)) {
        return NextResponse.json(
          { success: false, error: `${field} must be a number` },
          { status: 400 }
        )
      }
    } else if (field === 'lastRestocked') {
      processedValue = value ? new Date(value) : null
    }

    // Update the record
    const updated = await prisma.inventory.update({
      where: { id },
      data: { [field]: processedValue },
      include: {
        filter: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error: any) {
    console.error('Error updating filter inventory:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Filter inventory record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update filter inventory' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/filter-inventory/[id]
 * Get a single filter inventory record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const inventory = await prisma.inventory.findUnique({
      where: { id },
      include: {
        filter: true
      }
    })

    if (!inventory) {
      return NextResponse.json(
        { success: false, error: 'Filter inventory record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inventory
    })

  } catch (error) {
    console.error('Error fetching filter inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch filter inventory' },
      { status: 500 }
    )
  }
}
