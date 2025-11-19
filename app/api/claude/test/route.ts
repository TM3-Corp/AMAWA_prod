import { NextResponse } from 'next/server'
import { testClaudeConnection, processMessageWithClaude } from '@/lib/claude'

/**
 * Test endpoint to verify Claude API integration
 * GET /api/claude/test - Test basic connection
 * POST /api/claude/test - Test message processing with phone number
 */
export async function GET() {
  try {
    const result = await testClaudeConnection()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Claude test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { message, phone } = await request.json()

    if (!message || !phone) {
      return NextResponse.json(
        { error: 'Message and phone are required' },
        { status: 400 }
      )
    }

    const response = await processMessageWithClaude(message, phone)

    return NextResponse.json({
      success: true,
      response,
      phone,
      originalMessage: message,
    })
  } catch (error) {
    console.error('Claude test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
