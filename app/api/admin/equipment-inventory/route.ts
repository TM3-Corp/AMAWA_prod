import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/equipment-inventory
 * List all equipment inventory records
 */
export async function GET() {
  try {
    const inventory = await prisma.equipmentInventory.findMany({
      orderBy: [
        { equipmentModel: 'asc' }
      ]
    })

    // Calculate "in-use" count for each equipment model
    const equipmentCounts = await prisma.equipment.groupBy({
      by: ['equipmentType'],
      where: { isActive: true },
      _count: true
    })

    // Map counts to inventory
    const inventoryWithUsage = inventory.map(item => {
      // Try to match equipment type from client Equipment records
      // Equipment model format: "WHP-4200S Negro (Ósmosis Inversa)"
      // Equipment type in clients might be: "WHP-4200S Negro" or similar
      const matchingEquipment = equipmentCounts.find(eq =>
        item.equipmentModel.includes(eq.equipmentType || '') ||
        eq.equipmentType?.includes(item.equipmentModel.split(' (')[0])
      )

      return {
        ...item,
        inUseCount: matchingEquipment?._count || 0,
        status: item.quantity < item.minStock ? 'LOW' :
               item.quantity < item.minStock * 2 ? 'WARNING' : 'OK'
      }
    })

    return NextResponse.json({
      success: true,
      data: inventoryWithUsage
    })

  } catch (error) {
    console.error('Error fetching equipment inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch equipment inventory' },
      { status: 500 }
    )
  }
}
