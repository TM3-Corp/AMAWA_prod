# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AMAWA Production is a water purification service management system built for AMAWA, migrating their Excel-based client management to a modern web platform with automated maintenance scheduling and inventory tracking.

**Key Goal**: Replace Excel workflows with a centralized platform that provides a 360-degree client view, maintenance automation, and inventory management.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase, São Paulo region)
- **ORM**: Prisma
- **Cache**: Upstash Redis
- **Deployment**: Vercel
- **Data Source**: Excel import from `data/Clientes_AMAWA_Hogar.xlsx` (675 clients)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (includes Prisma generation)
npm run build

# Type checking
npm run type-check

# Linting
npm run lint

# Database operations
npx prisma generate              # Generate Prisma client
npx prisma db push              # Push schema to database
npx prisma migrate dev          # Create and apply migration
npx prisma studio               # Open database GUI

# Data import
tsx scripts/import-excel-fixed.ts  # Import clients from Excel
```

## Architecture

### Database Schema (Prisma)

Four main models with relational data:

1. **Client** - Core customer data with status tracking
   - Relations: `maintenances[]`, `incidents[]`
   - Status: `ACTIVE | INACTIVE | SUSPENDED | CANCELLED`
   - Fields include installation date, equipment type, contact info, address/comuna

2. **Maintenance** - Scheduled service records
   - Types: `SIX_MONTHS | TWELVE_MONTHS | EIGHTEEN_MONTHS | TWENTY_FOUR_MONTHS`
   - Status: `PENDING | SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED | RESCHEDULED`
   - Linked to clients via `clientId`

3. **Inventory** - Equipment and parts tracking
   - Unique constraint: `[equipmentType, location]`
   - Includes min stock levels and restocking dates

4. **Incident** - Issue tracking and support tickets
   - Types: `EQUIPMENT_FAILURE | FILTER_ISSUE | WATER_QUALITY | BILLING | OTHER`
   - Priority levels: `LOW | MEDIUM | HIGH | CRITICAL`

**Important**: Prisma enum values (e.g., `SIX_MONTHS`) map to database values (e.g., `6_months`) via `@map()` directives. Always use Prisma enum constants in code.

### App Structure

```
app/
├── page.tsx              # Landing page
├── layout.tsx            # Root layout (Spanish locale)
├── globals.css           # Global styles
├── dashboard/
│   └── page.tsx         # Main dashboard UI
└── api/
    ├── clients/
    │   └── route.ts     # Client CRUD endpoints
    └── stats/
        └── route.ts     # Statistics aggregation
```

### Data Import System

- **Source**: `data/Clientes_AMAWA_Hogar.xlsx`
- **Script**: `scripts/import-excel-fixed.ts`
- **Process**:
  - Reads "Clientes" sheet
  - Creates client records with full names, contacts, addresses
  - Automatically creates future maintenance records based on installation dates
  - Skips duplicates (by email/phone)
  - Includes inventory seeding

### Environment Configuration

Required variables in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_KEY
DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://YOUR_ENDPOINT.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN
```

## Database Enum Synchronization

When modifying Prisma enums:

1. Update `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev`
3. If enums already exist in Supabase, manually sync with SQL:
   ```sql
   ALTER TYPE "MaintenanceType" ADD VALUE IF NOT EXISTS '6_months';
   ```
4. See `supabase/fix-enum-mapping.sql` for enum fix examples

## Production Deployment

- **URL**: https://amawa-prod.vercel.app
- **Git Branch**: `main` (auto-deploys to Vercel)
- **Region**: São Paulo (all services)
- **Current Scale**: 675 clients on free tier

### Deployment Checklist
1. Environment variables set in Vercel
2. Prisma schema pushed to Supabase
3. Data imported via script
4. Verify enums match between Prisma and database

## Key Development Patterns

1. **Prisma Usage**: Always use `PrismaClient` singleton pattern, import enums from `@prisma/client`
2. **Date Handling**: Excel dates need conversion via `excelDateToJS()` helper (see import script)
3. **API Routes**: Use Prisma directly in route handlers, no separate service layer yet
4. **Styling**: TailwindCSS with custom configuration in `tailwind.config.js`
5. **Spanish Locale**: All UI text and metadata in Spanish

## Current Status (as of Oct 2025)

- ✅ Database schema designed and deployed
- ✅ 675 clients imported from Excel
- ✅ Enum mappings fixed between Prisma and Supabase
- ✅ Basic API endpoints (`/api/clients`, `/api/stats`)
- ✅ Dashboard foundation created
- 🚧 Next phase: Migrate mockup designs from `/06_presentacion/` to production components
- 🚧 Next phase: Build maintenance module with calendar integration

## Excel Data Structure

The source Excel file (`Clientes_AMAWA_Hogar.xlsx`) contains multiple sheets. The primary production sheet is "Clientes" with columns:
- Customer info: Nombre, Apellido, Nombre completo, Correo, Celular
- Location: Direccion, Comuna
- Equipment: Equipo, Fecha instalacion
- Maintenance tracking: Four maintenance date columns (6, 12, 18, 24 months)

**Important**: Understanding the Excel structure is crucial for the 360-degree client view feature, as it represents AMAWA's current workflow being migrated to the platform.

## Performance Considerations

- Free tier limits (see PRICING.md):
  - Supabase: 500MB DB, 2GB bandwidth
  - Upstash: 10K commands/sec, 256MB
  - Vercel: 100GB bandwidth
- Current runway: 6-12 months at 675 clients
- Use Redis caching aggressively to minimize DB queries
- Database indexes already on: `scheduledDate`, `status`, `createdAt`
