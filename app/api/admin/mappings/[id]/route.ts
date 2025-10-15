import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/admin/mappings/[id]
 * Update a single field in equipment-filter mapping
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
    const allowedFields = ['planCode', 'maintenanceCycle', 'packageId']
    if (!allowedFields.includes(field)) {
      return NextResponse.json(
        { success: false, error: `Field '${field}' is not allowed to be updated` },
        { status: 400 }
      )
    }

    // Validate value type based on field
    let processedValue = value
    if (field === 'maintenanceCycle') {
      processedValue = parseInt(value)
      if (isNaN(processedValue) || ![6, 12, 18, 24].includes(processedValue)) {
        return NextResponse.json(
          { success: false, error: 'Maintenance cycle must be 6, 12, 18, or 24' },
          { status: 400 }
        )
      }
    } else if (field === 'packageId') {
      // Verify package exists
      const packageExists = await prisma.filterPackage.findUnique({
        where: { id: value }
      })
      if (!packageExists) {
        return NextResponse.json(
          { success: false, error: 'Invalid package ID' },
          { status: 400 }
        )
      }
    }

    // Update the record
    const updated = await prisma.equipmentFilterMapping.update({
      where: { id },
      data: { [field]: processedValue },
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

    return NextResponse.json({
      success: true,
      data: updated
    })

  } catch (error: any) {
    console.error('Error updating mapping:', error)

    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Mapping not found' },
        { status: 404 }
      )
    }

    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'A mapping with this plan code and maintenance cycle already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update mapping' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/mappings/[id]
 * Get a single equipment-filter mapping
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const mapping = await prisma.equipmentFilterMapping.findUnique({
      where: { id },
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

    if (!mapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: mapping
    })

  } catch (error) {
    console.error('Error fetching mapping:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mapping' },
      { status: 500 }
    )
  }
}
