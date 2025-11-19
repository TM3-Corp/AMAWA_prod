# How Claude's Tool Use Works - Complete Explanation

## Overview

Claude doesn't have direct database access. Instead, we give it **tools** (functions) that it can call. Think of it like giving Claude a toolbox with specific tools inside.

## The Toolbox (4 Tools)

```typescript
const tools = [
  'get_client_maintenances(phone)',      // Get someone's maintenances
  'reschedule_maintenance(id, date)',    // Reschedule one maintenance
  'confirm_maintenance_completion(id)',  // Mark one maintenance complete
  'get_client_info(phone)'               // Get client/equipment details
]
```

**Important:** Claude can ONLY use these 4 tools. Nothing else. No arbitrary SQL, no other data access.

## How Claude Decides What to Do

### Example 1: "¿Cuál es el estado de mi mantención?"

```
1. User message arrives via WhatsApp from 56966083433

2. Claude receives:
   - Message: "¿Cuál es el estado de mi mantención?"
   - Phone: "56966083433"
   - Available tools: [get_client_maintenances, reschedule_maintenance, ...]

3. Claude thinks:
   "User wants maintenance status. I need to query their maintenances."

4. Claude calls tool:
   get_client_maintenances("56966083433")

5. Our code executes:
   const client = await prisma.client.findFirst({ where: { phone: "56966083433" }})
   // Returns all maintenances for this client

6. Claude receives tool result:
   {
     upcomingMaintenances: [
       { type: "TWELVE_MONTHS", scheduledDate: "2025-11-15", status: "SCHEDULED" }
     ],
     pastMaintenances: [
       { type: "SIX_MONTHS", completedDate: "2025-11-19", status: "COMPLETED" }
     ]
   }

7. Claude synthesizes response:
   "Hola Paul! Tu próxima mantención está programada para el 15 de noviembre..."
```

### Example 2: "Por favor, marca mis mantenciones como completadas"

```
1. User: "Por favor, marca mis mantenciones como completadas"
   Phone: 56966083433

2. Claude thinks:
   "Need to complete MULTIPLE maintenances. First, I need to see which ones are pending."

3. Claude calls: get_client_maintenances("56966083433")

4. Tool returns:
   {
     upcomingMaintenances: [
       { id: "uuid-1", type: "TWELVE_MONTHS", status: "SCHEDULED" },
       { id: "uuid-2", type: "EIGHTEEN_MONTHS", status: "PENDING" },
       { id: "uuid-3", type: "TWENTY_FOUR_MONTHS", status: "PENDING" }
     ]
   }

5. Claude thinks:
   "I found 3 pending maintenances. I'll complete each one."

6. Claude calls (in sequence):
   confirm_maintenance_completion("uuid-1")
   confirm_maintenance_completion("uuid-2")
   confirm_maintenance_completion("uuid-3")

7. Each tool call executes:
   await prisma.maintenance.update({
     where: { id: "uuid-1" },
     data: { status: 'COMPLETED', completedDate: new Date() }
   })

8. Claude responds:
   "✅ He marcado 3 mantenciones como completadas: 12 meses, 18 meses, y 24 meses."
```

This is **multi-step reasoning**! Claude automatically figures out it needs to:
1. First query to find pending maintenances
2. Then make multiple completion calls

## What Claude CANNOT Do

### ❌ Example 3: "¿Cuántos usuarios hay en la plataforma?"

```
1. User: "¿Cuántos usuarios hay en la plataforma?"

2. Claude thinks:
   "User wants total client count. Let me check my tools..."

3. Available tools:
   - get_client_maintenances(phone) ← Needs a specific phone number
   - reschedule_maintenance(id, date) ← Not relevant
   - confirm_maintenance_completion(id) ← Not relevant
   - get_client_info(phone) ← Needs a specific phone number

4. Claude realizes:
   "None of my tools can count ALL clients. They all require a phone number."

5. Claude responds:
   "Lo siento, no tengo acceso a estadísticas generales de la plataforma.
    Solo puedo ayudarte con información sobre tus propias mantenciones."
```

**Why?** We didn't give Claude a `get_platform_statistics()` tool!

### ❌ Example 4: "¿Qué modelo usa Javier Ignacio Fernández Faundez?"

```
1. User: "¿Qué modelo usa Javier Ignacio Fernández Faundez?"

2. Claude thinks:
   "User wants equipment info for 'Javier'. But my tools only accept phone numbers!"

3. Available tools:
   - get_client_info(phone) ← I need a PHONE, not a NAME

4. Claude realizes:
   "I cannot search by name. This is outside my scope."

5. Claude responds:
   "Lo siento, solo puedo acceder a tu propia información usando tu número de teléfono.
    No puedo buscar información de otros clientes por nombre."
```

**Why?**
- Privacy/security design choice
- Tools only accept phone numbers (the authenticated user)
- Claude cannot query arbitrary fields

## Tool Scope Definition

Tools are defined in `lib/claude.ts` with explicit schemas:

```typescript
{
  name: 'get_client_maintenances',
  description: 'Get all maintenances for a client by phone number',
  input_schema: {
    type: 'object',
    properties: {
      phone: {
        type: 'string',
        description: 'Client phone number in format 56912345678'
      }
    },
    required: ['phone']  // ← Phone is REQUIRED
  }
}
```

This schema acts as a **contract**:
- Claude knows exactly what parameters it can use
- TypeScript enforces the parameters at runtime
- No way for Claude to "hack" around these restrictions

## Security Implications

**What's protected:**

✅ Claude can only access data for the **authenticated user** (via phone number)
✅ No cross-client data access (can't query other people's info)
✅ No arbitrary SQL injection (Prisma handles queries)
✅ No admin operations (we didn't expose them)

**What's exposed:**

⚠️ Any user can query their OWN data (maintenances, equipment, contract)
⚠️ Any user can modify their OWN maintenances (reschedule, complete)

**This is by design!** It's like giving users a limited API to their own data.

## Adding New Capabilities

Want to enable "¿Cuántos usuarios hay en la plataforma?"

Add a new tool:

```typescript
{
  name: 'get_platform_statistics',
  description: 'Get overall platform statistics (public metrics only)',
  input_schema: {
    type: 'object',
    properties: {
      metric: {
        type: 'string',
        enum: ['total_clients', 'total_maintenances', 'active_contracts']
      }
    },
    required: ['metric']
  }
}

async function executeGetPlatformStatistics(metric: string) {
  switch (metric) {
    case 'total_clients':
      const count = await prisma.client.count()
      return { metric: 'total_clients', value: count }
    case 'total_maintenances':
      const maintenanceCount = await prisma.maintenance.count()
      return { metric: 'total_maintenances', value: maintenanceCount }
    // ...
  }
}
```

Now Claude can answer: "Actualmente hay 675 clientes activos en la plataforma AMAWA."

## Model Comparison

### Claude Haiku 4.5 (Current - Recommended)
- **Model ID:** `claude-haiku-4-5`
- **Cost:** $1/$5 per million input/output tokens (~$0.0006/message)
- **Performance:** Significantly improved reasoning vs 3.5
- **Best for:** Production WhatsApp use cases

### Claude 3.5 Haiku (Older)
- **Model ID:** `claude-3-5-haiku-20241022`
- **Cost:** $0.80/$4 per million tokens (~$0.0005/message)
- **Performance:** Good for simple tasks
- **Best for:** Ultra-low-cost scenarios

### Claude Sonnet 4.5
- **Model ID:** `claude-sonnet-4-20250514`
- **Cost:** $3/$15 per million tokens (~$0.004/message)
- **Performance:** Best reasoning, complex queries
- **Best for:** Complex multi-step operations

**You can switch models via environment variable:**
```bash
# Use Haiku 4.5 (default - recommended)
CLAUDE_MODEL=claude-haiku-4-5

# Use Haiku 3.5 (cheaper, older)
CLAUDE_MODEL=claude-3-5-haiku-20241022

# Use Sonnet 4.5 (smarter, more expensive)
CLAUDE_MODEL=claude-sonnet-4-20250514
```

## The Magic of Multi-Step Reasoning

Claude can automatically chain tools together:

**User:** "Quiero reagendar todas mis mantenciones pendientes para el próximo mes"

**Claude's thought process:**
```
1. "I need to find pending maintenances first"
   → Call get_client_maintenances(phone)

2. "I got 3 pending maintenances, now I need to reschedule each"
   → Call reschedule_maintenance(id1, "2025-12-15")
   → Call reschedule_maintenance(id2, "2025-12-20")
   → Call reschedule_maintenance(id3, "2025-12-25")

3. "All rescheduled! Now I'll summarize for the user"
   → Generate response in Spanish
```

**This is the power of LLM tool use!** Claude handles the orchestration logic.

## Limitations & Design Choices

| What Claude CAN Do | What Claude CANNOT Do |
|--------------------|-----------------------|
| Query your own maintenances | Count all clients in system |
| Reschedule your maintenances | Search clients by name |
| Complete your maintenances | Access other users' data |
| View your equipment info | Execute arbitrary SQL |
| Multi-step operations | Modify database schema |
| Natural language → SQL | Delete records |

These limitations are **intentional** for security and privacy.

## Real-World Flow

```
WhatsApp User Message
        ↓
Meta Webhook POST → /api/webhooks/whatsapp
        ↓
Extract: phone="56966083433", message="¿Cuál es el estado de mi mantención?"
        ↓
Call: processMessageWithClaude(message, phone)
        ↓
Claude API receives:
  - System prompt (schema context)
  - Tools definitions
  - User message with phone
        ↓
Claude thinks: "I need to call get_client_maintenances"
        ↓
Tool call: { name: "get_client_maintenances", input: { phone: "56966083433" } }
        ↓
Our code executes: executeGetClientMaintenances("56966083433")
        ↓
Prisma query: client.findFirst({ where: { phone }, include: { maintenances } })
        ↓
Database returns: { client: {...}, maintenances: [...] }
        ↓
Tool result sent back to Claude
        ↓
Claude generates Spanish response
        ↓
Response sent via WhatsApp API
        ↓
User receives: "Hola Paul! Tu próxima mantención..."
```

**Total latency:** 2-5 seconds (Claude API call is the bottleneck)

## Summary

**Tool Use = Giving Claude a controlled interface to your database**

- ✅ No direct SQL access
- ✅ Explicit tool definitions with schemas
- ✅ Type-safe parameters
- ✅ Scoped to authenticated user
- ✅ Multi-step reasoning automatically handled
- ✅ Natural language interface for users

**It's like building an API that Claude consumes on behalf of your users!**
