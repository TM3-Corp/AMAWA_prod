# WhatsApp Integration for AMAWA Maintenance Notifications

## Executive Summary

WhatsApp Business API enables automated maintenance reminders, appointment confirmations, and two-way communication with clients. This document outlines the best integration approach for AMAWA's maintenance coordination workflow.

---

## 📊 Options Comparison (2025)

### Option 1: Meta WhatsApp Cloud API (RECOMMENDED ✅)
**Direct integration with Meta's official API**

**Pros:**
- ✅ **Free API access** - No platform fees, only Meta's per-message charges
- ✅ **Direct from source** - Official Meta infrastructure
- ✅ **Full control** - Complete API access
- ✅ **Lower cost** - No middleman markup

**Cons:**
- ⚠️ Requires technical setup and maintenance
- ⚠️ Need to handle infrastructure yourself
- ⚠️ More complex initial configuration

**Best for:** Businesses with technical resources (like AMAWA with TM3 support)

---

### Option 2: Twilio WhatsApp API
**Business Solution Provider (BSP) with managed service**

**Pros:**
- ✅ Easy setup and developer-friendly
- ✅ Excellent documentation and SDKs
- ✅ Managed infrastructure
- ✅ Additional features (phone, SMS, email)

**Cons:**
- ❌ **Extra cost**: $0.005 USD per message on top of Meta's fees
- ❌ Higher total cost at scale
- ❌ Vendor lock-in

**Best for:** Rapid prototyping or businesses without technical resources

---

### Option 3: Other BSPs (AiSensy, 360Dialog, Interakt)
**Specialized WhatsApp platforms**

**Pros:**
- ✅ Pre-built templates for specific industries
- ✅ Visual chatbot builders (no-code)
- ✅ Marketing automation features
- ✅ Analytics dashboards

**Cons:**
- ❌ Monthly subscription fees ($50-300 USD)
- ❌ Per-message fees on top of Meta's charges
- ❌ Limited customization
- ❌ Vendor dependency

**Best for:** Non-technical teams needing turnkey solutions

---

## 💰 Pricing Breakdown (2025)

### Meta's Base Pricing (Chile)
**New model starting July 1, 2025: Per-template message**

| Message Type | Price per Message (Chile) |
|-------------|---------------------------|
| **Utility** (Appointment reminders, confirmations) | ~$0.008 USD |
| **Authentication** (OTP, verification) | ~$0.004 USD |
| **Marketing** (Promotional) | ~$0.013 USD |
| **Service** (User-initiated, 24hr window) | **FREE** |

**Notes:**
- Service messages: When client messages you first, you have 24 hours to respond for FREE
- Prices vary by country (Chile rates shown)
- Volume discounts available

### Total Cost Comparison (1000 maintenance reminders/month)

| Provider | Base Cost | Platform Fee | Total Monthly |
|----------|-----------|--------------|---------------|
| **Meta Cloud API** | $8 | $0 | **$8** |
| **Twilio** | $8 | $5 | **$13** |
| **AiSensy** | $8 | $99 subscription | **$107** |

**Winner:** Meta Cloud API for technical teams

---

## 🏗️ Architecture for AMAWA

### Recommended: Meta WhatsApp Cloud API

```
AMAWA Platform (Next.js)
         ↓
    Cron Jobs / Schedulers
         ↓
    WhatsApp Cloud API
         ↓
    Client's WhatsApp
```

### Implementation Components

1. **Message Templates** (Pre-approved by Meta)
   - Maintenance reminder (3 days before)
   - Maintenance confirmation (1 day before)
   - Maintenance completion notification
   - Reschedule request

2. **Automation Triggers**
   - Daily cron job checks upcoming maintenances
   - Send reminders based on scheduled dates
   - Handle responses (confirmations, reschedules)

3. **Two-Way Communication**
   - Client can reply to confirm/reschedule
   - Webhook receives messages
   - Update maintenance status in database

---

## 📋 Implementation Steps

### Phase 1: Setup (Week 1)
**Get WhatsApp Business Account**

1. Create Meta Business Account (https://business.facebook.com)
2. Register WhatsApp Business phone number
3. Verify business information
4. Get API credentials (Access Token, Phone Number ID)

**Requirements:**
- Business phone number (can't be personal WhatsApp)
- Business documentation (RUT, business registration)
- Facebook Business Manager account

### Phase 2: Template Creation (Week 1-2)
**Create and Submit Message Templates**

Example templates needed:

**Template 1: Maintenance Reminder (3 days before)**
```
Hola {{1}},

Te recordamos que tienes agendada una mantención de tu equipo de purificación de agua AMAWA para el {{2}}.

📅 Fecha: {{2}}
🏠 Dirección: {{3}}

¿Confirmas tu disponibilidad? Responde:
1️⃣ SÍ, confirmo
2️⃣ Necesito reagendar

Saludos,
Equipo AMAWA
```

**Template 2: Confirmation (1 day before)**
```
Hola {{1}},

Mañana {{2}} realizaremos la mantención de tu equipo AMAWA.

🕐 Horario estimado: {{3}}
📍 Dirección: {{4}}

Nuestro técnico {{5}} te contactará al llegar.

Gracias por confiar en AMAWA 💧
```

**Template 3: Completion Notification**
```
Hola {{1}},

✅ Mantención completada exitosamente

📋 Resumen:
- Tipo: {{2}}
- Fecha: {{3}}
- Técnico: {{4}}

Próxima mantención programada: {{5}}

¡Gracias por confiar en AMAWA!
```

**Approval process:**
- Submit templates via Meta Business Manager
- Wait 24-48 hours for approval
- Templates must follow WhatsApp policies (no marketing spam)

### Phase 3: Backend Integration (Week 2)

**Install SDK:**
```bash
npm install whatsapp-cloud-api
# or
npm install axios  # For direct API calls
```

**Create API Service:**

File: `lib/whatsapp/client.ts`
```typescript
import axios from 'axios'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v21.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

export class WhatsAppClient {
  async sendTemplate(
    to: string,
    templateName: string,
    parameters: string[]
  ) {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'es' },
          components: [
            {
              type: 'body',
              parameters: parameters.map(text => ({
                type: 'text',
                text
              }))
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return response.data
  }
}
```

**Create Notification Service:**

File: `lib/notifications/maintenance-reminders.ts`
```typescript
import { WhatsAppClient } from '@/lib/whatsapp/client'
import { PrismaClient } from '@prisma/client'

const whatsapp = new WhatsAppClient()
const prisma = new PrismaClient()

export async function sendMaintenanceReminders() {
  // Get maintenances 3 days from now
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

  const upcomingMaintenances = await prisma.maintenance.findMany({
    where: {
      scheduledDate: {
        gte: new Date(threeDaysFromNow.setHours(0, 0, 0, 0)),
        lte: new Date(threeDaysFromNow.setHours(23, 59, 59, 999))
      },
      status: 'PENDING'
    },
    include: {
      client: true
    }
  })

  for (const maintenance of upcomingMaintenances) {
    const client = maintenance.client

    // Skip if no phone number
    if (!client.phone) continue

    // Format phone for WhatsApp (Chilean format)
    const phone = formatChileanPhone(client.phone)

    try {
      await whatsapp.sendTemplate(
        phone,
        'maintenance_reminder_3days',
        [
          client.name,
          new Date(maintenance.scheduledDate).toLocaleDateString('es-CL'),
          client.address || 'Sin dirección'
        ]
      )

      console.log(`Reminder sent to ${client.name}`)
    } catch (error) {
      console.error(`Failed to send to ${client.name}:`, error)
    }
  }
}

function formatChileanPhone(phone: string): string {
  // Remove spaces, dashes, and country code
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')

  // If starts with +56, remove it
  if (cleaned.startsWith('+56')) {
    return '56' + cleaned.substring(3)
  }

  // If starts with 56, keep it
  if (cleaned.startsWith('56')) {
    return cleaned
  }

  // Otherwise add 56
  return '56' + cleaned
}
```

### Phase 4: Cron Jobs (Week 2-3)

**Option A: Vercel Cron (Recommended for simplicity)**

File: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/maintenance-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

File: `app/api/cron/maintenance-reminders/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { sendMaintenanceReminders } from '@/lib/notifications/maintenance-reminders'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await sendMaintenanceReminders()
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

**Option B: Node-cron (For local development)**
```typescript
import cron from 'node-cron'

// Run every day at 9 AM
cron.schedule('0 9 * * *', async () => {
  await sendMaintenanceReminders()
})
```

### Phase 5: Webhook for Responses (Week 3)

**Handle incoming messages:**

File: `app/api/webhooks/whatsapp/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Webhook verification
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Process incoming messages
  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

  if (message) {
    const from = message.from // Client phone number
    const text = message.text?.body // Message text

    // Handle confirmation/reschedule
    if (text === '1' || text.toLowerCase().includes('confirm')) {
      // Update maintenance status to SCHEDULED
      await handleConfirmation(from)
    } else if (text === '2' || text.toLowerCase().includes('reagendar')) {
      // Mark for rescheduling
      await handleRescheduleRequest(from)
    }
  }

  return NextResponse.json({ success: true })
}
```

---

## 🚀 Recommended Roadmap for AMAWA

### Week 1: Setup & Planning
- [ ] Create Meta Business Account
- [ ] Register WhatsApp Business number
- [ ] Submit message templates for approval
- [ ] Document all credentials in `.env`

### Week 2: Development
- [ ] Install WhatsApp SDK
- [ ] Create WhatsAppClient service
- [ ] Build maintenance reminder service
- [ ] Test with sandbox number

### Week 3: Integration
- [ ] Set up Vercel cron jobs
- [ ] Create webhook endpoint
- [ ] Test end-to-end flow
- [ ] Monitor and debug

### Week 4: Production Launch
- [ ] Go live with approved templates
- [ ] Monitor message delivery rates
- [ ] Gather client feedback
- [ ] Optimize timing and messaging

---

## 💡 Best Practices

### 1. **Phone Number Formatting**
Chilean numbers must be in format: `56912345678` (country code + number)

### 2. **Template Variables**
Keep templates flexible with variables for client name, dates, addresses

### 3. **Opt-Out Mechanism**
Include way for clients to stop notifications:
- "Responde STOP para dejar de recibir recordatorios"
- Store opt-out preferences in database

### 4. **Rate Limiting**
WhatsApp has rate limits:
- Start with 250 messages/day
- Increases with quality rating
- Can scale to 100k+/day

### 5. **Quality Score**
Maintain high quality to avoid restrictions:
- Only send to opted-in users
- Ensure templates are valuable (not spam)
- Monitor block rates

### 6. **Error Handling**
Handle common errors:
- Invalid phone numbers
- Blocked users
- Rate limit exceeded
- Template not approved

---

## 📊 Expected Impact for AMAWA

### Efficiency Gains
- **Manual calls reduced:** 80-90%
- **No-show rate:** Reduced from ~30% to ~5%
- **Staff time saved:** ~20 hours/week

### Client Experience
- ✅ Instant confirmations
- ✅ Flexible rescheduling
- ✅ Professional communication
- ✅ 24/7 availability

### Cost Savings
**Current:** Manual calls + no-shows
- Staff time: 20 hrs/week × $10/hr = $200/week = $800/month
- No-show cost: 30% × 100 maintenances × $50 = $1,500/month
- **Total current cost:** $2,300/month

**With WhatsApp:**
- Message cost: 400 messages × $0.008 = $3.20/month
- Staff time: 2 hrs/week × $10/hr = $20/week = $80/month
- No-show cost: 5% × 100 maintenances × $50 = $250/month
- **Total new cost:** $333.20/month

**Monthly savings:** $1,967 (~$23,600/year) 💰

---

## 🔐 Security Considerations

### Environment Variables Required
```bash
# Meta WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id

# Webhook Security
WEBHOOK_VERIFY_TOKEN=random_secure_token
CRON_SECRET=random_secure_token_for_cron
```

### Data Privacy
- Store WhatsApp message IDs for tracking
- Don't store message content (GDPR/privacy)
- Log only necessary metadata
- Respect opt-out requests immediately

---

## 📚 Resources

### Official Documentation
- Meta WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
- Getting Started Guide: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- Message Templates: https://developers.facebook.com/docs/whatsapp/message-templates

### Helpful Tools
- Template testing: WhatsApp Business Manager
- Phone number formatting: libphonenumber-js
- Webhook testing: ngrok for local development

### Support
- Meta Developer Support: https://developers.facebook.com/support
- WhatsApp Business Help: https://faq.whatsapp.com/

---

## ✅ Next Steps for AMAWA

1. **Decision:** Approve WhatsApp integration (Meta Cloud API recommended)
2. **Account Setup:** Create Meta Business Account and register number
3. **Template Design:** Finalize message templates with AMAWA branding
4. **Development:** Implement integration (1-2 weeks)
5. **Testing:** Pilot with 10-20 clients
6. **Launch:** Roll out to all 641 clients

**Estimated Timeline:** 3-4 weeks from approval to full production

**Estimated Investment:**
- Setup time: ~40 hours development
- Monthly cost: ~$8-15 USD for messages
- ROI: $23,600/year in savings + improved client satisfaction

---

## 🎯 Success Metrics to Track

1. **Message Delivery Rate:** Target 95%+
2. **Confirmation Rate:** Target 80%+
3. **No-Show Reduction:** Target < 5%
4. **Response Time:** Average < 2 hours
5. **Client Satisfaction:** Survey after implementation

---

**Prepared by:** TM3 Corp & Claude Code
**Date:** October 6, 2025
**Status:** Ready for Implementation
