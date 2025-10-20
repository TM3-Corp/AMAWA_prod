import { NextRequest, NextResponse } from 'next/server'
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

/**
 * POST /api/admin/equipment-inventory
 * Create a new equipment inventory record
 *
 * Body: {
 *   equipmentModel: string (required)
 *   quantity: number (required)
 *   minStock: number (required)
 *   location: string (required)
 *   unitCost?: number (optional)
 *   lastRestocked?: string (optional, ISO date)
 *   notes?: string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { equipmentModel, quantity, minStock, location, unitCost, lastRestocked, notes } = body

    // Validate required fields
    if (!equipmentModel || equipmentModel.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El modelo de equipo es requerido' },
        { status: 400 }
      )
    }

    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        { success: false, error: 'La cantidad es requerida' },
        { status: 400 }
      )
    }

    if (minStock === undefined || minStock === null) {
      return NextResponse.json(
        { success: false, error: 'El stock mínimo es requerido' },
        { status: 400 }
      )
    }

    if (!location || location.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'La ubicación es requerida' },
        { status: 400 }
      )
    }

    // Validate number types
    const parsedQuantity = parseInt(quantity)
    const parsedMinStock = parseInt(minStock)
    const parsedUnitCost = unitCost ? parseFloat(unitCost) : null

    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return NextResponse.json(
        { success: false, error: 'La cantidad debe ser un número válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    if (isNaN(parsedMinStock) || parsedMinStock < 0) {
      return NextResponse.json(
        { success: false, error: 'El stock mínimo debe ser un número válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    if (parsedUnitCost !== null && (isNaN(parsedUnitCost) || parsedUnitCost < 0)) {
      return NextResponse.json(
        { success: false, error: 'El costo unitario debe ser un número válido mayor o igual a 0' },
        { status: 400 }
      )
    }

    // Check for existing record with same model and location (unique constraint)
    const existingRecord = await prisma.equipmentInventory.findFirst({
      where: {
        equipmentModel: equipmentModel.trim(),
        location: location.trim()
      }
    })

    if (existingRecord) {
      return NextResponse.json(
        { success: false, error: `Ya existe un registro de "${equipmentModel}" en la ubicación "${location}"` },
        { status: 409 }
      )
    }

    // Create the equipment inventory record
    const newEquipment = await prisma.equipmentInventory.create({
      data: {
        equipmentModel: equipmentModel.trim(),
        quantity: parsedQuantity,
        minStock: parsedMinStock,
        location: location.trim(),
        unitCost: parsedUnitCost,
        lastRestocked: lastRestocked ? new Date(lastRestocked) : null,
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json({
      success: true,
      data: newEquipment,
      message: 'Equipo creado exitosamente'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating equipment inventory:', error)

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un registro con este modelo y ubicación' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Error al crear el equipo en inventario' },
      { status: 500 }
    )
  }
}
