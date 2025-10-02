# Roadmap de Implementación - Vista 360° del Cliente

**Basado en:** CLIENT_DATA_GAP_ANALYSIS.md
**Estado:** Pendiente de aprobación
**Fecha:** 2 de Octubre 2025

---

## 🎯 Objetivo

Transformar el sistema actual de registro básico en una **plataforma de gestión inteligente** con:
- ✅ Información completa del cliente (56+ campos)
- ✅ Historial de mantenciones con métricas de salud
- ✅ Información financiera y de plan detallada
- ✅ Comentarios editables en tiempo real
- ✅ Cálculo automático de KPIs de cliente

---

## 📊 Estado Actual vs Objetivo

| Aspecto | Actual | Objetivo | Gap |
|---------|--------|----------|-----|
| Campos por cliente | 11 | 56+ | 82% |
| Nombre/Apellido | ❌ Solo completo | ✅ Separado | Crítico |
| RUT | ❌ No | ✅ Sí (único) | Crítico |
| Historial mantenciones | ❌ No | ✅ 4 ciclos | Crítico |
| Métricas de respuesta | ❌ No | ✅ Automáticas | Crítico |
| Info financiera | ❌ No | ✅ Completa | Alta |
| Comentarios editables | ❌ No | ✅ Sí | Alta |
| TOKU integration | ❌ No | ✅ Sí | Media |

---

## 🚀 Fases de Implementación

### FASE 1: Fundación de Datos (CRÍTICO) 🔴

**Duración estimada:** 3-4 días

#### 1.1 Modificar Schema de Prisma

**Archivos:**
- `prisma/schema.prisma`

**Cambios en modelo `Client`:**
```prisma
// Agregar campos críticos
firstName        String    @map("first_name")
lastName         String    @map("last_name")
rut              String?   @unique
propertyType     String?   @map("property_type")
propertyNumber   String?   @map("property_number")
generalComments  String?   @map("general_comments")  // EDITABLE
planType         String?   @map("plan_type")
planCode         String?   @map("plan_code")
planCurrency     String?   @map("plan_currency")     // UF o CLP
monthlyValueCLP  Int?      @map("monthly_value_clp")
monthlyValueUF   Decimal?  @map("monthly_value_uf") @db.Decimal(10,4)
discountPercent  Decimal?  @map("discount_percent") @db.Decimal(5,2)
tokuEnabled      Boolean   @default(false) @map("toku_enabled")
uniqueId         String?   @unique @map("unique_id") // ID Unico Excel
```

**Cambios en modelo `Maintenance`:**
```prisma
// Agregar campos de métricas
cycleNumber      Int       @map("cycle_number")      // 1, 2, 3, 4
scheduledDate    DateTime  @map("scheduled_date")    // De Excel
actualDate       DateTime? @map("actual_date")       // Real
deviationDays    Int?      @map("deviation_days")    // Calculado
responseRate     String?   @map("response_rate")     // GOOD/FAIR/POOR
observations     String?                              // Campo Excel
```

#### 1.2 Crear Migración

```bash
npx prisma migrate dev --name add_extended_client_fields
```

#### 1.3 Script de Importación Mejorado

**Archivo:** `scripts/import-extended-client-data.ts`

**Debe:**
1. Leer Excel columna por columna (56 columnas)
2. Separar Nombre (col B) y Apellido (col C)
3. Normalizar "PResencial" → "Presencial", "DElivery" → "Delivery"
4. Importar 4 fechas de mantención por cliente
5. Convertir fechas Excel (45444) a JavaScript Date
6. Validar formato de RUT chileno
7. Crear registros de Maintenance con `scheduledDate` poblado
8. Calcular `deviationDays` si hay `actualDate`
9. Manejar valores nulos correctamente

**Validaciones críticas:**
```typescript
// Normalizar Delivery Type
const normalizeDeliveryType = (value: string): string => {
  if (!value) return 'Presencial'
  const lower = value.toLowerCase()
  if (lower.includes('presencial')) return 'Presencial'
  if (lower.includes('delivery')) return 'Delivery'
  return 'Presencial'
}

// Validar RUT chileno
const validateRUT = (rut: string): boolean => {
  const cleaned = rut.replace(/[^0-9kK]/g, '')
  if (cleaned.length < 8) return false
  // ... algoritmo de validación
  return true
}

// Convertir fecha Excel
const excelDateToJS = (excelDate: number): Date => {
  return new Date((excelDate - 25569) * 86400 * 1000)
}

// Calcular desviación
const calculateDeviation = (
  scheduled: Date,
  actual: Date | null
): number | null => {
  if (!actual) return null
  const diff = actual.getTime() - scheduled.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24)) // días
}

// Calcular Response Rate
const calculateResponseRate = (deviationDays: number | null): string => {
  if (deviationDays === null) return 'PENDING'
  if (deviationDays <= 7) return 'EXCELLENT'
  if (deviationDays <= 14) return 'GOOD'
  if (deviationDays <= 30) return 'FAIR'
  return 'POOR'
}
```

#### 1.4 Actualizar API Endpoints

**Archivo:** `app/api/clients/[id]/route.ts`

Debe retornar todos los nuevos campos + métricas calculadas:

```typescript
{
  client: {
    id: "uuid",
    firstName: "Felipe",
    lastName: "Caballero",
    fullName: "Felipe Caballero",
    rut: "17.704.037-1",
    // ... todos los campos
  },
  stats: {
    maintenance: {
      total: 4,
      completed: 2,
      pending: 2,
      complianceRate: 50,
      avgDeviationDays: 5,
      responseRate: "GOOD",
      nextMaintenance: { /* ... */ }
    }
  },
  healthScore: {
    overall: 85,  // 0-100
    factors: {
      maintenanceCompliance: 90,
      punctuality: 85,
      communication: 80
    }
  }
}
```

---

### FASE 2: UI de Vista 360° Mejorada 🟡

**Duración estimada:** 2-3 días

#### 2.1 Componentes Nuevos

**Archivo:** `components/clients/ClientDetailsCard.tsx`

```tsx
// Muestra información personal completa
<ClientDetailsCard>
  <Section title="Información Personal">
    <Field label="Nombre completo">{firstName} {lastName}</Field>
    <Field label="RUT">{rut}</Field>
    <Field label="Email">{email}</Field>
    <Field label="Teléfono">{phone}</Field>
  </Section>

  <Section title="Dirección">
    <Field label="Calle">{address}</Field>
    <Field label="Tipo">{propertyType}</Field>
    <Field label="Número">{propertyNumber}</Field>
    <Field label="Comuna">{comuna}</Field>
  </Section>
</ClientDetailsCard>
```

**Archivo:** `components/clients/PlanInformationCard.tsx`

```tsx
// Muestra plan financiero completo
<PlanInformationCard>
  <PlanBadge type={planType} code={planCode} />

  <PricingDisplay>
    <Currency>{planCurrency}</Currency>
    {planCurrency === 'CLP' ? (
      <Price>{formatCLP(monthlyValueCLP)}</Price>
    ) : (
      <Price>{monthlyValueUF} UF</Price>
    )}
    {discountPercent > 0 && (
      <Discount>{discountPercent}% descuento</Discount>
    )}
  </PricingDisplay>

  <PaymentMethods>
    {tokuEnabled && <Badge color="blue">TOKU</Badge>}
    {transferEnabled && <Badge color="green">Transferencia</Badge>}
  </PaymentMethods>
</PlanInformationCard>
```

**Archivo:** `components/clients/MaintenanceHistoryCard.tsx`

```tsx
// Muestra historial de mantenciones con métricas
<MaintenanceHistoryCard>
  <HealthMetrics>
    <Metric label="Compliance" value="75%" color="green" />
    <Metric label="Desviación Promedio" value="5 días" color="yellow" />
    <Metric label="Response Rate" value="GOOD" color="green" />
  </HealthMetrics>

  <MaintenanceTimeline>
    {maintenances.map(m => (
      <MaintenanceItem
        key={m.id}
        cycle={m.cycleNumber}
        scheduled={m.scheduledDate}
        actual={m.actualDate}
        deviation={m.deviationDays}
        status={m.status}
        responseRate={m.responseRate}
      />
    ))}
  </MaintenanceTimeline>
</MaintenanceHistoryCard>
```

**Archivo:** `components/clients/EditableCommentsCard.tsx`

```tsx
// Campo de comentarios editables en tiempo real
<EditableCommentsCard>
  <CommentHeader>
    <Title>Comentarios Generales</Title>
    <EditButton onClick={toggleEdit} />
  </CommentHeader>

  {isEditing ? (
    <TextArea
      value={comments}
      onChange={setComments}
      onSave={handleSave}
      onCancel={handleCancel}
      placeholder="Agregar notas sobre el cliente..."
    />
  ) : (
    <CommentDisplay>{comments || 'Sin comentarios'}</CommentDisplay>
  )}

  <LastEdited>Última edición: {lastEditedDate}</LastEdited>
</EditableCommentsCard>
```

#### 2.2 Layout de Página del Cliente

**Archivo:** `app/clients/[id]/page.tsx`

```tsx
<ClientDetailPage>
  <Header>
    <ClientAvatar />
    <ClientTitle firstName={firstName} lastName={lastName} />
    <HealthScoreBadge score={healthScore} />
  </Header>

  <Grid columns={3}>
    {/* Columna 1: Info Personal */}
    <Column>
      <ClientDetailsCard />
      <EquipmentDetailsCard />
    </Column>

    {/* Columna 2: Plan y Finanzas */}
    <Column>
      <PlanInformationCard />
      <PaymentHistoryCard />
    </Column>

    {/* Columna 3: Mantenciones y Salud */}
    <Column>
      <MaintenanceHistoryCard />
      <HealthMetricsCard />
    </Column>
  </Grid>

  {/* Fila completa: Comentarios editables */}
  <FullWidthRow>
    <EditableCommentsCard />
  </FullWidthRow>

  {/* Fila completa: Timeline de eventos */}
  <FullWidthRow>
    <ActivityTimeline events={allEvents} />
  </FullWidthRow>
</ClientDetailPage>
```

---

### FASE 3: Analytics y Dashboards 🟢

**Duración estimada:** 2 días

#### 3.1 Dashboard de Salud de Clientes

**Archivo:** `app/dashboard/client-health/page.tsx`

```tsx
// Dashboard agregado de métricas de todos los clientes
<ClientHealthDashboard>
  <KPICards>
    <KPI
      title="Compliance Promedio"
      value="78%"
      trend="+5%"
      color="green"
    />
    <KPI
      title="Desviación Promedio"
      value="8.5 días"
      trend="-2 días"
      color="yellow"
    />
    <KPI
      title="Clientes EXCELLENT"
      value="245"
      percentage="38%"
      color="blue"
    />
    <KPI
      title="Clientes POOR"
      value="87"
      percentage="14%"
      color="red"
    />
  </KPICards>

  <Charts>
    <LineChart
      title="Evolución de Compliance"
      data={complianceOverTime}
    />
    <PieChart
      title="Distribución por Response Rate"
      data={responseRateDistribution}
    />
    <BarChart
      title="Desviación por Comuna"
      data={deviationByComuna}
    />
  </Charts>

  <Tables>
    <ClientTable
      title="Clientes con Mayor Riesgo"
      filter={{ responseRate: 'POOR' }}
      limit={10}
    />
    <ClientTable
      title="Clientes Más Saludables"
      filter={{ responseRate: 'EXCELLENT' }}
      limit={10}
    />
  </Tables>
</ClientHealthDashboard>
```

#### 3.2 Reportes Automatizados

**Archivo:** `lib/reports/client-health-report.ts`

```typescript
// Generar reportes automáticos semanales/mensuales
export async function generateClientHealthReport(
  period: 'weekly' | 'monthly'
): Promise<Report> {
  const clients = await prisma.client.findMany({
    include: { maintenances: true }
  })

  return {
    period,
    generatedAt: new Date(),
    summary: {
      totalClients: clients.length,
      avgHealthScore: calculateAvgHealthScore(clients),
      topPerformers: getTopPerformers(clients, 10),
      atRiskClients: getAtRiskClients(clients, 10),
      complianceTrend: calculateComplianceTrend(clients),
    },
    insights: generateInsights(clients),
    recommendations: generateRecommendations(clients)
  }
}
```

---

## 🔧 Tareas Técnicas Detalladas

### Task 1: Actualizar Schema
- [ ] Modificar `prisma/schema.prisma`
- [ ] Agregar 35+ campos nuevos a modelo `Client`
- [ ] Agregar campos de métricas a modelo `Maintenance`
- [ ] Ejecutar `npx prisma migrate dev`
- [ ] Verificar migración en Supabase

### Task 2: Script de Importación
- [ ] Crear `scripts/import-extended-client-data.ts`
- [ ] Implementar lectura de 56 columnas de Excel
- [ ] Implementar normalización de datos
- [ ] Implementar validaciones (RUT, fechas, etc.)
- [ ] Importar 4 fechas de mantención por cliente
- [ ] Calcular métricas automáticas
- [ ] Ejecutar importación y verificar

### Task 3: Actualizar APIs
- [ ] Modificar `app/api/clients/[id]/route.ts`
- [ ] Agregar campos nuevos a respuesta
- [ ] Calcular métricas en tiempo real
- [ ] Crear endpoint para actualizar comentarios
- [ ] Crear endpoint para métricas agregadas

### Task 4: Componentes UI
- [ ] Crear `ClientDetailsCard.tsx`
- [ ] Crear `PlanInformationCard.tsx`
- [ ] Crear `MaintenanceHistoryCard.tsx`
- [ ] Crear `EditableCommentsCard.tsx`
- [ ] Crear `HealthMetricsCard.tsx`
- [ ] Actualizar `app/clients/[id]/page.tsx`

### Task 5: Testing
- [ ] Probar importación de datos
- [ ] Verificar cálculo de métricas
- [ ] Probar edición de comentarios
- [ ] Verificar visualización de mantenciones
- [ ] Probar en producción

---

## 📦 Entregables por Fase

### Fase 1 Completada:
- ✅ Schema actualizado con 35+ campos
- ✅ Script de importación funcionando
- ✅ 641 clientes con datos completos
- ✅ Historial de 2564 mantenciones (4 por cliente)
- ✅ APIs retornando datos extendidos

### Fase 2 Completada:
- ✅ Vista 360° del cliente completamente funcional
- ✅ Comentarios editables en tiempo real
- ✅ Métricas de salud visibles
- ✅ Timeline de mantenciones con desviaciones

### Fase 3 Completada:
- ✅ Dashboard de salud agregado
- ✅ Reportes automatizados
- ✅ Insights y recomendaciones
- ✅ Exportación de datos

---

## 🎯 Métricas de Éxito

Al completar todas las fases, el sistema debe:

1. **Datos Completos**
   - ✅ 56+ campos por cliente
   - ✅ 100% de clientes con historial de mantenciones
   - ✅ Métricas calculadas automáticamente

2. **Funcionalidad**
   - ✅ Edición de comentarios en < 2 segundos
   - ✅ Cálculo de health score en < 500ms
   - ✅ Visualización completa en < 1 segundo

3. **Insights Accionables**
   - ✅ Identificar clientes en riesgo
   - ✅ Medir compliance por comuna/plan
   - ✅ Predecir cancelaciones
   - ✅ Optimizar rutas de técnicos

4. **Experiencia de Usuario**
   - ✅ Interface intuitiva y rápida
   - ✅ Información fácil de encontrar
   - ✅ Acciones claras y simples
   - ✅ Responsive en mobile/desktop

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Datos inconsistentes en Excel | Media | Alto | Validaciones estrictas + logs detallados |
| Performance con 2500+ mantenciones | Media | Medio | Indexes en DB + paginación |
| Cálculos incorrectos de métricas | Baja | Alto | Tests unitarios + validación manual |
| Migración falla en producción | Baja | Crítico | Backup completo + rollback plan |

---

## 📅 Timeline Estimado

```
Semana 1: Fase 1 (Fundación de Datos)
├─ Día 1-2: Schema + Migración
├─ Día 3-4: Script de importación
└─ Día 5: Testing y validación

Semana 2: Fase 2 (UI Vista 360°)
├─ Día 1-2: Componentes base
├─ Día 3: Integración página cliente
└─ Día 4-5: Testing + refinamiento

Semana 3: Fase 3 (Analytics)
├─ Día 1-2: Dashboard salud clientes
├─ Día 3: Reportes automatizados
└─ Día 4-5: Testing final + deployment
```

**Total: ~15 días hábiles (3 semanas)**

---

## ✅ Aprobación y Siguiente Paso

**Para proceder con la implementación, necesitamos:**

1. ✅ Aprobación del cliente sobre campos a incluir
2. ✅ Confirmación de prioridades (¿Todas las fases o solo Fase 1?)
3. ✅ Validación del formato de datos de Excel
4. ✅ Plan de backup antes de migración en producción

**Pregunta clave para el cliente:**
> ¿Deseas implementar todas las fases (3 semanas) o comenzar solo con Fase 1 (datos críticos, 1 semana) y luego evaluar?

---

*Documento listo para revisión con el equipo y cliente.*
