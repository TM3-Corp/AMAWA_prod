-- Update WHP-4230 package codes to follow naming convention
-- 4230-6 → 4.1
-- 4230-12 → 4.2
-- 4230-24 → 4.3

BEGIN;

-- Update filter_packages table
UPDATE filter_packages
SET
  code = '4.1',
  name = 'WHP-4230 - 6 Meses',
  description = 'Paquete para WHP-4230 - Mantención 6 meses'
WHERE code = '4230-6';

UPDATE filter_packages
SET
  code = '4.2',
  name = 'WHP-4230 - 12 Meses',
  description = 'Paquete para WHP-4230 - Mantención 12 meses'
WHERE code = '4230-12';

UPDATE filter_packages
SET
  code = '4.3',
  name = 'WHP-4230 - 24 Meses',
  description = 'Paquete para WHP-4230 - Mantención 24 meses'
WHERE code = '4230-24';

-- Verify the changes
SELECT code, name, description
FROM filter_packages
WHERE code LIKE '4.%'
ORDER BY code;

COMMIT;
