-- Drop existing enums if they exist
DROP TYPE IF EXISTS "ClientStatus" CASCADE;
DROP TYPE IF EXISTS "MaintenanceType" CASCADE;
DROP TYPE IF EXISTS "MaintenanceStatus" CASCADE;
DROP TYPE IF EXISTS "IncidentType" CASCADE;
DROP TYPE IF EXISTS "IncidentStatus" CASCADE;
DROP TYPE IF EXISTS "Priority" CASCADE;

-- Create enum types
CREATE TYPE "ClientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CANCELLED');
CREATE TYPE "MaintenanceType" AS ENUM ('6_months', '12_months', '18_months', '24_months');
CREATE TYPE "MaintenanceStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED');
CREATE TYPE "IncidentType" AS ENUM ('EQUIPMENT_FAILURE', 'FILTER_ISSUE', 'WATER_QUALITY', 'BILLING', 'OTHER');
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Now alter existing tables to use these enums
ALTER TABLE clients ALTER COLUMN status TYPE "ClientStatus" USING status::"ClientStatus";
ALTER TABLE maintenances ALTER COLUMN type TYPE "MaintenanceType" USING type::"MaintenanceType";
ALTER TABLE maintenances ALTER COLUMN status TYPE "MaintenanceStatus" USING status::"MaintenanceStatus";
ALTER TABLE incidents ALTER COLUMN type TYPE "IncidentType" USING type::"IncidentType";
ALTER TABLE incidents ALTER COLUMN status TYPE "IncidentStatus" USING status::"IncidentStatus";
ALTER TABLE incidents ALTER COLUMN priority TYPE "Priority" USING priority::"Priority";