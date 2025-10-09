'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Printer, Package, FileText, Loader2, Trash2, Calendar as CalendarIcon, Edit2 } from 'lucide-react'
import { getPackageMappings, getPackageForMaintenance, type PackageMapping } from '@/lib/get-maintenance-package'

interface WorkOrderData {
  id: string
  month: number
  year: number
  deliveryType: string
  status: string
  totalMaintenances: number
  packageSummary: Record<string, number> | null
  filterSummary: Record<string, number> | null
  deliveryDate: string | null
  createdAt: string
  generatedAt: string | null
  cancelledAt: string | null
  maintenances: Array<{
    id: string
    scheduledDate: string
    cycleNumber: number | null
    client: {
      id: string
      name: string
      email: string | null
      phone: string | null
      address: string | null
      comuna: string | null
      contracts: Array<{
        planCode: string | null
        planType: string | null
      }>
      equipment: Array<{
        filterType: string | null
      }>
    }
  }>
  filterUsage: Array<{
    id: string
    quantityUsed: number
    deductedAt: string
    restoredAt: string | null
    filter: {
      sku: string
      name: string
    }
  }>
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function WorkOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [workOrder, setWorkOrder] = useState<WorkOrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [packageMappings, setPackageMappings] = useState<PackageMapping[]>([])
  const [editingDeliveryDate, setEditingDeliveryDate] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchWorkOrder()
      loadPackageMappings()
    }
  }, [params.id])

  async function loadPackageMappings() {
    const mappings = await getPackageMappings()
    setPackageMappings(mappings)
  }

  async function fetchWorkOrder() {
    try {
      setLoading(true)
      const response = await fetch(`/api/work-orders/${params.id}`)

      if (!response.ok) {
        throw new Error('Error al cargar orden de trabajo')
      }

      const data = await response.json()
      setWorkOrder(data)
      if (data.deliveryDate) {
        setDeliveryDate(new Date(data.deliveryDate).toISOString().split('T')[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateDeliveryDate() {
    try {
      const response = await fetch(`/api/work-orders/${params.id}/update-date`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryDate: new Date(deliveryDate).toISOString() })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar fecha')
      }

      await fetchWorkOrder()
      setEditingDeliveryDate(false)
      alert('Fecha actualizada exitosamente')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar fecha')
    }
  }

  async function handleConfirm() {
    if (!confirm('¿Confirmar orden de trabajo? Esto deducirá el inventario.')) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/work-orders/${params.id}/confirm`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al confirmar orden')
      }

      // Refresh data
      await fetchWorkOrder()
      alert('Orden confirmada exitosamente')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al confirmar orden')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancel() {
    if (!confirm('¿Cancelar orden de trabajo? Esto restaurará el inventario.')) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/work-orders/${params.id}/cancel`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al cancelar orden')
      }

      // Refresh data
      await fetchWorkOrder()
      alert('Orden cancelada exitosamente')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al cancelar orden')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar orden de trabajo? Esta acción no se puede deshacer.')) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/work-orders/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar orden')
      }

      alert('Orden eliminada exitosamente')
      router.push('/work-orders')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar orden')
      setActionLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando orden de trabajo...</p>
        </div>
      </div>
    )
  }

  if (error || !workOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar orden</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/work-orders"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
          >
            Volver a órdenes
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = {
    DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: FileText },
    GENERATED: { label: 'Generada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle }
  }

  const status = statusConfig[workOrder.status as keyof typeof statusConfig]
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Hidden in print */}
      <div className="bg-white border-b border-gray-200 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/work-orders"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                  Orden de Trabajo - {MONTHS[workOrder.month - 1]} {workOrder.year}
                </h1>
              </div>
              <p className="text-gray-600">
                {workOrder.deliveryType === 'Delivery' ? 'Envíos a Domicilio' : 'Mantenciones Presenciales'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {workOrder.status === 'DRAFT' && (
                <>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading ? 'Confirmando...' : 'Confirmar Orden'}
                  </button>
                </>
              )}
              {workOrder.status === 'GENERATED' && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {actionLoading ? 'Cancelando...' : 'Cancelar Orden'}
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Exportar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Print Header - Only visible in print */}
      <div className="hidden print:block bg-white p-8 border-b-2 border-gray-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AMAWA</h1>
            <p className="text-gray-600">Orden de Trabajo</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{MONTHS[workOrder.month - 1]} {workOrder.year}</p>
            <p className="text-sm text-gray-600">
              {workOrder.deliveryType === 'Delivery' ? 'Envíos a Domicilio' : 'Mantenciones Presenciales'}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-8">
        {/* Status Badge */}
        <div className="mb-6 flex items-center justify-between">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${status.color}`}>
            <StatusIcon className="w-4 h-4" />
            {status.label}
          </span>
          <div className="text-sm text-gray-600">
            Creada: {new Date(workOrder.createdAt).toLocaleString('es-CL')}
            {workOrder.generatedAt && (
              <span className="ml-4">
                Generada: {new Date(workOrder.generatedAt).toLocaleString('es-CL')}
              </span>
            )}
          </div>
        </div>

        {/* Delivery Date */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Fecha de Envío</h3>
                {editingDeliveryDate ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleUpdateDeliveryDate}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingDeliveryDate(false)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {workOrder.deliveryDate
                      ? new Date(workOrder.deliveryDate).toLocaleDateString('es-CL', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'No definida'}
                  </p>
                )}
              </div>
            </div>
            {!editingDeliveryDate && workOrder.status === 'DRAFT' && (
              <button
                onClick={() => setEditingDeliveryDate(true)}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Esta fecha será la misma para todos los paquetes en esta orden
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Maintenances */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Mantenciones</p>
                <p className="text-3xl font-bold text-gray-900">{workOrder.totalMaintenances}</p>
              </div>
              <Package className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </div>

          {/* Package Types */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tipos de Paquete</p>
                <p className="text-3xl font-bold text-gray-900">
                  {workOrder.packageSummary ? Object.keys(workOrder.packageSummary).length : 0}
                </p>
              </div>
              <FileText className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </div>

          {/* Filter Types */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tipos de Filtro</p>
                <p className="text-3xl font-bold text-gray-900">
                  {workOrder.filterSummary ? Object.keys(workOrder.filterSummary).length : 0}
                </p>
              </div>
              <Package className="w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Package Summary */}
        {workOrder.packageSummary && Object.keys(workOrder.packageSummary).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen de Paquetes</h2>
            <p className="text-gray-700 text-lg mb-4">
              {Object.entries(workOrder.packageSummary)
                .map(([code, count]) => `${count} paquetes ${code}`)
                .join(', ')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(workOrder.packageSummary).map(([code, count]) => (
                <div key={code} className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-900">{count}</p>
                  <p className="text-sm text-blue-700 mt-1">Paquete {code}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Summary */}
        {workOrder.filterSummary && Object.keys(workOrder.filterSummary).length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Total Filtros Individuales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(workOrder.filterSummary)
                .sort(([, a], [, b]) => b - a)
                .map(([sku, count]) => (
                  <div key={sku} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">{sku}</span>
                    <span className="text-lg font-bold text-blue-600">{count} unidades</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Client List */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Desglose por Cliente ({workOrder.maintenances.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">#</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Cliente</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Dirección</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Comuna</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Plan</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Paquete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workOrder.maintenances
                  .sort((a, b) => a.client.comuna?.localeCompare(b.client.comuna || '') || 0)
                  .map((maintenance, index) => {
                    const packageCode = getPackageForMaintenance(
                      maintenance.client.contracts[0]?.planCode,
                      maintenance.cycleNumber,
                      packageMappings
                    )

                    return (
                      <tr key={maintenance.id} className="hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm text-gray-900">{index + 1}</td>
                        <td className="py-3 px-2">
                          <p className="text-sm font-medium text-gray-900">{maintenance.client.name}</p>
                          {maintenance.client.phone && (
                            <p className="text-xs text-gray-500">{maintenance.client.phone}</p>
                          )}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-700">
                          {maintenance.client.address || '-'}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-700">
                          {maintenance.client.comuna || '-'}
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-700">
                          {maintenance.client.contracts[0]?.planCode || '-'}
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {packageCode}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Deductions */}
        {workOrder.filterUsage && workOrder.filterUsage.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Deducciones de Inventario</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Filtro</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">SKU</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-gray-700">Cantidad</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Deducido</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-gray-700">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workOrder.filterUsage.map((usage) => (
                    <tr key={usage.id}>
                      <td className="py-3 px-2 text-sm font-medium text-gray-900">{usage.filter.name}</td>
                      <td className="py-3 px-2 text-sm text-gray-700">{usage.filter.sku}</td>
                      <td className="py-3 px-2 text-sm text-right font-bold text-blue-600">
                        {usage.quantityUsed}
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-700">
                        {new Date(usage.deductedAt).toLocaleString('es-CL')}
                      </td>
                      <td className="py-3 px-2">
                        {usage.restoredAt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                            Restaurado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Deducido
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
