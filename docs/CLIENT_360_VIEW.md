# 360° Client View - Implementation Guide

## Overview

The 360° Client View provides AMAWA staff with a complete, centralized view of client information, service history, equipment details, and activity timeline - replacing the fragmented Excel-based workflow.

## Architecture

### Components Structure

```
components/clients/
├── ClientOverviewCard.tsx         # Client identity & contact info
├── EquipmentDetails.tsx          # Equipment model, filter type, installation
├── ServiceStatusDashboard.tsx    # Maintenance & incident tracking
└── ActivityTimeline.tsx          # Chronological event history
```

### API Endpoints

#### GET `/api/clients`
- **Purpose**: List all clients with pagination and search
- **Query Parameters**:
  - `limit` (default: 50) - Number of results per page
  - `page` (default: 1) - Page number
  - `search` (optional) - Search by name, comuna, or phone
- **Response**:
  ```json
  {
    "clients": [...],
    "total": 641,
    "page": 1,
    "totalPages": 13
  }
  ```

#### GET `/api/clients/[id]`
- **Purpose**: Get complete client details with all related data
- **Response**:
  ```json
  {
    "client": {
      "id": "...",
      "name": "...",
      "email": "...",
      "phone": "...",
      "address": "...",
      "comuna": "...",
      "equipmentType": "...",
      "installationDate": "...",
      "status": "ACTIVE",
      "maintenances": [...],
      "incidents": [...]
    },
    "stats": {
      "maintenance": {
        "total": 4,
        "completed": 2,
        "pending": 2,
        "nextMaintenance": {...}
      },
      "incidents": {
        "total": 1,
        "open": 0,
        "resolved": 1
      },
      "tenure": 12
    }
  }
  ```

#### PATCH `/api/clients/[id]`
- **Purpose**: Update client information
- **Body**: Client fields to update
- **Response**: Updated client object

#### DELETE `/api/clients/[id]`
- **Purpose**: Delete client (cascades to maintenances and incidents)
- **Response**: `{ "success": true }`

### Pages

#### `/clients` - Clients List
- Grid view of all clients
- Search by name, comuna, or phone
- Pagination (20 per page)
- Click card to navigate to detail view

#### `/clients/[id]` - 360° Client View
**Layout**: 3-column responsive grid

**Left Column**:
- Client Overview Card (contact, status, tenure)
- Equipment Details (model, filter type, serial)

**Middle Column**:
- Service Status Dashboard
  - Maintenance compliance KPI
  - Pending maintenances
  - Open incidents
  - Next scheduled maintenance
  - Recent maintenance history
  - Recent incidents

**Right Column**:
- Activity Timeline
  - Client registration
  - Equipment installation
  - All maintenances
  - All incidents
  - Chronological order (newest first)

## Data Flow

### Client Detail Page Load
1. Extract `clientId` from URL params
2. Fetch `/api/clients/[id]`
3. API queries Prisma with `include` for maintenances and incidents
4. Calculate stats (compliance, tenure, next maintenance)
5. Return enriched data to frontend
6. Components render with full data

### Search & Pagination
1. User types in search box (debounced)
2. Update URL query params
3. Fetch `/api/clients?search=...&page=...`
4. Prisma queries with `where` clause and `skip/take`
5. Re-render grid with filtered results

## Key Features

### 1. Client Overview Card
- **Avatar**: Gradient circle with first letter initial
- **Status Badge**: Color-coded (Active, Inactive, Suspended, Cancelled)
- **Contact Info**: Email, phone, address with icons
- **Tenure**: Calculated from installation date
- **Last Updated**: Shows data freshness

### 2. Equipment Details
- **Model Detection**: Parses equipment type (e.g., "WHP-3200 Negro")
- **Filter System**: Auto-detects Ósmosis Inversa vs Ultrafiltración
- **Equipment Status**: Real-time operational indicator
- **Installation Date**: Shows when equipment was installed
- **Serial Number**: Placeholder for future implementation

### 3. Service Status Dashboard
- **KPI Cards**:
  - Maintenance Compliance (%)
  - Pending Maintenances (count)
  - Open Incidents (count)
- **Next Maintenance**: Highlighted card with date and type
- **Maintenance History**: Last 5 maintenances with status badges
- **Recent Incidents**: Last 3 incidents with priority

### 4. Activity Timeline
- **Visual Timeline**: Vertical line with colored event nodes
- **Event Types**:
  - Client Registration (purple)
  - Installation (green)
  - Maintenances (blue/yellow based on status)
  - Incidents (red/green based on resolution)
- **Chronological**: Newest events at top
- **Details**: Each event shows description, date, and status

## Design System

### Colors
- **Primary**: Purple (`#9333EA`) - Actions, headers
- **Success**: Green (`#10B981`) - Completed, active
- **Warning**: Yellow (`#F59E0B`) - Pending, scheduled
- **Danger**: Red (`#EF4444`) - Incidents, critical
- **Info**: Blue (`#3B82F6`) - Maintenance, neutral

### Status Colors
```typescript
ACTIVE → bg-green-100 text-green-800
INACTIVE → bg-gray-100 text-gray-800
SUSPENDED → bg-yellow-100 text-yellow-800
CANCELLED → bg-red-100 text-red-800
PENDING → bg-yellow-100 text-yellow-800
COMPLETED → bg-green-100 text-green-800
IN_PROGRESS → bg-blue-100 text-blue-800
OPEN → bg-red-100 text-red-800
RESOLVED → bg-green-100 text-green-800
```

### Typography
- **Headers**: Bold, 2xl (32px)
- **Subheaders**: Bold, lg (18px)
- **Body**: Regular, base (16px)
- **Captions**: Regular, xs (12px)
- **Font**: Inter (via next/font/google)

### Spacing
- **Card Padding**: 6 (24px)
- **Grid Gap**: 6 (24px)
- **Element Spacing**: 2-4 (8-16px)

## Utility Functions

Located in `lib/utils.ts`:

### `formatDate(date: Date | string | null): string`
- Formats: "14 de octubre de 2025"
- Spanish locale (es-CL)

### `formatDateTime(date: Date | string | null): string`
- Formats: "14 de octubre de 2025, 15:30"
- Includes time

### `calculateTenure(installationDate: Date | string | null): string`
- Returns: "1 año y 3 meses", "6 meses", etc.
- Handles singular/plural in Spanish

### `getStatusColor(status: string): string`
- Returns: Tailwind classes for status badges
- Consistent across all components

### `getStatusLabel(status: string): string`
- Translates: "ACTIVE" → "Activo"
- Spanish labels for all statuses

## Testing

### API Tests
Location: `__tests__/api/clients.test.ts`

Tests:
- ✅ GET /api/clients returns paginated list
- ✅ Pagination works correctly
- ✅ Search filters results
- ✅ GET /api/clients/[id] returns full details
- ✅ Returns 404 for non-existent clients

Run tests:
```bash
npm test
```

### Manual Testing Checklist
- [ ] Navigate to /clients from dashboard
- [ ] Search for client by name
- [ ] Click client card to open 360° view
- [ ] Verify all sections load (Overview, Equipment, Service, Timeline)
- [ ] Check maintenance compliance calculation
- [ ] Verify next maintenance is highlighted
- [ ] Check timeline shows all events chronologically
- [ ] Test back button to dashboard
- [ ] Verify responsive layout on mobile

## Performance Considerations

### Database Queries
- **Single Query**: `/api/clients/[id]` uses one Prisma query with `include`
- **Indexed Fields**: `scheduledDate`, `status`, `createdAt` are indexed
- **Limit Results**: Timeline shows recent events only (configurable)

### Frontend Optimization
- **Client-Side Rendering**: Uses React hooks for data fetching
- **Loading States**: Shows spinner while fetching data
- **Error Handling**: Graceful fallback with error message
- **Lazy Loading**: Components load on demand

### Caching Strategy (Future)
- Redis cache for frequently accessed clients
- Cache invalidation on updates
- TTL: 5 minutes for client details

## Future Enhancements

### Phase 2: Edit Functionality
- [ ] Inline editing of client details
- [ ] Equipment update modal
- [ ] Status change with confirmation
- [ ] Audit log for changes

### Phase 3: Actions & Workflows
- [ ] Schedule new maintenance button
- [ ] Create incident button
- [ ] Send maintenance reminder (email/SMS)
- [ ] Export client report (PDF)

### Phase 4: Analytics
- [ ] Client lifetime value
- [ ] Service history chart (Recharts)
- [ ] Predictive maintenance alerts
- [ ] Churn risk indicator

### Phase 5: Multi-Equipment Support
- Currently shows only one equipment per client
- [ ] Support multiple equipment installations
- [ ] Equipment comparison view
- [ ] Individual equipment timelines

## Deployment Notes

### Environment Variables
Ensure these are set in Vercel:
```bash
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Build Check
```bash
npm run build
```

Should compile without errors. Check for:
- TypeScript errors
- Missing dependencies
- API route errors

### Database Migration
If schema changed:
```bash
npx prisma migrate deploy
```

## Troubleshooting

### "Cliente no encontrado" Error
- Check client ID is valid UUID
- Verify client exists in database
- Check Prisma connection

### Components Not Rendering
- Check browser console for errors
- Verify API returns data
- Check component props match interface

### Styling Issues
- Clear Next.js cache: `rm -rf .next`
- Rebuild: `npm run dev`
- Check Tailwind config

### Performance Issues
- Check database indexes
- Profile Prisma queries with `prisma studio`
- Monitor Vercel analytics

## Related Documentation
- [CLAUDE.md](../CLAUDE.md) - Project overview
- [PRICING.md](../PRICING.md) - Infrastructure costs
- [Prisma Schema](../prisma/schema.prisma) - Database schema
