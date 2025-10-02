-- Cleanup: Remove redundant columns from clients table
-- These columns are now stored in the normalized equipment and contracts tables

BEGIN;

-- ============================================
-- Drop Equipment-related columns
-- (Now in equipment table)
-- ============================================
ALTER TABLE clients DROP COLUMN IF EXISTS equipment_type;
ALTER TABLE clients DROP COLUMN IF EXISTS serial_number;
ALTER TABLE clients DROP COLUMN IF EXISTS color;
ALTER TABLE clients DROP COLUMN IF EXISTS filter_type;
ALTER TABLE clients DROP COLUMN IF EXISTS installation_date;
ALTER TABLE clients DROP COLUMN IF EXISTS delivery_type;
ALTER TABLE clients DROP COLUMN IF EXISTS installer_technician;

-- ============================================
-- Drop Contract-related columns
-- (Now in contracts table)
-- ============================================
ALTER TABLE clients DROP COLUMN IF EXISTS plan_code;
ALTER TABLE clients DROP COLUMN IF EXISTS plan_type;
ALTER TABLE clients DROP COLUMN IF EXISTS plan_currency;
ALTER TABLE clients DROP COLUMN IF EXISTS plan_value_clp;
ALTER TABLE clients DROP COLUMN IF EXISTS monthly_value_clp;
ALTER TABLE clients DROP COLUMN IF EXISTS monthly_value_uf;
ALTER TABLE clients DROP COLUMN IF EXISTS discount_percent;
ALTER TABLE clients DROP COLUMN IF EXISTS toku_enabled;
ALTER TABLE clients DROP COLUMN IF EXISTS needs_invoice;

-- ============================================
-- Drop Maintenance-related columns
-- (Redundant with maintenances table)
-- ============================================
ALTER TABLE clients DROP COLUMN IF EXISTS maintenance_dates;

-- ============================================
-- Drop other redundant/deprecated columns
-- ============================================
ALTER TABLE clients DROP COLUMN IF EXISTS technician_note;
ALTER TABLE clients DROP COLUMN IF EXISTS start_year;
ALTER TABLE clients DROP COLUMN IF EXISTS start_month;
ALTER TABLE clients DROP COLUMN IF EXISTS free_until_date;

COMMIT;

-- ============================================
-- VERIFICATION: Show remaining columns
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;

-- ============================================
-- Summary
-- ============================================
COMMENT ON TABLE clients IS 'Core client identity and contact information. Equipment and contract data stored in normalized tables.';
