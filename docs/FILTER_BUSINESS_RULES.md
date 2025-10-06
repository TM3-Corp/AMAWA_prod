# AMAWA Filter & Maintenance Business Rules

**Document Version:** 1.0
**Date:** October 2025
**Source:** Excel "Clientes_AMAWA_Hogar.xlsx" - Sheet "Envio de filtros"

---

## Overview

AMAWA uses two main filtration technologies:
- **Ultrafiltración (UF):** 12-month complete replacement cycle
- **Osmosis Inversa (RO):** 24-month complete replacement cycle

All equipment receives maintenance every 6 months, but filters are replaced at different intervals depending on the filtration type.

---

## Filter Inventory - Complete SKU List

### Ultrafiltración Filters (2 SKUs)
1. **S/P COMBI** - Sediment/Pre-filter Combo
2. **U/P COMBI** - Ultra-filter/Post-filter Combo

### Osmosis Inversa Filters (7 SKUs)
3. **PP-10CF** - Polypropylene sediment pre-filter (10")
4. **CTO-10CF** - Carbon block pre-filter (10")
5. **RO-10CF** - Reverse osmosis membrane (10")
6. **T33-10CF** - Post-carbon filter (10")
7. **POST CARBON RUHENS** - Additional post-carbon filter
8. **MAGNESIUM** - Mineralization filter (WHP-3200 RO only)
9. **Micro Carbon** - Pre-filter for WHP-4230 (replaces PP-10CF + CTO-10CF)

**Total Filter SKUs:** 9

---

## Equipment Models & Plan Codes

| Equipment Type | Filter Technology | Delivery Method | Plan Code |
|---------------|-------------------|-----------------|-----------|
| WHP-3200 | Ultrafiltración | Delivery | 3200UFDE |
| WHP-3200 | Osmosis Inversa | Delivery | 3200RODE |
| WHP-3200 | Osmosis con Bomba | Delivery | 3200RBDE |
| WHP-4200 | Osmosis Inversa | Delivery | 4200RODE |
| WHP-4230 (Pedestal) | Osmosis Inversa | Delivery | 4230RODE |
| Llave | Osmosis Inversa | Delivery | LLAVERODE |

---

## Filter Packages

### Package 1.1 (UF - Partial)
**Usage:** WHP-3200 UF at 6 and 18 months
- S/P COMBI (1 unit)

### Package 1.2 (UF - Complete)
**Usage:** WHP-3200 UF at 12 and 24 months
- S/P COMBI (1 unit)
- U/P COMBI (1 unit)

### Package 2.1 (RO Standard - Partial)
**Usage:** WHP-3200 RO at 6, 12, 18 months
- PP-10CF (1 unit)
- CTO-10CF (1 unit)

### Package 2.2 (RO Standard - Complete)
**Usage:** WHP-3200 RO at 24 months
- PP-10CF (1 unit)
- CTO-10CF (1 unit)
- RO-10CF (1 unit)
- T33-10CF (1 unit)
- POST CARBON RUHENS (1 unit)
- MAGNESIUM (1 unit)

### Package 5.1 (RO WHP-4200/Llave - Partial)
**Usage:** WHP-4200 and Llave at 6, 12, 18 months
**Note:** Identical to Package 2.1
- PP-10CF (1 unit)
- CTO-10CF (1 unit)

### Package 5.2 (RO WHP-4200/Llave - Complete)
**Usage:** WHP-4200 and Llave at 24 months
- PP-10CF (1 unit)
- CTO-10CF (1 unit)
- RO-10CF (1 unit)
- T33-10CF (1 unit)

### WHP-4230 Custom Schedule
**6 months:**
- Micro Carbon (1 unit)

**12 months:**
- Micro Carbon (1 unit)
- POST CARBON RUHENS (1 unit)

**18 months:**
- Micro Carbon (1 unit)

**24 months (Complete):**
- Micro Carbon (1 unit)
- POST CARBON RUHENS (1 unit)
- RO-10CF (1 unit)

---

## Maintenance Schedule Matrix

### WHP-3200 Ultrafiltración (3200UFDE)
| Month | Package | Filters Replaced |
|-------|---------|------------------|
| 6 | 1.1 | S/P COMBI |
| 12 | 1.2 | S/P COMBI + U/P COMBI ✅ COMPLETE |
| 18 | 1.1 | S/P COMBI |
| 24 | 1.2 | S/P COMBI + U/P COMBI ✅ COMPLETE |

**Cycle:** 12 months for complete replacement

---

### WHP-3200 Osmosis Inversa (3200RODE, 3200RBDE)
| Month | Package | Filters Replaced |
|-------|---------|------------------|
| 6 | 2.1 | PP-10CF + CTO-10CF (pre-filters) |
| 12 | 2.1 | PP-10CF + CTO-10CF (pre-filters) |
| 18 | 2.1 | PP-10CF + CTO-10CF (pre-filters) |
| 24 | 2.2 | All 6 filters ✅ COMPLETE |

**Cycle:** 24 months for complete replacement

---

### WHP-4200 Osmosis Inversa (4200RODE)
| Month | Package | Filters Replaced |
|-------|---------|------------------|
| 6 | 5.1 | PP-10CF + CTO-10CF (pre-filters) |
| 12 | 5.1 | PP-10CF + CTO-10CF (pre-filters) |
| 18 | 5.1 | PP-10CF + CTO-10CF (pre-filters) |
| 24 | 5.2 | PP-10CF + CTO-10CF + RO-10CF + T33-10CF ✅ COMPLETE |

**Cycle:** 24 months for complete replacement

---

### WHP-4230 Osmosis Inversa Pedestal (4230RODE)
| Month | Filters Replaced |
|-------|------------------|
| 6 | Micro Carbon |
| 12 | Micro Carbon + POST CARBON RUHENS |
| 18 | Micro Carbon |
| 24 | Micro Carbon + POST CARBON RUHENS + RO-10CF ✅ COMPLETE |

**Cycle:** 24 months for complete replacement

---

### Llave Osmosis Inversa (LLAVERODE)
| Month | Package | Filters Replaced |
|-------|---------|------------------|
| 6 | 5.1 | PP-10CF + CTO-10CF (pre-filters) |
| 12 | 5.1 | PP-10CF + CTO-10CF (pre-filters) |
| 18 | 5.1 | PP-10CF + CTO-10CF (pre-filters) |
| 24 | 5.2 | PP-10CF + CTO-10CF + RO-10CF + T33-10CF ✅ COMPLETE |

**Cycle:** 24 months for complete replacement

---

## Inventory Management Rules

### Automatic Deduction Triggers
Filters should be deducted from inventory when:
1. Maintenance status changes to **"COMPLETED"**
2. The maintenance type (6/12/18/24 months) matches a filter replacement schedule
3. The equipment's plan code determines which filter package to deduct

### Calculation Formula
For each completed maintenance:
```
1. Get client's equipment → extract plan code
2. Get maintenance type (6/12/18/24 months)
3. Lookup filter package mapping (plan code + maintenance type)
4. Deduct filters from inventory based on package
```

### Example:
- **Client:** Juan Pérez
- **Equipment:** WHP-3200 with plan code **3200RODE** (RO)
- **Maintenance Type:** 12 months (TWELVE_MONTHS)
- **Action:** Deduct Package 2.1 → PP-10CF (-1), CTO-10CF (-1)

---

## Stock Levels & Alerts

### Monthly Filter Consumption Estimates

**Based on 641 clients:**
- UF clients: ~120 (19%)
- RO Standard clients: ~490 (76%)
- RO Pedestal clients: ~31 (5%)

**Monthly maintenance volume:** ~107 clients/month (641 ÷ 6 months)

**Filter consumption per month (approximate):**
- PP-10CF: ~80 units/month
- CTO-10CF: ~80 units/month
- S/P COMBI: ~20 units/month
- U/P COMBI: ~3 units/month (only at 12/24m)
- RO-10CF: ~20 units/month (only at 24m)
- T33-10CF: ~20 units/month (only at 24m)
- POST CARBON RUHENS: ~18 units/month
- MAGNESIUM: ~13 units/month
- Micro Carbon: ~5 units/month

### Recommended Minimum Stock Levels
- PP-10CF: 250 units (3 months)
- CTO-10CF: 250 units (3 months)
- RO-10CF: 60 units (3 months)
- T33-10CF: 60 units (3 months)
- POST CARBON RUHENS: 60 units (3 months)
- MAGNESIUM: 40 units (3 months)
- S/P COMBI: 60 units (3 months)
- U/P COMBI: 15 units (5 months)
- Micro Carbon: 20 units (4 months)

---

## Data Integrity Rules

### Filter Package Consistency
- Package 2.1 and 5.1 are **identical** (can be consolidated in database)
- POST CARBON RUHENS is used in both WHP-3200 and WHP-4230
- RO-10CF is universal across all RO equipment types

### Equipment-Plan Code Validation
Each equipment record must have a valid plan code that maps to:
1. Equipment type (WHP-3200, WHP-4200, etc.)
2. Filter technology (UF/RO)
3. Delivery method (Presencial/Delivery)

### Maintenance-Filter Relationship
- Maintenances at 6/18 months: Partial filter replacement
- Maintenances at 12 months (UF only): Complete replacement
- Maintenances at 24 months (all types): Complete replacement

---

## Notes

1. **Pre-filter replacement frequency:** RO systems require more frequent pre-filter changes (every 6 months) to protect the expensive RO membrane
2. **UF simplicity:** UF systems have fewer filters but replace them more frequently (every 12 months vs 24 months)
3. **Cost optimization:** Pre-filters (PP-10CF, CTO-10CF) are cheaper and protect expensive membranes (RO-10CF)
4. **WHP-4230 exception:** Uses proprietary "Micro Carbon" instead of standard PP-10CF + CTO-10CF combination

---

**End of Document**
