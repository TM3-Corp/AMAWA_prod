import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all clients for statistics
    const clients = await prisma.client.findMany({
      select: {
        contactChannel: true,
        comuna: true,
        status: true,
        propertyType: true,
      },
    })

    // Calculate Canal de Contacto stats
    const contactChannelStats: Record<string, number> = {}
    clients.forEach(client => {
      const channel = client.contactChannel || 'No especificado'
      contactChannelStats[channel] = (contactChannelStats[channel] || 0) + 1
    })

    // Calculate Comuna stats
    const comunaStats: Record<string, number> = {}
    clients.forEach(client => {
      const comuna = client.comuna || 'No especificada'
      comunaStats[comuna] = (comunaStats[comuna] || 0) + 1
    })

    // Calculate Status stats
    const statusStats: Record<string, number> = {}
    clients.forEach(client => {
      const status = client.status || 'ACTIVE'
      statusStats[status] = (statusStats[status] || 0) + 1
    })

    // Calculate Property Type stats
    const propertyTypeStats: Record<string, number> = {}
    clients.forEach(client => {
      const propType = client.propertyType || 'No especificado'
      propertyTypeStats[propType] = (propertyTypeStats[propType] || 0) + 1
    })

    // Get unique comunas for filter dropdown (sorted alphabetically)
    const uniqueComunas = Array.from(
      new Set(clients.map(c => c.comuna).filter(Boolean))
    ).sort()

    return NextResponse.json({
      totalClients: clients.length,
      contactChannelStats,
      comunaStats,
      statusStats,
      propertyTypeStats,
      uniqueComunas,
    })
  } catch (error) {
    console.error('Error fetching client statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch client statistics' },
      { status: 500 }
    )
  }
}
