# Filter Inventory Database Schema Design

**Version:** 1.0
**Date:** October 2025

---

## Overview

This document describes the database schema for AMAWA's filter inventory and maintenance tracking system. The design enables:
- Automatic filter package selection based on equipment and maintenance type
- Inventory deduction when maintenance is completed
- Historical tracking of filter usage per maintenance
- Low stock alerts and consumption analytics

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Filter    │◄────────│ FilterPackageItem│────────►│ FilterPackage   │
│             │         │                  │         │                 │
│ - sku       │         │ - filter_id      │         │ - code          │
│ - name      │         │ - package_id     │         │ - name          │
│ - category  │         │ - quantity       │         │                 │
└─────────────┘         └──────────────────┘         └─────────────────┘
      ▲                                                        ▲
      │                                                        │
      │                 ┌──────────────────────────┐         │
      │                 │ EquipmentFilterMapping   │         │
      │                 │                          │         │
      │                 │ - plan_code              │         │
      │                 │ - maintenance_cycle      │─────────┘
      │                 │ - filter_package_id      │
      │                 └──────────────────────────┘
      │                              ▲
      │                              │
      │                              │ Used to determine
      │                              │ which package to use
      │                              │
┌─────┴──────────┐         ┌────────┴───────────┐
│   Inventory    │         │   Maintenance      │
│                │         │                    │
│ - filter_id    │         │ - type             │
│ - quantity     │         │ - status           │
│ - min_stock    │         │ - client_id        │
│ - location     │         └────────┬───────────┘
└────────────────┘                  │
      ▲                              │
      │                              ▼
      │                 ┌──────────────────────────┐
      │                 │ MaintenanceFilterUsage   │
      │                 │                          │
      └─────────────────│ - maintenance_id         │
                        │ - filter_id              │
                        │ - quantity_used          │
                        │ - deducted_at            │
                        └──────────────────────────┘
```

---

## Table Specifications

### 1. **Filter** (Master Filter SKU Table)

Stores all available filter types in the system.

```prisma
model Filter {
  id              String    @id @default(uuid())
  sku             String    @unique              // e.g., "PP-10CF", "S/P COMBI"
  name            String                         // Display name
  description     String?                        // Details about the filter
  category        String                         // "UF" or "RO"
  unitCost        Float?    @map("unit_cost")    // Cost per unit (optional)

  // Relations
  inventoryItems  Inventory[]
  packageItems    FilterPackageItem[]
  usageRecords    MaintenanceFilterUsage[]

  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@map("filters")
}
```

**Sample Data:**
| id | sku | name | category |
|----|-----|------|----------|
| uuid-1 | PP-10CF | Polypropylene Sediment Filter 10" | RO |
| uuid-2 | CTO-10CF | Carbon Block Filter 10" | RO |
| uuid-3 | S/P COMBI | Sediment/Pre-filter Combo | UF |

---

### 2. **FilterPackage** (Predefined Filter Packages)

Defines the standard filter packages sent during maintenance.

```prisma
model FilterPackage {
  id          String    @id @default(uuid())
  code        String    @unique                 // "1.1", "1.2", "2.1", "2.2", "5.2"
  name        String                            // "UF Partial", "RO Complete", etc.
  description String?                           // Usage details

  // Relations
  items       FilterPackageItem[]
  mappings    EquipmentFilterMapping[]

  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  @@map("filter_packages")
}
```

**Sample Data:**
| id | code | name | description |
|----|------|------|-------------|
| uuid-1 | 1.1 | UF Partial Replacement | WHP-3200 UF at 6/18 months |
| uuid-2 | 1.2 | UF Complete Replacement | WHP-3200 UF at 12/24 months |
| uuid-3 | 2.1 | RO Standard Partial | WHP-3200 RO pre-filters |
| uuid-4 | 2.2 | RO Standard Complete | WHP-3200 RO all filters |
| uuid-5 | 5.2 | RO 4200/Llave Complete | WHP-4200/Llave all filters |

---

### 3. **FilterPackageItem** (Package Contents)

Junction table defining which filters are in each package.

```prisma
model FilterPackageItem {
  id         String         @id @default(uuid())
  packageId  String         @map("package_id")
  filterId   String         @map("filter_id")
  quantity   Int            @default(1)           // Usually 1 per filter type

  // Relations
  package    FilterPackage  @relation(fields: [packageId], references: [id], onDelete: Cascade)
  filter     Filter         @relation(fields: [filterId], references: [id], onDelete: Cascade)

  createdAt  DateTime       @default(now()) @map("created_at")

  @@unique([packageId, filterId])
  @@index([packageId])
  @@index([filterId])
  @@map("filter_package_items")
}
```

**Sample Data:**
| package_id | filter_id (SKU) | quantity |
|------------|-----------------|----------|
| pkg-1.1 | S/P COMBI | 1 |
| pkg-1.2 | S/P COMBI | 1 |
| pkg-1.2 | U/P COMBI | 1 |
| pkg-2.1 | PP-10CF | 1 |
| pkg-2.1 | CTO-10CF | 1 |
| pkg-2.2 | PP-10CF | 1 |
| pkg-2.2 | CTO-10CF | 1 |
| pkg-2.2 | RO-10CF | 1 |
| pkg-2.2 | T33-10CF | 1 |
| pkg-2.2 | POST CARBON RUHENS | 1 |
| pkg-2.2 | MAGNESIUM | 1 |

---

### 4. **EquipmentFilterMapping** (Plan Code → Package Mapping)

Maps equipment plan codes and maintenance cycles to filter packages.

```prisma
model EquipmentFilterMapping {
  id              String         @id @default(uuid())
  planCode        String         @map("plan_code")        // "3200RODE", "4200RODE", etc.
  maintenanceCycle Int           @map("maintenance_cycle") // 6, 12, 18, or 24
  packageId       String         @map("package_id")

  // Relations
  package         FilterPackage  @relation(fields: [packageId], references: [id], onDelete: Cascade)

  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  @@unique([planCode, maintenanceCycle])
  @@index([planCode])
  @@map("equipment_filter_mappings")
}
```

**Sample Data:**
| plan_code | maintenance_cycle | package_id (code) |
|-----------|-------------------|-------------------|
| 3200UFDE | 6 | 1.1 |
| 3200UFDE | 12 | 1.2 |
| 3200UFDE | 18 | 1.1 |
| 3200UFDE | 24 | 1.2 |
| 3200RODE | 6 | 2.1 |
| 3200RODE | 12 | 2.1 |
| 3200RODE | 18 | 2.1 |
| 3200RODE | 24 | 2.2 |
| 4200RODE | 6 | 2.1 |
| 4200RODE | 12 | 2.1 |
| 4200RODE | 18 | 2.1 |
| 4200RODE | 24 | 5.2 |

**Note:** WHP-4230 (4230RODE) requires special handling since it doesn't use packages.

---

### 5. **MaintenanceFilterUsage** (Filter Usage Tracking)

Tracks which filters were actually used/deducted for each completed maintenance.

```prisma
model MaintenanceFilterUsage {
  id             String       @id @default(uuid())
  maintenanceId  String       @map("maintenance_id")
  filterId       String       @map("filter_id")
  quantityUsed   Int          @map("quantity_used")        // Number of units deducted
  deductedAt     DateTime     @default(now()) @map("deducted_at")
  notes          String?                                   // Optional notes

  // Relations
  maintenance    Maintenance  @relation(fields: [maintenanceId], references: [id], onDelete: Cascade)
  filter         Filter       @relation(fields: [filterId], references: [id])

  @@unique([maintenanceId, filterId])
  @@index([maintenanceId])
  @@index([filterId])
  @@index([deductedAt])
  @@map("maintenance_filter_usage")
}
```

**Sample Data:**
| maintenance_id | filter_id (SKU) | quantity_used | deducted_at |
|----------------|-----------------|---------------|-------------|
| maint-123 | PP-10CF | 1 | 2025-10-01 |
| maint-123 | CTO-10CF | 1 | 2025-10-01 |
| maint-456 | S/P COMBI | 1 | 2025-10-02 |
| maint-456 | U/P COMBI | 1 | 2025-10-02 |

---

### 6. **Inventory** (Updated)

Update existing Inventory model to reference Filter table.

```prisma
model Inventory {
  id            String    @id @default(uuid())
  filterId      String    @map("filter_id")              // NEW: Foreign key to Filter
  quantity      Int       @default(0)
  minStock      Int       @default(10) @map("min_stock")
  location      String?                                  // "Bodega Principal", "Truck 1", etc.
  lastRestocked DateTime? @map("last_restocked")

  // Relations
  filter        Filter    @relation(fields: [filterId], references: [id])

  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@unique([filterId, location])
  @@index([filterId])
  @@map("inventory")
}
```

**Migration Notes:**
- Remove old `equipmentType` field (or keep for backward compatibility)
- Add `filterId` foreign key
- Migrate existing data:
  - "Filtro Sedimento" → PP-10CF
  - "Filtro Carbón" → CTO-10CF

---

### 7. **Maintenance** (Updated)

Add relation to filter usage.

```prisma
model Maintenance {
  // ... existing fields ...

  // NEW: Relation to track filters used
  filterUsage    MaintenanceFilterUsage[]

  // ... rest of model ...
}
```

---

## Business Logic & Triggers

### Automatic Filter Deduction Flow

When a maintenance is marked as **COMPLETED**:

1. **Get Equipment Plan Code:**
   ```sql
   SELECT c.plan_code
   FROM contracts c
   WHERE c.client_id = maintenance.client_id
   AND c.is_active = true
   ```

2. **Get Maintenance Cycle:**
   ```javascript
   const cycle = maintenanceTypeToCycle(maintenance.type)
   // "6_months" → 6, "12_months" → 12, etc.
   ```

3. **Lookup Filter Package:**
   ```sql
   SELECT package_id
   FROM equipment_filter_mappings
   WHERE plan_code = contract.plan_code
   AND maintenance_cycle = cycle
   ```

4. **Get Package Contents:**
   ```sql
   SELECT filter_id, quantity
   FROM filter_package_items
   WHERE package_id = mapping.package_id
   ```

5. **Deduct from Inventory & Record Usage:**
   ```sql
   FOR EACH item IN package_items:
     -- Deduct from inventory
     UPDATE inventory
     SET quantity = quantity - item.quantity
     WHERE filter_id = item.filter_id
     AND location = 'Bodega Principal'

     -- Record usage
     INSERT INTO maintenance_filter_usage (
       maintenance_id,
       filter_id,
       quantity_used
     ) VALUES (
       maintenance.id,
       item.filter_id,
       item.quantity
     )
   ```

6. **Check Low Stock Alerts:**
   ```sql
   SELECT * FROM inventory
   WHERE quantity < min_stock
   ```

---

## Special Cases

### WHP-4230 Custom Handling

Since WHP-4230 doesn't follow standard packages, create individual mappings:

```sql
INSERT INTO equipment_filter_mappings (plan_code, maintenance_cycle, package_id)
VALUES
  ('4230RODE', 6, package_for_micro_carbon_only),
  ('4230RODE', 12, package_for_micro_carbon_plus_post),
  ('4230RODE', 18, package_for_micro_carbon_only),
  ('4230RODE', 24, package_for_all_three_filters);
```

Or handle programmatically with custom logic.

---

## Query Examples

### Get filters needed for upcoming maintenance
```sql
SELECT
  m.id AS maintenance_id,
  m.scheduled_date,
  c.name AS client_name,
  con.plan_code,
  fp.name AS package_name,
  f.sku AS filter_sku,
  fpi.quantity
FROM maintenances m
JOIN clients c ON m.client_id = c.id
JOIN contracts con ON c.id = con.client_id AND con.is_active = true
JOIN equipment_filter_mappings efm ON con.plan_code = efm.plan_code
  AND efm.maintenance_cycle = CASE m.type
    WHEN '6_months' THEN 6
    WHEN '12_months' THEN 12
    WHEN '18_months' THEN 18
    WHEN '24_months' THEN 24
  END
JOIN filter_packages fp ON efm.package_id = fp.id
JOIN filter_package_items fpi ON fp.id = fpi.package_id
JOIN filters f ON fpi.filter_id = f.id
WHERE m.status = 'PENDING'
AND m.scheduled_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
ORDER BY m.scheduled_date, c.name;
```

### Monthly filter consumption report
```sql
SELECT
  f.sku,
  f.name,
  SUM(mfu.quantity_used) AS total_used,
  DATE_TRUNC('month', mfu.deducted_at) AS month
FROM maintenance_filter_usage mfu
JOIN filters f ON mfu.filter_id = f.id
WHERE mfu.deducted_at >= NOW() - INTERVAL '6 months'
GROUP BY f.sku, f.name, DATE_TRUNC('month', mfu.deducted_at)
ORDER BY month DESC, total_used DESC;
```

### Low stock alerts
```sql
SELECT
  f.sku,
  f.name,
  i.quantity AS current_stock,
  i.min_stock,
  i.quantity - i.min_stock AS shortage,
  i.location
FROM inventory i
JOIN filters f ON i.filter_id = f.id
WHERE i.quantity < i.min_stock
ORDER BY (i.quantity - i.min_stock) ASC;
```

---

## Migration Strategy

1. Create new tables: `filters`, `filter_packages`, `filter_package_items`, `equipment_filter_mappings`, `maintenance_filter_usage`
2. Seed filter SKUs into `filters` table
3. Seed packages into `filter_packages` and `filter_package_items`
4. Seed plan code mappings into `equipment_filter_mappings`
5. Update existing `inventory` table to add `filter_id` foreign key
6. Migrate existing inventory data (map old equipment types to filter SKUs)
7. Add `filterUsage` relation to `Maintenance` model

---

**End of Document**
