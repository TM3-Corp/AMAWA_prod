import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function getTechnicians() {
  try {
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

    console.log('Technicians found:', technicians.length)
    technicians.forEach(t => console.log('  -', t.installerTechnician))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

getTechnicians()
