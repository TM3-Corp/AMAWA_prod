import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/technicians
 * List all active technicians from User table + legacy names from equipment
 */
export async function GET() {
  try {
    // Get technicians from User table
    const userTechnicians = await prisma.user.findMany({
      where: {
        role: 'TECHNICIAN',
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLogin: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Also get legacy technician names from equipment table for backwards compatibility
    const legacyTechnicians = await prisma.equipment.findMany({
      where: {
        installerTechnician: {
          not: null
        }
      },
      select: {
        installerTechnician: true
      },
      distinct: ['installerTechnician'],
      orderBy: {
        installerTechnician: 'asc'
      }
    })

    const legacyNames = legacyTechnicians
      .map(t => t.installerTechnician)
      .filter((name): name is string => name !== null)
      .map(name => ({ id: name, name, email: null, isLegacy: true }))

    // Combine both sources
    const allTechnicians = [
      ...userTechnicians.map(t => ({ ...t, isLegacy: false })),
      ...legacyNames
    ]

    return NextResponse.json({
      success: true,
      data: allTechnicians
    })

  } catch (error) {
    console.error('Error fetching technicians:', error)
    return NextResponse.json(
      { success: false, error: 'Error al obtener técnicos' },
      { status: 500 }
    )
  }
}
