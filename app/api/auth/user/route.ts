import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const supabase = createClient()

    // Get authenticated user from Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details from database including role
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLogin: true,
      },
    })

    if (!dbUser) {
      // User exists in Supabase but not in our database
      // Create a default user record
      const newUser = await prisma.user.create({
        data: {
          authId: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split('@')[0],
        },
      })

      return NextResponse.json({
        user: {
          ...newUser,
          email: user.email,
        },
      })
    }

    return NextResponse.json({
      user: {
        ...dbUser,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}
