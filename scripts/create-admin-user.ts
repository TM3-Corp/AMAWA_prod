/**
 * Script to create initial admin user
 *
 * Usage:
 * 1. Set EMAIL and PASSWORD in .env.local or pass as arguments:
 *    ADMIN_EMAIL="admin@amawa.cl" ADMIN_PASSWORD="YourSecurePassword123!" npx tsx scripts/create-admin-user.ts
 *
 * 2. Or update the user role for an existing user by email:
 *    npx tsx scripts/create-admin-user.ts existing@email.com
 */

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const prisma = new PrismaClient()

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function createAdminUser() {
  const emailArg = process.argv[2]

  if (emailArg) {
    // Update existing user to admin
    await promoteToAdmin(emailArg)
    return
  }

  // Create new admin user
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error('❌ Error: Please provide ADMIN_EMAIL and ADMIN_PASSWORD')
    console.log('\nUsage:')
    console.log('  ADMIN_EMAIL="admin@amawa.cl" ADMIN_PASSWORD="SecurePass123!" npx tsx scripts/create-admin-user.ts')
    console.log('\nOr to promote existing user:')
    console.log('  npx tsx scripts/create-admin-user.ts existing@email.com')
    process.exit(1)
  }

  try {
    console.log('🔄 Creating admin user...\n')

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'Administrator'
      }
    })

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message)
      process.exit(1)
    }

    console.log('✅ Supabase auth user created:', authData.user.email)

    // Create user record in database
    const dbUser = await prisma.user.create({
      data: {
        authId: authData.user.id,
        email: authData.user.email!,
        name: 'Administrator',
        role: 'ADMIN',
        isActive: true
      }
    })

    console.log('✅ Database user created with ADMIN role\n')
    console.log('📧 Email:', dbUser.email)
    console.log('👤 Name:', dbUser.name)
    console.log('🔑 Role:', dbUser.role)
    console.log('\n✨ Admin user created successfully!')
    console.log('\nYou can now login with:')
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function promoteToAdmin(email: string) {
  try {
    console.log(`🔄 Promoting ${email} to admin...\n`)

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: { email }
    })

    if (!dbUser) {
      console.error(`❌ User with email ${email} not found in database`)
      process.exit(1)
    }

    // Update role to admin
    await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN'
      }
    })

    console.log('✅ User promoted to ADMIN role\n')
    console.log('📧 Email:', email)
    console.log('🔑 New Role: ADMIN')
    console.log('\n✨ Done!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
