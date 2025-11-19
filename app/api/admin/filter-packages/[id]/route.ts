import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { code, name, description, items } = body

    const filterPackage = await prisma.filterPackage.update({
      where: { id: params.id },
      data: {
        code,
        name,
        description: description || null,
        items: {
          deleteMany: {},
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
    console.error('Error updating package:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update package' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const usageCount = await prisma.equipmentFilterMapping.count({
      where: { packageId: params.id }
    })

    if (usageCount > 0) {
      return NextResponse.json(
        { success: false, error: `Este paquete está siendo usado en ${usageCount} mapeo(s)` },
        { status: 400 }
      )
    }

    await prisma.filterPackage.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting package:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete package' },
      { status: 500 }
    )
  }
}
