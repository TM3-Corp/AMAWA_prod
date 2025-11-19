import Anthropic from '@anthropic-ai/sdk'
import prisma from '@/lib/prisma'

// Lazy initialization to ensure env vars are loaded
let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.CLAUDE_API_KEY
    if (!apiKey) {
      throw new Error('CLAUDE_API_KEY environment variable is not set')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

// Database schema context for Claude
const SCHEMA_CONTEXT = `
You are an AI assistant for AMAWA, a water purification service company in Chile.
You help clients manage their water filter maintenance through WhatsApp.

Database Schema:
- clients: Customer information (name, phone, email, address, comuna, status)
- maintenances: Service appointments with types:
  * SIX_MONTHS (6 months after installation)
  * TWELVE_MONTHS (12 months)
  * EIGHTEEN_MONTHS (18 months)
  * TWENTY_FOUR_MONTHS (24 months)
  Status: PENDING, SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, RESCHEDULED
- equipment: Water purification equipment (equipmentType, serialNumber, installationDate)
- contracts: Service plans (planCode, planType, monthlyValueCLP)

Available actions:
- Get maintenance status
- Reschedule maintenance
- Confirm maintenance completion
- View maintenance history
`

// Tool definitions for Claude
const tools: Anthropic.Tool[] = [
  {
    name: 'get_client_maintenances',
    description: 'Get all maintenances for a client by phone number, including upcoming and past maintenances',
    input_schema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Client phone number in format 56912345678',
        },
      },
      required: ['phone'],
    },
  },
  {
    name: 'reschedule_maintenance',
    description: 'Reschedule a maintenance to a new date',
    input_schema: {
      type: 'object',
      properties: {
        maintenanceId: {
          type: 'string',
          description: 'UUID of the maintenance to reschedule',
        },
        newDate: {
          type: 'string',
          description: 'New scheduled date in ISO format (YYYY-MM-DD)',
        },
      },
      required: ['maintenanceId', 'newDate'],
    },
  },
  {
    name: 'confirm_maintenance_completion',
    description: 'Mark a maintenance as completed',
    input_schema: {
      type: 'object',
      properties: {
        maintenanceId: {
          type: 'string',
          description: 'UUID of the maintenance to complete',
        },
        notes: {
          type: 'string',
          description: 'Optional completion notes',
        },
      },
      required: ['maintenanceId'],
    },
  },
  {
    name: 'get_client_info',
    description: 'Get detailed client information including equipment and contract details',
    input_schema: {
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          description: 'Client phone number',
        },
      },
      required: ['phone'],
    },
  },
]

// Tool execution functions
async function executeGetClientMaintenances(phone: string) {
  const client = await prisma.client.findFirst({
    where: { phone },
    include: {
      maintenances: {
        orderBy: { scheduledDate: 'asc' },
      },
    },
  })

  if (!client) {
    return { error: 'Cliente no encontrado' }
  }

  const now = new Date()
  const upcoming = client.maintenances.filter(
    (m) => m.status === 'PENDING' || m.status === 'SCHEDULED'
  )
  const past = client.maintenances.filter(
    (m) => m.status === 'COMPLETED' || new Date(m.scheduledDate) < now
  )

  return {
    client: {
      name: client.name,
      phone: client.phone,
      comuna: client.comuna,
    },
    upcomingMaintenances: upcoming.map((m) => ({
      id: m.id,
      type: m.type,
      scheduledDate: m.scheduledDate,
      status: m.status,
    })),
    pastMaintenances: past.map((m) => ({
      id: m.id,
      type: m.type,
      scheduledDate: m.scheduledDate,
      completedDate: m.completedDate,
      status: m.status,
    })),
  }
}

async function executeRescheduleMaintenance(maintenanceId: string, newDate: string) {
  try {
    const maintenance = await prisma.maintenance.update({
      where: { id: maintenanceId },
      data: {
        scheduledDate: new Date(newDate),
        status: 'SCHEDULED',
        notes: 'Reagendada vía WhatsApp con Claude AI',
      },
      include: {
        client: true,
      },
    })

    return {
      success: true,
      maintenance: {
        id: maintenance.id,
        type: maintenance.type,
        newScheduledDate: maintenance.scheduledDate,
        clientName: maintenance.client.name,
      },
    }
  } catch (error) {
    return { error: 'Error al reagendar mantención' }
  }
}

async function executeConfirmMaintenanceCompletion(maintenanceId: string, notes?: string) {
  try {
    const maintenance = await prisma.maintenance.update({
      where: { id: maintenanceId },
      data: {
        status: 'COMPLETED',
        actualDate: new Date(),
        completedDate: new Date(),
        notes: notes || 'Confirmado vía WhatsApp con Claude AI',
      },
      include: {
        client: true,
      },
    })

    return {
      success: true,
      maintenance: {
        id: maintenance.id,
        type: maintenance.type,
        completedDate: maintenance.completedDate,
        clientName: maintenance.client.name,
      },
    }
  } catch (error) {
    return { error: 'Error al confirmar mantención' }
  }
}

async function executeGetClientInfo(phone: string) {
  const client = await prisma.client.findFirst({
    where: { phone },
    include: {
      equipment: {
        where: { isActive: true },
      },
      contracts: {
        where: { isActive: true },
      },
    },
  })

  if (!client) {
    return { error: 'Cliente no encontrado' }
  }

  return {
    client: {
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      comuna: client.comuna,
    },
    equipment: client.equipment[0]
      ? {
          type: client.equipment[0].equipmentType,
          serialNumber: client.equipment[0].serialNumber,
          installationDate: client.equipment[0].installationDate,
        }
      : null,
    contract: client.contracts[0]
      ? {
          planCode: client.contracts[0].planCode,
          planType: client.contracts[0].planType,
          monthlyValueCLP: client.contracts[0].monthlyValueCLP,
        }
      : null,
  }
}

// Execute tool based on name
async function executeTool(toolName: string, toolInput: any) {
  switch (toolName) {
    case 'get_client_maintenances':
      return executeGetClientMaintenances(toolInput.phone)
    case 'reschedule_maintenance':
      return executeRescheduleMaintenance(toolInput.maintenanceId, toolInput.newDate)
    case 'confirm_maintenance_completion':
      return executeConfirmMaintenanceCompletion(toolInput.maintenanceId, toolInput.notes)
    case 'get_client_info':
      return executeGetClientInfo(toolInput.phone)
    default:
      return { error: 'Tool not found' }
  }
}

/**
 * Process a WhatsApp message using Claude AI
 * @param message - The message text from the client
 * @param phone - The client's phone number
 * @returns AI-generated response
 */
export async function processMessageWithClaude(
  message: string,
  phone: string
): Promise<string> {
  try {
    const anthropic = getAnthropicClient()
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `Cliente (teléfono: ${phone}): ${message}`,
      },
    ]

    // Use Haiku 4.5 (smarter, slightly more expensive) or Sonnet for best reasoning
    const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5'

    let response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: SCHEMA_CONTEXT,
      tools,
      messages,
    })

    // Handle tool use loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(
        (block) => block.type === 'tool_use'
      ) as Anthropic.ToolUseBlock | undefined

      if (!toolUseBlock) break

      const toolResult = await executeTool(toolUseBlock.name, toolUseBlock.input)

      messages.push({
        role: 'assistant',
        content: response.content,
      })

      messages.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify(toolResult),
          },
        ],
      })

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SCHEMA_CONTEXT,
        tools,
        messages,
      })
    }

    // Extract text response
    const textBlock = response.content.find((block) => block.type === 'text') as
      | Anthropic.TextBlock
      | undefined

    return textBlock?.text || 'Lo siento, no pude procesar tu mensaje.'
  } catch (error) {
    console.error('Error processing message with Claude:', error)
    return 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente.'
  }
}

/**
 * Test function to verify Claude integration
 */
export async function testClaudeConnection() {
  try {
    const anthropic = getAnthropicClient()
    const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5'

    const response = await anthropic.messages.create({
      model,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Responde solo con: "Conexión exitosa con Claude API"',
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === 'text') as
      | Anthropic.TextBlock
      | undefined

    return {
      success: true,
      message: textBlock?.text || 'No response',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
