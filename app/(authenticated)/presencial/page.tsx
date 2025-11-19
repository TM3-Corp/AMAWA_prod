'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, MapPin, Calendar, CheckCircle, Loader2, Users, AlertCircle } from 'lucide-react'

interface Maintenance {
  id: string
  scheduledDate: string
  type: string
  status: string
  client: {
    id: string
    name: string
    comuna: string
    address: string
    phone: string
  }
  technicianId: string | null
}

interface Technician {
  id: string
  name: string
  email: string | null
  isLegacy: boolean
}

interface TechnicianSuggestion {
  id: string
  name: string
  email: string
  score: number
  reason: string
  stats: {
    comunaMaintenances: number
    recentComunaMaintenances: number
    pendingMaintenances: number
  }
}

interface ComunaGroup {
  comuna: string
  maintenances: Maintenance[]
  suggestedTechnician: TechnicianSuggestion | null
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function PresencialAssignmentPage() {
  const searchParams = useSearchParams()
  const filterMonth = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null
  const filterYear = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null

  const [comunaGroups, setComunaGroups] = useState<ComunaGroup[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMaintenances, setSelectedMaintenances] = useState<Set<string>>(new Set())
  const [assigningComuna, setAssigningComuna] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [filterMonth, filterYear])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch presencial maintenances (case-sensitive: "Presencial" not "PRESENCIAL")
      // Include both PENDING and RESCHEDULED maintenances that need assignment
      const maintenancesRes = await fetch('/api/maintenances?deliveryType=Presencial')
      const maintenancesData = await maintenancesRes.json()
      const allMaintenances: Maintenance[] = maintenancesData.maintenances || []

      // Filter for unassigned maintenances (PENDING or RESCHEDULED without technician)
      let maintenances = allMaintenances.filter(m =>
        (m.status === 'PENDING' || m.status === 'RESCHEDULED') && !m.technicianId
      )

      // If month/year filters are present, filter by scheduled date
      if (filterMonth && filterYear) {
        maintenances = maintenances.filter(m => {
          const scheduledDate = new Date(m.scheduledDate)
          return scheduledDate.getMonth() + 1 === filterMonth && scheduledDate.getFullYear() === filterYear
        })
      }

      // Group by comuna
      const grouped: Record<string, Maintenance[]> = {}
      maintenances.forEach(m => {
        const comuna = m.client.comuna || 'Sin Comuna'
        if (!grouped[comuna]) grouped[comuna] = []
        grouped[comuna].push(m)
      })

      // Fetch technicians
      const techniciansRes = await fetch('/api/technicians')
      const techniciansData = await techniciansRes.json()
      setTechnicians(techniciansData.data || [])

      // For each comuna, get suggested technician
      const groupsWithSuggestions = await Promise.all(
        Object.entries(grouped).map(async ([comuna, maint]) => {
          let suggested = null
          try {
            const suggestRes = await fetch(`/api/technicians/suggest?comuna=${encodeURIComponent(comuna)}`)
            if (suggestRes.ok) {
              const suggestData = await suggestRes.json()
              suggested = suggestData.suggested
            }
          } catch (err) {
            console.error(`Error fetching suggestion for ${comuna}:`, err)
          }

          return {
            comuna,
            maintenances: maint,
            suggestedTechnician: suggested
          }
        })
      )

      // Sort by number of maintenances descending
      groupsWithSuggestions.sort((a, b) => b.maintenances.length - a.maintenances.length)

      setComunaGroups(groupsWithSuggestions)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  function toggleMaintenanceSelection(id: string) {
    const newSelected = new Set(selectedMaintenances)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedMaintenances(newSelected)
  }

  function toggleComunaSelection(comuna: string) {
    const comunaMaintenances = comunaGroups.find(g => g.comuna === comuna)?.maintenances || []
    const allSelected = comunaMaintenances.every(m => selectedMaintenances.has(m.id))

    const newSelected = new Set(selectedMaintenances)
    if (allSelected) {
      // Deselect all
      comunaMaintenances.forEach(m => newSelected.delete(m.id))
    } else {
      // Select all
      comunaMaintenances.forEach(m => newSelected.add(m.id))
    }
    setSelectedMaintenances(newSelected)
  }

  async function assignToComuna(comuna: string, technicianId: string) {
    const comunaMaintenances = comunaGroups.find(g => g.comuna === comuna)?.maintenances || []
    const maintenanceIds = comunaMaintenances.map(m => m.id)

    setAssigningComuna(comuna)

    try {
      const response = await fetch('/api/maintenances/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceIds, technicianId })
      })

      if (!response.ok) {
        throw new Error('Error al asignar')
      }

      const result = await response.json()
      alert(result.message)
      await fetchData() // Refresh data
    } catch (error) {
      alert('Error al asignar mantenciones')
    } finally {
      setAssigningComuna(null)
    }
  }

  async function assignSelected(technicianId: string) {
    if (selectedMaintenances.size === 0) {
      alert('Selecciona al menos una mantención')
      return
    }

    try {
      const response = await fetch('/api/maintenances/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenanceIds: Array.from(selectedMaintenances), technicianId })
      })

      if (!response.ok) {
        throw new Error('Error al asignar')
      }

      const result = await response.json()
      alert(result.message)
      setSelectedMaintenances(new Set())
      await fetchData() // Refresh data
    } catch (error) {
      alert('Error al asignar mantenciones seleccionadas')
    }
  }

  const totalMaintenances = comunaGroups.reduce((sum, g) => sum + g.maintenances.length, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando mantenciones presenciales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/calendar" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">👨‍🔧 Mantenciones Presenciales</h1>
              </div>
              <p className="text-gray-600">
                Asignación de técnicos por comuna
                {filterMonth && filterYear && (
                  <span className="ml-2 text-purple-600 font-semibold">
                    - {MONTHS[filterMonth - 1]} {filterYear}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {filterMonth && filterYear && (
                <Link
                  href="/presencial"
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Ver todas las mantenciones
                </Link>
              )}
              <div className="text-right">
                <div className="text-3xl font-bold text-purple-600">{totalMaintenances}</div>
                <div className="text-sm text-gray-600">Mantenciones pendientes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection Actions Bar */}
      {selectedMaintenances.size > 0 && (
        <div className="bg-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">{selectedMaintenances.size} mantención(es) seleccionada(s)</span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  onChange={(e) => e.target.value && assignSelected(e.target.value)}
                  className="px-4 py-2 bg-white text-gray-900 rounded-lg border-0 focus:ring-2 focus:ring-purple-300"
                >
                  <option value="">Asignar a técnico...</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name || tech.email}
                      {tech.isLegacy && ' (Legacy)'}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSelectedMaintenances(new Set())}
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg"
                >
                  Limpiar selección
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comuna Groups */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {comunaGroups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay mantenciones presenciales pendientes</h3>
            <p className="text-gray-600">Todas las mantenciones presenciales han sido asignadas</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comunaGroups.map(group => {
              const allSelected = group.maintenances.every(m => selectedMaintenances.has(m.id))
              const someSelected = group.maintenances.some(m => selectedMaintenances.has(m.id))

              return (
                <div key={group.comuna} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Comuna Header */}
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-6 h-6" />
                        <div>
                          <h2 className="text-2xl font-bold">{group.comuna}</h2>
                          <p className="text-purple-100">{group.maintenances.length} mantención(es)</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                            onChange={() => toggleComunaSelection(group.comuna)}
                            className="w-5 h-5 rounded border-white text-purple-600 focus:ring-2 focus:ring-white"
                          />
                          <span className="text-sm font-medium">Seleccionar todas</span>
                        </label>
                      </div>
                    </div>

                    {/* Suggested Technician */}
                    {group.suggestedTechnician && (
                      <div className="mt-4 bg-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium mb-1">✨ Técnico Sugerido</p>
                            <p className="text-lg font-bold">{group.suggestedTechnician.name}</p>
                            <p className="text-sm text-purple-100">{group.suggestedTechnician.reason}</p>
                          </div>
                          <button
                            onClick={() => assignToComuna(group.comuna, group.suggestedTechnician!.id)}
                            disabled={assigningComuna === group.comuna}
                            className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 font-medium"
                          >
                            {assigningComuna === group.comuna ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                Asignando...
                              </>
                            ) : (
                              'Asignar todas a este técnico'
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Maintenances List */}
                  <div className="divide-y divide-gray-200">
                    {group.maintenances.map(maintenance => (
                      <div
                        key={maintenance.id}
                        className={`p-4 hover:bg-gray-50 transition-colors ${
                          selectedMaintenances.has(maintenance.id) ? 'bg-purple-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={selectedMaintenances.has(maintenance.id)}
                            onChange={() => toggleMaintenanceSelection(maintenance.id)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-semibold text-gray-900">{maintenance.client.name}</span>
                              </div>
                              <p className="text-sm text-gray-600">{maintenance.client.address}</p>
                              <p className="text-sm text-gray-500">{maintenance.client.phone}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-700">
                                  {new Date(maintenance.scheduledDate).toLocaleDateString('es-CL')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {maintenance.type === '6_months' && '6 Meses'}
                                {maintenance.type === '12_months' && '12 Meses'}
                                {maintenance.type === '18_months' && '18 Meses'}
                                {maintenance.type === '24_months' && '24 Meses'}
                              </p>
                            </div>
                            <div>
                              <Link
                                href={`/maintenances/${maintenance.id}`}
                                className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                              >
                                Ver detalles →
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
