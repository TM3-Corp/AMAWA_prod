'use client'

import { useState, useEffect } from 'react'
import LockedSelect from '@/components/admin/LockedSelect'
import { CreateFilterModal } from '@/components/admin/CreateFilterModal'
import { CreatePackageModal } from '@/components/admin/CreatePackageModal'
import { CreateMappingModal } from '@/components/admin/CreateMappingModal'
import { EditFilterModal } from '@/components/admin/EditFilterModal'
import { EditPackageModal } from '@/components/admin/EditPackageModal'
import { RotateCw, ChevronDown, ChevronRight, Plus, Package, Filter as FilterIcon, Wrench, Edit, Trash2 } from 'lucide-react'

interface Filter {
  id: string
  sku: string
  name: string
  category: string
}

interface FilterPackageItem {
  id: string
  filterId: string
  quantity: number
  filter: Filter
}

interface FilterPackage {
  id: string
  code: string
  name: string
  description: string | null
  items: FilterPackageItem[]
}

interface EquipmentFilterMapping {
  id: string
  planCode: string
  maintenanceCycle: number
  packageId: string
  package: FilterPackage
}

interface MappingsData {
  mappings: EquipmentFilterMapping[]
  availablePackages: FilterPackage[]
}

// Grouped structure: Dispensador -> Filtración -> Plan -> Cycles
interface GroupedMapping {
  dispensador: string
  filtracion: string
  planCode: string
  cycles: {
    [key: number]: EquipmentFilterMapping
  }
}

export default function MappingsPage() {
  const [data, setData] = useState<MappingsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDispensadores, setExpandedDispensadores] = useState<Set<string>>(new Set())
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set())

  // Modal states
  const [showCreateFilter, setShowCreateFilter] = useState(false)
  const [showCreatePackage, setShowCreatePackage] = useState(false)
  const [showCreateMapping, setShowCreateMapping] = useState(false)
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null)
  const [editingPackage, setEditingPackage] = useState<FilterPackage | null>(null)
  const [deletingFilter, setDeletingFilter] = useState<Filter | null>(null)
  const [deletingPackage, setDeletingPackage] = useState<FilterPackage | null>(null)
  const [allFilters, setAllFilters] = useState<Filter[]>([])

  const fetchMappings = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/mappings')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al cargar mapeos')
      }

      setData(result.data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar los mapeos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMappings()
    fetchFilters()
  }, [])

  const fetchFilters = async () => {
    try {
      const response = await fetch('/api/admin/filters')
      const result = await response.json()
      if (result.success) {
        setAllFilters(result.data)
      }
    } catch (err) {
      console.error('Error fetching filters:', err)
    }
  }

  const handleDeleteFilter = async (filterId: string) => {
    try {
      const response = await fetch(`/api/admin/filters/${filterId}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (!result.success) {
        alert(result.error)
        return
      }

      setDeletingFilter(null)
      fetchFilters()
      fetchMappings()
    } catch (err) {
      console.error('Error deleting filter:', err)
      alert('Error al eliminar filtro')
    }
  }

  const handleDeletePackage = async (packageId: string) => {
    try {
      const response = await fetch(`/api/admin/filter-packages/${packageId}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (!result.success) {
        alert(result.error)
        return
      }

      setDeletingPackage(null)
      fetchMappings()
    } catch (err) {
      console.error('Error deleting package:', err)
      alert('Error al eliminar paquete')
    }
  }

  const toggleDispensador = (dispensador: string) => {
    const newExpanded = new Set(expandedDispensadores)
    if (newExpanded.has(dispensador)) {
      newExpanded.delete(dispensador)
    } else {
      newExpanded.add(dispensador)
    }
    setExpandedDispensadores(newExpanded)
  }

  const togglePlan = (planCode: string) => {
    const newExpanded = new Set(expandedPlans)
    if (newExpanded.has(planCode)) {
      newExpanded.delete(planCode)
    } else {
      newExpanded.add(planCode)
    }
    setExpandedPlans(newExpanded)
  }

  // Extract dispensador from plan code
  const getDispensadorFromPlan = (planCode: string): string => {
    // Extract numeric part (e.g., "3200" from "3200UFDE")
    const match = planCode.match(/^(\d+)/)
    return match ? `WHP-${match[1]}` : 'Desconocido'
  }

  // Extract filtración type from plan code
  const getFiltracionFromPlan = (planCode: string): string => {
    if (planCode.includes('UF')) return 'Ultrafiltración'
    if (planCode.includes('RODE') || planCode.includes('RO')) return 'Ósmosis Inversa'
    return 'Desconocido'
  }

  // Group mappings by hierarchy
  const groupMappings = (): Map<string, Map<string, GroupedMapping>> => {
    if (!data) return new Map()

    const grouped = new Map<string, Map<string, GroupedMapping>>()

    data.mappings.forEach(mapping => {
      const dispensador = getDispensadorFromPlan(mapping.planCode)
      const filtracion = getFiltracionFromPlan(mapping.planCode)

      if (!grouped.has(dispensador)) {
        grouped.set(dispensador, new Map())
      }

      const dispensadorGroup = grouped.get(dispensador)!
      const key = `${filtracion}-${mapping.planCode}`

      if (!dispensadorGroup.has(key)) {
        dispensadorGroup.set(key, {
          dispensador,
          filtracion,
          planCode: mapping.planCode,
          cycles: {}
        })
      }

      dispensadorGroup.get(key)!.cycles[mapping.maintenanceCycle] = mapping
    })

    return grouped
  }

  const getCycleBadge = (cycle: number) => {
    const colors: Record<number, string> = {
      6: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      12: 'bg-blue-100 text-blue-800 border-blue-200',
      18: 'bg-purple-100 text-purple-800 border-purple-200',
      24: 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return (
      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${colors[cycle]}`}>
        {cycle} meses
      </span>
    )
  }

  const getFiltracionBadge = (filtracion: string) => {
    return filtracion === 'Ultrafiltración' ? (
      <span className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white">
        Ultrafiltración (UF)
      </span>
    ) : (
      <span className="inline-flex px-3 py-1.5 text-sm font-semibold rounded-lg bg-purple-600 text-white">
        Ósmosis Inversa (RO)
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <RotateCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando mapeos...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || 'Error desconocido'}</p>
            <button
              onClick={fetchMappings}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const groupedData = groupMappings()
  const packageOptions = data.availablePackages.map(pkg => ({
    value: pkg.id,
    label: `${pkg.code} - ${pkg.name}`
  }))

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mapeo de Filtros por Equipo
              </h1>
              <p className="text-gray-600">
                Configuración de paquetes de filtros según dispensador, tipo de filtración y ciclo de mantención
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateFilter(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-lg hover:shadow-xl"
              >
                <FilterIcon className="w-5 h-5" />
                Nuevo Filtro
              </button>
              <button
                onClick={() => setShowCreatePackage(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition shadow-lg hover:shadow-xl"
              >
                <Package className="w-5 h-5" />
                Nuevo Paquete
              </button>
              <button
                onClick={() => setShowCreateMapping(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition shadow-lg hover:shadow-xl"
              >
                <Wrench className="w-5 h-5" />
                Nuevo Equipo
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">
              Dispensadores
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {groupedData.size}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">
              Configuraciones Totales
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {data.mappings.length}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">
              Paquetes Disponibles
            </div>
            <div className="text-3xl font-bold text-green-600">
              {data.availablePackages.length}
            </div>
          </div>
        </div>

        {/* Grouped Mappings */}
        <div className="space-y-6">
          {Array.from(groupedData.entries()).map(([dispensador, filtracionGroups]) => (
            <div key={dispensador} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Dispensador Header */}
              <button
                onClick={() => toggleDispensador(dispensador)}
                className="w-full px-6 py-5 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {expandedDispensadores.has(dispensador) ? (
                    <ChevronDown className="h-6 w-6 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-6 w-6 text-gray-500" />
                  )}
                  <div className="text-left">
                    <h2 className="text-2xl font-bold text-gray-900">{dispensador}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {filtracionGroups.size} configuración(es) de filtración
                    </p>
                  </div>
                </div>
              </button>

              {/* Filtración Groups */}
              {expandedDispensadores.has(dispensador) && (
                <div className="border-t border-gray-200">
                  {Array.from(filtracionGroups.values()).map((group, idx) => (
                    <div key={`${group.planCode}`} className={idx > 0 ? 'border-t border-gray-100' : ''}>
                      {/* Plan Header */}
                      <div className="px-6 py-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {getFiltracionBadge(group.filtracion)}
                            <div>
                              <div className="text-lg font-semibold text-gray-900">
                                Plan: {group.planCode}
                              </div>
                              <div className="text-sm text-gray-600 mt-0.5">
                                {Object.keys(group.cycles).length} ciclo(s) configurado(s)
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => togglePlan(group.planCode)}
                            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            {expandedPlans.has(group.planCode) ? 'Ocultar Ciclos' : 'Ver Ciclos'}
                          </button>
                        </div>
                      </div>

                      {/* Cycles */}
                      {expandedPlans.has(group.planCode) && (
                        <div className="px-6 py-6 bg-white">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {[6, 12, 18, 24].map(cycle => {
                              const mapping = group.cycles[cycle]
                              if (!mapping) return null

                              return (
                                <div key={cycle} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md transition-all">
                                  <div className="flex items-start justify-between mb-4">
                                    <div>
                                      <div className="mb-2">
                                        {getCycleBadge(cycle)}
                                      </div>
                                      <div className="text-sm font-medium text-gray-700">
                                        Ciclo de mantención
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mb-4">
                                    <LockedSelect
                                      label="Paquete Asignado"
                                      value={mapping.packageId}
                                      fieldName="packageId"
                                      recordId={mapping.id}
                                      apiEndpoint="/api/admin/mappings"
                                      options={packageOptions}
                                      onUpdate={fetchMappings}
                                      displayFormatter={(value) => {
                                        const pkg = data.availablePackages.find(p => p.id === value)
                                        return pkg ? `${pkg.code} - ${pkg.name}` : '—'
                                      }}
                                    />
                                  </div>

                                  {/* Package Details */}
                                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                    <h5 className="text-xs font-semibold text-blue-900 mb-2 uppercase tracking-wide">
                                      Filtros Incluidos
                                    </h5>
                                    <div className="space-y-2">
                                      {mapping.package.items.map((item) => (
                                        <div
                                          key={item.id}
                                          className="flex items-center justify-between text-sm bg-white rounded px-3 py-2 border border-blue-100"
                                        >
                                          <div className="text-gray-900">
                                            <span className="font-medium">{item.filter.sku}</span>
                                            {' - '}
                                            <span className="text-gray-600">{item.filter.name}</span>
                                          </div>
                                          <span className="font-bold text-blue-700">
                                            x{item.quantity}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Filters Reference */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            🔵 Referencia de Filtros Disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {allFilters.map((filter) => (
              <div
                key={filter.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-lg transition-all relative"
              >
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => setEditingFilter(filter)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingFilter(filter)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="font-bold text-gray-900 mb-1 text-lg pr-16">
                  {filter.sku}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {filter.name}
                </div>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                  filter.category === 'UF' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {filter.category}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Available Packages Reference */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            📦 Referencia de Paquetes Disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.availablePackages.map((pkg) => (
              <div
                key={pkg.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-green-400 hover:shadow-lg transition-all relative"
              >
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => setEditingPackage(pkg)}
                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingPackage(pkg)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="font-bold text-gray-900 mb-1 text-lg pr-16">
                  {pkg.code}
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  {pkg.name}
                </div>
                {pkg.description && (
                  <div className="text-xs text-gray-500 mb-3 italic">
                    {pkg.description}
                  </div>
                )}
                <div className="border-t border-gray-200 pt-3">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    CONTIENE:
                  </div>
                  <ul className="space-y-1">
                    {pkg.items.map((item) => (
                      <li key={item.id} className="text-xs text-gray-600 flex items-center justify-between">
                        <span>• {item.filter.sku}</span>
                        <span className="font-semibold text-gray-800">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Creation Modals */}
        {showCreateFilter && (
          <CreateFilterModal
            onClose={() => setShowCreateFilter(false)}
            onSuccess={() => {
              fetchMappings()
              setShowCreateFilter(false)
            }}
          />
        )}

        {showCreatePackage && (
          <CreatePackageModal
            onClose={() => setShowCreatePackage(false)}
            onSuccess={() => {
              fetchMappings()
              setShowCreatePackage(false)
            }}
          />
        )}

        {showCreateMapping && (
          <CreateMappingModal
            onClose={() => setShowCreateMapping(false)}
            onSuccess={() => {
              fetchMappings()
              setShowCreateMapping(false)
            }}
          />
        )}

        {/* Edit Modals */}
        {editingFilter && (
          <EditFilterModal
            filter={editingFilter}
            onClose={() => setEditingFilter(null)}
            onSuccess={() => {
              fetchFilters()
              fetchMappings()
              setEditingFilter(null)
            }}
          />
        )}

        {editingPackage && (
          <EditPackageModal
            package={editingPackage}
            onClose={() => setEditingPackage(null)}
            onSuccess={() => {
              fetchMappings()
              setEditingPackage(null)
            }}
          />
        )}

        {/* Delete Confirmation Modals */}
        {deletingFilter && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Eliminar Filtro</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">SKU:</span> {deletingFilter.sku}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-semibold">Nombre:</span> {deletingFilter.name}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingFilter(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteFilter(deletingFilter.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {deletingPackage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Eliminar Paquete</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Código:</span> {deletingPackage.code}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <span className="font-semibold">Nombre:</span> {deletingPackage.name}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Contiene {deletingPackage.items.length} filtro(s)
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingPackage(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeletePackage(deletingPackage.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
