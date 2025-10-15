import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/admin/equipment-inventory/[id]
 * Update a single field in equipment inventory record
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
    const allowedFields = ['quantity', 'minStock', 'unitCost', 'notes', 'lastRestocked']
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
    } else if (field === 'unitCost') {
      processedValue = value ? parseFloat(value) : null
      if (processedValue !== null && isNaN(processedValue)) {
        return NextResponse.json(
          { success: false, error: 'Unit cost must be a number' },
          { status: 400 }
        )
      }
    } else if (field === 'lastRestocked') {
      processedValue = value ? new Date(value) : null
    }

    // Update the record
    const updated = await prisma.equipmentInventory.update({
      where: { id },
      data: { [field]: processedValue }
    })

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error: any) {
    console.error('Error updating equipment inventory:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Equipment inventory record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update equipment inventory' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/equipment-inventory/[id]
 * Get a single equipment inventory record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const inventory = await prisma.equipmentInventory.findUnique({
      where: { id }
    })

    if (!inventory) {
      return NextResponse.json(
        { success: false, error: 'Equipment inventory record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: inventory
    })

  } catch (error) {
    console.error('Error fetching equipment inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch equipment inventory' },
      { status: 500 }
    )
  }
}
