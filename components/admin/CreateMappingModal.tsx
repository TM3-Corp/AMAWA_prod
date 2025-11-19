'use client'

import { useState, useEffect } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'

interface FilterPackage {
  id: string
  code: string
  name: string
}

interface CycleMapping {
  maintenanceCycle: number
  packageId: string
}

interface CreateMappingModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreateMappingModal({ onClose, onSuccess }: CreateMappingModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availablePackages, setAvailablePackages] = useState<FilterPackage[]>([])

  const [planCode, setPlanCode] = useState('')
  const [cycles, setCycles] = useState<CycleMapping[]>([
    { maintenanceCycle: 6, packageId: '' },
    { maintenanceCycle: 12, packageId: '' },
    { maintenanceCycle: 18, packageId: '' },
    { maintenanceCycle: 24, packageId: '' }
  ])

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/admin/filter-packages')
      const result = await response.json()
      if (result.success) {
        setAvailablePackages(result.data)
      }
    } catch (err) {
      console.error('Error fetching packages:', err)
    } finally {
      setLoadingPackages(false)
    }
  }

  const handleCycleChange = (maintenanceCycle: number, packageId: string) => {
    setCycles(cycles.map(cycle =>
      cycle.maintenanceCycle === maintenanceCycle
        ? { ...cycle, packageId }
        : cycle
    ))
  }

  const getCycleBadge = (cycle: number) => {
    const colors: Record<number, string> = {
      6: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      12: 'bg-blue-100 text-blue-800 border-blue-300',
      18: 'bg-purple-100 text-purple-800 border-purple-300',
      24: 'bg-orange-100 text-orange-800 border-orange-300'
    }
    return colors[cycle] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const validCycles = cycles.filter(cycle => cycle.packageId)
    if (validCycles.length === 0) {
      setError('Debe asignar al menos un paquete a un ciclo')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planCode: planCode.toUpperCase(),
          cycles: validCycles
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al crear mapeo')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between sticky top-0">
          <div>
            <h2 className="text-xl font-bold">Crear Nuevo Equipo</h2>
            <p className="text-sm text-purple-100 mt-1">Define el plan y asigna paquetes a cada ciclo</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Plan Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value.toUpperCase())}
              placeholder="3200UFDE"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ejemplo: 3200UFDE (WHP-3200 UF Delivery), 4200RODE (WHP-4200 RO Delivery)
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Asignación de Paquetes por Ciclo</h3>
            <p className="text-sm text-gray-600">
              Selecciona qué paquete de filtros se usará en cada ciclo de mantención
            </p>

            {loadingPackages ? (
              <p className="text-sm text-gray-600">Cargando paquetes...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cycles.map((cycle) => (
                  <div
                    key={cycle.maintenanceCycle}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-purple-300 transition"
                  >
                    <div className="mb-3">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border-2 ${getCycleBadge(cycle.maintenanceCycle)}`}>
                        {cycle.maintenanceCycle} meses
                      </span>
                    </div>

                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Paquete Asignado
                    </label>
                    <select
                      value={cycle.packageId}
                      onChange={(e) => handleCycleChange(cycle.maintenanceCycle, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    >
                      <option value="">Sin asignar</option>
                      {availablePackages.map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.code} - {pkg.name}
                        </option>
                      ))}
                    </select>

                    {cycle.packageId && (
                      <div className="mt-2 text-xs text-gray-500">
                        ✓ Paquete asignado
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingPackages}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>Creando...</>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Crear Equipo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
