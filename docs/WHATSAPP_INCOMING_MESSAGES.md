# WhatsApp Incoming Messages & Interactive Responses

## 📥 Receiving Messages from Clients

### Overview

Your WhatsApp Business API can receive different types of messages from clients:
- ✅ **Text messages** - Simple text from clients
- ✅ **Interactive button responses** - When clients click buttons (Sí/No)
- ✅ **Interactive list responses** - When clients select from a list
- ✅ **Message status updates** - Delivered, read, failed notifications
- 📸 **Media messages** - Images, documents, videos (future)

---

## 🔄 Webhook Flow

```
Client sends message via WhatsApp
         ↓
Meta WhatsApp API receives it
         ↓
Meta sends HTTP POST to your webhook
         ↓
https://amawa-prod.vercel.app/api/webhooks/whatsapp
         ↓
Your code processes the message
         ↓
Your code can respond automatically (within 24h window = FREE)
```

---

## 📊 Incoming Message Structure

### 1. Simple Text Message

When a client sends: "Hola, tengo una pregunta"

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "1373350721107667",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "56974784620",
          "phone_number_id": "799669516574071"
        },
        "contacts": [{
          "profile": { "name": "Juan Pérez" },
          "wa_id": "56966083433"
        }],
        "messages": [{
          "from": "56966083433",
          "id": "wamid.ABC123...",
          "timestamp": "1700000000",
          "type": "text",
          "text": {
            "body": "Hola, tengo una pregunta"
          }
        }]
      }
    }]
  }]
}
```

**Key fields**:
- `messages[0].from` - Client's phone number
- `messages[0].text.body` - The actual message text
- `messages[0].id` - Unique message ID (for tracking)
- `contacts[0].profile.name` - Client's WhatsApp name

---

### 2. Interactive Button Response

When you send a message with buttons and the client clicks "Sí":

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "56966083433",
          "id": "wamid.ABC123...",
          "timestamp": "1700000100",
          "type": "interactive",
          "interactive": {
            "type": "button_reply",
            "button_reply": {
              "id": "confirm_yes",    // Button ID you defined
              "title": "Sí"           // Button text
            }
          }
        }]
      }
    }]
  }]
}
```

**Key fields**:
- `messages[0].type` - `"interactive"`
- `messages[0].interactive.button_reply.id` - The button ID
- `messages[0].interactive.button_reply.title` - Button text clicked

---

### 3. Message Status Update (Delivered/Read)

When your sent message is delivered or read:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "id": "wamid.XYZ789...",  // Your original message ID
          "status": "delivered",      // or "read", "sent", "failed"
          "timestamp": "1700000000",
          "recipient_id": "56966083433"
        }]
      }
    }]
  }]
}
```

**Status types**:
- `sent` - Message sent to WhatsApp servers
- `delivered` - Message delivered to client's phone
- `read` - Client opened/read the message
- `failed` - Message delivery failed

---

## 🎮 Interactive Buttons: Complete Workflow

### Step 1: Send Message with Buttons

You can add interactive buttons to templates using Meta's Message Template Manager or Cloud API.

**Example: Address Confirmation with Buttons**

```typescript
import { sendWhatsAppMessage } from '@/lib/whatsapp'

// Send message with interactive buttons
async function confirmAddressWithButtons(clientPhone: string, address: string) {
  await sendWhatsAppMessage({
    to: clientPhone,
    type: 'template',
    template: {
      name: 'address_confirmation_buttons', // Template name in Meta
      language: 'es',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: address }
          ]
        },
        {
          type: 'button',
          sub_type: 'quick_reply',
          index: 0,
          parameters: [
            {
              type: 'payload',
              payload: 'confirm_yes' // Button ID
            }
          ]
        },
        {
          type: 'button',
          sub_type: 'quick_reply',
          index: 1,
          parameters: [
            {
              type: 'payload',
              payload: 'need_help' // Button ID
            }
          ]
        }
      ]
    }
  })
}
```

**Template content in Meta** (you create this in Meta Business Manager):

```
Tu dirección registrada es:
{{1}}

¿Es correcta?

[Sí] [No, necesito ayuda]
```

---

### Step 2: Receive Button Response

When client clicks a button, you receive:

```json
{
  "interactive": {
    "type": "button_reply",
    "button_reply": {
      "id": "confirm_yes",  // or "need_help"
      "title": "Sí"         // or "No, necesito ayuda"
    }
  }
}
```

---

### Step 3: Process Button Response in Webhook

Update your webhook handler to process button clicks:

```typescript
// app/api/webhooks/whatsapp/route.ts

async function handleIncomingMessage(message: any, metadata: any) {
  const from = message.from
  const messageId = message.id

  // Handle interactive button responses
  if (message.type === 'interactive') {
    const buttonId = message.interactive?.button_reply?.id

    switch (buttonId) {
      case 'confirm_yes':
        await handleAddressConfirmed(from)
        break

      case 'need_help':
        await handleNeedsHelp(from)
        break

      case 'maintenance_confirm':
        await handleMaintenanceConfirmed(from)
        break

      case 'maintenance_reschedule':
        await handleMaintenanceReschedule(from)
        break

      default:
        console.log(`Unknown button ID: ${buttonId}`)
    }
  }

  // Handle regular text messages
  if (message.type === 'text') {
    await handleTextMessage(from, message.text.body, messageId)
  }
}

// Address confirmed - update database and proceed with delivery
async function handleAddressConfirmed(clientPhone: string) {
  console.log(`✅ Client ${clientPhone} confirmed address`)

  // 1. Find client in database
  const client = await prisma.client.findFirst({
    where: { phone: clientPhone }
  })

  if (!client) {
    console.error('Client not found for phone:', clientPhone)
    return
  }

  // 2. Find pending work order for this client
  const workOrder = await prisma.workOrder.findFirst({
    where: {
      clientId: client.id,
      status: 'PENDING_CONFIRMATION',
      deliveryType: 'BLUE_EXPRESS'
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!workOrder) {
    console.log('No pending work order found')
    return
  }

  // 3. Update work order to CONFIRMED
  await prisma.workOrder.update({
    where: { id: workOrder.id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date()
    }
  })

  // 4. Send confirmation message (FREE within 24h window!)
  await sendTextMessage(
    clientPhone,
    `Perfecto! Tu envío está confirmado. Recibirás tus filtros en ${workOrder.deliveryDate}. ¡Gracias! 💧`
  )

  console.log(`Work order ${workOrder.id} confirmed and notification sent`)
}

// Client needs help - escalate to human agent
async function handleNeedsHelp(clientPhone: string) {
  console.log(`🆘 Client ${clientPhone} needs help - escalating`)

  // 1. Find client
  const client = await prisma.client.findFirst({
    where: { phone: clientPhone }
  })

  if (!client) return

  // 2. Create incident for support team
  await prisma.incident.create({
    data: {
      clientId: client.id,
      type: 'OTHER',
      priority: 'MEDIUM',
      description: 'Client requested help via WhatsApp address confirmation',
      status: 'OPEN',
      source: 'WHATSAPP'
    }
  })

  // 3. Send acknowledgment (FREE within 24h window!)
  await sendTextMessage(
    clientPhone,
    `Entendido ${client.firstName}. Un miembro de nuestro equipo se contactará contigo pronto para ayudarte. 📞`
  )

  // 4. Notify internal team (Slack, email, etc.)
  // await notifyTeam({
  //   client: client.name,
  //   phone: clientPhone,
  //   issue: 'Address confirmation - needs help'
  // })

  console.log(`Incident created and team notified for ${client.name}`)
}
```

---

## 🧪 Testing Incoming Messages

### Option 1: Use Test Script (Simulated - Local Development)

```bash
# Make sure dev server is running
npm run dev

# In another terminal, run test script
npx tsx scripts/test-webhook-message.ts
```

This simulates incoming messages locally without needing Meta integration.

---

### Option 2: Configure Real Webhook (Production/Staging)

#### A. Configure Webhook in Meta Developer Console

1. Go to: https://developers.facebook.com/apps/1301540951300318/whatsapp-business/wa-dev-console/
2. Click **Configuration** under "Webhooks"
3. Click **Edit**
4. Enter:
   - **Callback URL**: `https://amawa-prod.vercel.app/api/webhooks/whatsapp`
   - **Verify Token**: `amawa_wsp_webhook_2025_secure_token_xyz789`
5. Click **Verify and Save**
6. Subscribe to webhook fields:
   - ✅ `messages` - Incoming messages from clients
   - ✅ `message_status` - Delivery/read receipts
   - ✅ `message_echoes` (optional) - Your own sent messages

#### B. Send Real Test Message

1. Send a WhatsApp message from your phone to: **+56 9 7478 4620**
2. Message example: "Hola, probando el webhook"
3. Check Vercel logs to see the incoming webhook:

```bash
# View Vercel logs
vercel logs --follow

# Filter for WhatsApp webhooks
vercel logs --filter "WhatsApp webhook"
```

#### C. What You Should See in Logs

```
📱 WhatsApp webhook received: {
  "object": "whatsapp_business_account",
  "entry": [ ... ]
}
📨 Message from 56966083433: {
  "from": "56966083433",
  "text": { "body": "Hola, probando el webhook" },
  ...
}
```

---

## 📋 Common Use Cases for Interactive Responses

### 1. Address Confirmation (Before Filter Shipment)

**Scenario**: Before shipping filters via Blue Express, confirm the delivery address.

**Flow**:
1. Work order created with delivery type "BLUE_EXPRESS"
2. System sends address confirmation message with buttons: [Sí] [No, necesito actualizar]
3. Client clicks "Sí" → Update work order to CONFIRMED, proceed with shipment
4. Client clicks "No" → Create incident, human agent calls client to update address

**Implementation**: See `handleAddressConfirmed()` above

---

### 2. Maintenance Confirmation

**Scenario**: 3 days before scheduled maintenance, confirm client availability.

**Flow**:
1. Cron job checks maintenances 3 days out
2. Send confirmation message: "Mantención programada para [fecha]. ¿Confirmas? [Sí] [Reagendar]"
3. Client clicks "Sí" → Update status to SCHEDULED, assign technician
4. Client clicks "Reagendar" → Update status to RESCHEDULED, notify scheduler

**Code**:
```typescript
async function handleMaintenanceConfirmed(clientPhone: string) {
  const client = await prisma.client.findFirst({
    where: { phone: clientPhone }
  })

  const maintenance = await prisma.maintenance.findFirst({
    where: {
      clientId: client.id,
      status: 'PENDING',
      scheduledDate: {
        gte: new Date(),
        lte: addDays(new Date(), 7) // Within next week
      }
    }
  })

  if (maintenance) {
    await prisma.maintenance.update({
      where: { id: maintenance.id },
      data: { status: 'SCHEDULED' }
    })

    await sendTextMessage(
      clientPhone,
      `Perfecto! Tu mantención está confirmada para ${format(maintenance.scheduledDate, 'dd/MM/yyyy')}. Te avisaremos cuando el técnico esté en camino.`
    )
  }
}
```

---

### 3. Post-Maintenance Feedback

**Scenario**: After maintenance completion, get quick feedback.

**Flow**:
1. Technician marks maintenance as COMPLETED
2. 2 hours later, send message: "¿Todo funcionando bien? [Sí, perfecto] [No, tengo un problema]"
3. Client clicks "Sí, perfecto" → Mark as SUCCESSFUL, no action needed
4. Client clicks "No, tengo un problema" → Create high-priority incident, call client

**Code**:
```typescript
async function handleMaintenanceCompleted(maintenanceId: string) {
  // Wait 2 hours after completion
  setTimeout(async () => {
    const maintenance = await prisma.maintenance.findUnique({
      where: { id: maintenanceId },
      include: { client: true }
    })

    if (maintenance.client.phone) {
      // Send feedback request with buttons
      await sendTemplateMessage({
        to: maintenance.client.phone,
        templateName: 'maintenance_feedback',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: maintenance.client.firstName }
            ]
          }
        ]
      })
    }
  }, 2 * 60 * 60 * 1000) // 2 hours
}
```

---

## 💡 Best Practices for Interactive Messages

### 1. **24-Hour Service Window = FREE Messages**

When a client messages you first OR clicks a button:
- ✅ You have a FREE 24-hour window to send any messages
- ✅ Send follow-ups, confirmations, or ask questions - all FREE
- ✅ No need to use templates during this window

**Example**:
```typescript
// Client clicked "Sí" button
await handleAddressConfirmed(clientPhone)

// Within the 24h window, you can send FREE messages:
await sendTextMessage(clientPhone, "Perfecto! Procesando tu pedido...")
await new Promise(r => setTimeout(r, 2000))
await sendTextMessage(clientPhone, "Tu código de seguimiento es: BX-123456")
await sendTextMessage(clientPhone, "Link de rastreo: https://tracking.bluex.cl/123456")

// All 3 messages above = FREE (within 24h window)
```

---

### 2. **Keep Button IDs Descriptive**

Use clear button IDs that indicate the action:

✅ **Good**:
- `confirm_address`
- `maintenance_confirm`
- `need_help`
- `reschedule_request`

❌ **Bad**:
- `btn1`
- `yes`
- `option_a`

---

### 3. **Handle Unknown Button IDs Gracefully**

Always have a default case:

```typescript
switch (buttonId) {
  case 'confirm_yes':
    await handleConfirm(from)
    break

  default:
    console.warn(`Unknown button ID: ${buttonId} from ${from}`)
    await sendTextMessage(
      from,
      "Gracias por tu respuesta. Nuestro equipo revisará tu solicitud."
    )
}
```

---

### 4. **Log Everything for Debugging**

```typescript
console.log('📱 Webhook received:', {
  from: message.from,
  type: message.type,
  timestamp: new Date().toISOString(),
  buttonId: message.interactive?.button_reply?.id,
  text: message.text?.body
})
```

---

### 5. **Link Messages to Database Records**

Always connect incoming messages to your database:

```typescript
// Store incoming message for audit trail
await prisma.whatsAppMessage.create({
  data: {
    messageId: message.id,
    from: message.from,
    to: metadata.phone_number_id,
    direction: 'INCOMING',
    type: message.type,
    content: JSON.stringify(message),
    timestamp: new Date(parseInt(message.timestamp) * 1000),
    clientId: client?.id // Link to client if found
  }
})
```

---

## 🔍 Debugging: Check if Messages Are Being Received

### Check Production Logs (Vercel)

```bash
# Install Vercel CLI if not already
npm i -g vercel

# Login
vercel login

# View live logs
vercel logs --follow --scope amawa-prod

# Filter for WhatsApp
vercel logs --filter "WhatsApp" --limit 50
```

### Check Local Development Logs

```bash
# Start dev server
npm run dev

# Send test webhook
npx tsx scripts/test-webhook-message.ts

# Check console output for:
# 📱 WhatsApp webhook received: ...
# 📨 Message from 56966083433: ...
```

### Verify Webhook Configuration

```bash
# Test webhook endpoint
curl https://amawa-prod.vercel.app/api/webhooks/whatsapp

# Should return: {"error":"Verification failed"}
# (This is correct - it's expecting Meta's verification params)
```

---

## 🚨 Troubleshooting

### Problem: "I sent a message but webhook didn't receive it"

**Solutions**:
1. Check webhook is configured in Meta Developer Console
2. Verify webhook URL is correct: `https://amawa-prod.vercel.app/api/webhooks/whatsapp`
3. Check verify token matches: `amawa_wsp_webhook_2025_secure_token_xyz789`
4. View Vercel logs to see if request came in but failed processing
5. Ensure webhook fields are subscribed: `messages`, `message_status`

---

### Problem: "Webhook receives message but doesn't respond"

**Solutions**:
1. Check your handler logic for the message type
2. Verify client phone number format (should be `56966083433`)
3. Check if client exists in database
4. Look for errors in Vercel logs
5. Ensure you're within 24h service window (if not, must use template)

---

### Problem: "Can't test locally because no ngrok"

**Solutions**:
1. Use test script: `npx tsx scripts/test-webhook-message.ts`
2. Test directly on production (Vercel)
3. Deploy to staging environment with webhook configured
4. Get ngrok authtoken: https://dashboard.ngrok.com/signup (free tier available)

---

## ✅ Next Steps

1. **Configure Production Webhook** (if not done):
   - Go to Meta Developer Console
   - Add webhook URL: `https://amawa-prod.vercel.app/api/webhooks/whatsapp`
   - Verify with token: `amawa_wsp_webhook_2025_secure_token_xyz789`

2. **Create Message Templates with Buttons**:
   - Go to Meta Business Manager
   - Create templates for:
     - Address confirmation
     - Maintenance confirmation
     - Post-maintenance feedback

3. **Enhance Webhook Handler**:
   - Add database linking (find client by phone)
   - Implement button response handlers
   - Add message storage for audit trail
   - Set up incident creation for "need help" requests

4. **Test End-to-End**:
   - Send message from your phone to +56 9 7478 4620
   - Check Vercel logs
   - Verify response is sent back
   - Check database updates

---

**Documentation created**: November 18, 2025
**Last tested**: November 18, 2025 (local simulation successful)
**Status**: Ready for production webhook configuration ✅
