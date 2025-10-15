'use client'

import { useState, useEffect } from 'react'
import LockedField from '@/components/admin/LockedField'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface Filter {
  id: string
  sku: string
  name: string
  description: string | null
  category: string
  unitCost: number | null
}

interface FilterInventory {
  id: string
  filterId: string
  quantity: number
  minStock: number
  location: string
  lastRestocked: string | null
  filter: Filter
  inUseCount: number
  status: 'LOW' | 'WARNING' | 'OK'
  createdAt: string
  updatedAt: string
}

export default function FilterInventoryPage() {
  const [inventory, setInventory] = useState<FilterInventory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')

  const fetchInventory = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/filter-inventory')
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al cargar inventario')
      }

      setInventory(data.data)
    } catch (err: any) {
      setError(err.message || 'Error al cargar el inventario de filtros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="h-4 w-4" />
            Bajo
          </span>
        )
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="h-4 w-4" />
            Advertencia
          </span>
        )
      case 'OK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-4 w-4" />
            OK
          </span>
        )
      default:
        return null
    }
  }

  const getCategoryBadge = (category: string) => {
    return category === 'UF' ? (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
        UF
      </span>
    ) : (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800">
        RO
      </span>
    )
  }

  const filteredInventory = categoryFilter === 'ALL'
    ? inventory
    : inventory.filter(item => item.filter.category === categoryFilter)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
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

  const totalStock = filteredInventory.reduce((sum, item) => sum + item.quantity, 0)
  const totalInUse = filteredInventory.reduce((sum, item) => sum + item.inUseCount, 0)
  const lowStockCount = filteredInventory.filter(item => item.status === 'LOW').length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Inventario de Filtros
          </h1>
          <p className="text-gray-600">
            Gestión de stock de filtros para mantenciones
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-4 py-2 text-sm font-medium border ${
                categoryFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-l-md`}
            >
              Todos
            </button>
            <button
              onClick={() => setCategoryFilter('UF')}
              className={`px-4 py-2 text-sm font-medium border-t border-b ${
                categoryFilter === 'UF'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Ultrafiltración (UF)
            </button>
            <button
              onClick={() => setCategoryFilter('RO')}
              className={`px-4 py-2 text-sm font-medium border ${
                categoryFilter === 'RO'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-r-md`}
            >
              Ósmosis Inversa (RO)
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">
              Tipos de Filtro
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {filteredInventory.length}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">
              Unidades en Stock
            </div>
            <div className="text-3xl font-bold text-blue-600">
              {totalStock}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">
              Filtros en Uso
            </div>
            <div className="text-3xl font-bold text-green-600">
              {totalInUse}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-600 mb-1">
              Stock Bajo
            </div>
            <div className="text-3xl font-bold text-red-600">
              {lowStockCount}
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU / Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  En Uso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Mínimo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <>
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.filter.sku}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.filter.name}
                      </div>
                      {item.filter.description && (
                        <div className="text-xs text-gray-400 mt-1">
                          {item.filter.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCategoryBadge(item.filter.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {item.quantity} unidades
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.inUseCount} unidades
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.minStock}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleRow(item.id)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        {expandedRows.has(item.id) ? 'Ocultar' : 'Editar'}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expandedRows.has(item.id) && (
                    <tr key={`${item.id}-expanded`}>
                      <td colSpan={7} className="px-6 py-6 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <LockedField
                            label="Cantidad en Stock"
                            value={item.quantity}
                            fieldName="quantity"
                            recordId={item.id}
                            apiEndpoint="/api/admin/filter-inventory"
                            type="number"
                            onUpdate={fetchInventory}
                          />

                          <LockedField
                            label="Stock Mínimo"
                            value={item.minStock}
                            fieldName="minStock"
                            recordId={item.id}
                            apiEndpoint="/api/admin/filter-inventory"
                            type="number"
                            onUpdate={fetchInventory}
                          />

                          <LockedField
                            label="Ubicación"
                            value={item.location}
                            fieldName="location"
                            recordId={item.id}
                            apiEndpoint="/api/admin/filter-inventory"
                            type="text"
                            onUpdate={fetchInventory}
                            placeholder="Ej: Bodega Principal"
                          />

                          <LockedField
                            label="Última Reposición"
                            value={item.lastRestocked}
                            fieldName="lastRestocked"
                            recordId={item.id}
                            apiEndpoint="/api/admin/filter-inventory"
                            type="date"
                            onUpdate={fetchInventory}
                          />
                        </div>

                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <div className="text-sm font-medium text-blue-900 mb-2">
                            Información del Filtro
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                            <div>
                              <span className="font-medium">Costo Unitario:</span>{' '}
                              {item.filter.unitCost
                                ? `$${item.filter.unitCost.toLocaleString('es-CL')} CLP`
                                : 'No especificado'}
                            </div>
                            <div>
                              <span className="font-medium">Categoría:</span>{' '}
                              {item.filter.category === 'UF' ? 'Ultrafiltración' : 'Ósmosis Inversa'}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
