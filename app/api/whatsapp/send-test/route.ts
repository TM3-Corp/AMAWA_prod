import { NextRequest, NextResponse } from 'next/server'
import { sendTextMessage, formatPhoneNumber, isValidPhoneNumber } from '@/lib/whatsapp'

/**
 * Test endpoint to send WhatsApp messages
 *
 * Usage:
 * POST /api/whatsapp/send-test
 * Body: { "to": "56976559269", "message": "Test message from AMAWA" }
 */
export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      )
    }

    // Format and validate phone number
    const formattedPhone = formatPhoneNumber(to)

    if (!isValidPhoneNumber(formattedPhone)) {
      return NextResponse.json(
        {
          error: 'Invalid phone number format',
          note: 'Chilean numbers should be: 56 9 XXXX XXXX (12 digits total)'
        },
        { status: 400 }
      )
    }

    console.log(`📤 Sending test message to ${formattedPhone}:`, message)

    // Send message
    const result = await sendTextMessage(formattedPhone, message)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Message sent successfully',
        messageId: result.messageId,
        sentTo: formattedPhone,
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
    console.error('Error in send-test endpoint:', error)
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
    endpoint: '/api/whatsapp/send-test',
    method: 'POST',
    description: 'Send a test WhatsApp message',
    body: {
      to: 'Phone number (e.g., "56976559269" or "+56 9 7655 9269")',
      message: 'Message text to send',
    },
    example: {
      to: '56976559269',
      message: 'Hola! Este es un mensaje de prueba desde AMAWA.',
    },
    note: 'Currently using test credentials. Will be updated after phone verification.',
  })
}
