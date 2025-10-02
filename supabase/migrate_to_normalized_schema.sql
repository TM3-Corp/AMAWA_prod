-- Migration: Move equipment and contract data from clients table to normalized tables
-- This migration is SAFE - it only copies data, doesn't delete anything yet

BEGIN;

-- ============================================
-- PHASE 1: Migrate Equipment Data
-- ============================================

INSERT INTO equipment (
  client_id,
  equipment_type,
  serial_number,
  color,
  filter_type,
  installation_date,
  delivery_type,
  installer_technician,
  is_active,
  created_at,
  updated_at
)
SELECT
  id AS client_id,
  equipment_type,
  serial_number,
  color,
  filter_type,
  installation_date,
  delivery_type,
  installer_technician,
  true AS is_active,  -- All current equipment is active
  created_at,
  updated_at
FROM clients
WHERE equipment_type IS NOT NULL OR installation_date IS NOT NULL;

-- Show migration results
SELECT
  'Equipment records migrated' AS step,
  COUNT(*) AS count
FROM equipment;

-- ============================================
-- PHASE 2: Migrate Contract Data
-- ============================================

INSERT INTO contracts (
  client_id,
  plan_code,
  plan_type,
  plan_currency,
  plan_value_clp,
  monthly_value_clp,
  monthly_value_uf,
  discount_percent,
  toku_enabled,
  needs_invoice,
  start_date,
  end_date,
  is_active,
  created_at,
  updated_at
)
SELECT
  id AS client_id,
  plan_code,
  plan_type,
  plan_currency,
  plan_value_clp,
  monthly_value_clp,
  monthly_value_uf,
  discount_percent,
  toku_enabled,
  needs_invoice,
  COALESCE(installation_date, created_at) AS start_date,  -- Use installation or account creation
  NULL AS end_date,  -- NULL = ongoing contract
  true AS is_active,  -- All current contracts are active
  created_at,
  updated_at
FROM clients
WHERE plan_code IS NOT NULL OR plan_type IS NOT NULL OR monthly_value_clp IS NOT NULL OR monthly_value_uf IS NOT NULL;

-- Show migration results
SELECT
  'Contract records migrated' AS step,
  COUNT(*) AS count
FROM contracts;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check sample equipment records
SELECT
  e.id,
  c.first_name,
  c.last_name,
  e.equipment_type,
  e.filter_type,
  e.is_active
FROM equipment e
JOIN clients c ON e.client_id = c.id
LIMIT 5;

-- Check sample contract records
SELECT
  ct.id,
  c.first_name,
  c.last_name,
  ct.plan_code,
  ct.monthly_value_clp,
  ct.is_active
FROM contracts ct
JOIN clients c ON ct.client_id = c.id
LIMIT 5;

-- Summary statistics
SELECT
  (SELECT COUNT(*) FROM clients) AS total_clients,
  (SELECT COUNT(*) FROM equipment) AS total_equipment_records,
  (SELECT COUNT(*) FROM contracts) AS total_contract_records,
  (SELECT COUNT(*) FROM maintenances) AS total_maintenance_records;
