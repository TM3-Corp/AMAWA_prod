'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Package, TrendingUp, Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MonthData {
  year: number
  month: number
  totalMaintenances: number
  deliveryCount: number
  presencialCount: number
  packageSummary: Record<string, number>
  workOrder: {
    id: string
    status: string
    deliveryType: string
  } | null
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function MonthlyCalendarPage() {
  const router = useRouter()
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentYearOffset, setCurrentYearOffset] = useState(0) // -1 = prev year, 0 = current, 1 = next year
  const [generatingWorkOrder, setGeneratingWorkOrder] = useState<string | null>(null)

  const currentYear = new Date().getFullYear() + currentYearOffset

  useEffect(() => {
    fetchMonthlyStats()
  }, [currentYearOffset])

  async function fetchMonthlyStats() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/calendar/monthly-stats?startYear=${currentYear - 1}&endYear=${currentYear + 1}`
      )

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas')
      }

      const data = await response.json()
      setMonthlyData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateWorkOrder(month: number, year: number, deliveryType: string) {
    const key = `${year}-${month}-${deliveryType}`
    setGeneratingWorkOrder(key)

    try {
      const response = await fetch('/api/work-orders/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year, deliveryType })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al generar orden')
      }

      const workOrder = await response.json()
      router.push(`/work-orders/${workOrder.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar orden de trabajo')
      setGeneratingWorkOrder(null)
    }
  }

  function getMonthData(month: number, deliveryType: string): MonthData | null {
    return monthlyData.find(
      m => m.year === currentYear && m.month === month &&
      (monthlyData.some(d => d.year === m.year && d.month === m.month && d.deliveryCount > 0) ?
        (deliveryType === 'Delivery' && m.deliveryCount > 0) :
        (deliveryType === 'Presencial' && m.presencialCount > 0))
    ) || null
  }

  function calculatePercentage(deliveryCount: number, presencialCount: number): { delivery: number, presencial: number } {
    const total = deliveryCount + presencialCount
    if (total === 0) return { delivery: 0, presencial: 0 }

    return {
      delivery: Math.round((deliveryCount / total) * 100),
      presencial: Math.round((presencialCount / total) * 100)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando calendario...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchMonthlyStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
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
                <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Calendario Ejecutivo</h1>
              </div>
              <p className="text-gray-600">Vista mensual de mantenciones y órdenes de trabajo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Year Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentYearOffset(currentYearOffset - 1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              {currentYear - 1}
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{currentYear}</h2>
            <button
              onClick={() => setCurrentYearOffset(currentYearOffset + 1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {currentYear + 1}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Timeline */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MONTHS.map((monthName, index) => {
            const monthNumber = index + 1

            // Get data for both delivery types
            const deliveryData = monthlyData.find(
              m => m.year === currentYear && m.month === monthNumber && m.deliveryCount > 0
            )
            const presencialData = monthlyData.find(
              m => m.year === currentYear && m.month === monthNumber && m.presencialCount > 0
            )

            const totalMaintenances = (deliveryData?.totalMaintenances || 0) + (presencialData?.totalMaintenances || 0)
            const hasData = totalMaintenances > 0

            const percentages = calculatePercentage(
              deliveryData?.deliveryCount || 0,
              presencialData?.presencialCount || 0
            )

            // Combine package summaries
            const allPackages = { ...(deliveryData?.packageSummary || {}), ...(presencialData?.packageSummary || {}) }

            return (
              <div key={monthNumber} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Month Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                  <h3 className="text-lg font-bold">{monthName} {currentYear}</h3>
                  <p className="text-blue-100 text-sm mt-1">
                    {totalMaintenances} mantenciones
                  </p>
                </div>

                {/* Content */}
                <div className="p-4">
                  {hasData ? (
                    <>
                      {/* Package Summary */}
                      {Object.keys(allPackages).length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Paquetes</p>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(allPackages).map(([code, count]) => (
                              <span key={code} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                                {count}x {code}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Delivery Type Breakdown */}
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Tipo de Entrega</p>
                        <div className="space-y-2">
                          {deliveryData && deliveryData.deliveryCount > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">📦 Domicilio</span>
                              <span className="text-sm font-bold text-blue-600">{percentages.delivery}%</span>
                            </div>
                          )}
                          {presencialData && presencialData.presencialCount > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">👨‍🔧 Presencial</span>
                              <span className="text-sm font-bold text-green-600">{percentages.presencial}%</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Work Order Status */}
                      <div className="border-t border-gray-200 pt-4">
                        {deliveryData?.workOrder ? (
                          <Link
                            href={`/work-orders/${deliveryData.workOrder.id}`}
                            className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg p-3 hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">Mantención Realizada</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleGenerateWorkOrder(monthNumber, currentYear, 'Delivery')}
                            disabled={generatingWorkOrder === `${currentYear}-${monthNumber}-Delivery`}
                            className="w-full flex items-center justify-center gap-2 text-sm text-orange-700 bg-orange-50 rounded-lg p-3 hover:bg-orange-100 transition-colors disabled:opacity-50"
                          >
                            {generatingWorkOrder === `${currentYear}-${monthNumber}-Delivery` ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Generando...</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4" />
                                <span className="font-medium">Mantención Pendiente de OT</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Sin mantenciones programadas</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
