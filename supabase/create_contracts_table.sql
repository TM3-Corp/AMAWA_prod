-- Create Contracts table to track client plan subscriptions and pricing
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Plan details
  plan_code TEXT,      -- 3200RODE, 3200UFDE, etc
  plan_type TEXT,      -- Mensual, Anual, etc

  -- Pricing
  plan_currency TEXT,  -- UF or CLP
  plan_value_clp INTEGER,
  monthly_value_clp INTEGER,
  monthly_value_uf DOUBLE PRECISION,
  discount_percent DOUBLE PRECISION,

  -- Payment methods
  toku_enabled BOOLEAN DEFAULT false,
  needs_invoice BOOLEAN,

  -- Contract period
  start_date TIMESTAMP,
  end_date TIMESTAMP,  -- NULL for ongoing contracts

  -- Active tracking (allows plan changes over time)
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contracts_client_id ON contracts(client_id);
CREATE INDEX idx_contracts_is_active ON contracts(is_active);
CREATE INDEX idx_contracts_start_date ON contracts(start_date);
CREATE INDEX idx_contracts_plan_code ON contracts(plan_code);

-- RLS Policy
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to contracts" ON contracts FOR ALL USING (true);

-- Update trigger
CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE contracts IS 'Tracks client contract/plan subscriptions. Supports contract history (plan changes, price adjustments).';
COMMENT ON COLUMN contracts.is_active IS 'True for current/active contract. Allows tracking plan changes over time.';
COMMENT ON COLUMN contracts.discount_percent IS 'Discount as a percentage (0-100). Example: 100 = 100% discount (free).';
