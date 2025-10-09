-- ============================================
-- ADD WORK ORDERS SYSTEM
-- Manual migration for work orders feature
-- ============================================

-- Add delivery_type and work_order_id to maintenances table
ALTER TABLE maintenances
  ADD COLUMN IF NOT EXISTS delivery_type TEXT,
  ADD COLUMN IF NOT EXISTS work_order_id TEXT;

-- Create indexes for new maintenance columns
CREATE INDEX IF NOT EXISTS maintenances_delivery_type_idx ON maintenances(delivery_type);
CREATE INDEX IF NOT EXISTS maintenances_work_order_id_idx ON maintenances(work_order_id);

-- Create work_orders table
CREATE TABLE IF NOT EXISTS work_orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  delivery_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  total_maintenances INTEGER NOT NULL DEFAULT 0,
  package_summary JSONB,
  filter_summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  generated_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_period_delivery UNIQUE (year, month, delivery_type)
);

-- Create indexes for work_orders
CREATE INDEX IF NOT EXISTS work_orders_status_idx ON work_orders(status);
CREATE INDEX IF NOT EXISTS work_orders_year_month_idx ON work_orders(year, month);
CREATE INDEX IF NOT EXISTS work_orders_delivery_type_idx ON work_orders(delivery_type);

-- Create work_order_filter_usage table
CREATE TABLE IF NOT EXISTS work_order_filter_usage (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  work_order_id TEXT NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  filter_id TEXT NOT NULL REFERENCES filters(id),
  quantity_used INTEGER NOT NULL,
  deducted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  restored_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_workorder_filter UNIQUE (work_order_id, filter_id)
);

-- Create indexes for work_order_filter_usage
CREATE INDEX IF NOT EXISTS work_order_filter_usage_work_order_id_idx ON work_order_filter_usage(work_order_id);
CREATE INDEX IF NOT EXISTS work_order_filter_usage_filter_id_idx ON work_order_filter_usage(filter_id);
CREATE INDEX IF NOT EXISTS work_order_filter_usage_deducted_at_idx ON work_order_filter_usage(deducted_at);

-- Add foreign key constraint for maintenances.work_order_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'maintenances_work_order_id_fkey'
  ) THEN
    ALTER TABLE maintenances
      ADD CONSTRAINT maintenances_work_order_id_fkey
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id);
  END IF;
END $$;

-- Grant permissions (adjust as needed for your Supabase setup)
GRANT ALL ON work_orders TO postgres, anon, authenticated, service_role;
GRANT ALL ON work_order_filter_usage TO postgres, anon, authenticated, service_role;

-- Update existing maintenances to copy delivery_type from equipment
UPDATE maintenances m
SET delivery_type = e.delivery_type
FROM clients c
LEFT JOIN equipment e ON e.client_id = c.id AND e.is_active = true
WHERE m.client_id = c.id
  AND m.delivery_type IS NULL
  AND e.delivery_type IS NOT NULL;

-- Set default delivery_type to 'DOMICILIO' for maintenances that still don't have one
UPDATE maintenances
SET delivery_type = 'Delivery'
WHERE delivery_type IS NULL;

COMMENT ON TABLE work_orders IS 'Monthly work orders for filter deliveries';
COMMENT ON TABLE work_order_filter_usage IS 'Tracks inventory deductions for work orders';
COMMENT ON COLUMN maintenances.delivery_type IS 'Type of delivery: PRESENCIAL or DOMICILIO';
COMMENT ON COLUMN maintenances.work_order_id IS 'Reference to work order if part of bulk delivery';
