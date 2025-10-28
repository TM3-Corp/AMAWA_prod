import { NextRequest, NextResponse } from 'next/server'
import { sendTechnicianVisit } from '@/lib/whatsapp'

/**
 * API endpoint to send technician visit appointment
 *
 * POST /api/whatsapp/send-visit
 * Body: {
 *   "to": "56966083433",
 *   "clientName": "Pablo",
 *   "address": "123 Maple St",
 *   "date": "2025-12-31",
 *   "startTime": "10:00 AM",
 *   "endTime": "2:00 PM"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { to, clientName, address, date, startTime, endTime } = await request.json()

    // Validate required fields
    if (!to || !clientName || !address || !date || !startTime || !endTime) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          required: ['to', 'clientName', 'address', 'date', 'startTime', 'endTime']
        },
        { status: 400 }
      )
    }

    console.log(`📤 Sending technician visit to ${to}:`, {
      clientName,
      address,
      date,
      startTime,
      endTime
    })

    // Send the template message
    const result = await sendTechnicianVisit({
      to,
      clientName,
      address,
      date,
      startTime,
      endTime
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Technician visit message sent successfully',
        messageId: result.messageId,
        sentTo: to,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in send-visit endpoint:', error)
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
    endpoint: '/api/whatsapp/send-visit',
    method: 'POST',
    description: 'Send technician visit appointment using prueba_envio_filtros template',
    template: 'prueba_envio_filtros',
    body: {
      to: 'Phone number (e.g., "56966083433")',
      clientName: 'Client name',
      address: 'Full address',
      date: 'Visit date (e.g., "2025-12-31")',
      startTime: 'Start time (e.g., "10:00 AM")',
      endTime: 'End time (e.g., "2:00 PM")',
    },
    example: {
      to: '56966083433',
      clientName: 'Pablo Sargent',
      address: 'Av. Las Condes 1234, Las Condes',
      date: '2025-11-15',
      startTime: '10:00 AM',
      endTime: '12:00 PM',
    },
  })
}
