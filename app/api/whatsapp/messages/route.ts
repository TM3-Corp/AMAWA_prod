import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/whatsapp/messages - Fetch recent WhatsApp messages
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const unprocessedOnly = searchParams.get('unprocessed') === 'true'
    const clientId = searchParams.get('clientId')

    // Build where clause
    const where: any = {}

    if (unprocessedOnly) {
      where.processed = false
    }

    if (clientId) {
      where.clientId = clientId
    }

    // Fetch messages
    const messages = await prisma.whatsAppMessage.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true
          }
        },
        relatedMaintenance: {
          select: {
            id: true,
            scheduledDate: true,
            status: true,
            type: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: limit
    })

    // Get counts
    const totalCount = await prisma.whatsAppMessage.count({ where })
    const unprocessedCount = await prisma.whatsAppMessage.count({
      where: { processed: false }
    })

    return NextResponse.json({
      messages,
      totalCount,
      unprocessedCount,
      limit
    })
  } catch (error) {
    console.error('Error fetching WhatsApp messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

// PATCH /api/whatsapp/messages/:id - Mark message as processed
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, processed, processingNotes } = body

    if (!messageId) {
      return NextResponse.json(
        { error: 'messageId is required' },
        { status: 400 }
      )
    }

    const updatedMessage = await prisma.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        processed: processed ?? true,
        processedAt: processed ? new Date() : null,
        processingNotes
      }
    })

    return NextResponse.json({ message: updatedMessage })
  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    )
  }
}
