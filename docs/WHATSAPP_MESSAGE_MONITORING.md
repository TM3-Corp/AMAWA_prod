# WhatsApp Message Monitoring System

**Created**: November 18, 2025
**Status**: ✅ Production Ready

---

## Overview

The AMAWA platform now has a complete WhatsApp message monitoring and response system that:

1. **Stores all incoming messages** from clients in the database
2. **Links messages to clients and maintenances** automatically
3. **Automatically updates maintenance statuses** based on client responses
4. **Provides a real-time monitor dashboard** to view incoming messages
5. **Tracks processing status** of each message

---

## Architecture

### Database Schema

A new `whatsapp_messages` table has been added to store all incoming WhatsApp messages:

```sql
CREATE TABLE whatsapp_messages (
  id TEXT PRIMARY KEY,
  wa_message_id TEXT UNIQUE NOT NULL,           -- WhatsApp's message ID
  from_phone TEXT NOT NULL,                     -- Sender's phone
  client_id TEXT REFERENCES clients(id),        -- Linked client
  message_type TEXT NOT NULL,                   -- text | interactive | image | document
  text_body TEXT,                               -- Message text content
  interactive_type TEXT,                        -- button_reply | list_reply
  button_id TEXT,                               -- Button ID if clicked
  button_title TEXT,                            -- Button label
  raw_payload JSONB NOT NULL,                   -- Full webhook payload
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,  -- When message was sent
  processed BOOLEAN DEFAULT false,              -- Has been acted upon?
  processed_at TIMESTAMP WITH TIME ZONE,        -- When processed
  processing_notes TEXT,                        -- Action taken
  related_maintenance_id TEXT REFERENCES maintenances(id),  -- Linked maintenance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Features

1. **Automatic Client Linking**: Messages are automatically linked to clients by matching phone numbers
2. **Maintenance Linking**: Messages are linked to the client's latest pending/scheduled maintenance
3. **Status Updates**: Maintenance statuses are automatically updated based on message content
4. **Processing Tracking**: Each message tracks whether it's been processed and what action was taken

---

## Message Flow

### 1. Message Arrives

When a client sends a WhatsApp message:

```mermaid
Client Phone → WhatsApp API → Webhook → Database → Processing Logic
```

### 2. Database Storage

The webhook handler (`app/api/webhooks/whatsapp/route.ts`) immediately stores:
- Message content (text or button click)
- Sender's phone number
- Linked client (if found)
- Full webhook payload for debugging
- Timestamp

### 3. Automatic Processing

If a client is found, the system:

1. **Finds the latest pending/scheduled maintenance** for that client
2. **Analyzes the message content**:
   - "Sí", "Yes", "Confirmo" → Marks maintenance as `SCHEDULED`
   - "Reagendar", "Cambiar fecha" → Marks maintenance as `RESCHEDULED`
   - "Cambié filtro" → Marks maintenance as `COMPLETED`
   - Button clicks → Same logic based on button ID

3. **Updates the database**:
   - Maintenance status changed
   - Message marked as processed
   - Processing notes added

### 4. Monitor Dashboard

View all incoming messages at: `/admin/whatsapp-messages`

Features:
- ✅ Real-time auto-refresh (every 10 seconds)
- ✅ Filter unprocessed messages only
- ✅ See client name and phone
- ✅ View linked maintenance
- ✅ See processing notes
- ✅ Timestamp with relative time ("hace 5 minutos")

---

## API Endpoints

### GET `/api/whatsapp/messages`

Fetch recent WhatsApp messages.

**Query Parameters**:
- `limit` (number, default: 50) - Number of messages to return
- `unprocessed` (boolean) - Only return unprocessed messages
- `clientId` (string) - Filter by specific client

**Response**:
```json
{
  "messages": [
    {
      "id": "...",
      "waMessageId": "wamid.HBg...",
      "fromPhone": "56966083433",
      "messageType": "text",
      "textBody": "Hola, confirmo la mantención",
      "timestamp": "2025-11-18T20:00:00Z",
      "processed": true,
      "processingNotes": "Confirmed maintenance abc123. Status updated to SCHEDULED.",
      "client": {
        "id": "...",
        "name": "Juan Pérez",
        "phone": "56966083433"
      },
      "relatedMaintenance": {
        "id": "abc123",
        "status": "SCHEDULED",
        "scheduledDate": "2025-11-25T10:00:00Z"
      }
    }
  ],
  "totalCount": 150,
  "unprocessedCount": 5,
  "limit": 50
}
```

### PATCH `/api/whatsapp/messages`

Manually mark a message as processed.

**Request Body**:
```json
{
  "messageId": "...",
  "processed": true,
  "processingNotes": "Manual processing notes"
}
```

---

## Message Processing Logic

### Text Messages

The system recognizes these patterns in client messages:

| Client Message | Action | Maintenance Status |
|---------------|--------|-------------------|
| "Sí", "Yes", "Confirmo" | Confirm maintenance | `SCHEDULED` |
| "Reagendar", "Cambiar fecha", "Otro día" | Request reschedule | `RESCHEDULED` |
| "Cambié filtro", "Cambiar filtro" | Confirm completion | `COMPLETED` |

### Interactive Button Responses

| Button ID | Button Title | Action | Maintenance Status |
|-----------|-------------|--------|-------------------|
| `confirm_yes` | "Sí" | Confirm | `SCHEDULED` |
| `need_help` | "No, necesito ayuda" | Request help | `RESCHEDULED` |

---

## Integration with Maintenance Workflow

### Before (Manual Process)

1. ❌ Staff manually calls clients to confirm maintenance
2. ❌ Staff manually updates spreadsheet with client response
3. ❌ No record of client communication
4. ❌ Time-consuming and error-prone

### After (Automated Process)

1. ✅ System sends WhatsApp message 3 days before maintenance
2. ✅ Client responds via WhatsApp (text or button click)
3. ✅ System automatically updates maintenance status
4. ✅ All communication is logged in database
5. ✅ Staff reviews monitor dashboard for any issues

---

## Date Delta Logic (Future Enhancement)

The system can analyze time deltas between:

- **Message timestamp** vs **Last maintenance date**
  - Example: Client responds 6 months after last maintenance → Likely ready for new maintenance

- **Message timestamp** vs **Scheduled maintenance date**
  - Example: Client confirms 3 days before → High confidence appointment
  - Example: Client confirms 1 hour before → May need reminder

This can be used for:
- Predictive maintenance scheduling
- Client engagement scoring
- Proactive outreach triggers

---

## Testing

### Local Testing

Use the test script to simulate incoming messages:

```bash
npm run dev

# In another terminal
npx tsx scripts/test-webhook-message.ts
```

This will:
1. Send simulated WhatsApp webhook payloads
2. Store messages in database
3. Process them automatically
4. Show results in console logs

### Verify Database

Check stored messages:

```bash
PGPASSWORD="Tabancura_1997" psql -h aws-1-sa-east-1.pooler.supabase.com -p 5432 -U postgres.bbbaomrkvsibswmlrxtx -d postgres -c "
  SELECT
    id,
    from_phone,
    message_type,
    text_body,
    processed,
    processing_notes
  FROM whatsapp_messages
  ORDER BY timestamp DESC
  LIMIT 10;
"
```

---

## Production Deployment

### Prerequisites

1. ✅ WhatsApp Business API configured (see `WHATSAPP_STATUS.md`)
2. ✅ Webhook verified and working
3. ✅ Database table created (`whatsapp_messages`)
4. ✅ Prisma client generated

### Deploy to Vercel

The system is production-ready. When you deploy to Vercel:

1. **Webhook will automatically receive messages** from Meta's servers
2. **Messages will be stored** in the Supabase database
3. **Processing will happen automatically** via the webhook handler
4. **Monitor dashboard** will be accessible at `/admin/whatsapp-messages`

No additional configuration needed! The webhook is already verified and working on production.

---

## Dashboard Usage

### Access the Monitor

1. Navigate to `/admin/whatsapp-messages` (admin access required)
2. You'll see all incoming messages in real-time

### Features

**Auto-refresh** (toggle on/off)
- Updates every 10 seconds when enabled
- Shows new messages as they arrive

**Filter Options**
- Show all messages
- Show only unprocessed messages

**Message Details**
- Client name and phone
- Message content (text or button click)
- Linked maintenance (if any)
- Processing status and notes
- Relative timestamp ("hace 5 minutos")

---

## Future Enhancements

### Phase 1: Analytics Dashboard

Track message metrics:
- Response rate by time of day
- Average response time
- Most common responses
- Client engagement score

### Phase 2: Automated Responses

Send automated replies within 24-hour window (FREE):
- Confirmation: "¡Gracias! Tu mantención está confirmada para el [fecha]"
- Reschedule: "Entendido. Nuestro equipo te contactará para reagendar"
- Completion: "¡Excelente! Gracias por confirmar el cambio de filtros"

### Phase 3: Proactive Notifications

Trigger messages based on:
- No response 2 days before maintenance → Send reminder
- Maintenance completed but no confirmation → Request feedback
- 6 months since last contact → Offer new maintenance

### Phase 4: Multi-channel Integration

Connect with other channels:
- Link WhatsApp messages to phone call logs
- Integrate with email responses
- Create unified communication timeline

---

## Troubleshooting

### Messages not appearing in database

1. Check webhook is receiving messages:
   ```bash
   vercel logs --filter "WhatsApp webhook" --limit 100
   ```

2. Verify table exists:
   ```bash
   psql ... -c "\d whatsapp_messages"
   ```

3. Check Prisma client is up to date:
   ```bash
   npx prisma generate
   ```

### Client not found warnings

This is normal if the phone number in the message doesn't match any client in the database. The message will still be stored, but won't be linked to a client or maintenance.

**Solution**: Update client phone numbers in database to match WhatsApp format (e.g., `56966083433`)

### Maintenance not updating

Check the message content matches the expected patterns. The system looks for:
- Exact matches: "sí", "yes", "confirmo"
- Partial matches: "reagendar", "cambiar fecha"

If needed, add custom patterns in `app/api/webhooks/whatsapp/route.ts` → `handleTextMessage()`

---

## Code References

| File | Purpose |
|------|---------|
| `prisma/schema.prisma:428-473` | WhatsAppMessage model definition |
| `app/api/webhooks/whatsapp/route.ts:89-161` | Message storage and processing |
| `app/api/webhooks/whatsapp/route.ts:163-340` | Text and button response handlers |
| `app/api/whatsapp/messages/route.ts` | API endpoints for fetching messages |
| `app/(authenticated)/admin/whatsapp-messages/page.tsx` | Monitor dashboard UI |
| `supabase/add-whatsapp-messages.sql` | Database table creation |

---

## Summary

The WhatsApp message monitoring system provides AMAWA with:

✅ **Complete visibility** into all client WhatsApp communications
✅ **Automatic processing** of confirmations and reschedule requests
✅ **Database linking** between messages, clients, and maintenances
✅ **Real-time dashboard** for monitoring incoming messages
✅ **Processing tracking** to ensure no message is missed

This eliminates manual phone calls, reduces errors, and provides a complete audit trail of all client communication.

**Next Steps**:
1. Deploy to production (already configured!)
2. Monitor first week of messages
3. Refine processing patterns based on actual client responses
4. Add automated reply messages
5. Build analytics dashboard

---

**Status**: 🟢 **PRODUCTION READY**

**Last Updated**: November 18, 2025
