import { calculateEffectiveCycle, getCycleInfo } from '../lib/calculate-effective-cycle'

console.log('🔧 Testing Cycle Wrapping Logic\n')

// Test cases: cycle number → expected effective months
const testCases = [
  { cycle: 1, expected: 6 },
  { cycle: 2, expected: 12 },
  { cycle: 3, expected: 18 },
  { cycle: 4, expected: 24 },
  { cycle: 5, expected: 6 },   // Wraps to cycle 1
  { cycle: 6, expected: 12 },  // Wraps to cycle 2
  { cycle: 7, expected: 18 },  // Wraps to cycle 3
  { cycle: 8, expected: 24 },  // Wraps to cycle 4
  { cycle: 9, expected: 6 },   // Wraps to cycle 1
  { cycle: 12, expected: 24 }, // Wraps to cycle 4
  { cycle: 13, expected: 6 },  // Wraps to cycle 1
]

let passed = 0
let failed = 0

testCases.forEach(({ cycle, expected }) => {
  const result = calculateEffectiveCycle(cycle)
  const info = getCycleInfo(cycle)
  const status = result === expected ? '✅' : '❌'

  if (result === expected) {
    passed++
    console.log(`${status} Cycle ${cycle} → ${result} months (${info.displayText})`)
  } else {
    failed++
    console.log(`${status} Cycle ${cycle} → Expected ${expected}, got ${result}`)
  }
})

console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`)

if (failed === 0) {
  console.log('✅ All tests passed!')
  process.exit(0)
} else {
  console.log('❌ Some tests failed!')
  process.exit(1)
}
