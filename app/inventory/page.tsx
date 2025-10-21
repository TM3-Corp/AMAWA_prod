'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import {
  Package,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Box,
  MapPin,
  RefreshCw,
  Filter as FilterIcon
} from 'lucide-react'

type TabType = 'equipment' | 'filters'

interface EquipmentInventory {
  id: string
  equipmentModel: string
  quantity: number
  minStock: number
  location: string
  lastRestocked: string | null
  status: 'LOW' | 'WARNING' | 'OK'
}

interface FilterInventory {
  id: string
  filterId: string
  quantity: number
  minStock: number
  location: string
  lastRestocked: string | null
  filter: {
    id: string
    sku: string
    name: string
    category: string
  }
  status: 'LOW' | 'WARNING' | 'OK'
}

interface EquipmentTreeNode {
  type: string
  models: {
    [model: string]: EquipmentInventory[]
  }
}

interface FilterTreeNode {
  category: string
  filters: {
    [sku: string]: {
      name: string
      locations: FilterInventory[]
    }
  }
}

export default function UnifiedInventoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('equipment')
  const [equipmentData, setEquipmentData] = useState<EquipmentInventory[]>([])
  const [filterData, setFilterData] = useState<FilterInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Track expanded nodes in the tree
  const [expandedEquipmentTypes, setExpandedEquipmentTypes] = useState<Set<string>>(new Set())
  const [expandedEquipmentModels, setExpandedEquipmentModels] = useState<Set<string>>(new Set())
  const [expandedFilterCategories, setExpandedFilterCategories] = useState<Set<string>>(new Set())
  const [expandedFilterTypes, setExpandedFilterTypes] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const fetchInventoryData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [equipmentRes, filterRes] = await Promise.all([
        fetch('/api/admin/equipment-inventory'),
        fetch('/api/admin/filter-inventory')
      ])

      if (!equipmentRes.ok || !filterRes.ok) {
        throw new Error('Error al cargar inventario')
      }

      const [equipmentResult, filterResult] = await Promise.all([
        equipmentRes.json(),
        filterRes.json()
      ])

      if (equipmentResult.success && equipmentResult.data) {
        // Calculate status for equipment
        const equipmentWithStatus = equipmentResult.data.map((item: any) => ({
          ...item,
          status: item.quantity < item.minStock ? 'LOW' :
                 item.quantity < item.minStock * 2 ? 'WARNING' : 'OK'
        }))
        setEquipmentData(equipmentWithStatus)
      }

      if (filterResult.success && filterResult.data) {
        setFilterData(filterResult.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Build equipment tree: Type → Model → Locations
  const buildEquipmentTree = (): EquipmentTreeNode[] => {
    const tree: { [type: string]: EquipmentTreeNode } = {}

    equipmentData.forEach(item => {
      // Extract equipment type from model (everything before the variant details)
      // E.g., "WHP-3200 Blanco (Ultrafiltración)" → "WHP-3200"
      const typeMatch = item.equipmentModel.match(/^([A-Z]+-\d+|Llave|Dispensador)/i)
      const type = typeMatch ? typeMatch[1] : 'Otros'

      if (!tree[type]) {
        tree[type] = {
          type,
          models: {}
        }
      }

      if (!tree[type].models[item.equipmentModel]) {
        tree[type].models[item.equipmentModel] = []
      }

      tree[type].models[item.equipmentModel].push(item)
    })

    return Object.values(tree)
  }

  // Build filter tree: Category → Filter Type → Locations
  const buildFilterTree = (): FilterTreeNode[] => {
    const tree: { [category: string]: FilterTreeNode } = {}

    filterData.forEach(item => {
      const category = item.filter.category === 'UF' ? 'Ultrafiltración' : 'Ósmosis Inversa'

      if (!tree[category]) {
        tree[category] = {
          category,
          filters: {}
        }
      }

      if (!tree[category].filters[item.filter.sku]) {
        tree[category].filters[item.filter.sku] = {
          name: item.filter.name,
          locations: []
        }
      }

      tree[category].filters[item.filter.sku].locations.push(item)
    })

    return Object.values(tree)
  }

  const toggleEquipmentType = (type: string) => {
    const newExpanded = new Set(expandedEquipmentTypes)
    if (newExpanded.has(type)) {
      newExpanded.delete(type)
    } else {
      newExpanded.add(type)
    }
    setExpandedEquipmentTypes(newExpanded)
  }

  const toggleEquipmentModel = (model: string) => {
    const newExpanded = new Set(expandedEquipmentModels)
    if (newExpanded.has(model)) {
      newExpanded.delete(model)
    } else {
      newExpanded.add(model)
    }
    setExpandedEquipmentModels(newExpanded)
  }

  const toggleFilterCategory = (category: string) => {
    const newExpanded = new Set(expandedFilterCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedFilterCategories(newExpanded)
  }

  const toggleFilterType = (sku: string) => {
    const newExpanded = new Set(expandedFilterTypes)
    if (newExpanded.has(sku)) {
      newExpanded.delete(sku)
    } else {
      newExpanded.add(sku)
    }
    setExpandedFilterTypes(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3" />
            Bajo
          </span>
        )
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3" />
            Advertencia
          </span>
        )
      case 'OK':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            OK
          </span>
        )
      default:
        return null
    }
  }

  const equipmentTree = buildEquipmentTree()
  const filterTree = buildFilterTree()

  const equipmentStats = {
    total: equipmentData.length,
    totalQuantity: equipmentData.reduce((sum, item) => sum + item.quantity, 0),
    lowStock: equipmentData.filter(item => item.status === 'LOW').length,
    warningStock: equipmentData.filter(item => item.status === 'WARNING').length
  }

  const filterStats = {
    total: filterData.length,
    totalQuantity: filterData.reduce((sum, item) => sum + item.quantity, 0),
    lowStock: filterData.filter(item => item.status === 'LOW').length,
    warningStock: filterData.filter(item => item.status === 'WARNING').length
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Cargando inventario...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar inventario</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchInventoryData}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Inventario
            </h1>
            <p className="text-gray-600">
              Vista jerárquica de equipos y filtros en stock
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('equipment')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'equipment'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5" />
                  <span>Equipos</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'equipment' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {equipmentStats.total}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('filters')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'filters'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FilterIcon className="w-5 h-5" />
                  <span>Filtros</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === 'filters' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {filterStats.total}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {activeTab === 'equipment' ? (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-1">Ubicaciones</div>
                  <div className="text-3xl font-bold text-blue-600">{equipmentStats.total}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-1">Unidades Totales</div>
                  <div className="text-3xl font-bold text-gray-900">{equipmentStats.totalQuantity}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-1">Stock Bajo</div>
                  <div className="text-3xl font-bold text-red-600">{equipmentStats.lowStock}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-1">Advertencia</div>
                  <div className="text-3xl font-bold text-yellow-600">{equipmentStats.warningStock}</div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-1">Ubicaciones</div>
                  <div className="text-3xl font-bold text-purple-600">{filterStats.total}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-1">Unidades Totales</div>
                  <div className="text-3xl font-bold text-gray-900">{filterStats.totalQuantity}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-1">Stock Bajo</div>
                  <div className="text-3xl font-bold text-red-600">{filterStats.lowStock}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-sm text-gray-600 mb-1">Advertencia</div>
                  <div className="text-3xl font-bold text-yellow-600">{filterStats.warningStock}</div>
                </div>
              </>
            )}
          </div>

          {/* Tree View */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {activeTab === 'equipment' ? (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Inventario de Equipos (Vista Jerárquica)
                </h2>
                {equipmentTree.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No hay equipos en inventario
                  </div>
                ) : (
                  <div className="space-y-2">
                    {equipmentTree.map((typeNode) => (
                      <div key={typeNode.type} className="border border-gray-200 rounded-lg">
                        {/* Level 1: Equipment Type */}
                        <button
                          onClick={() => toggleEquipmentType(typeNode.type)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {expandedEquipmentTypes.has(typeNode.type) ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                            <Box className="w-5 h-5 text-blue-600" />
                            <span className="font-semibold text-gray-900">{typeNode.type}</span>
                            <span className="text-sm text-gray-500">
                              ({Object.keys(typeNode.models).length} modelos)
                            </span>
                          </div>
                        </button>

                        {/* Level 2: Models */}
                        {expandedEquipmentTypes.has(typeNode.type) && (
                          <div className="border-t border-gray-200 bg-gray-50">
                            {Object.entries(typeNode.models).map(([model, locations]) => (
                              <div key={model} className="border-b border-gray-200 last:border-b-0">
                                <button
                                  onClick={() => toggleEquipmentModel(model)}
                                  className="w-full px-4 py-3 pl-12 flex items-center justify-between hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {expandedEquipmentModels.has(model) ? (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-500" />
                                    )}
                                    <Package className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-900">{model}</span>
                                    <span className="text-xs text-gray-500">
                                      ({locations.length} ubicaciones)
                                    </span>
                                  </div>
                                  <div className="text-sm font-semibold text-gray-700">
                                    Total: {locations.reduce((sum, loc) => sum + loc.quantity, 0)} unidades
                                  </div>
                                </button>

                                {/* Level 3: Locations */}
                                {expandedEquipmentModels.has(model) && (
                                  <div className="bg-white">
                                    {locations.map((location) => (
                                      <div
                                        key={location.id}
                                        className="px-4 py-3 pl-20 flex items-center justify-between border-t border-gray-100"
                                      >
                                        <div className="flex items-center gap-3">
                                          <MapPin className="w-4 h-4 text-green-600" />
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{location.location}</div>
                                            {location.lastRestocked && (
                                              <div className="text-xs text-gray-500">
                                                Última reposición: {new Date(location.lastRestocked).toLocaleDateString('es-CL')}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div className="text-right">
                                            <div className="text-sm font-semibold text-gray-900">{location.quantity} unidades</div>
                                            <div className="text-xs text-gray-500">Mín: {location.minStock}</div>
                                          </div>
                                          {getStatusBadge(location.status)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Inventario de Filtros (Vista Jerárquica)
                </h2>
                {filterTree.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No hay filtros en inventario
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filterTree.map((categoryNode) => (
                      <div key={categoryNode.category} className="border border-gray-200 rounded-lg">
                        {/* Level 1: Category */}
                        <button
                          onClick={() => toggleFilterCategory(categoryNode.category)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {expandedFilterCategories.has(categoryNode.category) ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                            <FilterIcon className="w-5 h-5 text-purple-600" />
                            <span className="font-semibold text-gray-900">{categoryNode.category}</span>
                            <span className="text-sm text-gray-500">
                              ({Object.keys(categoryNode.filters).length} tipos)
                            </span>
                          </div>
                        </button>

                        {/* Level 2: Filter Types */}
                        {expandedFilterCategories.has(categoryNode.category) && (
                          <div className="border-t border-gray-200 bg-gray-50">
                            {Object.entries(categoryNode.filters).map(([sku, filterData]) => (
                              <div key={sku} className="border-b border-gray-200 last:border-b-0">
                                <button
                                  onClick={() => toggleFilterType(sku)}
                                  className="w-full px-4 py-3 pl-12 flex items-center justify-between hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    {expandedFilterTypes.has(sku) ? (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-500" />
                                    )}
                                    <Package className="w-4 h-4 text-gray-600" />
                                    <div className="text-left">
                                      <div className="text-sm font-medium text-gray-900">{sku}</div>
                                      <div className="text-xs text-gray-500">{filterData.name}</div>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      ({filterData.locations.length} ubicaciones)
                                    </span>
                                  </div>
                                  <div className="text-sm font-semibold text-gray-700">
                                    Total: {filterData.locations.reduce((sum, loc) => sum + loc.quantity, 0)} unidades
                                  </div>
                                </button>

                                {/* Level 3: Locations */}
                                {expandedFilterTypes.has(sku) && (
                                  <div className="bg-white">
                                    {filterData.locations.map((location) => (
                                      <div
                                        key={location.id}
                                        className="px-4 py-3 pl-20 flex items-center justify-between border-t border-gray-100"
                                      >
                                        <div className="flex items-center gap-3">
                                          <MapPin className="w-4 h-4 text-green-600" />
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{location.location}</div>
                                            {location.lastRestocked && (
                                              <div className="text-xs text-gray-500">
                                                Última reposición: {new Date(location.lastRestocked).toLocaleDateString('es-CL')}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div className="text-right">
                                            <div className="text-sm font-semibold text-gray-900">{location.quantity} unidades</div>
                                            <div className="text-xs text-gray-500">Mín: {location.minStock}</div>
                                          </div>
                                          {getStatusBadge(location.status)}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
