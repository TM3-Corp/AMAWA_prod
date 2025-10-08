'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import StockLevelCard from '@/components/inventory/StockLevelCard'
import ForecastCard from '@/components/inventory/ForecastCard'
import UsageHistoryTable from '@/components/inventory/UsageHistoryTable'

interface InventoryData {
  stockByFilter: Array<{
    id: string
    sku: string
    name: string
    category: string
    totalStock: number
    minStock: number
    status: 'LOW' | 'WARNING' | 'OK'
    locations: Array<{
      location: string | null
      quantity: number
      minStock: number
      lastRestocked: Date | null
    }>
    recentUsage: Array<{
      id: string
      quantityUsed: number
      deductedAt: Date
      maintenance: {
        id: string
        client: {
          name: string
        }
      }
    }>
  }>
  forecast: Array<{
    sku: string
    name: string
    quantity: number
    maintenances: number
  }>
  stats: {
    totalFilters: number
    lowStockCount: number
    warningStockCount: number
    totalPendingMaintenances: number
    totalUsageRecords: number
  }
}

export default function InventoryPage() {
  const [data, setData] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'UF' | 'RO'>('ALL')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'LOW' | 'WARNING' | 'OK'>('ALL')

  useEffect(() => {
    fetchInventoryData()
  }, [])

  async function fetchInventoryData() {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory')

      if (!response.ok) {
        throw new Error('Error al cargar datos de inventario')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando inventario...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar inventario</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchInventoryData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // Filter stock cards
  const filteredStock = data.stockByFilter.filter(item => {
    if (filterCategory !== 'ALL' && item.category !== filterCategory) return false
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false
    return true
  })

  // Collect all usage records
  const allUsageRecords = data.stockByFilter.flatMap(filter => filter.recentUsage)
    .sort((a, b) => new Date(b.deductedAt).getTime() - new Date(a.deductedAt).getTime())

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Inventario</h1>
              </div>
              <p className="text-gray-600">Control de stock y pronóstico de filtros</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchInventoryData}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{data.stats.totalFilters}</p>
              <p className="text-xs text-gray-600">Tipos de Filtros</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{data.stats.lowStockCount}</p>
              <p className="text-xs text-gray-600">Stock Bajo</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{data.stats.warningStockCount}</p>
              <p className="text-xs text-gray-600">Alerta</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{data.stats.totalPendingMaintenances}</p>
              <p className="text-xs text-gray-600">Mant. Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{data.stats.totalUsageRecords}</p>
              <p className="text-xs text-gray-600">Registros de Uso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Categoría:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todas</option>
              <option value="UF">Ultrafiltración</option>
              <option value="RO">Ósmosis Inversa</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Estado:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="LOW">Stock Bajo</option>
              <option value="WARNING">Alerta</option>
              <option value="OK">OK</option>
            </select>
          </div>
          {(filterCategory !== 'ALL' || filterStatus !== 'ALL') && (
            <button
              onClick={() => {
                setFilterCategory('ALL')
                setFilterStatus('ALL')
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Stock Level Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Niveles de Stock</h2>
          {filteredStock.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStock.map((item) => (
                <StockLevelCard
                  key={item.id}
                  sku={item.sku}
                  name={item.name}
                  category={item.category}
                  totalStock={item.totalStock}
                  minStock={item.minStock}
                  status={item.status}
                  locations={item.locations}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No hay filtros que coincidan con los criterios seleccionados</p>
            </div>
          )}
        </div>

        {/* Forecast */}
        <div className="mb-8">
          <ForecastCard
            forecast={data.forecast}
            totalPendingMaintenances={data.stats.totalPendingMaintenances}
            stockByFilter={data.stockByFilter}
          />
        </div>

        {/* Usage History */}
        <div>
          <UsageHistoryTable usageRecords={allUsageRecords} />
        </div>
      </div>
    </div>
  )
}
