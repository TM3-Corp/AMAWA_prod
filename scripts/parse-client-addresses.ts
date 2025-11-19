import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Parse address to extract street number
 *
 * Examples:
 * - "Montenegro 189, Dept 504 B" → "189"
 * - "Av. Apoquindo 1234" → "1234"
 * - "Calle Los Robles 567 A" → "567"
 * - "Condominio los algarrobos de chicureo IVB" → null (no numeric number)
 */
function extractStreetNumber(address: string | null): string | null {
  if (!address) return null

  // Find first sequence of digits (street number)
  const match = address.match(/\d+/)

  return match ? match[0] : null
}

/**
 * Extract street name (everything before the first number)
 *
 * Examples:
 * - "Montenegro 189, Dept 504 B" → "Montenegro"
 * - "Av. Apoquindo 1234" → "Av. Apoquindo"
 */
function extractStreetName(address: string | null): string | null {
  if (!address) return null

  // Find position of first digit
  const match = address.match(/\d/)

  if (!match || match.index === undefined) {
    // No number found, return whole address as street name
    return address.trim()
  }

  // Return everything before the first digit, trimmed
  return address.substring(0, match.index).trim()
}

async function main() {
  console.log('🔍 Starting address parsing...\n')

  // Get all clients with addresses
  const clients = await prisma.client.findMany({
    where: {
      address: {
        not: null
      }
    },
    select: {
      id: true,
      name: true,
      address: true,
      addressNumber: true
    }
  })

  console.log(`Found ${clients.length} clients with addresses\n`)

  let updatedCount = 0
  let skippedCount = 0
  let failedCount = 0
  const manualFixNeeded: Array<{ id: string; name: string; address: string }> = []

  for (const client of clients) {
    const streetNumber = extractStreetNumber(client.address)
    const streetName = extractStreetName(client.address)

    if (streetNumber) {
      // Update client with parsed street number
      await prisma.client.update({
        where: { id: client.id },
        data: { addressNumber: streetNumber }
      })

      console.log(`✅ ${client.name}`)
      console.log(`   Address: ${client.address}`)
      console.log(`   Street: ${streetName}`)
      console.log(`   Number: ${streetNumber}`)
      console.log('')

      updatedCount++
    } else {
      // No number found - needs manual fix
      console.log(`⚠️  ${client.name}`)
      console.log(`   Address: ${client.address}`)
      console.log(`   ❌ NO NUMBER FOUND - Needs manual fix`)
      console.log('')

      manualFixNeeded.push({
        id: client.id,
        name: client.name,
        address: client.address!
      })

      failedCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('📊 SUMMARY')
  console.log('='.repeat(80))
  console.log(`✅ Successfully parsed: ${updatedCount}`)
  console.log(`⚠️  Need manual fix: ${failedCount}`)
  console.log(`⏭️  Skipped (already had number): ${skippedCount}`)
  console.log('')

  if (manualFixNeeded.length > 0) {
    console.log('📝 ADDRESSES NEEDING MANUAL FIX:')
    console.log('='.repeat(80))
    manualFixNeeded.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}`)
      console.log(`   ID: ${item.id}`)
      console.log(`   Address: ${item.address}`)
      console.log('')
    })
    console.log('You can manually update these in Supabase or via SQL:')
    console.log(`UPDATE clients SET address_number = 'YOUR_NUMBER' WHERE id = 'CLIENT_ID';`)
  }

  console.log('\n✅ Address parsing complete!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
