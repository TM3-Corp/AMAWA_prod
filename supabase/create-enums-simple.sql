-- Simple enum creation without modifying existing data
-- Run this in Supabase SQL Editor

-- Check if enums exist first
DO $$ 
BEGIN
    -- Create ClientStatus enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ClientStatus') THEN
        CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED');
    END IF;

    -- Create MaintenanceType enum if it doesn't exist  
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaintenanceType') THEN
        CREATE TYPE "MaintenanceType" AS ENUM ('SIX_MONTHS', 'TWELVE_MONTHS', 'EIGHTEEN_MONTHS', 'TWENTY_FOUR_MONTHS');
    END IF;

    -- Create MaintenanceStatus enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MaintenanceStatus') THEN
        CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');
    END IF;

    -- Create IncidentType enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentType') THEN
        CREATE TYPE "IncidentType" AS ENUM ('EQUIPMENT_FAILURE', 'FILTER_ISSUE', 'WATER_QUALITY', 'BILLING', 'OTHER');
    END IF;

    -- Create IncidentStatus enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IncidentStatus') THEN
        CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
    END IF;

    -- Create Priority enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Priority') THEN
        CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
    END IF;
END $$;