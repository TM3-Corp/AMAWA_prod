import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/technicians/suggest?comuna=Las+Condes
 *
 * Suggests the best technician for a comuna based on:
 * 1. History of completed maintenances in that comuna
 * 2. Recent activity in that comuna
 * 3. Overall workload (less is better)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const comuna = searchParams.get('comuna')

    if (!comuna) {
      return NextResponse.json(
        { success: false, error: 'Comuna parameter is required' },
        { status: 400 }
      )
    }

    // Get all active technicians
    const technicians = await prisma.user.findMany({
      where: {
        role: 'TECHNICIAN',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    })

    if (technicians.length === 0) {
      return NextResponse.json({
        success: true,
        suggested: null,
        message: 'No hay técnicos disponibles'
      })
    }

    // For each technician, calculate their score for this comuna
    const technicianScores = await Promise.all(
      technicians.map(async (tech) => {
        // Count completed maintenances in this comuna
        const comunaMaintenances = await prisma.maintenance.findMany({
          where: {
            technicianId: tech.id,
            status: 'COMPLETED',
            client: {
              comuna: comuna
            }
          }
        })

        // Count recent maintenances (last 6 months) in this comuna
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const recentComunaMaintenances = comunaMaintenances.filter(
          m => m.completedDate && m.completedDate >= sixMonthsAgo
        ).length

        // Count total pending maintenances assigned to this technician (workload)
        const pendingMaintenances = await prisma.maintenance.count({
          where: {
            technicianId: tech.id,
            status: {
              in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS']
            }
          }
        })

        // Scoring algorithm:
        // - +10 points per completed maintenance in this comuna (experience)
        // - +5 bonus points per recent maintenance in comuna (recency)
        // - -2 points per pending maintenance (workload penalty)
        const experienceScore = comunaMaintenances.length * 10
        const recencyBonus = recentComunaMaintenances * 5
        const workloadPenalty = pendingMaintenances * 2

        const totalScore = experienceScore + recencyBonus - workloadPenalty

        return {
          technician: tech,
          score: totalScore,
          stats: {
            comunaMaintenances: comunaMaintenances.length,
            recentComunaMaintenances,
            pendingMaintenances,
            experienceScore,
            recencyBonus,
            workloadPenalty
          }
        }
      })
    )

    // Sort by score descending
    technicianScores.sort((a, b) => b.score - a.score)

    const topChoice = technicianScores[0]

    return NextResponse.json({
      success: true,
      suggested: {
        ...topChoice.technician,
        score: topChoice.score,
        stats: topChoice.stats,
        reason: topChoice.stats.comunaMaintenances > 0
          ? `Ha completado ${topChoice.stats.comunaMaintenances} mantención(es) en ${comuna}`
          : 'Menor carga de trabajo actual'
      },
      alternatives: technicianScores.slice(1, 4).map(t => ({
        ...t.technician,
        score: t.score,
        stats: t.stats
      }))
    })

  } catch (error) {
    console.error('Error suggesting technician:', error)
    return NextResponse.json(
      { success: false, error: 'Error al sugerir técnico' },
      { status: 500 }
    )
  }
}
