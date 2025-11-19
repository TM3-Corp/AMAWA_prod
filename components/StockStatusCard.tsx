'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, AlertTriangle, CheckCircle2, XCircle, ArrowRight, TrendingDown } from 'lucide-react'

interface StockProjectionSummary {
  totalFilters: number
  criticalFiltersCount: number
  hasCriticalWarning: boolean
  projectionMonths: number
  message: string
}

interface FilterCoverage {
  sku: string
  name: string
  currentStock: number
  monthsUntilStockout: number
  isCritical: boolean
  totalFutureConsumption: number
}

interface StockProjectionData {
  success: boolean
  summary: StockProjectionSummary
  filterCoverage: Record<string, FilterCoverage>
}

export default function StockStatusCard() {
  const [data, setData] = useState<StockProjectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchStockProjection()
  }, [])

  const fetchStockProjection = async () => {
    try {
      setLoading(true)
      setError(false)
      const response = await fetch('/api/inventory/stock-projection')
      const result = await response.json()

      if (result.success) {
        setData(result)
      } else {
        setError(true)
      }
    } catch (err) {
      console.error('Error fetching stock projection:', err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-red-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Error al cargar proyección de stock
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              No se pudo obtener la información de stock. Intenta nuevamente.
            </p>
            <button
              onClick={fetchStockProjection}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const { summary, filterCoverage } = data

  // Get most critical filters (sorted by months until stockout)
  const criticalFilters = Object.values(filterCoverage)
    .filter(f => f.isCritical)
    .sort((a, b) => a.monthsUntilStockout - b.monthsUntilStockout)
    .slice(0, 3)

  // Determine overall status
  const getStatusConfig = () => {
    if (summary.criticalFiltersCount === 0) {
      return {
        bgColor: 'from-green-50 to-green-100',
        borderColor: 'border-green-200',
        iconBg: 'bg-green-500',
        icon: CheckCircle2,
        iconColor: 'text-white',
        textColor: 'text-green-800',
        badgeColor: 'bg-green-100 text-green-800',
        status: 'Óptimo'
      }
    } else if (summary.criticalFiltersCount <= 2) {
      return {
        bgColor: 'from-yellow-50 to-orange-100',
        borderColor: 'border-orange-200',
        iconBg: 'bg-orange-500',
        icon: AlertTriangle,
        iconColor: 'text-white',
        textColor: 'text-orange-800',
        badgeColor: 'bg-orange-100 text-orange-800',
        status: 'Advertencia'
      }
    } else {
      return {
        bgColor: 'from-red-50 to-red-100',
        borderColor: 'border-red-300',
        iconBg: 'bg-red-600',
        icon: AlertTriangle,
        iconColor: 'text-white',
        textColor: 'text-red-800',
        badgeColor: 'bg-red-100 text-red-800',
        status: 'Crítico'
      }
    }
  }

  const statusConfig = getStatusConfig()
  const StatusIcon = statusConfig.icon

  return (
    <div className={`bg-gradient-to-br ${statusConfig.bgColor} rounded-xl shadow-sm p-6 border ${statusConfig.borderColor}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`w-12 h-12 ${statusConfig.iconBg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <StatusIcon className={`w-6 h-6 ${statusConfig.iconColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900">
                Estado de Stock de Filtros
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.badgeColor}`}>
                {statusConfig.status}
              </span>
            </div>
            <p className={`text-sm font-medium ${statusConfig.textColor} mb-1`}>
              {summary.message}
            </p>
            <p className="text-xs text-gray-600">
              Proyección a {summary.projectionMonths} meses • {summary.totalFilters} filtros monitoreados
            </p>
          </div>
        </div>
      </div>

      {/* Critical Filters List */}
      {criticalFilters.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-orange-600" />
            Filtros Críticos (Menos de 4 meses)
          </h4>
          <div className="space-y-2">
            {criticalFilters.map((filter) => (
              <div
                key={filter.sku}
                className="flex items-center justify-between p-3 bg-white bg-opacity-60 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{filter.sku}</p>
                  <p className="text-xs text-gray-600">{filter.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-orange-600">
                    {filter.monthsUntilStockout === 0 ? (
                      <span className="text-red-600">Sin stock</span>
                    ) : (
                      `${filter.monthsUntilStockout} ${filter.monthsUntilStockout === 1 ? 'mes' : 'meses'}`
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Stock: {filter.currentStock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Details Link */}
      <Link
        href="/inventory/stock-projection"
        className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-lg font-semibold text-sm transition-all transform hover:scale-[1.02] shadow-sm"
      >
        Ver Proyección Detallada
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
