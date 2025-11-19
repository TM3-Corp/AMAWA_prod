/**
 * WhatsApp Business API Utilities
 *
 * Provides functions to send messages via WhatsApp Business Platform API
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v24.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!

interface SendMessageParams {
  to: string // Phone number in international format (e.g., "56976559269")
  type: 'text' | 'template'
  text?: string
  template?: {
    name: string
    language: string
    components?: any[]
  }
}

/**
 * Send a WhatsApp message
 */
export async function sendWhatsAppMessage(params: SendMessageParams) {
  try {
    const url = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`

    const payload: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: params.to,
    }

    if (params.type === 'text' && params.text) {
      payload.type = 'text'
      payload.text = { body: params.text }
    } else if (params.type === 'template' && params.template) {
      payload.type = 'template'
      payload.template = {
        name: params.template.name,
        language: { code: params.template.language },
        components: params.template.components || [],
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('WhatsApp API Error:', error)
      throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`)
    }

    const result = await response.json()
    console.log('✅ Message sent successfully:', result)

    return {
      success: true,
      messageId: result.messages[0].id,
      response: result,
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send address confirmation message
 * Uses template: address_confirmation_filter_shipment
 */
export async function sendAddressConfirmation(params: {
  to: string
  clientName: string
  shipmentDate: string
  address: string
  comuna: string
}) {
  return sendWhatsAppMessage({
    to: params.to,
    type: 'template',
    template: {
      name: 'address_confirmation_filter_shipment',
      language: 'es',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.clientName },
            { type: 'text', text: params.shipmentDate },
            { type: 'text', text: params.address },
            { type: 'text', text: params.comuna },
          ],
        },
      ],
    },
  })
}

/**
 * Send tutorial video message
 * Uses template: tutorial_video_uf or tutorial_video_ro
 */
export async function sendTutorialVideo(params: {
  to: string
  clientName: string
  equipmentType: string
  filterType: 'UF' | 'RO'
  videoUrl: string
}) {
  const templateName = params.filterType === 'UF' ? 'tutorial_video_uf' : 'tutorial_video_ro'

  return sendWhatsAppMessage({
    to: params.to,
    type: 'template',
    template: {
      name: templateName,
      language: 'es',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.clientName },
            { type: 'text', text: params.equipmentType },
            { type: 'text', text: params.videoUrl },
          ],
        },
      ],
    },
  })
}

/**
 * Send maintenance confirmation request
 * Uses template: maintenance_confirmation
 */
export async function sendMaintenanceConfirmation(params: {
  to: string
  clientName: string
}) {
  return sendWhatsAppMessage({
    to: params.to,
    type: 'template',
    template: {
      name: 'maintenance_confirmation',
      language: 'es',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.clientName },
          ],
        },
      ],
    },
  })
}

/**
 * Send technician visit appointment
 * Uses template: prueba_envio_filtros
 */
export async function sendTechnicianVisit(params: {
  to: string
  clientName: string
  address: string
  date: string
  startTime: string
  endTime: string
}) {
  return sendWhatsAppMessage({
    to: params.to,
    type: 'template',
    template: {
      name: 'prueba_envio_filtros',
      language: 'es',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: params.clientName },
            { type: 'text', text: params.address },
            { type: 'text', text: params.date },
            { type: 'text', text: params.startTime },
            { type: 'text', text: params.endTime },
          ],
        },
      ],
    },
  })
}

/**
 * Send a simple text message (for testing or manual messages)
 */
export async function sendTextMessage(to: string, text: string) {
  return sendWhatsAppMessage({
    to,
    type: 'text',
    text,
  })
}

/**
 * Format phone number for WhatsApp API
 * Removes +, spaces, and ensures correct format
 * Example: "+56 9 7655 9269" → "56976559269"
 */
export function formatPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

/**
 * Validate phone number format
 */
export function isValidPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  // Accept any international number (at least 10 digits, max 15)
  // Chilean numbers: 569XXXXXXXX (12 digits)
  // US numbers: 1XXXXXXXXXX (11 digits)
  return /^\d{10,15}$/.test(formatted)
}
