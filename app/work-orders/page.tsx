'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, Plus, Calendar, Package, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

interface WorkOrder {
  id: string
  month: number
  year: number
  deliveryType: string
  status: string
  totalMaintenances: number
  packageSummary: Record<string, number> | null
  filterSummary: Record<string, number> | null
  createdAt: string
  generatedAt: string | null
  cancelledAt: string | null
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Borrador',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock
  },
  GENERATED: {
    label: 'Generada',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle
  },
  CANCELLED: {
    label: 'Cancelada',
    color: 'bg-red-100 text-red-800',
    icon: XCircle
  }
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterDeliveryType, setFilterDeliveryType] = useState<string>('ALL')

  // Generation form state
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1)
  const [genYear, setGenYear] = useState(new Date().getFullYear())
  const [genDeliveryType, setGenDeliveryType] = useState('Delivery')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchWorkOrders()
  }, [])

  async function fetchWorkOrders() {
    try {
      setLoading(true)
      const response = await fetch('/api/work-orders')

      if (!response.ok) {
        throw new Error('Error al cargar órdenes de trabajo')
      }

      const data = await response.json()
      setWorkOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateWorkOrder() {
    try {
      setGenerating(true)
      const response = await fetch('/api/work-orders/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: genMonth,
          year: genYear,
          deliveryType: genDeliveryType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al generar orden de trabajo')
      }

      const newWorkOrder = await response.json()

      // Refresh list
      await fetchWorkOrders()

      // Close modal
      setShowGenerateModal(false)

      // Redirect to the new work order
      window.location.href = `/work-orders/${newWorkOrder.id}`
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar orden de trabajo')
    } finally {
      setGenerating(false)
    }
  }

  // Filter work orders
  const filteredWorkOrders = workOrders.filter(wo => {
    if (filterStatus !== 'ALL' && wo.status !== filterStatus) return false
    if (filterDeliveryType !== 'ALL' && wo.deliveryType !== filterDeliveryType) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando órdenes de trabajo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar órdenes</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchWorkOrders}
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
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Órdenes de Trabajo</h1>
              </div>
              <p className="text-gray-600">Gestión mensual de envíos y mantenciones</p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nueva Orden
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{workOrders.length}</p>
              <p className="text-xs text-gray-600">Total Órdenes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">
                {workOrders.filter(wo => wo.status === 'DRAFT').length}
              </p>
              <p className="text-xs text-gray-600">Borradores</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {workOrders.filter(wo => wo.status === 'GENERATED').length}
              </p>
              <p className="text-xs text-gray-600">Generadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {workOrders.filter(wo => wo.status === 'CANCELLED').length}
              </p>
              <p className="text-xs text-gray-600">Canceladas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Estado:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="DRAFT">Borrador</option>
              <option value="GENERATED">Generada</option>
              <option value="CANCELLED">Cancelada</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tipo:</label>
            <select
              value={filterDeliveryType}
              onChange={(e) => setFilterDeliveryType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Todos</option>
              <option value="Delivery">Domicilio</option>
              <option value="Presencial">Presencial</option>
            </select>
          </div>
          {(filterStatus !== 'ALL' || filterDeliveryType !== 'ALL') && (
            <button
              onClick={() => {
                setFilterStatus('ALL')
                setFilterDeliveryType('ALL')
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Work Orders List */}
        {filteredWorkOrders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkOrders.map((wo) => {
              const statusInfo = STATUS_CONFIG[wo.status as keyof typeof STATUS_CONFIG]
              const StatusIcon = statusInfo.icon

              return (
                <Link
                  key={wo.id}
                  href={`/work-orders/${wo.id}`}
                  className="block bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-lg text-gray-900">
                          {MONTHS[wo.month - 1]} {wo.year}
                        </h3>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {wo.deliveryType === 'Delivery' ? '📦 Domicilio' : '👨‍🔧 Presencial'}
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">Mantenciones</span>
                      <span className="text-2xl font-bold text-gray-900">{wo.totalMaintenances}</span>
                    </div>

                    {wo.packageSummary && Object.keys(wo.packageSummary).length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Paquetes:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(wo.packageSummary).slice(0, 3).map(([code, count]) => (
                            <span key={code} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                              {count}x {code}
                            </span>
                          ))}
                          {Object.keys(wo.packageSummary).length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                              +{Object.keys(wo.packageSummary).length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Creada: {new Date(wo.createdAt).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay órdenes de trabajo que coincidan con los criterios</p>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Generar Nueva Orden de Trabajo</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mes</label>
                <select
                  value={genMonth}
                  onChange={(e) => setGenMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {MONTHS.map((month, index) => (
                    <option key={index} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                <input
                  type="number"
                  value={genYear}
                  onChange={(e) => setGenYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Entrega</label>
                <select
                  value={genDeliveryType}
                  onChange={(e) => setGenDeliveryType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Delivery">Domicilio</option>
                  <option value="Presencial">Presencial</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={generating}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerateWorkOrder}
                disabled={generating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  'Generar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
