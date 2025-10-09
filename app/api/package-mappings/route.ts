import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all package mappings for client-side use
 * GET /api/package-mappings
 */
export async function GET() {
  try {
    const mappings = await prisma.equipmentFilterMapping.findMany({
      include: {
        package: {
          select: {
            code: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(mappings)
  } catch (error) {
    console.error('Error fetching package mappings:', error)
    return NextResponse.json(
      { error: 'Error al obtener mappings de paquetes' },
      { status: 500 }
    )
  }
}
