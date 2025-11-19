-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Message identification
  wa_message_id TEXT UNIQUE NOT NULL,
  from_phone TEXT NOT NULL,

  -- Client linking
  client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,

  -- Message content
  message_type TEXT NOT NULL,
  text_body TEXT,
  interactive_type TEXT,
  button_id TEXT,
  button_title TEXT,

  -- Context and metadata
  raw_payload JSONB NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Processing status
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_notes TEXT,

  -- Maintenance linking
  related_maintenance_id TEXT REFERENCES maintenances(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_phone ON whatsapp_messages(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_client_id ON whatsapp_messages(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_related_maintenance_id ON whatsapp_messages(related_maintenance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_processed ON whatsapp_messages(processed);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_type ON whatsapp_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_whatsapp_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whatsapp_messages_updated_at
  BEFORE UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_messages_updated_at();
