import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Creating test client: Paul Sargent...')

    // Create client
    const client = await prisma.client.create({
      data: {
        name: 'Paul Sargent',
        firstName: 'Paul',
        lastName: 'Sargent',
        phone: '56966083433',
        email: 'paul.sargent@amawa.cl',
        comuna: 'Santiago Centro',
        address: 'Test Address 123',
        status: 'ACTIVE',
      },
    })

    console.log('✅ Client created:', client.id)

    // Create equipment (copying from Manuel Mella)
    const equipment = await prisma.equipment.create({
      data: {
        clientId: client.id,
        equipmentType: 'WHP-4200',
        serialNumber: 'TEST001',
        color: 'Blanco',
        filterType: 'Reverse Osmosis',
        installationDate: new Date('2024-11-15'),
        deliveryType: 'Delivery',
        installerTechnician: 'Felipe Gonzalez',
        isActive: true,
        tutorialVideoUrl: 'https://www.youtube.com/watch?v=5J3-zz8rJuE',
      },
    })

    console.log('✅ Equipment created:', equipment.id)

    // Create contract (copying from Manuel Mella)
    const contract = await prisma.contract.create({
      data: {
        clientId: client.id,
        planCode: '4200RODE',
        planType: 'Mensual',
        planCurrency: 'CLP',
        planValueCLP: 28990,
        monthlyValueCLP: 28990,
        monthlyValueUF: 0,
        discountPercent: 0,
        tokuEnabled: true,
        needsInvoice: false,
        startDate: new Date('2024-11-15'),
        isActive: true,
      },
    })

    console.log('✅ Contract created:', contract.id)

    // Create a scheduled maintenance for testing (6 months type, scheduled for "today")
    const maintenance = await prisma.maintenance.create({
      data: {
        clientId: client.id,
        type: 'SIX_MONTHS',
        scheduledDate: new Date(), // Today
        status: 'SCHEDULED', // Use SCHEDULED status (Agendada)
        deliveryType: 'Delivery',
      },
    })

    console.log('✅ Maintenance created:', maintenance.id)
    console.log('\n📊 Summary:')
    console.log('  Client ID:', client.id)
    console.log('  Phone:', client.phone)
    console.log('  Equipment:', equipment.equipmentType)
    console.log('  Plan:', contract.planCode)
    console.log('  Maintenance ID:', maintenance.id)
    console.log('  Maintenance Status:', maintenance.status)
    console.log('\n✅ Test client created successfully!')
    console.log('🧪 You can now test WhatsApp responses with phone: 56966083433')
  } catch (error) {
    console.error('Error creating test client:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
