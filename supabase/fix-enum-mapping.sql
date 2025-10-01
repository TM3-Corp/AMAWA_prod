-- Fix enum mapping to match Prisma schema @map directives
-- This script drops and recreates enums with correct values

-- First, drop existing types and tables that use them
DROP TABLE IF EXISTS "Maintenance" CASCADE;
DROP TABLE IF EXISTS "Incident" CASCADE;
DROP TABLE IF EXISTS "Client" CASCADE;
DROP TABLE IF EXISTS "Inventory" CASCADE;

-- Drop existing enum types
DROP TYPE IF EXISTS "MaintenanceType" CASCADE;
DROP TYPE IF EXISTS "MaintenanceStatus" CASCADE;
DROP TYPE IF EXISTS "ClientStatus" CASCADE;
DROP TYPE IF EXISTS "IncidentType" CASCADE;
DROP TYPE IF EXISTS "IncidentStatus" CASCADE;
DROP TYPE IF EXISTS "Priority" CASCADE;

-- Recreate enums with correct mapped values
-- MaintenanceType uses lowercase with underscores due to @map directive in Prisma schema
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "MaintenanceType" AS ENUM ('6_months', '12_months', '18_months', '24_months');
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');
CREATE TYPE "IncidentType" AS ENUM ('EQUIPMENT_FAILURE', 'FILTER_ISSUE', 'WATER_QUALITY', 'BILLING', 'OTHER');
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');