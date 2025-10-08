import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update or create user record with last login
    const dbUser = await prisma.user.upsert({
      where: { authId: user.id },
      update: {
        lastLogin: new Date(),
      },
      create: {
        authId: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split('@')[0],
        lastLogin: new Date(),
      },
    })

    return NextResponse.json({ success: true, user: dbUser })
  } catch (error) {
    console.error('Error updating login:', error)
    return NextResponse.json(
      { error: 'Failed to update login time' },
      { status: 500 }
    )
  }
}
