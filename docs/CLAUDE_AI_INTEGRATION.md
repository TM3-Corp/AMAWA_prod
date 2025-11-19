# Claude AI Integration for WhatsApp Conversational Interface

## Overview

AMAWA's WhatsApp webhook now supports AI-powered conversational processing using Anthropic's Claude API. This enables clients to interact with their maintenance data using natural language instead of rigid command patterns.

## Architecture

```
WhatsApp Message → Meta Webhook → AMAWA API → Claude AI → Database Tools → Response
```

### Key Components

1. **lib/claude.ts** - Core AI integration module
   - Tool definitions for database operations
   - Message processing with Claude Sonnet 4.5
   - Database query execution via Prisma

2. **app/api/webhooks/whatsapp/route.ts** - Webhook handler
   - Receives incoming WhatsApp messages
   - Routes to AI processing (when enabled) or legacy pattern matching
   - Stores messages and processing results in database

3. **app/api/claude/test/route.ts** - Test API endpoint
   - GET: Test basic Claude API connection
   - POST: Test message processing with phone number

## Features

### Supported Operations (via Natural Language)

1. **Check Maintenance Status**
   - "¿Cuál es el estado de mi mantención?"
   - "¿Cuándo es mi próxima mantención?"

2. **View Maintenance History**
   - "Muéstrame mi historial de mantenciones"
   - "¿Qué mantenciones tengo pendientes?"

3. **Reschedule Maintenance** (Coming soon)
   - "Quiero reagendar mi mantención para el martes 26 de noviembre"
   - "¿Puedo cambiar la fecha de mi mantención?"

4. **Confirm Maintenance Completion**
   - "Sí, confirmé que cambiaron mis filtros"
   - Falls back to legacy pattern matching for simple "Si" responses

5. **Get Client Information**
   - "¿Cuál es mi plan actual?"
   - "Muéstrame mi información de equipo"

### Claude Tools (Function Calling)

The AI has access to these database tools:

```typescript
1. get_client_maintenances(phone: string)
   - Returns upcoming and past maintenances for a client

2. reschedule_maintenance(maintenanceId: string, newDate: string)
   - Reschedules a maintenance to a new date
   - Sets status to SCHEDULED
   - Adds note: "Reagendada vía WhatsApp con Claude AI"

3. confirm_maintenance_completion(maintenanceId: string, notes?: string)
   - Marks maintenance as COMPLETED
   - Sets actualDate and completedDate to now
   - Adds note: "Confirmado vía WhatsApp con Claude AI"

4. get_client_info(phone: string)
   - Returns client details, equipment, and contract information
```

## Setup

### 1. Get Claude API Key

1. Visit https://console.anthropic.com/settings/keys
2. Create a new API key
3. Copy the key (starts with `sk-ant-api03-...`)

### 2. Add to Environment Variables

Add to `.env.local`:

```bash
# Claude AI Integration
CLAUDE_API_KEY=sk-ant-api03-YOUR_KEY_HERE
WHATSAPP_AI_ENABLED=true  # Set to false to disable AI processing
```

### 3. Deploy

The integration works automatically in production. When `WHATSAPP_AI_ENABLED=true`, all incoming WhatsApp text messages will be processed by Claude AI instead of pattern matching.

## Testing

### Test 1: Basic Connection

```bash
curl http://localhost:3000/api/claude/test
```

Expected response:
```json
{
  "success": true,
  "message": "Conexión exitosa con Claude API"
}
```

### Test 2: Message Processing

```bash
curl -X POST http://localhost:3000/api/claude/test \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuál es el estado de mi mantención?",
    "phone": "56966083433"
  }'
```

Expected response:
```json
{
  "success": true,
  "response": "Hola Paul! Te muestro el estado actual de tus mantenciones...",
  "phone": "56966083433",
  "originalMessage": "¿Cuál es el estado de mi mantención?"
}
```

### Test 3: Full Integration Test Script

```bash
npx tsx scripts/test-claude-integration.ts
```

This runs comprehensive tests including:
- API connection verification
- Client maintenance status queries
- Reschedule requests
- Natural language understanding

## Usage Examples

### Client Perspective (WhatsApp)

**Client:** "Hola, ¿cuándo es mi próxima mantención?"

**Claude AI:**
```
Hola Maria! 👋

Tu próxima mantención está programada para el 15 de diciembre de 2025.

Es una mantención de 12 meses y el estado actual es PROGRAMADA ✅

¿Necesitas reprogramarla o tienes alguna consulta específica?
```

**Client:** "Sí, ¿la podemos mover al martes 17 de diciembre?"

**Claude AI:**
```
¡Perfecto! He reagendado tu mantención para el martes 17 de diciembre de 2025.

📅 Detalles actualizados:
- Tipo: Mantención de 12 meses
- Nueva fecha: 17 de diciembre de 2025
- Estado: PROGRAMADA ✅

¿Hay algo más en lo que pueda ayudarte?
```

## How It Works

### 1. Message Reception

When a WhatsApp message arrives:
1. Meta sends webhook POST to `/api/webhooks/whatsapp`
2. Message is stored in `whatsapp_messages` table
3. Client is identified by phone number

### 2. AI Processing Flow

```typescript
if (AI_ENABLED) {
  // 1. Send message + phone to Claude API
  const aiResponse = await processMessageWithClaude(text, phone)

  // 2. Claude analyzes message and decides which tools to use
  // 3. Tools query database via Prisma
  // 4. Claude generates natural language response
  // 5. Response is stored in database

  // TODO: Send response back to client via WhatsApp
}
```

### 3. Tool Execution

When Claude needs data, it calls tools like:

```typescript
// Example: Client asks "¿Cuál es mi próxima mantención?"

// Claude calls: get_client_maintenances("56912345678")
// Returns:
{
  client: { name: "Maria Gonzalez", phone: "56912345678" },
  upcomingMaintenances: [
    {
      id: "uuid-123",
      type: "TWELVE_MONTHS",
      scheduledDate: "2025-12-15",
      status: "SCHEDULED"
    }
  ],
  pastMaintenances: [ /* ... */ ]
}

// Claude synthesizes natural language response using this data
```

## Cost Considerations

### Anthropic Pricing (as of Nov 2024)

- **Model:** Claude Sonnet 4.5 (`claude-sonnet-4-20250514`)
- **Input:** $3.00 per million tokens
- **Output:** $15.00 per million tokens

### Estimated Costs

Typical conversation:
- Input: ~500 tokens (schema + message + tool results)
- Output: ~200 tokens (response)
- **Cost per message:** ~$0.004 (less than half a cent)

At 1,000 messages/month: **~$4/month**

## Migration Strategy

### Phase 1: Parallel Mode (Current)
- Legacy pattern matching continues to work
- AI can be enabled/disabled via env var
- Both systems store processing results

### Phase 2: AI-First Mode
- Set `WHATSAPP_AI_ENABLED=true` in production
- Legacy patterns serve as fallback
- Monitor AI performance via `whatsapp_messages.processingNotes`

### Phase 3: AI-Only Mode
- Remove legacy pattern matching
- All messages processed by Claude
- Add response sending back to WhatsApp

## Database Schema

### WhatsAppMessage Table

```prisma
model WhatsAppMessage {
  id                    String    @id @default(uuid())
  waMessageId          String    @unique
  fromPhone            String
  clientId             String?   // Linked client
  messageType          String    // text, interactive, image, etc.
  textBody             String?
  interactiveType      String?
  buttonId             String?
  buttonTitle          String?
  rawPayload           Json
  timestamp            DateTime
  processed            Boolean   @default(false)
  processedAt          DateTime?
  processingNotes      String?   // AI response stored here
  relatedMaintenanceId String?   // Linked maintenance
  createdAt            DateTime  @default(now())
}
```

## Security

### API Key Protection
- **NEVER** commit `.env.local` to Git
- Use Vercel environment variables for production
- Rotate keys if exposed

### Input Validation
- Phone numbers validated against client database
- Tool parameters type-checked by Claude
- Database operations use Prisma (SQL injection safe)

### Rate Limiting
- WhatsApp webhook has built-in rate limits
- Consider adding Redis-based rate limiting for production

## Monitoring

### Key Metrics to Track

1. **AI Processing Success Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE processed = true) * 100.0 / COUNT(*) as success_rate
   FROM whatsapp_messages
   WHERE "messageType" = 'text'
   ```

2. **Tool Usage Frequency**
   - Monitor which tools Claude uses most
   - Optimize slow database queries

3. **Response Quality**
   - Review `processingNotes` for AI responses
   - Collect user feedback

## Future Enhancements

### Near-term
1. **Send responses back to clients** via WhatsApp API
2. **Add more tools:**
   - `create_incident` - Report equipment issues
   - `get_filter_inventory` - Check filter availability
   - `schedule_callback` - Request technician callback

### Long-term
1. **Multi-turn conversations** - Maintain conversation context
2. **Image analysis** - Process photos of equipment issues
3. **Voice notes** - Transcribe and process audio messages
4. **Proactive notifications** - AI-generated maintenance reminders

## Troubleshooting

### Error: "CLAUDE_API_KEY not set"
**Solution:** Ensure `.env.local` contains valid API key and restart dev server

### Error: "Could not resolve authentication method"
**Solution:** API key is loaded after client initialization. Use lazy initialization pattern (already implemented in `lib/claude.ts`)

### Messages not processing with AI
**Solution:** Check `WHATSAPP_AI_ENABLED=true` in environment variables

### AI responses are in English instead of Spanish
**Solution:** Schema context includes instructions for Spanish responses. Check SCHEMA_CONTEXT in `lib/claude.ts`

## Support

For issues with:
- **Anthropic API:** https://support.anthropic.com
- **AMAWA Integration:** Contact development team
- **WhatsApp Business API:** https://developers.facebook.com/support

## References

- [Anthropic Claude API Docs](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Tool Use (Function Calling)](https://docs.anthropic.com/claude/docs/tool-use)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
