import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get unique technician names from equipment table
    const technicians = await prisma.equipment.findMany({
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

    // Map to simple string array
    const technicianNames = technicians
      .map(t => t.installerTechnician)
      .filter((name): name is string => name !== null)

    return NextResponse.json({ technicians: technicianNames })
  } catch (error) {
    console.error('Error fetching technicians:', error)
    return NextResponse.json(
      { error: 'Failed to fetch technicians' },
      { status: 500 }
    )
  }
}
