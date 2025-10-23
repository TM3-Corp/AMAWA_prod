import { NextRequest, NextResponse } from 'next/server'

// Webhook verification (GET) - Meta will call this to verify our webhook
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Meta sends these parameters for verification
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

    // Check if token matches
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook verified successfully')
      // Respond with the challenge to complete verification
      return new NextResponse(challenge, { status: 200 })
    } else {
      console.error('❌ Webhook verification failed')
      return NextResponse.json(
        { error: 'Verification failed' },
        { status: 403 }
      )
    }
  } catch (error) {
    console.error('Error in webhook verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Webhook event handler (POST) - Meta sends messages here
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('📱 WhatsApp webhook received:', JSON.stringify(body, null, 2))

    // Meta requires a 200 response immediately
    // Process async in the background
    processWebhookAsync(body)

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    // Still return 200 to Meta to avoid retries
    return NextResponse.json({ status: 'ok' }, { status: 200 })
  }
}

// Process webhook events asynchronously
async function processWebhookAsync(body: any) {
  try {
    // Check if this is a WhatsApp Business message
    if (body.object !== 'whatsapp_business_account') {
      return
    }

    // Extract message from webhook body
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (!value) return

    // Handle messages
    if (value.messages) {
      for (const message of value.messages) {
        await handleIncomingMessage(message, value.metadata)
      }
    }

    // Handle message status updates (delivered, read, etc.)
    if (value.statuses) {
      for (const status of value.statuses) {
        await handleMessageStatus(status)
      }
    }
  } catch (error) {
    console.error('Error in async webhook processing:', error)
  }
}

// Handle incoming messages from clients
async function handleIncomingMessage(message: any, metadata: any) {
  try {
    const from = message.from // Client's phone number
    const messageId = message.id
    const timestamp = message.timestamp

    console.log(`📨 Message from ${from}:`, message)

    // Handle different message types
    switch (message.type) {
      case 'text':
        await handleTextMessage(from, message.text.body, messageId)
        break

      case 'image':
        console.log('📷 Image received from', from)
        break

      case 'document':
        console.log('📄 Document received from', from)
        break

      default:
        console.log(`❓ Unsupported message type: ${message.type}`)
    }
  } catch (error) {
    console.error('Error handling incoming message:', error)
  }
}

// Handle text messages
async function handleTextMessage(from: string, text: string, messageId: string) {
  try {
    const lowerText = text.toLowerCase().trim()

    // Address confirmation responses
    if (lowerText === 'si' || lowerText === 'sí' || lowerText === 'yes') {
      console.log(`✅ ${from} confirmed address`)
      // TODO: Mark address as confirmed in database
      // TODO: Update work order status
    }

    // Maintenance completion confirmation
    if (lowerText.includes('cambi') && lowerText.includes('filtro')) {
      console.log(`✅ ${from} confirmed filter change`)
      // TODO: Update maintenance record with actual date
    }

    // TODO: Add more response handling logic
    // - Check if client exists in database
    // - Link message to client record
    // - Update relevant records (work orders, maintenances)
    // - Send automated responses
  } catch (error) {
    console.error('Error handling text message:', error)
  }
}

// Handle message status updates
async function handleMessageStatus(status: any) {
  try {
    const messageId = status.id
    const statusType = status.status // sent, delivered, read, failed

    console.log(`📊 Message ${messageId} status: ${statusType}`)

    // TODO: Update message delivery status in database
    // This helps track if clients received our messages
  } catch (error) {
    console.error('Error handling message status:', error)
  }
}
