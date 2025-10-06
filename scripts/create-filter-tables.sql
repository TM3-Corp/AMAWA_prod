-- Filter Inventory System Tables
-- Version: 1.0
-- Date: October 2025

-- ============================================
-- 1. FILTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS filters (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    unit_cost DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_filters_category ON filters(category);
CREATE INDEX IF NOT EXISTS idx_filters_sku ON filters(sku);

-- ============================================
-- 2. FILTER PACKAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS filter_packages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_filter_packages_code ON filter_packages(code);

-- ============================================
-- 3. FILTER PACKAGE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS filter_package_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    package_id TEXT NOT NULL REFERENCES filter_packages(id) ON DELETE CASCADE,
    filter_id TEXT NOT NULL REFERENCES filters(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_package_filter UNIQUE (package_id, filter_id)
);

CREATE INDEX IF NOT EXISTS idx_filter_package_items_package ON filter_package_items(package_id);
CREATE INDEX IF NOT EXISTS idx_filter_package_items_filter ON filter_package_items(filter_id);

-- ============================================
-- 4. EQUIPMENT FILTER MAPPINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS equipment_filter_mappings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    plan_code TEXT NOT NULL,
    maintenance_cycle INTEGER NOT NULL,
    package_id TEXT NOT NULL REFERENCES filter_packages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_plan_cycle UNIQUE (plan_code, maintenance_cycle)
);

CREATE INDEX IF NOT EXISTS idx_equipment_filter_mappings_plan_code ON equipment_filter_mappings(plan_code);
CREATE INDEX IF NOT EXISTS idx_equipment_filter_mappings_cycle ON equipment_filter_mappings(maintenance_cycle);

-- ============================================
-- 5. MAINTENANCE FILTER USAGE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_filter_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maintenance_id UUID NOT NULL REFERENCES maintenances(id) ON DELETE CASCADE,
    filter_id TEXT NOT NULL REFERENCES filters(id),
    quantity_used INTEGER NOT NULL,
    deducted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes TEXT,
    CONSTRAINT unique_maintenance_filter UNIQUE (maintenance_id, filter_id)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_filter_usage_maintenance ON maintenance_filter_usage(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_filter_usage_filter ON maintenance_filter_usage(filter_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_filter_usage_deducted_at ON maintenance_filter_usage(deducted_at);

-- ============================================
-- 6. UPDATE INVENTORY TABLE
-- ============================================
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS filter_id TEXT REFERENCES filters(id);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE inventory ALTER COLUMN equipment_type DROP NOT NULL;

-- Create new unique constraint for filter_id + location
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_filter_location'
    ) THEN
        ALTER TABLE inventory ADD CONSTRAINT unique_filter_location UNIQUE (filter_id, location);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_filter_id ON inventory(filter_id);

-- ============================================
-- VERIFY TABLES CREATED
-- ============================================
SELECT
    tablename,
    schemaname
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('filters', 'filter_packages', 'filter_package_items', 'equipment_filter_mappings', 'maintenance_filter_usage')
ORDER BY tablename;
