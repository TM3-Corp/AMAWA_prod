-- Create Equipment table to track client equipment installations
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Equipment details
  equipment_type TEXT,
  serial_number TEXT,
  color TEXT,
  filter_type TEXT,  -- RO (Reverse Osmosis) or UF (Ultrafiltration)

  -- Installation details
  installation_date TIMESTAMP,
  delivery_type TEXT,  -- Presencial or Delivery
  installer_technician TEXT,

  -- Active tracking (allows multiple equipment per client over time)
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_equipment_client_id ON equipment(client_id);
CREATE INDEX idx_equipment_is_active ON equipment(is_active);
CREATE INDEX idx_equipment_filter_type ON equipment(filter_type);

-- RLS Policy
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to equipment" ON equipment FOR ALL USING (true);

-- Update trigger
CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE equipment IS 'Tracks equipment installations for clients. Supports equipment history (upgrades, replacements).';
COMMENT ON COLUMN equipment.is_active IS 'True for current/active equipment. Allows tracking equipment changes over time.';
