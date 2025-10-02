import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { comuna: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.client.count({ where }),
    ])

    return NextResponse.json({
      clients,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Create client with core fields only (equipment/contract in separate tables)
    const client = await prisma.client.create({
      data: {
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        rut: data.rut,
        email: data.email,
        phone: data.phone,
        address: data.address,
        propertyType: data.propertyType,
        propertyNumber: data.propertyNumber,
        comuna: data.comuna,
        contactChannel: data.contactChannel,
        status: data.status || 'ACTIVE',
      },
    })

    // If equipment data provided, create equipment record
    if (data.equipmentType || data.installationDate) {
      await prisma.equipment.create({
        data: {
          clientId: client.id,
          equipmentType: data.equipmentType,
          serialNumber: data.serialNumber,
          color: data.color,
          filterType: data.filterType,
          installationDate: data.installationDate ? new Date(data.installationDate) : null,
          deliveryType: data.deliveryType,
          installerTechnician: data.installerTech,
          isActive: true,
        },
      })
    }

    // If contract data provided, create contract record
    if (data.planCode || data.monthlyValueCLP || data.monthlyValueUF) {
      await prisma.contract.create({
        data: {
          clientId: client.id,
          planCode: data.planCode,
          planType: data.planType,
          planCurrency: data.planCurrency,
          planValueCLP: data.planValueCLP,
          monthlyValueCLP: data.monthlyValueCLP,
          monthlyValueUF: data.monthlyValueUF,
          discountPercent: data.discountPercent,
          tokuEnabled: data.tokuEnabled || false,
          needsInvoice: data.needsInvoice,
          startDate: data.installationDate ? new Date(data.installationDate) : new Date(),
          isActive: true,
        },
      })
    }

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}