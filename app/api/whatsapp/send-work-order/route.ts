import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendTechnicianVisit } from '@/lib/whatsapp'

const prisma = new PrismaClient()

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

/**
 * Send WhatsApp notifications for all clients in a work order
 *
 * POST /api/whatsapp/send-work-order
 * Body: { "workOrderId": "uuid" }
 */
export async function POST(request: NextRequest) {
  try {
    const { workOrderId } = await request.json()

    if (!workOrderId) {
      return NextResponse.json(
        { error: 'Missing workOrderId' },
        { status: 400 }
      )
    }

    console.log(`📦 Processing work order: ${workOrderId}`)

    // STEP 1: Fetch work order with all related data
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        maintenances: {
          include: {
            client: {
              include: {
                equipment: {
                  where: { isActive: true },
                  take: 1 // Get the active equipment
                }
              }
            }
          }
        }
      }
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      )
    }

    if (!workOrder.deliveryDate) {
      return NextResponse.json(
        { error: 'Work order has no delivery date set' },
        { status: 400 }
      )
    }

    console.log(`📋 Found ${workOrder.maintenances.length} maintenances in work order`)

    // STEP 2: Filter clients with valid phone numbers
    const clientsToNotify = workOrder.maintenances.filter(maintenance => {
      const phone = maintenance.client.phone
      return phone && phone.length >= 10 // Basic validation
    })

    console.log(`📱 ${clientsToNotify.length} clients have valid phone numbers`)

    // STEP 3: Send WhatsApp messages
    const results = {
      total: clientsToNotify.length,
      sent: 0,
      failed: 0,
      errors: [] as Array<{ clientId: string; clientName: string; error: string }>
    }

    for (const maintenance of clientsToNotify) {
      const client = maintenance.client
      const equipment = client.equipment[0] // Get active equipment
      // Use video URL from database, fall back to default if not set
      const videoUrl = equipment?.tutorialVideoUrl || 'https://www.youtube.com/watch?v=default'

      try {
        console.log(`📤 Sending to ${client.name} (${client.phone}) - Video: ${videoUrl}`)

        const result = await sendTechnicianVisit({
          to: client.phone!,
          clientName: client.name,
          address: `${client.address || 'Sin dirección'}, ${client.comuna || ''}`,
          date: formatDate(workOrder.deliveryDate),
          startTime: '10:00 AM',  // TODO: Make this configurable
          endTime: '2:00 PM',     // TODO: Make this configurable
        })

        if (result.success) {
          results.sent++
          console.log(`✅ Sent to ${client.name}`)
        } else {
          results.failed++
          results.errors.push({
            clientId: client.id,
            clientName: client.name,
            error: result.error || 'Unknown error'
          })
          console.error(`❌ Failed to send to ${client.name}:`, result.error)
        }

        // Rate limiting: Wait 1 second between messages to avoid hitting API limits
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        results.failed++
        results.errors.push({
          clientId: client.id,
          clientName: client.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        console.error(`❌ Error sending to ${client.name}:`, error)
      }
    }

    console.log(`📊 Results: ${results.sent} sent, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      workOrderId,
      deliveryDate: workOrder.deliveryDate,
      results
    })

  } catch (error) {
    console.error('Error in send-work-order endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to show usage instructions
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/whatsapp/send-work-order',
    method: 'POST',
    description: 'Send WhatsApp notifications to all clients in a work order',
    body: {
      workOrderId: 'UUID of the work order'
    },
    example: {
      workOrderId: 'uuid-here'
    },
    workflow: [
      '1. Fetch work order with maintenances and clients',
      '2. Filter clients with valid phone numbers',
      '3. For each client, send WhatsApp with custom video URL',
      '4. Return success/failure report'
    ],
    notes: [
      'Sends 1 message per second to avoid rate limits',
      'Video URLs are mapped from equipment filterType',
      'Skips clients without phone numbers'
    ]
  })
}
