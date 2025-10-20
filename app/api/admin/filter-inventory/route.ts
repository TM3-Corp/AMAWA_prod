import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/filter-inventory
 * List all filter inventory records
 */
export async function GET() {
  try {
    const inventory = await prisma.inventory.findMany({
      where: {
        filterId: { not: null } // Only filter inventory records
      },
      include: {
        filter: true // Include filter details (sku, name, category, etc.)
      },
      orderBy: [
        { filter: { category: 'asc' } },
        { filter: { sku: 'asc' } }
      ]
    })

    // Calculate "in-use" count for each filter
    // Sum up quantities from MaintenanceFilterUsage and WorkOrderFilterUsage
    const filterUsageCounts = await Promise.all(
      inventory.map(async (item) => {
        if (!item.filterId) return { filterId: null, inUse: 0 }

        // Get usage from completed maintenances
        const maintenanceUsage = await prisma.maintenanceFilterUsage.aggregate({
          where: { filterId: item.filterId },
          _sum: { quantityUsed: true }
        })

        // Get usage from active work orders (not cancelled)
        const workOrderUsage = await prisma.workOrderFilterUsage.aggregate({
          where: {
            filterId: item.filterId,
            restoredAt: null // Only count non-restored usage
          },
          _sum: { quantityUsed: true }
        })

        return {
          filterId: item.filterId,
          inUse: (maintenanceUsage._sum.quantityUsed || 0) + (workOrderUsage._sum.quantityUsed || 0)
        }
      })
    )

    // Map usage counts to inventory
    const inventoryWithUsage = inventory.map(item => {
      const usageData = filterUsageCounts.find(u => u.filterId === item.filterId)

      return {
        ...item,
        inUseCount: usageData?.inUse || 0,
        status: item.quantity < item.minStock ? 'LOW' :
               item.quantity < item.minStock * 2 ? 'WARNING' : 'OK'
      }
    })

    return NextResponse.json({
      success: true,
      data: inventoryWithUsage
    })

  } catch (error) {
    console.error('Error fetching filter inventory:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch filter inventory' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/filter-inventory
 * Create a new filter inventory location record
 *
 * Body: {
 *   filterId: string (required)
 *   quantity: number (required)
 *   minStock: number (required)
 *   location: string (required)
 *   lastRestocked?: string (optional, ISO date)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { filterId, quantity, minStock, location, lastRestocked } = body

    // Validate required fields
    if (!filterId || filterId.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'El filtro es requerido' },
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

    // Verify filter exists
    const filter = await prisma.filter.findUnique({
      where: { id: filterId }
    })

    if (!filter) {
      return NextResponse.json(
        { success: false, error: 'El filtro seleccionado no existe' },
        { status: 404 }
      )
    }

    // Check for existing record with same filter and location (unique constraint)
    const existingRecord = await prisma.inventory.findFirst({
      where: {
        filterId: filterId,
        location: location.trim()
      }
    })

    if (existingRecord) {
      return NextResponse.json(
        { success: false, error: `Ya existe un registro de este filtro en la ubicación "${location}"` },
        { status: 409 }
      )
    }

    // Create the filter inventory record
    const newInventory = await prisma.inventory.create({
      data: {
        filterId: filterId,
        quantity: parsedQuantity,
        minStock: parsedMinStock,
        location: location.trim(),
        lastRestocked: lastRestocked ? new Date(lastRestocked) : null
      },
      include: {
        filter: true
      }
    })

    return NextResponse.json({
      success: true,
      data: newInventory,
      message: 'Ubicación de inventario creada exitosamente'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating filter inventory:', error)

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Ya existe un registro con este filtro y ubicación' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Error al crear la ubicación de inventario' },
      { status: 500 }
    )
  }
}
