import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import { z } from 'zod'

const prisma = new PrismaClient()

// Schema for Excel data validation
const ClientSchema = z.object({
  Nombre: z.string(),
  Telefono: z.string().optional(),
  Email: z.string().email().optional(),
  Comuna: z.string().optional(),
  Direccion: z.string().optional(),
  Equipo: z.string().optional(),
  'Fecha Instalacion': z.string().optional(),
})

async function importClientsFromExcel(filePath: string) {
  console.log('📚 Reading Excel file...')
  const workbook = XLSX.readFile(filePath)
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(worksheet)

  console.log(`Found ${data.length} records to import`)

  let imported = 0
  let errors = 0

  for (const row of data) {
    try {
      // Validate data
      const validatedData = ClientSchema.parse(row)
      
      // Convert Excel date if needed
      let installationDate = null
      if (validatedData['Fecha Instalacion']) {
        // Excel stores dates as numbers
        const dateNum = parseInt(validatedData['Fecha Instalacion'])
        if (!isNaN(dateNum)) {
          installationDate = new Date((dateNum - 25569) * 86400 * 1000)
        }
      }

      // Insert into database
      await prisma.client.create({
        data: {
          name: validatedData.Nombre,
          phone: validatedData.Telefono,
          email: validatedData.Email,
          comuna: validatedData.Comuna,
          address: validatedData.Direccion,
          equipmentType: validatedData.Equipo,
          installationDate,
          status: 'ACTIVE',
        },
      })

      imported++
      if (imported % 50 === 0) {
        console.log(`✅ Imported ${imported} clients...`)
      }
    } catch (error) {
      console.error(`❌ Error importing row:`, error)
      errors++
    }
  }

  console.log(`\n✨ Import complete!`)
  console.log(`✅ Successfully imported: ${imported} clients`)
  console.log(`❌ Errors: ${errors}`)
}

// Generate maintenance schedules based on installation dates
async function generateMaintenanceSchedules() {
  console.log('\n🔧 Generating maintenance schedules...')
  
  const clients = await prisma.client.findMany({
    where: {
      installationDate: { not: null }
    }
  })

  let scheduled = 0
  for (const client of clients) {
    if (!client.installationDate) continue

    const installDate = new Date(client.installationDate)
    const now = new Date()
    const monthsSinceInstall = Math.floor((now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

    // Determine next maintenance type
    let nextMaintenanceMonths = 6
    let maintenanceType: 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'EIGHTEEN_MONTHS' | 'TWENTY_FOUR_MONTHS' = 'SIX_MONTHS'

    if (monthsSinceInstall >= 24) {
      maintenanceType = 'TWENTY_FOUR_MONTHS'
      nextMaintenanceMonths = 24
    } else if (monthsSinceInstall >= 18) {
      maintenanceType = 'EIGHTEEN_MONTHS'
      nextMaintenanceMonths = 18
    } else if (monthsSinceInstall >= 12) {
      maintenanceType = 'TWELVE_MONTHS'
      nextMaintenanceMonths = 12
    } else if (monthsSinceInstall >= 6) {
      maintenanceType = 'SIX_MONTHS'
      nextMaintenanceMonths = 6
    }

    // Calculate next maintenance date
    const nextMaintenanceDate = new Date(installDate)
    nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + nextMaintenanceMonths)

    // Only schedule if maintenance is upcoming (within next 90 days)
    const daysUntilMaintenance = Math.floor((nextMaintenanceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilMaintenance > 0 && daysUntilMaintenance <= 90) {
      await prisma.maintenance.create({
        data: {
          clientId: client.id,
          scheduledDate: nextMaintenanceDate,
          type: maintenanceType,
          status: 'PENDING',
        },
      })
      scheduled++
    }
  }

  console.log(`✅ Scheduled ${scheduled} upcoming maintenances`)
}

// Main execution
async function main() {
  try {
    // Import clients from Excel
    await importClientsFromExcel('./data/Clientes_AMAWA_Hogar.xlsx')
    
    // Generate maintenance schedules
    await generateMaintenanceSchedules()
    
  } catch (error) {
    console.error('Fatal error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if called directly
if (require.main === module) {
  main()
}