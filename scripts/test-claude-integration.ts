import dotenv from 'dotenv'
import { testClaudeConnection, processMessageWithClaude } from '@/lib/claude'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function main() {
  console.log('🧪 Testing Claude API Integration\n')

  // Debug: Check if API key is loaded
  const apiKey = process.env.CLAUDE_API_KEY
  console.log('API Key loaded:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND')
  console.log('')

  if (!apiKey) {
    console.error('❌ CLAUDE_API_KEY not found in environment variables')
    process.exit(1)
  }

  // Test 1: Basic connection
  console.log('📡 Test 1: Testing basic Claude API connection...')
  const connectionTest = await testClaudeConnection()
  console.log('Result:', connectionTest)
  console.log('')

  if (!connectionTest.success) {
    console.error('❌ Connection test failed. Cannot proceed with further tests.')
    process.exit(1)
  }

  // Test 2: Process a simple message with Paul's phone
  console.log('💬 Test 2: Processing test message with Claude AI...')
  const testMessage = 'Hola, ¿cuál es el estado de mi mantención?'
  const testPhone = '56966083433' // Paul's test client phone

  console.log(`Message: "${testMessage}"`)
  console.log(`Phone: ${testPhone}`)
  console.log('')

  try {
    const response = await processMessageWithClaude(testMessage, testPhone)
    console.log('✅ Claude AI Response:')
    console.log(response)
    console.log('')
  } catch (error) {
    console.error('❌ Error processing message:', error)
  }

  // Test 3: Test rescheduling request
  console.log('📅 Test 3: Processing reschedule request...')
  const rescheduleMessage = '¿Puedo reagendar mi mantención para el próximo martes?'
  console.log(`Message: "${rescheduleMessage}"`)
  console.log('')

  try {
    const response = await processMessageWithClaude(rescheduleMessage, testPhone)
    console.log('✅ Claude AI Response:')
    console.log(response)
    console.log('')
  } catch (error) {
    console.error('❌ Error processing message:', error)
  }

  console.log('✅ All tests completed!')
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
