import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const comuna = searchParams.get('comuna') || ''
    const status = searchParams.get('status') || ''

    // Build where clause with filters
    const where: any = {}

    // Improved search filter: split by spaces and require all terms to match
    if (search) {
      const searchTerms = search.trim().split(/\s+/)

      // Each term must match at least one of the fields (name, comuna, or phone)
      where.AND = searchTerms.map(term => ({
        OR: [
          { name: { contains: term, mode: 'insensitive' as const } },
          { comuna: { contains: term, mode: 'insensitive' as const } },
          { phone: { contains: term, mode: 'insensitive' as const } },
        ]
      }))
    }

    // Comuna filter (exact match)
    if (comuna) {
      // If we already have AND from search, append comuna filter
      if (where.AND) {
        where.AND.push({ comuna })
      } else {
        where.comuna = comuna
      }
    }

    // Status filter (exact match)
    if (status) {
      // If we already have AND from search/comuna, append status filter
      if (where.AND) {
        where.AND.push({ status })
      } else {
        where.status = status
      }
    }

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

    // Automatically generate maintenance schedule based on installation date
    if (data.installationDate) {
      const installationDate = new Date(data.installationDate)
      const maintenanceCycles = [
        { type: 'SIX_MONTHS', months: 6 },
        { type: 'TWELVE_MONTHS', months: 12 },
        { type: 'EIGHTEEN_MONTHS', months: 18 },
        { type: 'TWENTY_FOUR_MONTHS', months: 24 },
      ]

      // Create all 4 maintenances
      for (const cycle of maintenanceCycles) {
        const scheduledDate = new Date(installationDate)
        scheduledDate.setMonth(scheduledDate.getMonth() + cycle.months)

        await prisma.maintenance.create({
          data: {
            clientId: client.id,
            type: cycle.type as any,
            scheduledDate,
            status: 'PENDING',
            deliveryType: data.deliveryType || 'Delivery',
          },
        })
      }
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