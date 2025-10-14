-- ============================================
-- Migration: Add Packages 3.1 and 3.2 for 4200RODE/Llave
-- Date: 2025-10-13
-- Purpose: Align database with updated Excel "Envio de filtros" sheet
-- ============================================

-- Get filter IDs (we'll need these)
-- PP-10CF, CTO-10CF, RO-10CF, T33-10CF

BEGIN;

-- ============================================
-- 1. CREATE PACKAGE 3.1 (4200RODE Partial - 6, 12, 18 months)
-- ============================================
INSERT INTO filter_packages (id, code, name, description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '3.1',
  'RO 4200/Llave Partial Replacement',
  'WHP-4200 and Llave pre-filters at 6, 12, 18 months',
  NOW(),
  NOW()
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Add filters to Package 3.1
INSERT INTO filter_package_items (id, package_id, filter_id, quantity, created_at)
SELECT
  gen_random_uuid(),
  fp.id,
  f.id,
  1,
  NOW()
FROM filter_packages fp
CROSS JOIN filters f
WHERE fp.code = '3.1'
  AND f.sku IN ('PP-10CF', 'CTO-10CF')
ON CONFLICT (package_id, filter_id) DO NOTHING;

-- ============================================
-- 2. CREATE PACKAGE 3.2 (4200RODE Complete - 24 months)
-- ============================================
INSERT INTO filter_packages (id, code, name, description, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '3.2',
  'RO 4200/Llave Complete Replacement',
  'WHP-4200 and Llave all filters at 24 months',
  NOW(),
  NOW()
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Add filters to Package 3.2
INSERT INTO filter_package_items (id, package_id, filter_id, quantity, created_at)
SELECT
  gen_random_uuid(),
  fp.id,
  f.id,
  1,
  NOW()
FROM filter_packages fp
CROSS JOIN filters f
WHERE fp.code = '3.2'
  AND f.sku IN ('PP-10CF', 'CTO-10CF', 'RO-10CF', 'T33-10CF')
ON CONFLICT (package_id, filter_id) DO NOTHING;

-- ============================================
-- 3. UPDATE 4200RODE MAPPINGS
-- ============================================

-- 4200RODE at 6, 12, 18 months → Package 3.1
UPDATE equipment_filter_mappings
SET package_id = (SELECT id FROM filter_packages WHERE code = '3.1'),
    updated_at = NOW()
WHERE plan_code = '4200RODE'
  AND maintenance_cycle IN (6, 12, 18);

-- 4200RODE at 24 months → Package 3.2
UPDATE equipment_filter_mappings
SET package_id = (SELECT id FROM filter_packages WHERE code = '3.2'),
    updated_at = NOW()
WHERE plan_code = '4200RODE'
  AND maintenance_cycle = 24;

-- ============================================
-- 4. UPDATE LLAVERODE MAPPINGS
-- ============================================

-- LLAVERODE at 6, 12, 18 months → Package 3.1
UPDATE equipment_filter_mappings
SET package_id = (SELECT id FROM filter_packages WHERE code = '3.1'),
    updated_at = NOW()
WHERE plan_code = 'LLAVERODE'
  AND maintenance_cycle IN (6, 12, 18);

-- LLAVERODE at 24 months → Package 3.2
UPDATE equipment_filter_mappings
SET package_id = (SELECT id FROM filter_packages WHERE code = '3.2'),
    updated_at = NOW()
WHERE plan_code = 'LLAVERODE'
  AND maintenance_cycle = 24;

-- ============================================
-- 5. UPDATE PRESENCIAL VARIANTS
-- ============================================

-- 4200ROPR (presencial) at 6, 12, 18 months → Package 3.1
UPDATE equipment_filter_mappings
SET package_id = (SELECT id FROM filter_packages WHERE code = '3.1'),
    updated_at = NOW()
WHERE plan_code = '4200ROPR'
  AND maintenance_cycle IN (6, 12, 18);

-- 4200ROPR at 24 months → Package 3.2
UPDATE equipment_filter_mappings
SET package_id = (SELECT id FROM filter_packages WHERE code = '3.2'),
    updated_at = NOW()
WHERE plan_code = '4200ROPR'
  AND maintenance_cycle = 24;

-- LLAVEROPR (presencial) at 6, 12, 18 months → Package 3.1
UPDATE equipment_filter_mappings
SET package_id = (SELECT id FROM filter_packages WHERE code = '3.1'),
    updated_at = NOW()
WHERE plan_code = 'LLAVEROPR'
  AND maintenance_cycle IN (6, 12, 18);

-- LLAVEROPR at 24 months → Package 3.2
UPDATE equipment_filter_mappings
SET package_id = (SELECT id FROM filter_packages WHERE code = '3.2'),
    updated_at = NOW()
WHERE plan_code = 'LLAVEROPR'
  AND maintenance_cycle = 24;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify Package 3.1 contents
SELECT 'Package 3.1 Contents:' as info;
SELECT fp.code, f.sku, fpi.quantity
FROM filter_packages fp
JOIN filter_package_items fpi ON fp.id = fpi.package_id
JOIN filters f ON fpi.filter_id = f.id
WHERE fp.code = '3.1'
ORDER BY f.sku;

-- Verify Package 3.2 contents
SELECT 'Package 3.2 Contents:' as info;
SELECT fp.code, f.sku, fpi.quantity
FROM filter_packages fp
JOIN filter_package_items fpi ON fp.id = fpi.package_id
JOIN filters f ON fpi.filter_id = f.id
WHERE fp.code = '3.2'
ORDER BY f.sku;

-- Verify 4200RODE mappings
SELECT '4200RODE Mappings:' as info;
SELECT efm.plan_code, efm.maintenance_cycle, fp.code, fp.name
FROM equipment_filter_mappings efm
JOIN filter_packages fp ON efm.package_id = fp.id
WHERE efm.plan_code IN ('4200RODE', 'LLAVERODE', '4200ROPR', 'LLAVEROPR')
ORDER BY efm.plan_code, efm.maintenance_cycle;
