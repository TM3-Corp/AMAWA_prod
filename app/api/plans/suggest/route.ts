import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Suggest plan corrections based on fuzzy matching
 *
 * GET /api/plans/suggest?plan=4230UFPR
 *
 * Returns:
 * - Suggested plan codes (sorted by similarity)
 * - All available plan codes with their mappings
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const inputPlan = searchParams.get('plan')

    // Get all plan codes that have mappings
    const mappings = await prisma.equipmentFilterMapping.findMany({
      distinct: ['planCode'],
      select: {
        planCode: true
      },
      orderBy: {
        planCode: 'asc'
      }
    })

    const availablePlans = mappings.map(m => m.planCode)

    // If no input plan, just return all available plans
    if (!inputPlan) {
      return NextResponse.json({
        suggestions: availablePlans,
        allPlans: availablePlans
      })
    }

    // Calculate similarity scores
    const suggestions = availablePlans
      .map(plan => ({
        planCode: plan,
        score: calculateSimilarity(inputPlan, plan)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Top 5 suggestions
      .map(s => s.planCode)

    return NextResponse.json({
      inputPlan,
      suggestions,
      allPlans: availablePlans
    })
  } catch (error) {
    console.error('Error suggesting plans:', error)
    return NextResponse.json(
      { error: 'Error al sugerir planes' },
      { status: 500 }
    )
  }
}

/**
 * Calculate similarity between two strings
 * Uses a simple Levenshtein-like approach
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  // Exact match
  if (s1 === s2) return 100

  // Contains check
  if (s2.includes(s1) || s1.includes(s2)) return 90

  // Check common prefix
  let prefixLength = 0
  const minLength = Math.min(s1.length, s2.length)
  for (let i = 0; i < minLength; i++) {
    if (s1[i] === s2[i]) {
      prefixLength++
    } else {
      break
    }
  }

  if (prefixLength > 0) {
    return 50 + (prefixLength / Math.max(s1.length, s2.length)) * 40
  }

  // Check for common characters (simple approach)
  const s1Set = new Set(s1.split(''))
  const s2Set = new Set(s2.split(''))
  const intersection = new Set([...s1Set].filter(x => s2Set.has(x)))
  const union = new Set([...s1Set, ...s2Set])

  return (intersection.size / union.size) * 50
}
