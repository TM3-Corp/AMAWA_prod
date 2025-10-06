'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, CheckCircle, AlertCircle, Package, User, MapPin, Phone, Mail, Wrench } from 'lucide-react'

interface MaintenanceDetail {
  maintenance: any
  requiredFilters: {
    packageCode: string
    packageName: string
    filters: Array<{
      sku: string
      name: string
      quantity: number
    }>
  } | null
  isOverdue: boolean
}

export default function MaintenanceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const maintenanceId = params.id as string

  const [data, setData] = useState<MaintenanceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [completionData, setCompletionData] = useState({
    actualDate: new Date().toISOString().split('T')[0],
    notes: '',
    observations: ''
  })

  useEffect(() => {
    fetchMaintenance()
  }, [maintenanceId])

  const fetchMaintenance = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/maintenances/${maintenanceId}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching maintenance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    try {
      setCompleting(true)

      const response = await fetch(`/api/maintenances/${maintenanceId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completionData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al completar mantención')
      }

      // Show success message
      alert(`✅ Mantención completada exitosamente!\n\nFiltros deducidos del inventario:\n${result.deductedFilters.map((f: any) =>
        `• ${f.sku}: ${f.previousStock} → ${f.newStock} unidades`
      ).join('\n')}${result.lowStockWarnings.length > 0 ?
        `\n\n⚠️ Alertas de stock bajo:\n${result.lowStockWarnings.map((w: any) =>
          `• ${w.sku}: ${w.currentStock}/${w.minStock} (faltan ${w.shortage} unidades)`
        ).join('\n')}` : ''
      }`)

      // Refresh data
      await fetchMaintenance()
      setShowCompleteModal(false)
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setCompleting(false)
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
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Mantención no encontrada</h2>
          <button
            onClick={() => router.push('/maintenances')}
            className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Volver a Mantenciones
          </button>
        </div>
      </div>
    )
  }

  const { maintenance, requiredFilters, isOverdue } = data
  const client = maintenance.client
  const equipment = client.equipment[0]
  const contract = client.contracts[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/maintenances')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <img src="/images/amawa_logo.png" alt="AMAWA Logo" className="h-10 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Detalle de Mantención</h1>
                <p className="text-sm text-gray-500">{client.name}</p>
              </div>
            </div>
            {maintenance.status !== 'COMPLETED' && (
              <button
                onClick={() => setShowCompleteModal(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Marcar como Completada
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Maintenance Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Información de Mantención
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Fecha Programada</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(maintenance.scheduledDate).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tipo de Mantención</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {maintenance.type === '6_months' && '6 Meses'}
                    {maintenance.type === '12_months' && '12 Meses'}
                    {maintenance.type === '18_months' && '18 Meses'}
                    {maintenance.type === '24_months' && '24 Meses'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <div className="mt-1">
                    {isOverdue ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Atrasada
                      </span>
                    ) : maintenance.status === 'COMPLETED' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Completada
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>
                {maintenance.completedDate && (
                  <div>
                    <p className="text-sm text-gray-500">Fecha Completada</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {new Date(maintenance.completedDate).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Required Filters */}
            {requiredFilters && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Filtros Requeridos
                </h3>
                <div className="bg-purple-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-purple-600 font-medium">
                    Paquete: {requiredFilters.packageCode}
                  </p>
                  <p className="text-xs text-purple-500">{requiredFilters.packageName}</p>
                </div>
                <div className="space-y-3">
                  {requiredFilters.filters.map((filter, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{filter.sku}</p>
                        <p className="text-sm text-gray-500">{filter.name}</p>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {filter.quantity}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Usage History */}
            {maintenance.filterUsage && maintenance.filterUsage.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Historial de Filtros Utilizados
                </h3>
                <div className="space-y-3">
                  {maintenance.filterUsage.map((usage: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{usage.filter.sku}</p>
                        <p className="text-sm text-gray-500">
                          Deducido: {new Date(usage.deductedAt).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {usage.quantityUsed}x
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {maintenance.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Notas</h3>
                <p className="text-gray-600">{maintenance.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Client Info */}
          <div className="space-y-6">
            {/* Client Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Información del Cliente
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium text-gray-800">{client.name}</p>
                </div>
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-600">{client.phone}</p>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-600">{client.email}</p>
                  </div>
                )}
                {client.comuna && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-600">{client.comuna}</p>
                  </div>
                )}
                <button
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="w-full mt-4 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition"
                >
                  Ver Perfil Completo
                </button>
              </div>
            </div>

            {/* Equipment Card */}
            {equipment && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Equipo</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Equipo</p>
                    <p className="font-medium text-gray-800">{equipment.equipmentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo de Filtración</p>
                    <p className="font-medium text-gray-800">{equipment.filterType}</p>
                  </div>
                  {equipment.serialNumber && (
                    <div>
                      <p className="text-sm text-gray-500">N° de Serie</p>
                      <p className="font-medium text-gray-800">{equipment.serialNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contract Card */}
            {contract && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contrato</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Código de Plan</p>
                    <p className="font-medium text-gray-800">{contract.planCode}</p>
                  </div>
                  {contract.monthlyValueCLP && (
                    <div>
                      <p className="text-sm text-gray-500">Valor Mensual</p>
                      <p className="font-medium text-gray-800">
                        ${contract.monthlyValueCLP.toLocaleString('es-CL')} CLP
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Maintenance Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Completar Mantención</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Real de Ejecución
                </label>
                <input
                  type="date"
                  value={completionData.actualDate}
                  onChange={(e) => setCompletionData({ ...completionData, actualDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={completionData.notes}
                  onChange={(e) => setCompletionData({ ...completionData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Observaciones de la mantención..."
                />
              </div>

              {requiredFilters && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    Se deducirán los siguientes filtros del inventario:
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {requiredFilters.filters.map((filter, idx) => (
                      <li key={idx}>• {filter.sku} x{filter.quantity}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                disabled={completing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                {completing ? 'Completando...' : 'Completar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
