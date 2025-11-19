/**
 * Test Script: Simulate Incoming WhatsApp Messages
 *
 * This script simulates receiving messages from WhatsApp to test
 * your webhook handler locally without needing ngrok.
 *
 * Usage: npx tsx scripts/test-webhook-message.ts
 */

// Example incoming message payloads from Meta WhatsApp API

// 1. Simple text message from client
const incomingTextMessage = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '1373350721107667',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '56974784620',
              phone_number_id: '799669516574071'
            },
            contacts: [
              {
                profile: {
                  name: 'Juan Pérez'
                },
                wa_id: '56966083433'
              }
            ],
            messages: [
              {
                from: '56966083433',
                id: 'wamid.HBgLNTY5NjYwODM0MzMVAgARGBIxMjM0NUFCQ0RFRjEyMzQ1AA==',
                timestamp: '1700000000',
                text: {
                  body: 'Hola, tengo una pregunta sobre mi mantención'
                },
                type: 'text'
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
}

// 2. Interactive button response (client clicked "Sí")
const buttonResponseYes = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '1373350721107667',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '56974784620',
              phone_number_id: '799669516574071'
            },
            contacts: [
              {
                profile: {
                  name: 'María González'
                },
                wa_id: '56987654321'
              }
            ],
            messages: [
              {
                from: '56987654321',
                id: 'wamid.HBgLNTY5ODc2NTQzMjEVAgARGBIxMjM0NUFCQ0RFRjEyMzQ1AA==',
                timestamp: '1700000100',
                type: 'interactive',
                interactive: {
                  type: 'button_reply',
                  button_reply: {
                    id: 'confirm_yes',
                    title: 'Sí'
                  }
                }
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
}

// 3. Interactive button response (client clicked "No, necesito ayuda")
const buttonResponseNo = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '1373350721107667',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '56974784620',
              phone_number_id: '799669516574071'
            },
            contacts: [
              {
                profile: {
                  name: 'Carlos Rodríguez'
                },
                wa_id: '56912345678'
              }
            ],
            messages: [
              {
                from: '56912345678',
                id: 'wamid.HBgLNTY5MTIzNDU2NzgVAgARGBIxMjM0NUFCQ0RFRjEyMzQ1AA==',
                timestamp: '1700000200',
                type: 'interactive',
                interactive: {
                  type: 'button_reply',
                  button_reply: {
                    id: 'need_help',
                    title: 'No, necesito ayuda'
                  }
                }
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
}

// 4. Message status update (delivered)
const messageStatusDelivered = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '1373350721107667',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '56974784620',
              phone_number_id: '799669516574071'
            },
            statuses: [
              {
                id: 'wamid.HBgLNTY5NjYwODM0MzMVAgARGBI1NUNBNjg5Q0EzNEU3MzlGN0YA',
                status: 'delivered',
                timestamp: '1700000000',
                recipient_id: '56966083433',
                conversation: {
                  id: 'CONVERSATION_ID',
                  origin: {
                    type: 'business_initiated'
                  }
                },
                pricing: {
                  billable: true,
                  pricing_model: 'CBP',
                  category: 'utility'
                }
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
}

// 5. Message status update (read)
const messageStatusRead = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '1373350721107667',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '56974784620',
              phone_number_id: '799669516574071'
            },
            statuses: [
              {
                id: 'wamid.HBgLNTY5NjYwODM0MzMVAgARGBI1NUNBNjg5Q0EzNEU3MzlGN0YA',
                status: 'read',
                timestamp: '1700000050',
                recipient_id: '56966083433'
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
}

// Test function to send webhook to local server
async function testWebhook(payload: any, testName: string) {
  console.log(`\n📨 Testing: ${testName}`)
  console.log('=' .repeat(60))

  try {
    const response = await fetch('http://localhost:3000/api/webhooks/whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    console.log(`✅ Response status: ${response.status}`)
    console.log(`✅ Response body:`, result)

    // Wait a bit to see console logs from the webhook handler
    await new Promise(resolve => setTimeout(resolve, 500))
  } catch (error) {
    console.error(`❌ Error:`, error)
  }
}

// Main test runner
async function main() {
  console.log('🧪 WhatsApp Webhook Test Suite')
  console.log('Testing incoming messages on http://localhost:3000/api/webhooks/whatsapp')
  console.log('\nMake sure your dev server is running (npm run dev)\n')

  // Run tests
  await testWebhook(incomingTextMessage, 'Simple text message')
  await testWebhook(buttonResponseYes, 'Button response: Sí')
  await testWebhook(buttonResponseNo, 'Button response: No, necesito ayuda')
  await testWebhook(messageStatusDelivered, 'Message status: Delivered')
  await testWebhook(messageStatusRead, 'Message status: Read')

  console.log('\n✨ All tests completed!')
  console.log('\nCheck your Next.js console (where you ran `npm run dev`) to see:')
  console.log('  - Incoming message logs')
  console.log('  - Message processing logic')
  console.log('  - Any responses sent back')
}

// Run tests
main().catch(console.error)
