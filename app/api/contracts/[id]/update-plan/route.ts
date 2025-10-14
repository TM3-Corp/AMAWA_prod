import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Update contract plan code
 *
 * PATCH /api/contracts/[id]/update-plan
 * Body: { planCode: string }
 *
 * Updates the contract's plan code (for typo corrections)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id
    const { planCode } = await request.json()

    if (!planCode) {
      return NextResponse.json(
        { error: 'Código de plan requerido' },
        { status: 400 }
      )
    }

    // Verify the plan code has mappings
    const mappingExists = await prisma.equipmentFilterMapping.findFirst({
      where: { planCode }
    })

    if (!mappingExists) {
      return NextResponse.json(
        {
          error: `El plan ${planCode} no tiene paquetes mapeados`,
          suggestion: 'Verifica que el código de plan sea correcto'
        },
        { status: 400 }
      )
    }

    // Update contract
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        planCode,
        updatedAt: new Date()
      },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Plan actualizado correctamente',
      contract: updatedContract
    })
  } catch (error) {
    console.error('Error updating contract plan:', error)
    return NextResponse.json(
      { error: 'Error al actualizar plan del contrato' },
      { status: 500 }
    )
  }
}
