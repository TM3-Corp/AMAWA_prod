import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

async function applyMigration() {
  try {
    console.log('🔄 Applying users table migration...\n')

    // Execute the SQL migration directly
    await prisma.$executeRawUnsafe(`
      -- Create UserRole enum if it doesn't exist
      DO $$ BEGIN
        CREATE TYPE "UserRole" AS ENUM ('admin', 'technician', 'manager', 'client');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `)

    console.log('✅ UserRole enum created')

    await prisma.$executeRawUnsafe(`
      -- Create users table if it doesn't exist
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT,
        "role" "UserRole" NOT NULL DEFAULT 'technician',
        "auth_id" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "last_login" TIMESTAMP(3),

        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `)

    console.log('✅ Users table created')

    // Create indexes if they don't exist
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_id_key" ON "users"("auth_id");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "users_auth_id_idx" ON "users"("auth_id");
    `)

    console.log('✅ Indexes created')

    console.log('\n✨ Migration completed successfully!\n')
  } catch (error) {
    console.error('❌ Error applying migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()
