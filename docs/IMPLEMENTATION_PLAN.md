# WhatsApp AI Implementation Plan - Phase 3 (Fully Automated)

## 🎯 Goal: Automated Rescheduling with Database Updates

Client says "El martes" → AI finds slots → Proposes times → Client picks → **Database automatically updated!**

---

## 💰 Cost Optimization Strategy

### WhatsApp Pricing Breakdown

**Message Types:**
1. **Template/Business-Initiated** (~$0.008): When YOU send first (reminders)
2. **Session/User-Initiated** (FREE): 24 hours after client responds

### Cost Per Maintenance (Optimized)

**Scenario 1: Client Confirms**
```
Day -7: Reminder sent              → $0.008 (template)
Client: "Confirmo"                 → FREE (opens 24hr window)
AI: "✅ Confirmado..."             → FREE (within session)

Total: $0.008 WhatsApp + $0.001 AI = $0.009
```

**Scenario 2: Client Reschedules**
```
Day -7: Reminder sent              → $0.008 (template)
Client: "Necesito reagendar"       → FREE (opens 24hr window)
AI: "¿Qué día?"                    → FREE
Client: "El martes"                → FREE
AI: "Martes 22, 10am o 2pm?"       → FREE
Client: "10am"                     → FREE
AI: "✅ Reagendado"                → FREE

Total: $0.008 WhatsApp + $0.004 AI = $0.012
```

**Scenario 3: Complex Multi-Day Rescheduling**
```
Day -7: Reminder sent              → $0.008
[24hr session expires before resolved]
Day -6: AI sends follow-up         → $0.008
Client: "10am perfecto"            → FREE
AI: "✅ Confirmado"                → FREE

Total: $0.016 WhatsApp + $0.006 AI = $0.022
```

### Monthly Cost Projection (641 Clients, 4 Cycles/Year)

**~214 maintenances per month:**
- 170 confirmations (80%): 170 × $0.009 = **$1.53**
- 40 reschedules (18%): 40 × $0.012 = **$0.48**
- 4 complex (2%): 4 × $0.022 = **$0.09**

**Total monthly cost: ~$2.10** (WhatsApp + AI) 🎉

**Compare to:**
- Manual calls: $800/month
- **Savings: $798/month ($9,576/year!)**

---

## 🏗️ Technical Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. CRON JOB (Daily 9 AM)                               │
│     Check maintenances 7 days from now                  │
│     Send WhatsApp template reminder                     │
│     Cost: $0.008 per message                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. CLIENT RESPONDS (Opens 24hr FREE window)            │
│     "1", "confirmo", "necesito reagendar", etc.         │
│     Webhook receives message                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. AI AGENT (Claude Haiku)                             │
│     - Understands intent                                │
│     - Checks available slots in DB                      │
│     - Proposes specific dates/times                     │
│     - Updates database when confirmed                   │
│     Cost: $0.004 per conversation                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. DATABASE UPDATE                                     │
│     maintenance.scheduledDate = new Date               │
│     maintenance.status = 'RESCHEDULED'                 │
│     maintenance.notes = 'AI: Cliente solicitó...'      │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Steps

### Phase 1: Setup Meta WhatsApp (Week 1)

**1.1 Create Business Account**
- Go to: https://business.facebook.com
- Create Meta Business Account
- Add business info (AMAWA details, RUT)

**1.2 Register WhatsApp Number**
- Need dedicated business phone number (not personal)
- Options:
  - Get new Chilean number (+56 9 XXXX XXXX)
  - Port existing business line
  - Use virtual number (Twilio, etc.)

**1.3 Create Message Templates**

**Template: `maintenance_reminder_7days`**
```
Hola {{1}},

Te recordamos tu mantención AMAWA:

📅 Fecha: {{2}}
🕐 Hora: {{3}}
📍 Dirección: {{4}}

Responde con:
1️⃣ Confirmo
2️⃣ Necesito reagendar

O escribe lo que necesites, estamos para ayudarte 💧

Equipo AMAWA
```

**Submit for approval** (24-48 hours)

**1.4 Get API Credentials**
```bash
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=9876543210
```

---

### Phase 2: Build AI Agent (Week 1-2)

**2.1 Install Dependencies**
```bash
npm install @anthropic-ai/sdk
npm install date-fns  # For date manipulation
```

**2.2 Create AI Agent Service**

File: `lib/ai/maintenance-agent.ts`
```typescript
import Anthropic from '@anthropic-ai/sdk'
import { PrismaClient } from '@prisma/client'
import { addDays, format, parse, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const prisma = new PrismaClient()

interface AIResponse {
  intent: 'confirm' | 'reschedule' | 'cancel' | 'question' | 'unclear'
  message: string  // Response to send to client
  proposedDate?: string  // ISO date if rescheduling
  proposedTime?: string  // HH:MM if specific time
  confidence: number  // 0-1, how confident AI is
  requiresHuman: boolean  // Flag for manual review
}

export class MaintenanceAIAgent {

  async processMessage(
    userMessage: string,
    maintenanceId: string
  ): Promise<AIResponse> {

    // Get maintenance context
    const maintenance = await prisma.maintenance.findUnique({
      where: { id: maintenanceId },
      include: {
        client: {
          include: {
            equipment: true,
            contracts: true
          }
        }
      }
    })

    if (!maintenance) {
      throw new Error('Maintenance not found')
    }

    // Build context for AI
    const systemPrompt = this.buildSystemPrompt(maintenance)

    // Get AI response with function calling
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 500,
      system: systemPrompt,
      tools: this.getTools(),
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    })

    // Process AI response
    return this.processAIResponse(response, maintenance)
  }

  private buildSystemPrompt(maintenance: any): string {
    const scheduledDate = format(
      new Date(maintenance.scheduledDate),
      "EEEE d 'de' MMMM",
      { locale: es }
    )

    return `Eres el asistente virtual de AMAWA, empresa de purificación de agua en Chile.

CONTEXTO ACTUAL:
Cliente: ${maintenance.client.name}
Mantención programada: ${scheduledDate}
Dirección: ${maintenance.client.address}, ${maintenance.client.comuna}
Tipo: ${this.getMaintenanceTypeLabel(maintenance.type)}
Técnico asignado: ${maintenance.technicianId || 'Por asignar'}

FECHA ACTUAL: ${format(new Date(), 'yyyy-MM-dd')}

TU TRABAJO:
1. Ayudar al cliente a CONFIRMAR o REAGENDAR su mantención
2. Si quiere reagendar:
   - Pregunta qué día prefiere
   - Usa la función check_available_slots para verificar disponibilidad
   - Propón horarios específicos (10am, 12pm, 2pm, 4pm)
   - Cuando confirme, usa reschedule_maintenance para actualizar
3. Si confirma: Agradece y confirma los detalles

REGLAS IMPORTANTES:
- Sé amable, profesional pero cercano
- Usa lenguaje chileno natural ("¿te viene bien?", "bacán", "listo")
- SIEMPRE verifica disponibilidad antes de proponer fechas
- Fechas en formato: "Martes 22 de octubre"
- Horas en formato 12 horas: "10 AM", "2 PM"
- Si no entiendes, pide clarificación
- Si es urgente/complejo, deriva a equipo humano
- Termina mensajes con emoji 💧

EXPRESIONES CHILENAS COMUNES:
"el próximo martes" = siguiente martes desde hoy
"la otra semana" = +7 días
"en dos semanas" = +14 días
"el lunes" = próximo lunes
"mañana" = +1 día
"pasado mañana" = +2 días

IMPORTANTE: Cuando uses las funciones, el cliente NO ve los resultados.
Debes interpretar y responder en lenguaje natural.`
  }

  private getTools() {
    return [
      {
        name: 'check_available_slots',
        description: 'Verifica disponibilidad de horarios para una fecha específica',
        input_schema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Fecha en formato YYYY-MM-DD'
            }
          },
          required: ['date']
        }
      },
      {
        name: 'reschedule_maintenance',
        description: 'Reagenda la mantención a nueva fecha y hora',
        input_schema: {
          type: 'object',
          properties: {
            new_date: {
              type: 'string',
              description: 'Nueva fecha en formato YYYY-MM-DD'
            },
            new_time: {
              type: 'string',
              description: 'Hora en formato HH:MM (24h), ej: 10:00, 14:00'
            },
            reason: {
              type: 'string',
              description: 'Motivo del cambio'
            }
          },
          required: ['new_date', 'new_time']
        }
      },
      {
        name: 'confirm_maintenance',
        description: 'Confirma la mantención en su fecha original',
        input_schema: {
          type: 'object',
          properties: {
            confirmation_note: {
              type: 'string',
              description: 'Nota adicional si hay alguna'
            }
          }
        }
      }
    ]
  }

  private async processAIResponse(
    response: any,
    maintenance: any
  ): Promise<AIResponse> {

    let intent: AIResponse['intent'] = 'unclear'
    let message = ''
    let proposedDate: string | undefined
    let proposedTime: string | undefined
    let requiresHuman = false

    // Check if AI used tools
    for (const content of response.content) {

      if (content.type === 'tool_use') {
        const toolName = content.name
        const input = content.input

        switch (toolName) {
          case 'check_available_slots':
            // Check DB for available slots
            const slots = await this.checkAvailableSlots(input.date)

            // Return result to AI (it will format response)
            message = await this.continueWithToolResult(
              response,
              content.id,
              slots
            )

            intent = 'reschedule'
            proposedDate = input.date
            break

          case 'reschedule_maintenance':
            // Update database
            await this.updateMaintenance(
              maintenance.id,
              input.new_date,
              input.new_time,
              input.reason
            )

            intent = 'reschedule'
            proposedDate = input.new_date
            proposedTime = input.new_time

            // AI will send confirmation message
            message = await this.continueWithToolResult(
              response,
              content.id,
              { success: true }
            )
            break

          case 'confirm_maintenance':
            // Update status to SCHEDULED
            await prisma.maintenance.update({
              where: { id: maintenance.id },
              data: {
                status: 'SCHEDULED',
                notes: input.confirmation_note,
                updatedAt: new Date()
              }
            })

            intent = 'confirm'

            message = await this.continueWithToolResult(
              response,
              content.id,
              { success: true }
            )
            break
        }
      } else if (content.type === 'text') {
        message = content.text
      }
    }

    return {
      intent,
      message,
      proposedDate,
      proposedTime,
      confidence: 0.9, // High confidence with function calling
      requiresHuman
    }
  }

  private async checkAvailableSlots(dateStr: string): Promise<string[]> {
    const date = new Date(dateStr)

    // Count existing maintenances on this date
    const count = await prisma.maintenance.count({
      where: {
        scheduledDate: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999))
        },
        status: {
          in: ['SCHEDULED', 'IN_PROGRESS', 'PENDING']
        }
      }
    })

    // Assuming 2 technicians, 4 slots each = 8 total per day
    const maxPerDay = 8
    const available = maxPerDay - count

    if (available <= 0) {
      return [] // No slots available
    }

    // Return all possible slots (AI will format nicely)
    return ['10:00', '12:00', '14:00', '16:00']
  }

  private async updateMaintenance(
    maintenanceId: string,
    newDate: string,
    newTime: string,
    reason?: string
  ) {
    const [hours, minutes] = newTime.split(':').map(Number)
    const scheduledDate = new Date(newDate)
    scheduledDate.setHours(hours, minutes, 0, 0)

    await prisma.maintenance.update({
      where: { id: maintenanceId },
      data: {
        scheduledDate,
        status: 'RESCHEDULED',
        notes: reason || 'Reagendado por cliente vía WhatsApp',
        updatedAt: new Date()
      }
    })
  }

  private async continueWithToolResult(
    previousResponse: any,
    toolUseId: string,
    result: any
  ): Promise<string> {
    // Continue conversation with tool result
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      messages: [
        ...previousResponse.messages,
        {
          role: 'assistant',
          content: previousResponse.content
        },
        {
          role: 'user',
          content: [
            {
              type: 'tool_result',
              tool_use_id: toolUseId,
              content: JSON.stringify(result)
            }
          ]
        }
      ]
    })

    return response.content.find((c: any) => c.type === 'text')?.text || ''
  }

  private getMaintenanceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      '6_months': 'Semestral (6 meses)',
      '12_months': 'Anual (12 meses)',
      '18_months': '18 meses',
      '24_months': 'Bianual (24 meses)'
    }
    return labels[type] || type
  }
}
```

**2.3 Create WhatsApp Webhook**

File: `app/api/webhooks/whatsapp/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { MaintenanceAIAgent } from '@/lib/ai/maintenance-agent'
import { WhatsAppClient } from '@/lib/whatsapp/client'
import { PrismaClient } from '@prisma/client'

const agent = new MaintenanceAIAgent()
const whatsapp = new WhatsAppClient()
const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  // Webhook verification
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract message
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]

    if (!message) {
      return NextResponse.json({ success: true })
    }

    const from = message.from // Client phone number
    const messageText = message.text?.body

    if (!messageText) {
      return NextResponse.json({ success: true })
    }

    // Find maintenance for this phone number
    const maintenance = await prisma.maintenance.findFirst({
      where: {
        client: {
          phone: {
            contains: from.slice(-8) // Match last 8 digits
          }
        },
        status: {
          in: ['PENDING', 'SCHEDULED']
        },
        scheduledDate: {
          gte: new Date() // Future maintenances only
        }
      },
      include: {
        client: true
      },
      orderBy: {
        scheduledDate: 'asc' // Nearest first
      }
    })

    if (!maintenance) {
      // No pending maintenance found
      await whatsapp.sendMessage(
        from,
        'Hola! No encontramos mantenciones pendientes para este número. Para ayudarte, llámanos al +56 9 1234 5678 📞'
      )
      return NextResponse.json({ success: true })
    }

    // Process with AI
    const aiResponse = await agent.processMessage(messageText, maintenance.id)

    // Send response
    await whatsapp.sendMessage(from, aiResponse.message)

    // Log conversation
    await prisma.maintenanceMessage.create({
      data: {
        maintenanceId: maintenance.id,
        from: 'client',
        to: 'system',
        message: messageText,
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
        timestamp: new Date()
      }
    })

    await prisma.maintenanceMessage.create({
      data: {
        maintenanceId: maintenance.id,
        from: 'system',
        to: 'client',
        message: aiResponse.message,
        metadata: {
          proposedDate: aiResponse.proposedDate,
          proposedTime: aiResponse.proposedTime
        },
        timestamp: new Date()
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

### Phase 3: Database Schema Updates (Week 2)

**Add conversation tracking table:**

```prisma
// prisma/schema.prisma

model MaintenanceMessage {
  id             String   @id @default(uuid())
  maintenanceId  String   @map("maintenance_id")
  from           String   // 'client' | 'system' | 'staff'
  to             String
  message        String   @db.Text
  intent         String?  // AI detected intent
  confidence     Float?   // AI confidence 0-1
  metadata       Json?    // Additional data
  timestamp      DateTime @default(now())

  maintenance    Maintenance @relation(fields: [maintenanceId], references: [id], onDelete: Cascade)

  @@index([maintenanceId])
  @@index([timestamp])
  @@map("maintenance_messages")
}

// Update Maintenance model
model Maintenance {
  // ... existing fields

  messages       MaintenanceMessage[]
  confirmedAt    DateTime? @map("confirmed_at")

  // ... rest of model
}
```

**Run migration:**
```bash
npx prisma migrate dev --name add_whatsapp_conversations
npx prisma generate
```

---

### Phase 4: Cron Job for Reminders (Week 2)

**File: `app/api/cron/maintenance-reminders/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { WhatsAppClient } from '@/lib/whatsapp/client'
import { addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

const prisma = new PrismaClient()
const whatsapp = new WhatsAppClient()

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get maintenances 7 days from now
    const targetDate = addDays(new Date(), 7)
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

    const maintenances = await prisma.maintenance.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'PENDING'
      },
      include: {
        client: true
      }
    })

    const results = {
      sent: 0,
      failed: 0,
      skipped: 0
    }

    for (const maintenance of maintenances) {
      const client = maintenance.client

      // Skip if no phone
      if (!client.phone) {
        results.skipped++
        continue
      }

      try {
        // Format Chilean phone number
        const phone = formatChileanPhone(client.phone)

        // Format date nicely
        const dateStr = format(
          new Date(maintenance.scheduledDate),
          "EEEE d 'de' MMMM",
          { locale: es }
        )

        const timeStr = format(
          new Date(maintenance.scheduledDate),
          'HH:mm'
        )

        // Send template message
        await whatsapp.sendTemplate(
          phone,
          'maintenance_reminder_7days',
          [
            client.name,
            dateStr,
            timeStr,
            client.address || 'Sin dirección registrada'
          ]
        )

        // Update maintenance to mark reminder sent
        await prisma.maintenance.update({
          where: { id: maintenance.id },
          data: {
            notes: `Recordatorio enviado: ${new Date().toISOString()}`
          }
        })

        results.sent++

      } catch (error) {
        console.error(`Failed to send to ${client.name}:`, error)
        results.failed++
      }
    }

    return NextResponse.json({
      success: true,
      results,
      date: targetDate
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    )
  }
}

function formatChileanPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')

  // If starts with 56, keep it
  if (cleaned.startsWith('56')) {
    return cleaned
  }

  // Otherwise add 56
  return '56' + cleaned
}
```

**Setup Vercel Cron:**

`vercel.json`:
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

---

## 📊 Testing Strategy

### 1. Sandbox Testing (Week 2)
- Use WhatsApp test numbers
- Test all conversation flows
- Verify database updates

### 2. Pilot Group (Week 3)
- Select 20 friendly clients
- Monitor all conversations
- Gather feedback
- Fix any issues

### 3. Full Rollout (Week 4)
- Enable for all 641 clients
- Monitor daily metrics
- Optimize prompts based on data

---

## 🎯 Success Metrics

**Track weekly:**
- Messages sent: X
- Confirmations: Y%
- Reschedules: Z%
- Manual interventions needed: W
- Client satisfaction: Survey

**Goal:**
- 95%+ automatic handling
- < 5% manual intervention
- < $3/month total cost

---

## ✅ Deliverables

**Week 1:**
- [ ] Meta Business Account created
- [ ] WhatsApp number registered
- [ ] Templates approved
- [ ] API credentials obtained

**Week 2:**
- [ ] AI agent implemented
- [ ] Webhook deployed
- [ ] Database schema updated
- [ ] Cron job configured

**Week 3:**
- [ ] Sandbox testing complete
- [ ] Pilot with 20 clients
- [ ] Monitoring dashboard

**Week 4:**
- [ ] Full rollout
- [ ] Documentation complete
- [ ] Training for staff

---

**Total Cost:** ~$2/month + one-time dev time
**ROI:** $798/month savings = **39,900% ROI!** 🚀

---

**Next Steps:**
1. Get Meta Business Account approval
2. I'll implement the complete system
3. Test with pilot group
4. Launch! 🎉
