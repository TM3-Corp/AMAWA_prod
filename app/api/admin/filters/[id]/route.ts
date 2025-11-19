import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { sku, name, description, category, unitCost } = body

    const filter = await prisma.filter.update({
      where: { id: params.id },
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
    console.error('Error updating filter:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update filter' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const usageCount = await prisma.filterPackageItem.count({
      where: { filterId: params.id }
    })

    if (usageCount > 0) {
      return NextResponse.json(
        { success: false, error: `Este filtro está siendo usado en ${usageCount} paquete(s)` },
        { status: 400 }
      )
    }

    await prisma.filter.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting filter:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete filter' },
      { status: 500 }
    )
  }
}
