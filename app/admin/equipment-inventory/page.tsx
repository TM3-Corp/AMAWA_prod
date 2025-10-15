'use client'

import { useState, useEffect } from 'react'
import LockedField from '@/components/admin/LockedField'
import {
  AlertTriangle,
  CheckCircle,
  RotateCw,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface EquipmentInventory {
  id: string
  equipmentModel: string
  quantity: number
  minStock: number
  location: string
  unitCost: number | null
  lastRestocked: string | null
  notes: string | null
  inUseCount: number
  status: 'LOW' | 'WARNING' | 'OK'
  createdAt: string
  updatedAt: string
}

export default function EquipmentInventoryPage() {
  const [inventory, setInventory] = useState<EquipmentInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedDispensadores, setExpandedDispensadores] = useState<Set<string>>(new Set())
  const [expandedFiltracion, setExpandedFiltracion] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<string | null>(null)

  const fetchInventory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/equipment-inventory')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar inventario')
      }

      // Filter out "Suma Total" or similar aggregate rows
      const filtered = data.data.filter((item: EquipmentInventory) =>
        !item.equipmentModel.toLowerCase().includes('suma') &&
        !item.equipmentModel.toLowerCase().includes('total')
      )

      setInventory(filtered)
    } catch (err: any) {
      setError(err.message || 'Error al cargar el inventario de equipos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const toggleDispensador = (dispensador: string) => {
    const newExpanded = new Set(expandedDispensadores)
    if (newExpanded.has(dispensador)) {
      newExpanded.delete(dispensador)
    } else {
      newExpanded.add(dispensador)
    }
    setExpandedDispensadores(newExpanded)
  }

  const toggleFiltracion = (key: string) => {
    const newExpanded = new Set(expandedFiltracion)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedFiltracion(newExpanded)
  }

  // Parse equipment model: extract base model (e.g., "WHP-3200", "Llave")
  const getBaseModel = (model: string): string => {
    const match = model.match(/^(WHP-\d+S?|Llave|WHP-\d+\w*)/i)
    return match ? match[1].toUpperCase() : model
  }

  // Group equipment by base model (dispensador)
  const groupByDispensador = () => {
    const grouped = new Map<string, EquipmentInventory[]>()

    inventory.forEach(item => {
      const baseModel = getBaseModel(item.equipmentModel)
      if (!grouped.has(baseModel)) {
        grouped.set(baseModel, [])
      }
      grouped.get(baseModel)!.push(item)
    })

    return grouped
  }

  // Group items by filtration type
  const groupByFiltracion = (items: EquipmentInventory[]) => {
    const grouped = new Map<string, EquipmentInventory[]>()

    items.forEach(item => {
      const match = item.equipmentModel.match(/\((.*?)\)/)
      const filtracion = match ? match[1] : 'Sin especificar'

      if (!grouped.has(filtracion)) {
        grouped.set(filtracion, [])
      }
      grouped.get(filtracion)!.push(item)
    })

    return grouped
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="h-4 w-4" />
            Bajo
          </span>
        )
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            Advertencia
          </span>
        )
      case 'OK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4" />
            OK
          </span>
        )
      default:
        return null
    }
  }

  const getFiltracionBadge = (filtracion: string) => {
    const isUF = filtracion.toLowerCase().includes('ultrafiltración') || filtracion.toLowerCase().includes('ultrafiltracion')
    return isUF ? (
      <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-lg bg-blue-600 text-white">
        {filtracion}
      </span>
    ) : (
      <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-lg bg-purple-600 text-white">
        {filtracion}
      </span>
    )
  }

  const renderEquipmentItem = (item: EquipmentInventory) => {
    // Calculate percentage for progress bar
    const stockPercentage = Math.min((item.quantity / (item.minStock * 2)) * 100, 100)
    const barColor = item.status === 'LOW' ? '#ef4444' : item.status === 'WARNING' ? '#f59e0b' : '#10b981'

    return (
      <div key={item.id} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="font-medium text-gray-900 mb-1">
              {item.equipmentModel}
            </div>
            <div className="text-sm text-gray-500">
              {item.location}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Stock:</span>{' '}
                <span className="text-gray-900">{item.quantity} unidades</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Mín:</span>{' '}
                <span className="text-gray-900">{item.minStock}</span>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="mt-3 w-full max-w-md">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Nivel de stock</span>
                <span>{Math.round((item.quantity / item.minStock) * 100)}% del mínimo</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${stockPercentage}%`,
                    backgroundColor: barColor
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span className="text-gray-400">Mínimo: {item.minStock}</span>
                <span>Óptimo: {item.minStock * 2}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge(item.status)}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setEditingItem(editingItem === item.id ? null : item.id)
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {editingItem === item.id ? 'Cerrar' : 'Editar'}
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {editingItem === item.id && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <LockedField
                label="Cantidad en Stock"
                value={item.quantity}
                fieldName="quantity"
                recordId={item.id}
                apiEndpoint="/api/admin/equipment-inventory"
                type="number"
                onUpdate={fetchInventory}
              />

              <LockedField
                label="Stock Mínimo"
                value={item.minStock}
                fieldName="minStock"
                recordId={item.id}
                apiEndpoint="/api/admin/equipment-inventory"
                type="number"
                onUpdate={fetchInventory}
              />

              <LockedField
                label="Costo Unitario (CLP)"
                value={item.unitCost}
                fieldName="unitCost"
                recordId={item.id}
                apiEndpoint="/api/admin/equipment-inventory"
                type="number"
                onUpdate={fetchInventory}
                placeholder="Ej: 250000"
              />

              <LockedField
                label="Última Reposición"
                value={item.lastRestocked}
                fieldName="lastRestocked"
                recordId={item.id}
                apiEndpoint="/api/admin/equipment-inventory"
                type="date"
                onUpdate={fetchInventory}
              />

              <div className="md:col-span-2">
                <LockedField
                  label="Notas"
                  value={item.notes}
                  fieldName="notes"
                  recordId={item.id}
                  apiEndpoint="/api/admin/equipment-inventory"
                  type="textarea"
                  onUpdate={fetchInventory}
                  placeholder="Notas adicionales sobre este modelo..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <RotateCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando inventario...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchInventory}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const groupedData = groupByDispensador()
  const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0)
  // Get unique "en uso" count at base model level
  const baseModelUsage = new Map<string, number>()
  inventory.forEach(item => {
    const baseModel = getBaseModel(item.equipmentModel)
    if (!baseModelUsage.has(baseModel)) {
      baseModelUsage.set(baseModel, item.inUseCount)
    }
  })
  const totalInUse = Array.from(baseModelUsage.values()).reduce((sum, count) => sum + count, 0)
  const lowStockCount = inventory.filter(item => item.status === 'LOW').length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Inventario de Equipos
          </h1>
          <p className="text-gray-600">
            Gestión de stock físico de equipos de purificación
          </p>
        </div>

        {/* Stats Bar */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{inventory.length}</p>
                <p className="text-xs text-gray-600">Variantes Totales</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{totalStock}</p>
                <p className="text-xs text-gray-600">Unidades en Stock</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{totalInUse}</p>
                <p className="text-xs text-gray-600">Equipos en Uso</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
                <p className="text-xs text-gray-600">Stock Bajo</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {inventory.filter(item => item.status === 'WARNING').length}
                </p>
                <p className="text-xs text-gray-600">Alerta</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grouped Equipment */}
        <div className="space-y-6">
          {Array.from(groupedData.entries()).map(([dispensador, items]) => {
            const totalStockInModel = items.reduce((sum, item) => sum + item.quantity, 0)
            // All variants of the same base model share the same "in use" count
            const inUseCount = items[0]?.inUseCount || 0
            const filtracionGroups = groupByFiltracion(items)
            const hasMultipleFiltraciones = filtracionGroups.size > 1

            return (
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
                        {totalStockInModel} en stock • {inUseCount} en uso • {items.length} variante(s)
                      </p>
                    </div>
                  </div>
                  {items.some(item => item.status === 'LOW') && (
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  )}
                </button>

                {/* Content */}
                {expandedDispensadores.has(dispensador) && (
                  <div className="border-t border-gray-200">
                    {hasMultipleFiltraciones ? (
                      // Show filtration groups if there are multiple
                      Array.from(filtracionGroups.entries()).map(([filtracion, filtracionItems], idx) => {
                        const filtracionKey = `${dispensador}-${filtracion}`
                        const filtracionStock = filtracionItems.reduce((sum, item) => sum + item.quantity, 0)

                        return (
                          <div key={filtracionKey} className={idx > 0 ? 'border-t border-gray-100' : ''}>
                            <button
                              onClick={() => toggleFiltracion(filtracionKey)}
                              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                {expandedFiltracion.has(filtracionKey) ? (
                                  <ChevronDown className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-gray-400" />
                                )}
                                {getFiltracionBadge(filtracion)}
                                <div className="text-sm text-gray-600">
                                  {filtracionStock} en stock • {filtracionItems.length} variante(s)
                                </div>
                              </div>
                            </button>

                            {expandedFiltracion.has(filtracionKey) && (
                              <div className="px-6 py-4 bg-white space-y-4">
                                {filtracionItems.map(renderEquipmentItem)}
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      // If only one filtration type, show items directly
                      <div className="px-6 py-4 bg-white space-y-4">
                        {items.length > 1 && (
                          <div className="flex items-center gap-2 pb-2">
                            {getFiltracionBadge(Array.from(filtracionGroups.keys())[0])}
                          </div>
                        )}
                        {items.map(renderEquipmentItem)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
