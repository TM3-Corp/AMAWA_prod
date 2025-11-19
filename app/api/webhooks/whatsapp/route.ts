import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { processMessageWithClaude } from '@/lib/claude'
import { sendTextMessage } from '@/lib/whatsapp'

// Enable AI processing for incoming messages (set to false to use legacy pattern matching)
const AI_ENABLED = process.env.WHATSAPP_AI_ENABLED === 'true'

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

    // Process webhook events (fast - completes in milliseconds)
    await processWebhookAsync(body)

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

    // Find client by phone number
    const client = await prisma.client.findFirst({
      where: { phone: from }
    })

    // Extract message content based on type
    let textBody: string | null = null
    let interactiveType: string | null = null
    let buttonId: string | null = null
    let buttonTitle: string | null = null

    if (message.type === 'text') {
      textBody = message.text?.body
    } else if (message.type === 'interactive') {
      interactiveType = message.interactive?.type
      if (message.interactive?.button_reply) {
        buttonId = message.interactive.button_reply.id
        buttonTitle = message.interactive.button_reply.title
      }
    }

    // Store message in database
    const storedMessage = await prisma.whatsAppMessage.create({
      data: {
        waMessageId: messageId,
        fromPhone: from,
        clientId: client?.id || null,
        messageType: message.type,
        textBody,
        interactiveType,
        buttonId,
        buttonTitle,
        rawPayload: message,
        timestamp: new Date(parseInt(timestamp) * 1000), // Convert Unix timestamp
      }
    })

    console.log(`✅ Message stored in database with ID: ${storedMessage.id}`)

    // Handle different message types
    switch (message.type) {
      case 'text':
        await handleTextMessage(from, message.text.body, messageId, storedMessage.id, client)
        break

      case 'interactive':
        await handleInteractiveMessage(from, message.interactive, messageId, storedMessage.id, client)
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
async function handleTextMessage(
  from: string,
  text: string,
  messageId: string,
  storedMessageId: string,
  client: any
) {
  try {
    if (!client) {
      console.log(`⚠️  Client not found for phone: ${from}`)
      return
    }

    // AI-powered processing (when enabled)
    if (AI_ENABLED) {
      console.log(`🤖 Processing message with Claude AI: "${text}"`)

      try {
        const aiResponse = await processMessageWithClaude(text, from)
        console.log(`🤖 Claude AI response: ${aiResponse}`)

        // Send AI response back to client via WhatsApp
        console.log(`📤 Sending AI response to ${from}...`)
        const sendResult = await sendTextMessage(from, aiResponse)

        if (sendResult.success) {
          console.log(`✅ AI response sent successfully. Message ID: ${sendResult.messageId}`)
        } else {
          console.error(`❌ Failed to send AI response: ${sendResult.error}`)
        }

        // Update message with AI processing info
        await prisma.whatsAppMessage.update({
          where: { id: storedMessageId },
          data: {
            processed: true,
            processedAt: new Date(),
            processingNotes: `AI processed. Response sent: ${sendResult.success}. Preview: ${aiResponse.substring(0, 500)}`,
          }
        })

        return
      } catch (error) {
        console.error('Error processing with Claude AI, falling back to pattern matching:', error)
        // Fall through to legacy pattern matching
      }
    }

    // Legacy pattern matching (backward compatibility)
    const lowerText = text.toLowerCase().trim()
    let processingNotes: string | null = null
    let maintenanceId: string | null = null

    // Find the client's latest pending or scheduled maintenance
    const latestMaintenance = await prisma.maintenance.findFirst({
      where: {
        clientId: client.id,
        status: { in: ['PENDING', 'SCHEDULED'] }
      },
      orderBy: { scheduledDate: 'asc' }
    })

    // Maintenance completion confirmation - "Si" response
    if (lowerText === 'si' || lowerText === 'sí' || lowerText === 'yes' || lowerText === 'confirmo') {
      console.log(`✅ ${from} confirmed maintenance completion with "Si"`)

      if (latestMaintenance) {
        // Mark maintenance as COMPLETED with WhatsApp confirmation note
        await prisma.maintenance.update({
          where: { id: latestMaintenance.id },
          data: {
            status: 'COMPLETED',
            actualDate: new Date(),
            completedDate: new Date(),
            notes: 'Confirmado vía Whatsapp'
          }
        })
        maintenanceId = latestMaintenance.id
        processingNotes = `Client confirmed with "Si". Maintenance ${latestMaintenance.id} marked as COMPLETED.`
        console.log(`✅ Maintenance ${latestMaintenance.id} marked as COMPLETED for client ${client.name}`)
      } else {
        processingNotes = 'Client confirmed with "Si" but no pending/scheduled maintenance found.'
      }
    }

    // Rescheduling requests
    if (lowerText.includes('reagendar') || lowerText.includes('cambiar fecha') || lowerText.includes('otro día')) {
      console.log(`📅 ${from} requested to reschedule`)

      if (latestMaintenance) {
        await prisma.maintenance.update({
          where: { id: latestMaintenance.id },
          data: { status: 'RESCHEDULED' }
        })
        maintenanceId = latestMaintenance.id
        processingNotes = `Client requested reschedule for maintenance ${latestMaintenance.id}. Status updated to RESCHEDULED.`
        console.log(`📅 Maintenance ${latestMaintenance.id} marked for rescheduling`)
      } else {
        processingNotes = 'Client requested reschedule but no pending maintenance found.'
      }
    }

    // Maintenance completion confirmation
    if (lowerText.includes('cambi') && lowerText.includes('filtro')) {
      console.log(`✅ ${from} confirmed filter change`)

      if (latestMaintenance) {
        await prisma.maintenance.update({
          where: { id: latestMaintenance.id },
          data: {
            status: 'COMPLETED',
            actualDate: new Date(),
            completedDate: new Date()
          }
        })
        maintenanceId = latestMaintenance.id
        processingNotes = `Client confirmed filter change. Maintenance ${latestMaintenance.id} marked as COMPLETED.`
        console.log(`✅ Maintenance ${latestMaintenance.id} marked as completed`)
      } else {
        processingNotes = 'Client confirmed filter change but no active maintenance found.'
      }
    }

    // Update the stored message with processing information
    if (processingNotes) {
      await prisma.whatsAppMessage.update({
        where: { id: storedMessageId },
        data: {
          processed: true,
          processedAt: new Date(),
          processingNotes,
          relatedMaintenanceId: maintenanceId
        }
      })
    }
  } catch (error) {
    console.error('Error handling text message:', error)
  }
}

// Handle interactive button responses
async function handleInteractiveMessage(
  from: string,
  interactive: any,
  messageId: string,
  storedMessageId: string,
  client: any
) {
  try {
    if (!client) {
      console.log(`⚠️  Client not found for phone: ${from}`)
      return
    }

    const buttonReply = interactive?.button_reply
    if (!buttonReply) return

    const buttonId = buttonReply.id
    let processingNotes: string | null = null
    let maintenanceId: string | null = null

    console.log(`🔘 Button clicked by ${from}: ${buttonId} (${buttonReply.title})`)

    // Find the client's latest pending or scheduled maintenance
    const latestMaintenance = await prisma.maintenance.findFirst({
      where: {
        clientId: client.id,
        status: { in: ['PENDING', 'SCHEDULED'] }
      },
      orderBy: { scheduledDate: 'asc' }
    })

    // Handle confirmation buttons
    if (buttonId.includes('confirm') || buttonId.includes('yes')) {
      if (latestMaintenance) {
        await prisma.maintenance.update({
          where: { id: latestMaintenance.id },
          data: { status: 'SCHEDULED' }
        })
        maintenanceId = latestMaintenance.id
        processingNotes = `Button confirmation received. Maintenance ${latestMaintenance.id} status updated to SCHEDULED.`
        console.log(`✅ Maintenance ${latestMaintenance.id} confirmed via button`)
      } else {
        processingNotes = 'Button confirmation received but no pending maintenance found.'
      }
    }

    // Handle reschedule/help buttons
    if (buttonId.includes('reschedule') || buttonId.includes('help')) {
      if (latestMaintenance) {
        await prisma.maintenance.update({
          where: { id: latestMaintenance.id },
          data: { status: 'RESCHEDULED' }
        })
        maintenanceId = latestMaintenance.id
        processingNotes = `Reschedule requested via button. Maintenance ${latestMaintenance.id} status updated to RESCHEDULED.`
        console.log(`📅 Maintenance ${latestMaintenance.id} marked for rescheduling via button`)
      } else {
        processingNotes = 'Reschedule requested via button but no pending maintenance found.'
      }
    }

    // Update the stored message with processing information
    if (processingNotes) {
      await prisma.whatsAppMessage.update({
        where: { id: storedMessageId },
        data: {
          processed: true,
          processedAt: new Date(),
          processingNotes,
          relatedMaintenanceId: maintenanceId
        }
      })
    }
  } catch (error) {
    console.error('Error handling interactive message:', error)
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
