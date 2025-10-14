/**
 * Calculate the effective maintenance cycle in months
 *
 * The maintenance cycle repeats every 24 months (4 cycles):
 * - Cycle 1, 5, 9, 13, ... → 6 months
 * - Cycle 2, 6, 10, 14, ... → 12 months
 * - Cycle 3, 7, 11, 15, ... → 18 months
 * - Cycle 4, 8, 12, 16, ... → 24 months
 *
 * @param cycleNumber - The maintenance cycle number (1, 2, 3, 4, 5, 6, ...)
 * @returns The effective cycle in months (6, 12, 18, or 24)
 *
 * @example
 * calculateEffectiveCycle(1) // 6
 * calculateEffectiveCycle(4) // 24
 * calculateEffectiveCycle(5) // 6 (wraps around)
 * calculateEffectiveCycle(8) // 24 (wraps around)
 */
export function calculateEffectiveCycle(cycleNumber: number | null | undefined): number {
  if (!cycleNumber || cycleNumber < 1) {
    return 6 // Default to first cycle
  }

  // Calculate position in 4-cycle pattern (1-4)
  // Formula: ((n - 1) % 4) + 1
  // - Cycle 1 → ((1-1) % 4) + 1 = 0 + 1 = 1
  // - Cycle 4 → ((4-1) % 4) + 1 = 3 + 1 = 4
  // - Cycle 5 → ((5-1) % 4) + 1 = 0 + 1 = 1 (wraps to cycle 1)
  // - Cycle 8 → ((8-1) % 4) + 1 = 3 + 1 = 4 (wraps to cycle 4)
  const effectiveCycleNumber = ((cycleNumber - 1) % 4) + 1

  // Convert to months: 1→6, 2→12, 3→18, 4→24
  return effectiveCycleNumber * 6
}

/**
 * Get human-readable cycle information
 *
 * @param cycleNumber - The maintenance cycle number
 * @returns Object with cycle details
 *
 * @example
 * getCycleInfo(5) // { cycleNumber: 5, effectiveMonths: 6, displayText: "Ciclo 5 (6 meses)" }
 */
export function getCycleInfo(cycleNumber: number | null | undefined) {
  const effectiveMonths = calculateEffectiveCycle(cycleNumber)
  const actualCycle = cycleNumber || 1

  return {
    cycleNumber: actualCycle,
    effectiveMonths,
    displayText: `Ciclo ${actualCycle} (${effectiveMonths} meses)`,
    isRepeating: actualCycle > 4
  }
}
