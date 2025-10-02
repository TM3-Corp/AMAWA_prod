# Análisis de Datos del Cliente - Gap Analysis

**Fecha:** 2 de Octubre 2025
**Objetivo:** Identificar datos faltantes para lograr una Vista 360° completa del cliente

---

## 📊 Resumen Ejecutivo

**Datos Actuales en DB:** 11 campos por cliente
**Datos Disponibles en Excel:** 56+ campos por cliente
**Gap Identificado:** ~45 campos no almacenados (82% de los datos)

---

## 🔍 Comparación: Base de Datos vs Excel

### ✅ Campos Actualmente Almacenados

| Campo DB | Columna Excel | Estado |
|----------|---------------|--------|
| `name` | Nombre completo (col 55) | ✅ Almacenado |
| `email` | Correo (col 4) | ✅ Almacenado |
| `phone` | Celular (col 5) | ✅ Almacenado |
| `address` | Direccion (col 6) | ✅ Almacenado |
| `comuna` | Comuna (col 7) | ✅ Almacenado |
| `equipmentType` | Equipo (col 19) | ✅ Almacenado |
| `installationDate` | Fecha instalacion (col 10) | ✅ Almacenado |
| `status` | (Calculado) | ✅ Almacenado |

---

## ❌ Campos NO Almacenados (Organizados por Categoría)

### 1️⃣ INFORMACIÓN PERSONAL

| Campo Propuesto | Columna Excel | Prioridad | Notas |
|-----------------|---------------|-----------|-------|
| `firstName` | Nombre (col 1) | 🔴 ALTA | Actualmente solo guardamos nombre completo |
| `lastName` | Apellido (col 2) | 🔴 ALTA | Separar apellido para búsquedas |
| `rut` | Rut (col 3) | 🔴 ALTA | Identificación única chilena |
| `propertyType` | Depto/casa/empresa (col 8) | 🟡 MEDIA | Útil para logística |
| `propertyNumber` | Numero Depto/casa (col 9) | 🟡 MEDIA | Complementa dirección |

**Impacto:** Permite búsquedas por apellido, validación por RUT, mejor logística de visitas.

---

### 2️⃣ INFORMACIÓN DE CUENTA

| Campo Propuesto | Columna Excel | Prioridad | Notas |
|-----------------|---------------|-----------|-------|
| `freeUntilDate` | Gratis hasta (col 11) | 🔴 ALTA | Promociones y periodo de prueba |
| `needsInvoice` | Necesita Factura (col 12) | 🟡 MEDIA | Importante para facturación |
| `contactChannel` | Canal de contacto (col 13) | 🟢 BAJA | Marketing attribution |
| `generalComments` | Comentarios generales (col 16) | 🔴 ALTA | **Campo editable solicitado** |
| `regularized` | Regularizado (col 0) | 🟡 MEDIA | Estado administrativo |

**Impacto:** Control de promociones, notas del cliente editables, tracking de canal de adquisición.

---

### 3️⃣ DETALLES DE EQUIPO (Extendidos)

| Campo Propuesto | Columna Excel | Prioridad | Notas |
|-----------------|---------------|-----------|-------|
| `serialNumber` | Numero de serie equipo (col 17) | 🔴 ALTA | Trazabilidad del equipo |
| `color` | Color (col 18) | 🟡 MEDIA | Blanco/Negro (inventario) |
| `filterType` | Tipo de filtrado (col 20) | 🔴 ALTA | RO vs UF (tipo de tecnología) |
| `deliveryType` | Delivery/presencial (col 21) | 🟡 MEDIA | Tipo de instalación |
| `planCode` | Codigo Plan (col 22) | 🔴 ALTA | Código interno del plan |
| `uniqueId` | ID Unico (col 23) | 🔴 ALTA | **TOKU ID o identificador legacy** |
| `installationCost` | Costo instalacion (col 24) | 🟢 BAJA | Histórico financiero |
| `installerTechnician` | Tecnico instalador (col 25) | 🟡 MEDIA | Quién instaló el equipo |

**Impacto:** Trazabilidad completa del equipo, historial de instalación, identificación única.

---

### 4️⃣ INFORMACIÓN FINANCIERA DEL PLAN

| Campo Propuesto | Columna Excel | Prioridad | Notas |
|-----------------|---------------|-----------|-------|
| `firstMonthCharge` | Cobro primer mes (col 26) | 🟢 BAJA | Histórico |
| `firstChargeDate` | Fecha de cobro primer mes (col 27) | 🟡 MEDIA | Ciclo de facturación |
| `planCurrency` | UF - CLP (col 28) | 🔴 ALTA | **Moneda del plan** |
| `planValueUF` | Valor plan (UF) (col 30) | 🔴 ALTA | Precio base en UF |
| `discountPercent` | Descuento (col 31) | 🔴 ALTA | Descuento aplicado |
| `monthlyValueUF` | Valor mensual (UF) (col 32) | 🔴 ALTA | Precio final mensual UF |
| `planValueCLP` | Valor plan (CLP) (col 33) | 🔴 ALTA | Precio base en CLP |
| `monthlyValueCLP` | Valor mensual (CLP) (col 35) | 🔴 ALTA | Precio final mensual CLP |
| `tokuEnabled` | TOKU (col 38) | 🟡 MEDIA | **Sistema de pago TOKU** |
| `transferEnabled` | TRANSFERENCIA (col 39) | 🟡 MEDIA | Método de pago |

**Impacto:** Vista completa del plan financiero, cálculo automático de facturación, control de descuentos.

---

### 5️⃣ NOTAS TÉCNICAS Y CALIDAD

| Campo Propuesto | Columna Excel | Prioridad | Notas |
|-----------------|---------------|-----------|-------|
| `technicianNote` | Nota tecnico (col 40) | 🟡 MEDIA | Observaciones del instalador |
| `ppmTap` | PPM Llave (col 41) | 🟢 BAJA | Partes por millón en llave |
| `ppmMachine` | PPM Máquina (col 42) | 🟢 BAJA | Partes por millón en equipo |
| `filtrationLevel` | Filtración (col 43) | 🟢 BAJA | Nivel de filtración |

**Impacto:** Calidad del agua, diagnóstico técnico, historial de instalación.

---

### 6️⃣ HISTORIAL DE MANTENCIONES (🚨 CRÍTICO)

| Campo Propuesto | Columna Excel | Prioridad | Notas |
|-----------------|---------------|-----------|-------|
| `firstMaintenanceDate` | Fecha primera mantención (col 44) | 🔴 CRÍTICA | **6 meses post-instalación** |
| `secondMaintenanceDate` | Fecha segunda mantención (col 46) | 🔴 CRÍTICA | **12 meses post-instalación** |
| `thirdMaintenanceDate` | Fecha Tercera Mantención (col 47) | 🔴 CRÍTICA | **18 meses post-instalación** |
| `fourthMaintenanceDate` | Fecha Cuarta Mantención (col 48) | 🔴 CRÍTICA | **24 meses post-instalación** |
| `maintenanceObservations` | Observaciones (col 50) | 🟡 MEDIA | Notas de mantención |
| `filterOrder` | Orden de Filtros (col 51) | 🟢 BAJA | Pedido de filtros |

**Impacto CRÍTICO:**
- ✅ Permite calcular **tasa de respuesta del cliente** (programado vs ejecutado)
- ✅ Identificar **clientes "saludables"** con mejor compliance
- ✅ Historial completo de todas las mantenciones realizadas
- ✅ **Métricas de desviación**: ¿Cuántos días se atrasó la mantención programada?

---

### 7️⃣ METADATA DEL CLIENTE

| Campo Propuesto | Columna Excel | Prioridad | Notas |
|-----------------|---------------|-----------|-------|
| `startYear` | Año (col 52) | 🟡 MEDIA | Año de inicio del servicio |
| `startMonth` | Mes (col 53) | 🟡 MEDIA | Mes de inicio del servicio |
| `planType` | Tipo de Plan (col 54) | 🔴 ALTA | Categoría del plan contratado |

**Impacto:** Análisis de cohortes, retención por periodo, segmentación de clientes.

---

## 🎯 Propuesta de Mejora del Schema

### Nuevo Modelo: `Client` (Extendido)

```prisma
model Client {
  // IDs
  id               String    @id @default(uuid())
  uniqueId         String?   @unique @map("unique_id")      // ID Unico (TOKU o legacy)

  // Personal Info
  firstName        String    @map("first_name")
  lastName         String    @map("last_name")
  fullName         String    @map("full_name")              // Computed: firstName + lastName
  rut              String?   @unique
  email            String?   @unique
  phone            String?

  // Address
  address          String?
  propertyType     String?   @map("property_type")          // Depto/Casa/Empresa
  propertyNumber   String?   @map("property_number")
  comuna           String?

  // Account Status
  status           String    @default("ACTIVE")
  regularized      Boolean   @default(true)
  freeUntilDate    DateTime? @map("free_until_date")
  contactChannel   String?   @map("contact_channel")
  generalComments  String?   @map("general_comments")       // EDITABLE

  // Equipment Info
  equipmentType    String?   @map("equipment_type")         // WHP-3200, etc
  serialNumber     String?   @unique @map("serial_number")
  color            String?                                  // Blanco/Negro
  filterType       String?   @map("filter_type")            // RO/UF
  installationDate DateTime? @map("installation_date")
  deliveryType     String?   @map("delivery_type")          // Presencial/Delivery
  installerTech    String?   @map("installer_technician")
  installationCost Decimal?  @map("installation_cost") @db.Decimal(10,2)

  // Plan & Pricing
  planCode         String?   @map("plan_code")              // 3200RODE, etc
  planType         String?   @map("plan_type")
  planCurrency     String?   @map("plan_currency")          // UF/CLP
  planValueUF      Decimal?  @map("plan_value_uf") @db.Decimal(10,4)
  planValueCLP     Int?      @map("plan_value_clp")
  discountPercent  Decimal?  @map("discount_percent") @db.Decimal(5,2)
  monthlyValueUF   Decimal?  @map("monthly_value_uf") @db.Decimal(10,4)
  monthlyValueCLP  Int?      @map("monthly_value_clp")

  // Payment Methods
  tokuEnabled      Boolean   @default(false) @map("toku_enabled")
  transferEnabled  Boolean   @default(false) @map("transfer_enabled")
  needsInvoice     Boolean   @default(false) @map("needs_invoice")
  firstChargeDate  DateTime? @map("first_charge_date")

  // Technical Notes
  technicianNote   String?   @map("technician_note")
  ppmTap           Int?      @map("ppm_tap")
  ppmMachine       Int?      @map("ppm_machine")
  filtrationLevel  String?   @map("filtration_level")

  // Client Start
  startYear        Int?      @map("start_year")
  startMonth       Int?      @map("start_month")

  // Timestamps
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  // Relations
  maintenances     Maintenance[]
  incidents        Incident[]

  @@map("clients")
}
```

### Nuevo Modelo: `Maintenance` (Mejorado)

```prisma
model Maintenance {
  id                  String    @id @default(uuid())
  clientId            String    @map("client_id")

  // Maintenance Type & Cycle
  type                String                           // 6_months, 12_months, etc
  cycleNumber         Int       @map("cycle_number")   // 1, 2, 3, 4

  // Dates - CRÍTICO para métricas
  scheduledDate       DateTime  @map("scheduled_date") // Fecha programada (de Excel)
  actualDate          DateTime? @map("actual_date")    // Fecha real de ejecución
  completedDate       DateTime? @map("completed_date") // Fecha de completado

  // Calculated Metrics
  deviationDays       Int?      @map("deviation_days") // actualDate - scheduledDate
  responseRate        String?   @map("response_rate")  // GOOD/FAIR/POOR/CRITICAL

  // Status & Details
  status              String    @default("PENDING")
  notes               String?
  observations        String?                          // Campo "Observaciones" de Excel
  technicianId        String?   @map("technician_id")

  // Filter Order
  filterOrderSent     Boolean   @default(false) @map("filter_order_sent")
  filterOrderDate     DateTime? @map("filter_order_date")

  // Timestamps
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  // Relations
  client              Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([scheduledDate])
  @@index([actualDate])
  @@index([status])
  @@index([responseRate])
  @@map("maintenances")
}
```

---

## 📈 Métricas Clave Habilitadas por Nuevos Datos

### 1. Health Score del Cliente

```typescript
interface ClientHealthMetrics {
  maintenanceCompliance: number      // % de mantenciones a tiempo
  avgDeviationDays: number           // Promedio de días de atraso
  responseRate: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  onTimeMaintenances: number         // Cantidad a tiempo
  lateMaintenances: number           // Cantidad atrasadas
  missedMaintenances: number         // Cantidad no realizadas
}
```

**Cálculo de Response Rate:**
- **EXCELLENT:** Desviación ≤ 7 días (1 semana)
- **GOOD:** Desviación 8-14 días (2 semanas)
- **FAIR:** Desviación 15-30 días (1 mes)
- **POOR:** Desviación > 30 días

### 2. Análisis de Cohortes

Con `startYear` y `startMonth`:
- Retención por cohorte
- Lifetime value por periodo
- Tendencias de crecimiento

### 3. Análisis de Rentabilidad

Con datos financieros completos:
- Revenue por cliente
- Descuentos aplicados
- Métodos de pago preferidos
- Costo de adquisición (por canal)

### 4. Gestión de Inventario

Con `color`, `filterType`, `equipmentType`:
- Stock necesario por tipo de equipo
- Frecuencia de cambio de filtros
- Planificación de compras

---

## 🚀 Plan de Implementación Propuesto

### Fase 1: Datos Críticos (Prioridad ALTA) 🔴

**Cliente:**
- Separar `firstName` y `lastName`
- Agregar `rut`
- Agregar `generalComments` (editable)
- Agregar `planCurrency`, valores de plan, descuentos
- Agregar `planType` y `planCode`

**Mantenciones:**
- Importar fechas de las 4 mantenciones desde Excel
- Calcular `deviationDays` cuando hay fecha real
- Calcular `responseRate` automáticamente

**Estimado:** 2-3 días de desarrollo

### Fase 2: Datos Financieros y de Equipo (Prioridad MEDIA) 🟡

- Agregar detalles completos de plan financiero
- Agregar `serialNumber`, `color`, `filterType`
- Agregar `uniqueId` (TOKU)
- Agregar métodos de pago

**Estimado:** 1-2 días de desarrollo

### Fase 3: Metadata y Notas Técnicas (Prioridad BAJA) 🟢

- Agregar notas técnicas (PPM, filtración)
- Agregar metadata (año/mes inicio)
- Agregar canal de contacto

**Estimado:** 1 día de desarrollo

---

## 📋 Requerimientos para Importación

### Script de Migración Necesario

```typescript
// scripts/migrate-extended-client-data.ts
//
// Debe importar:
// 1. Separar Nombre/Apellido de columnas B y C
// 2. Importar fechas de 4 mantenciones (cols 44, 46, 47, 48)
// 3. Capitalizar Delivery/Presencial correctamente
// 4. Importar todos los campos financieros
// 5. Calcular métricas de desviación automáticamente
```

### Validaciones Importantes

- **RUT:** Validar formato chileno (12.345.678-9)
- **Delivery Type:** Normalizar a "Presencial" o "Delivery"
- **Plan Currency:** Validar solo "UF" o "CLP"
- **Fechas:** Convertir desde formato Excel (45444 → Date)
- **Response Rate:** Calcular automáticamente basado en desviación

---

## 🎯 Resultado Esperado: Vista 360° Completa

Con todos estos datos, el sistema podrá mostrar:

### Dashboard del Cliente

```
┌─────────────────────────────────────────────────────────┐
│ FELIPE CABALLERO                            Health: 🟢   │
│ RUT: 17.704.037-1                                        │
│ Las Condes, Rafael Sanzio 80, Depto 511                 │
├─────────────────────────────────────────────────────────┤
│ EQUIPO                                                   │
│ WHP-3200 Blanco | RO | S/N: ABC123                     │
│ Instalado: 15/06/2024 | Técnico: Felipe González       │
├─────────────────────────────────────────────────────────┤
│ PLAN                                                     │
│ Tipo: Premium | Código: 3200RODE                       │
│ $22,900 CLP/mes (10% desc.) | Pago: TOKU              │
├─────────────────────────────────────────────────────────┤
│ MANTENCIONES                                            │
│ ✅ 6 meses:  15/12/2024 → 18/12/2024 (+3 días)  🟢     │
│ ⏳ 12 meses: 15/06/2025 (Próxima)                      │
│ ⏹️  18 meses: 15/12/2025 (Pendiente)                   │
│ ⏹️  24 meses: 15/06/2026 (Pendiente)                   │
│                                                          │
│ Compliance: 100% | Desviación promedio: 3 días         │
├─────────────────────────────────────────────────────────┤
│ COMENTARIOS GENERALES                        [Editar]   │
│ Cliente muy puntual, prefiere visitas AM.              │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Conclusión

Para lograr una **Vista 360° verdaderamente completa**, necesitamos:

1. ✅ **Extender el schema** con ~35 campos adicionales
2. ✅ **Migrar datos históricos** desde Excel (especialmente mantenciones)
3. ✅ **Implementar cálculos automáticos** de métricas de salud
4. ✅ **Crear UI para editar** comentarios y campos clave
5. ✅ **Validar e importar** datos de las 675 filas del Excel

**Impacto:** Transformar de un sistema básico de registros a una plataforma de **gestión inteligente de clientes** con insights accionables.

---

*Próximos pasos: Revisar con el equipo y decidir qué fases implementar primero.*
