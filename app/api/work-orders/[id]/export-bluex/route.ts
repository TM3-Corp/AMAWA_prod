import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import { getPackageForMaintenance } from '@/lib/get-maintenance-package'

const prisma = new PrismaClient()

// Helper to parse phone number
function formatPhone(phone: string | null): string {
  if (!phone) return ''

  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '')

  // If already has country code (starts with 56), return as is
  if (cleaned.startsWith('56')) {
    return cleaned
  }

  // Add country code
  return `56${cleaned}`
}

// Helper to split full name
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  } else if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1] }
  } else {
    // More than 2 parts: first word is firstName, rest is lastName
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    }
  }
}

// Helper to extract street name (everything before first number)
function getStreetName(address: string | null): string {
  if (!address) return ''

  const match = address.match(/^(.+?)\s*\d/)
  return match ? match[1].trim() : address.trim()
}

/**
 * GET /api/work-orders/[id]/export-bluex
 *
 * Exports work order maintenances to Bluex bulk upload Excel format
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workOrderId = params.id

    // Get work order with maintenances and client data
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        maintenances: {
          include: {
            client: {
              include: {
                contracts: {
                  where: { isActive: true },
                  take: 1
                }
              }
            }
          }
        }
      }
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Orden de trabajo no encontrada' },
        { status: 404 }
      )
    }

    // Only export Delivery work orders (not Presencial)
    if (workOrder.deliveryType !== 'Delivery' && workOrder.deliveryType !== 'DOMICILIO') {
      return NextResponse.json(
        { error: 'Solo se pueden exportar órdenes con tipo de entrega Delivery' },
        { status: 400 }
      )
    }

    // Load package mappings directly from database
    const rawMappings = await prisma.equipmentFilterMapping.findMany({
      include: {
        package: true
      }
    })

    // Transform to the format expected by getPackageForMaintenance
    const packageMappings = rawMappings.map(mapping => ({
      planCode: mapping.planCode,
      maintenanceCycle: mapping.maintenanceCycle,
      package: {
        code: mapping.package.code,
        name: mapping.package.name
      }
    }))

    // Create Bluex rows
    const bluexRows: any[] = []

    workOrder.maintenances.forEach((maintenance, index) => {
      const client = maintenance.client
      const { firstName, lastName } = client.firstName && client.lastName
        ? { firstName: client.firstName, lastName: client.lastName }
        : splitName(client.name)

      const streetName = getStreetName(client.address)
      const streetNumber = client.addressNumber || ''

      // Get the specific plan and package for this maintenance
      const planCode = client.contracts[0]?.planCode || 'N/A'
      const packageCode = getPackageForMaintenance(
        planCode,
        maintenance.cycleNumber,
        packageMappings
      )

      // Create specific description: "Filtros {Plan}: Paquete {Paquete}"
      const description = `Filtros ${planCode}: Paquete ${packageCode}`

      bluexRows.push({
        'N°': index + 1,
        'Nombre*': firstName,
        'Apellido*': lastName,
        'Telefono*': formatPhone(client.phone),
        'Correo*': client.email || '',
        'Tipo Entrega*': 'Prepago Domicilio',
        'Región*': 'Región Metropolitana de Santiago',
        'Comuna*': (client.comuna || '').trim(), // Trim whitespace to avoid import errors
        'Nombre Calle*': streetName,
        'N° Domicilio *': streetNumber,
        'Dpto / Oficina': client.propertyNumber || '',
        'Referencia Ayuda': '',
        'Descripción Contenido*': description,
        'Valor Contenido*': 15000, // Number type (not string) for Bluex import
        'Garantía*': 'NO',
        'N° Boleta / Factura': '',
        'Tamaño*': 'XS'
      })
    })

    // Split bluexRows into batches of 50 (Bluex limitation)
    const BATCH_SIZE = 50
    const batches: any[][] = []

    for (let i = 0; i < bluexRows.length; i += BATCH_SIZE) {
      batches.push(bluexRows.slice(i, i + BATCH_SIZE))
    }

    // Calculate column widths (same for all sheets)
    const maxWidths: number[] = []
    const headers = Object.keys(bluexRows[0] || {})

    headers.forEach((header, colIndex) => {
      let maxWidth = header.length
      bluexRows.forEach(row => {
        const cellValue = String(row[header] || '')
        maxWidth = Math.max(maxWidth, cellValue.length)
      })
      maxWidths[colIndex] = Math.min(maxWidth + 2, 50) // Max 50 chars width
    })

    // Create Excel workbook with multiple sheets
    const workbook = XLSX.utils.book_new()

    batches.forEach((batch, index) => {
      // Renumber rows within each batch (starting from 1)
      const renumberedBatch = batch.map((row, rowIndex) => ({
        ...row,
        'N°': rowIndex + 1
      }))

      const worksheet = XLSX.utils.json_to_sheet(renumberedBatch)
      worksheet['!cols'] = maxWidths.map(w => ({ wch: w }))

      // Name sheets: "Lote 1", "Lote 2", etc.
      const sheetName = `Lote ${index + 1}`
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    })

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Create filename
    const filename = `Bluex_OT_${workOrder.year}-${String(workOrder.month).padStart(2, '0')}_${workOrder.id.substring(0, 8)}.xlsx`

    // Return file as download
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    })

  } catch (error) {
    console.error('Error exporting to Bluex:', error)
    return NextResponse.json(
      { error: 'Error al generar archivo de exportación' },
      { status: 500 }
    )
  }
}
