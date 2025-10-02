-- Add extended client fields for 360° view
-- Migration: add_extended_client_fields
-- Date: 2025-10-02

-- Add new columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS unique_id TEXT UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rut TEXT UNIQUE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS property_number TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS general_comments TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_channel TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS needs_invoice BOOLEAN;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS free_until_date TIMESTAMP;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS serial_number TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS filter_type TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS delivery_type TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS installer_technician TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan_code TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan_type TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan_currency TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan_value_clp INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS monthly_value_clp INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS monthly_value_uf DOUBLE PRECISION;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS discount_percent DOUBLE PRECISION;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS toku_enabled BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS technician_note TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS start_year INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS start_month INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS maintenance_dates JSONB;

-- Add new columns to maintenances table
ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS actual_date TIMESTAMP;
ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS cycle_number INTEGER;
ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS deviation_days INTEGER;
ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS response_rate TEXT;
ALTER TABLE maintenances ADD COLUMN IF NOT EXISTS observations TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_rut ON clients(rut);
CREATE INDEX IF NOT EXISTS idx_clients_unique_id ON clients(unique_id);
CREATE INDEX IF NOT EXISTS idx_clients_first_name ON clients(first_name);
CREATE INDEX IF NOT EXISTS idx_clients_last_name ON clients(last_name);
CREATE INDEX IF NOT EXISTS idx_maintenances_actual_date ON maintenances(actual_date);
CREATE INDEX IF NOT EXISTS idx_maintenances_response_rate ON maintenances(response_rate);
CREATE INDEX IF NOT EXISTS idx_maintenances_cycle_number ON maintenances(cycle_number);

-- Update existing clients to populate firstName and lastName from name
-- This will be done by the import script

COMMENT ON COLUMN clients.unique_id IS 'ID Unico from Excel (TOKU or legacy ID)';
COMMENT ON COLUMN clients.maintenance_dates IS 'Array of scheduled maintenance dates from Excel [6m, 12m, 18m, 24m]';
COMMENT ON COLUMN clients.general_comments IS 'Editable comments field';
COMMENT ON COLUMN maintenances.actual_date IS 'When maintenance was actually completed (vs scheduled)';
COMMENT ON COLUMN maintenances.deviation_days IS 'Days between scheduled and actual (negative = early, positive = late)';
COMMENT ON COLUMN maintenances.response_rate IS 'EXCELLENT (≤7d), GOOD (8-14d), FAIR (15-30d), POOR (>30d)';
