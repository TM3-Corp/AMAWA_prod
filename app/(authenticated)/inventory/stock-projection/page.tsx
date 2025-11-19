'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Package, AlertTriangle, CheckCircle2, TrendingDown, Calendar, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface FilterCoverage {
  sku: string
  name: string
  currentStock: number
  monthsUntilStockout: number
  isCritical: boolean
  totalFutureConsumption: number
}

interface MonthlyProjection {
  year: number
  month: number
  monthName: string
  maintenancesCount: number
  filterConsumption: Record<string, number>
  remainingStock: Record<string, number>
  criticalFilters: string[]
}

interface StockProjectionData {
  success: boolean
  summary: {
    totalFilters: number
    criticalFiltersCount: number
    hasCriticalWarning: boolean
    projectionMonths: number
    message: string
  }
  currentStock: Record<string, {
    filterId: string
    sku: string
    name: string
    totalStock: number
  }>
  monthlyProjection: MonthlyProjection[]
  filterCoverage: Record<string, FilterCoverage>
}

export default function StockProjectionPage() {
  const router = useRouter()
  const [data, setData] = useState<StockProjectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'filters' | 'monthly'>('filters')

  useEffect(() => {
    fetchStockProjection()
  }, [])

  const fetchStockProjection = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/inventory/stock-projection')
      const result = await response.json()

      if (result.success) {
        setData(result)
      }
    } catch (err) {
      console.error('Error fetching stock projection:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error al cargar proyección</h2>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  const { summary, filterCoverage, monthlyProjection, currentStock } = data

  // Sort filters by criticality
  const sortedFilters = Object.values(filterCoverage).sort((a, b) => {
    if (a.isCritical && !b.isCritical) return -1
    if (!a.isCritical && b.isCritical) return 1
    return a.monthsUntilStockout - b.monthsUntilStockout
  })

  const getCoverageColor = (months: number) => {
    if (months === 0) return 'bg-red-100 text-red-800 border-red-300'
    if (months < 2) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (months < 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  const getCoverageIcon = (months: number) => {
    if (months < 4) return <AlertTriangle className="w-4 h-4" />
    return <CheckCircle2 className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <img src="/images/amawa_logo.png" alt="AMAWA Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Proyección de Stock de Filtros</h1>
                <p className="text-sm text-gray-500">
                  Análisis de cobertura a {summary.projectionMonths} meses basado en mantenciones programadas
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Filtros</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalFilters}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                summary.criticalFiltersCount > 0 ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                {summary.criticalFiltersCount > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Filtros Críticos</p>
                <p className="text-2xl font-bold text-gray-900">{summary.criticalFiltersCount}</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">Menos de 4 meses de cobertura</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Próximas Mantenciones</p>
                <p className="text-2xl font-bold text-gray-900">
                  {monthlyProjection.reduce((sum, m) => sum + m.maintenancesCount, 0)}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">En los próximos {summary.projectionMonths} meses</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-white rounded-xl shadow-sm p-2 mb-6 inline-flex gap-2">
          <button
            onClick={() => setSelectedView('filters')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              selectedView === 'filters'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Por Filtro
            </div>
          </button>
          <button
            onClick={() => setSelectedView('monthly')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              selectedView === 'monthly'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Por Mes
            </div>
          </button>
        </div>

        {/* Filters View */}
        {selectedView === 'filters' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Filtro
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Consumo Proyectado
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Meses de Cobertura
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedFilters.map((filter) => (
                    <tr
                      key={filter.sku}
                      className={`hover:bg-gray-50 transition-colors ${
                        filter.isCritical ? 'bg-orange-50 bg-opacity-30' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{filter.sku}</p>
                          <p className="text-sm text-gray-500">{filter.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-lg font-bold text-gray-900">{filter.currentStock}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <p className="text-lg font-semibold text-purple-600">
                          {filter.totalFutureConsumption}
                        </p>
                        <p className="text-xs text-gray-500">próximos {summary.projectionMonths} meses</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {getCoverageIcon(filter.monthsUntilStockout)}
                          <span className="text-lg font-bold text-gray-900">
                            {filter.monthsUntilStockout === summary.projectionMonths
                              ? `${filter.monthsUntilStockout}+`
                              : filter.monthsUntilStockout === 0
                              ? '0'
                              : filter.monthsUntilStockout}
                          </span>
                          <span className="text-sm text-gray-500">
                            {filter.monthsUntilStockout === 1 ? 'mes' : 'meses'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getCoverageColor(filter.monthsUntilStockout)}`}>
                          {filter.monthsUntilStockout === 0 ? 'Sin Stock' :
                           filter.monthsUntilStockout < 2 ? 'Crítico' :
                           filter.monthsUntilStockout < 4 ? 'Advertencia' :
                           'OK'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly View */}
        {selectedView === 'monthly' && (
          <div className="space-y-6">
            {monthlyProjection.map((month, index) => {
              const hasConsumption = Object.keys(month.filterConsumption).length > 0

              return (
                <div key={`${month.year}-${month.month}`} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold capitalize">{month.monthName}</h3>
                        <p className="text-sm text-purple-100">
                          {month.maintenancesCount} mantención{month.maintenancesCount !== 1 ? 'es' : ''} programada{month.maintenancesCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {month.criticalFilters.length > 0 && (
                        <div className="flex items-center gap-2 bg-red-500 bg-opacity-30 px-3 py-1 rounded-full">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-semibold">
                            {month.criticalFilters.length} crítico{month.criticalFilters.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {hasConsumption ? (
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(month.filterConsumption).map(([sku, quantity]) => {
                          const remaining = month.remainingStock[sku] || 0
                          const isCritical = month.criticalFilters.includes(sku)
                          const filterInfo = currentStock[sku]

                          return (
                            <div
                              key={sku}
                              className={`p-4 rounded-lg border-2 ${
                                isCritical
                                  ? 'bg-red-50 border-red-300'
                                  : remaining < 10
                                  ? 'bg-orange-50 border-orange-300'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-bold text-gray-900">{sku}</p>
                                  <p className="text-xs text-gray-600">{filterInfo?.name}</p>
                                </div>
                                {isCritical && (
                                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-sm text-gray-500">Consumo:</span>
                                <span className="text-lg font-bold text-purple-600">-{quantity}</span>
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm text-gray-500">Restante:</span>
                                <span className={`text-lg font-bold ${
                                  remaining <= 0 ? 'text-red-600' : remaining < 10 ? 'text-orange-600' : 'text-gray-900'
                                }`}>
                                  {remaining}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      No hay consumo proyectado para este mes
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <Link
            href="/admin/filter-inventory"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-semibold"
          >
            Gestionar Inventario
          </Link>
          <Link
            href="/calendar"
            className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-semibold border border-gray-300"
          >
            Ver Calendario de Mantenciones
          </Link>
        </div>
      </div>
    </div>
  )
}
