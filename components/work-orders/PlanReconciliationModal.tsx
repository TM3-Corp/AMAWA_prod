'use client'

import { useState, useEffect } from 'react'
import { getCycleInfo } from '@/lib/calculate-effective-cycle'

interface UnmappedMaintenance {
  maintenanceId: string
  clientId: string
  clientName: string
  planCode: string
  cycle: number
  reason: string
}

interface PackageInfo {
  cycle: number
  packageCode: string
  packageName: string
  filters: Array<{
    sku: string
    name: string
    quantity: number
  }>
}

interface PlanReconciliationModalProps {
  unmappedMaintenances: UnmappedMaintenance[]
  onClose: () => void
  onComplete: () => void
}

export default function PlanReconciliationModal({
  unmappedMaintenances,
  onClose,
  onComplete
}: PlanReconciliationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [suggestedPlans, setSuggestedPlans] = useState<string[]>([])
  const [allPlans, setAllPlans] = useState<string[]>([])
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null)
  const [updatePermanently, setUpdatePermanently] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentMaintenance = unmappedMaintenances[currentIndex]
  const isLastItem = currentIndex === unmappedMaintenances.length - 1
  const cycleInfo = getCycleInfo(Math.floor(currentMaintenance?.cycle / 6))

  // Fetch plan suggestions when modal opens or current maintenance changes
  useEffect(() => {
    if (currentMaintenance) {
      fetchPlanSuggestions(currentMaintenance.planCode)
    }
  }, [currentMaintenance])

  // Fetch package info when plan is selected
  useEffect(() => {
    if (selectedPlan && currentMaintenance) {
      fetchPackageInfo(selectedPlan, currentMaintenance.cycle)
    }
  }, [selectedPlan, currentMaintenance])

  async function fetchPlanSuggestions(planCode: string) {
    try {
      const response = await fetch(`/api/plans/suggest?plan=${encodeURIComponent(planCode)}`)
      const data = await response.json()
      setSuggestedPlans(data.suggestions || [])
      setAllPlans(data.allPlans || [])
    } catch (error) {
      console.error('Error fetching plan suggestions:', error)
    }
  }

  async function fetchPackageInfo(planCode: string, cycle: number) {
    try {
      const response = await fetch(`/api/plans/${encodeURIComponent(planCode)}/packages?cycle=${cycle}`)
      if (response.ok) {
        const data = await response.json()
        setPackageInfo(data.selectedPackage || null)
      } else {
        setPackageInfo(null)
      }
    } catch (error) {
      console.error('Error fetching package info:', error)
      setPackageInfo(null)
    }
  }

  async function handleApply() {
    if (!selectedPlan || !packageInfo) return

    setLoading(true)

    try {
      // If permanent update requested, update the contract
      if (updatePermanently) {
        const contract = await fetch(`/api/clients/${currentMaintenance.clientId}`)
          .then(res => res.json())
          .then(data => data.contracts?.find((c: any) => c.isActive))

        if (contract) {
          await fetch(`/api/contracts/${contract.id}/update-plan`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planCode: selectedPlan })
          })
        }
      }

      // Move to next or complete
      if (isLastItem) {
        onComplete()
      } else {
        // Reset for next item
        setCurrentIndex(currentIndex + 1)
        setSelectedPlan('')
        setPackageInfo(null)
        setUpdatePermanently(false)
      }
    } catch (error) {
      console.error('Error applying correction:', error)
      alert('Error al aplicar la corrección. Por favor intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!currentMaintenance) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Plan sin Paquete Asignado</h2>
                <p className="text-sm text-gray-600">
                  Cliente {currentIndex + 1} de {unmappedMaintenances.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Client Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Cliente</p>
                <p className="font-semibold text-gray-900">{currentMaintenance.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ciclo de mantención</p>
                <p className="font-semibold text-gray-900">{cycleInfo.displayText}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600">Plan actual</p>
              <p className="font-mono text-red-600 font-semibold">{currentMaintenance.planCode}</p>
              <p className="text-xs text-gray-500 mt-1">{currentMaintenance.reason}</p>
            </div>
          </div>

          {/* Plan Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona el plan correcto *
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Seleccionar plan --</option>

              {/* Suggested plans first */}
              {suggestedPlans.length > 0 && (
                <optgroup label="✨ Sugerencias (más similar)">
                  {suggestedPlans.map(plan => (
                    <option key={`suggest-${plan}`} value={plan}>
                      {plan}
                    </option>
                  ))}
                </optgroup>
              )}

              {/* All other plans */}
              <optgroup label="Todos los planes">
                {allPlans
                  .filter(plan => !suggestedPlans.includes(plan))
                  .map(plan => (
                    <option key={plan} value={plan}>
                      {plan}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Package Info (Auto-filled) */}
          {packageInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-green-800">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-semibold">Paquete auto-seleccionado</p>
              </div>

              <div className="bg-white rounded-md p-3 border border-green-200">
                <p className="font-semibold text-gray-900 mb-2">
                  {packageInfo.packageCode} - {packageInfo.packageName}
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 font-medium">Filtros incluidos:</p>
                  {packageInfo.filters.map(filter => (
                    <div key={filter.sku} className="flex items-center gap-2 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{filter.sku} - {filter.name}</span>
                      {filter.quantity > 1 && (
                        <span className="text-gray-500">(×{filter.quantity})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Permanent Update Checkbox */}
          {selectedPlan && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updatePermanently}
                  onChange={(e) => setUpdatePermanently(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Actualizar contrato permanentemente</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Corregir "{currentMaintenance.planCode}" → "{selectedPlan}" en la base de datos.
                    Esto evitará esta advertencia en el futuro.
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            {/* Progress indicator */}
            <span className="text-sm text-gray-600">
              {currentIndex + 1} / {unmappedMaintenances.length}
            </span>

            <button
              onClick={handleApply}
              disabled={!selectedPlan || !packageInfo || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Aplicando...
                </>
              ) : isLastItem ? (
                'Aplicar y Finalizar'
              ) : (
                <>
                  Aplicar y Siguiente
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
