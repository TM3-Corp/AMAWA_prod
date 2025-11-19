import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { processMessageWithClaude } from '@/lib/claude'
import { sendTextMessage } from '@/lib/whatsapp'

// Enable AI processing for incoming messages (set to false to use legacy pattern matching)
const AI_ENABLED = process.env.WHATSAPP_AI_ENABLED === 'true'

// Message debouncing configuration
const DEBOUNCE_DELAY = 5000 // 5 seconds - wait for more messages before processing
const DEBOUNCE_WINDOW = 10000 // 10 seconds - look back for recent messages to batch

// Helper to wait (Promise-based delay that works in serverless)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Normalize phone number to match database format
 * WhatsApp sends: 56953706861
 * Database has: 56 9 5370 6861
 */
function normalizePhoneForDB(phone: string): string[] {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')

  const formats = [phone] // Original format

  // Chilean format: 56 9 XXXX XXXX (11 digits starting with 569)
  if (digits.length === 11 && digits.startsWith('569')) {
    formats.push(`${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`)
  }

  // Also try without any spaces
  if (digits !== phone) {
    formats.push(digits)
  }

  return Array.from(new Set(formats)) // Remove duplicates
}

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

// Process batched messages using database-based debouncing (works in serverless)
async function processBatchedMessages(phone: string, currentMessageId: string) {
  try {
    // Wait for debounce delay to allow more messages to arrive
    console.log(`⏱️  Waiting ${DEBOUNCE_DELAY}ms for more messages...`)
    await delay(DEBOUNCE_DELAY)

    // Fetch all unprocessed messages from this phone in the recent window
    const recentTime = new Date(Date.now() - DEBOUNCE_WINDOW)
    const unprocessedMessages = await prisma.whatsAppMessage.findMany({
      where: {
        fromPhone: phone,
        processed: false,
        messageType: 'text',
        timestamp: { gte: recentTime }
      },
      orderBy: { timestamp: 'asc' }
    })

    if (unprocessedMessages.length === 0) {
      console.log(`⚠️  No unprocessed messages found for ${phone}`)
      return
    }

    console.log(`🚀 Processing batch of ${unprocessedMessages.length} messages from ${phone}`)

    // Combine all messages into one
    const combinedText = unprocessedMessages.map(m => m.textBody).filter(Boolean).join('\n')
    console.log(`📝 Combined message: "${combinedText}"`)

    // Process with Claude AI
    const aiResponse = await processMessageWithClaude(combinedText, phone)
    console.log(`🤖 Claude AI response: ${aiResponse}`)

    // Send AI response back to client via WhatsApp
    console.log(`📤 Sending AI response to ${phone}...`)
    const sendResult = await sendTextMessage(phone, aiResponse)

    if (sendResult.success) {
      console.log(`✅ AI response sent successfully. Message ID: ${sendResult.messageId}`)
    } else {
      console.error(`❌ Failed to send AI response: ${sendResult.error}`)
    }

    // Update all messages in the batch with AI processing info
    const processingNotes = `AI processed (batched ${unprocessedMessages.length} messages). Response sent: ${sendResult.success}. Preview: ${aiResponse.substring(0, 500)}`

    const messageIds = unprocessedMessages.map(m => m.id)
    await prisma.whatsAppMessage.updateMany({
      where: { id: { in: messageIds } },
      data: {
        processed: true,
        processedAt: new Date(),
        processingNotes,
      }
    })

    console.log(`✅ Updated ${unprocessedMessages.length} messages in database`)
  } catch (error) {
    console.error('Error processing batched messages:', error)
  }
}

// Handle incoming messages from clients
async function handleIncomingMessage(message: any, metadata: any) {
  try {
    const from = message.from // Client's phone number
    const messageId = message.id
    const timestamp = message.timestamp

    console.log(`📨 Message from ${from}:`, message)

    // Find client by phone number (try multiple formats)
    const phoneFormats = normalizePhoneForDB(from)
    console.log(`🔍 Searching for client with phone formats:`, phoneFormats)

    const client = await prisma.client.findFirst({
      where: {
        phone: { in: phoneFormats }
      }
    })

    if (client) {
      console.log(`✅ Client found: ${client.name} (${client.phone})`)
    } else {
      console.log(`⚠️  No client found for phone: ${from}`)
    }

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
    // AI-powered processing (when enabled)
    if (AI_ENABLED) {
      // Handle unregistered clients with a friendly message
      if (!client) {
        console.log(`⚠️  Unregistered client ${from} - sending friendly response`)

        const unregisteredMessage = `Hola! 👋\n\nVeo que tu número aún no está registrado en nuestro sistema AMAWA.\n\nPara poder ayudarte con mantenciones y servicios de purificación de agua, necesitas estar registrado como cliente.\n\n📞 Contáctanos:\n• WhatsApp: +56 9 2646 7576\n• Email: hola@amawa.cl\n\n¡Estaremos felices de atenderte!`

        const sendResult = await sendTextMessage(from, unregisteredMessage)

        await prisma.whatsAppMessage.update({
          where: { id: storedMessageId },
          data: {
            processed: true,
            processedAt: new Date(),
            processingNotes: `Unregistered client. Sent registration info. Response sent: ${sendResult.success}`,
          }
        })

        return
      }

      // Database-based debouncing - check if there are recent unprocessed messages
      console.log(`🤖 Message from ${client.name}: "${text}"`)

      // Check if there are any other recent unprocessed messages from this client
      const recentTime = new Date(Date.now() - DEBOUNCE_WINDOW)
      const recentUnprocessedCount = await prisma.whatsAppMessage.count({
        where: {
          fromPhone: from,
          processed: false,
          messageType: 'text',
          timestamp: { gte: recentTime },
          id: { not: storedMessageId } // Exclude current message
        }
      })

      if (recentUnprocessedCount > 0) {
        // There are other unprocessed messages - they're being batched
        console.log(`📦 Found ${recentUnprocessedCount} other unprocessed messages. Skipping processing (will be batched).`)
        return
      }

      // This is the first/only message - process it after debounce delay
      console.log(`🎯 First message in potential batch. Starting debounce timer.`)
      await processBatchedMessages(from, storedMessageId)
      return
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
