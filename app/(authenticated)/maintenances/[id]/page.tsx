'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, CheckCircle, AlertCircle, Package, User, MapPin, Phone, Mail, Wrench, UserPlus, Clock, ExternalLink, PhoneOff } from 'lucide-react'
import TechnicianAssignmentModal from '@/components/TechnicianAssignmentModal'
import { MaintenanceHistoryCard } from '@/components/MaintenanceHistoryCard'
import IncidentFormModal from '@/components/IncidentFormModal'
import { getMaintenanceStatusLabel, getMaintenanceStatusColor } from '@/lib/constants'

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
  clientMaintenances: Array<{
    id: string
    type: string
    scheduledDate: string
    actualDate: string | null
    status: string
    cycleNumber: number | null
    deviationDays: number | null
    responseRate: string | null
  }>
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
  const [showTechnicianModal, setShowTechnicianModal] = useState(false)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
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
    // Check for open incidents
    const openIncidents = maintenance.incidents?.filter((inc: any) => inc.status === 'OPEN')
    if (openIncidents && openIncidents.length > 0) {
      alert(`❌ No se puede completar la mantención porque tiene ${openIncidents.length} incidencia(s) abierta(s).\n\nPor favor, resuelve todas las incidencias antes de marcar como completada.`)
      return
    }

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
      alert('✅ Mantención completada exitosamente!')

      // Refresh data
      await fetchMaintenance()
      setShowCompleteModal(false)
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    } finally {
      setCompleting(false)
    }
  }

  const handleAssignTechnician = async (technicianName: string) => {
    try {
      const response = await fetch(`/api/maintenances/${maintenanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: technicianName })
      })

      if (!response.ok) {
        throw new Error('Error al asignar técnico')
      }

      // Refresh data
      await fetchMaintenance()
      setShowTechnicianModal(false)
    } catch (error: any) {
      throw error
    }
  }

  const handleMarkAsNoResponde = async () => {
    // Check for open incidents
    const openIncidents = maintenance.incidents?.filter((inc: any) => inc.status === 'OPEN')
    if (openIncidents && openIncidents.length > 0) {
      alert(`❌ No se puede marcar como "No Responde" porque tiene ${openIncidents.length} incidencia(s) abierta(s).\n\nPor favor, resuelve todas las incidencias antes de cambiar el estado.`)
      return
    }

    try {
      const response = await fetch(`/api/maintenances/${maintenanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'NO_RESPONDE' })
      })

      if (!response.ok) {
        throw new Error('Error al actualizar estado')
      }

      // Refresh data
      await fetchMaintenance()
    } catch (error: any) {
      alert(`❌ Error: ${error.message}`)
    }
  }

  const handleIncidentSaved = () => {
    setShowIncidentModal(false)
    fetchMaintenance() // Refresh to show new incident
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

  const { maintenance, requiredFilters, clientMaintenances, isOverdue } = data
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
            <div className="flex items-center gap-3 flex-wrap">
              {maintenance.status !== 'COMPLETED' && (
                <>
                  {/* Only show Asignar Técnico for Presencial deliveries */}
                  {equipment?.deliveryType === 'Presencial' && (
                    <button
                      onClick={() => setShowTechnicianModal(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      {maintenance.technicianId ? 'Cambiar Técnico' : 'Asignar Técnico'}
                    </button>
                  )}
                  <button
                    onClick={() => setShowIncidentModal(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5" />
                    Reportar Incidencia
                  </button>
                  {maintenance.status === 'PENDING' && (
                    <button
                      onClick={handleMarkAsNoResponde}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                    >
                      <PhoneOff className="w-5 h-5" />
                      Marcar como No Responde
                    </button>
                  )}
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Marcar como Completada
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
                  <p className="text-sm text-gray-500">Fecha de Instalación</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {equipment?.installationDate ? (
                      new Date(equipment.installationDate).toLocaleDateString('es-CL')
                    ) : (
                      <span className="text-gray-400 text-sm">Sin fecha</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha Programada</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {new Date(maintenance.scheduledDate).toLocaleDateString('es-CL')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha Real</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {maintenance.actualDate ? (
                      new Date(maintenance.actualDate).toLocaleDateString('es-CL')
                    ) : (
                      <span className="text-gray-400 text-sm">No completada</span>
                    )}
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
                  <p className="text-sm text-gray-500">Tipo de Entrega</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {equipment?.deliveryType || (
                      <span className="text-gray-400 text-sm">No especificado</span>
                    )}
                  </p>
                </div>
                {maintenance.actualDate && (
                  <div>
                    <p className="text-sm text-gray-500">Diferencia</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {(() => {
                        const scheduled = new Date(maintenance.scheduledDate)
                        const actual = new Date(maintenance.actualDate)
                        const diffTime = actual.getTime() - scheduled.getTime()
                        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

                        if (diffDays === 0) {
                          return <span className="text-green-600">A tiempo</span>
                        } else if (diffDays > 0) {
                          return <span className="text-orange-600">+{diffDays} días</span>
                        } else {
                          return <span className="text-green-600">{diffDays} días (anticipada)</span>
                        }
                      })()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Estado</p>
                  <div className="mt-1">
                    {(() => {
                      // Check for linked OPEN incident with category (only open incidents override status)
                      const activeIncident = maintenance.incidents?.find(inc => inc.status === 'OPEN')
                      const displayStatus = activeIncident?.category || maintenance.status

                      if (isOverdue && maintenance.status === 'PENDING' && !activeIncident) {
                        return (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Atrasada
                          </span>
                        )
                      }

                      // If showing incident category, use different color
                      const colorClass = activeIncident?.category
                        ? getMaintenanceStatusColor(displayStatus)
                        : getMaintenanceStatusColor(maintenance.status)

                      return (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colorClass}`}>
                          {maintenance.status === 'COMPLETED' && !activeIncident && <CheckCircle className="w-4 h-4 mr-1" />}
                          {maintenance.status === 'SCHEDULED' && !activeIncident && <Calendar className="w-4 h-4 mr-1" />}
                          {maintenance.status === 'PENDING' && !activeIncident && <Clock className="w-4 h-4 mr-1" />}
                          {maintenance.status === 'NO_RESPONDE' && !activeIncident && <AlertCircle className="w-4 h-4 mr-1" />}
                          {maintenance.status === 'RESCHEDULED' && !activeIncident && <Calendar className="w-4 h-4 mr-1" />}
                          {activeIncident && <AlertCircle className="w-4 h-4 mr-1" />}
                          {activeIncident?.category || getMaintenanceStatusLabel(maintenance.status)}
                        </span>
                      )
                    })()}
                  </div>
                </div>
                {/* Only show Técnico Asignado for Presencial deliveries */}
                {equipment?.deliveryType === 'Presencial' && (
                  <div>
                    <p className="text-sm text-gray-500">Técnico Asignado</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {maintenance.technicianId || (
                        <span className="text-gray-400 text-sm">Sin asignar</span>
                      )}
                    </p>
                  </div>
                )}
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

            {/* Linked Incidents */}
            {maintenance.incidents && maintenance.incidents.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Incidencias Vinculadas
                </h3>
                <div className="space-y-3">
                  {maintenance.incidents.map((incident) => (
                    <div key={incident.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusColor(incident.category || '')}`}>
                              {incident.category || 'Sin categoría'}
                            </span>
                            <Link
                              href="/admin/incidencias"
                              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                              title="Ver todas las incidencias"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver detalles
                            </Link>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Creada: {new Date(incident.createdAt).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          incident.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                          incident.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                          incident.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {incident.status === 'OPEN' ? 'Abierto' :
                           incident.status === 'IN_PROGRESS' ? 'En Progreso' :
                           incident.status === 'RESOLVED' ? 'Resuelto' :
                           'Cerrado'}
                        </span>
                      </div>
                      {incident.vtReason && (
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Razón VT:</span> {incident.vtReason}
                        </p>
                      )}
                      {incident.comments && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Comentarios:</span> {incident.comments}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Client Info - Moved here to fill space */}
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
                    <p className="text-gray-600 text-sm">{client.phone}</p>
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-600 text-sm">{client.email}</p>
                  </div>
                )}
                {client.comuna && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-600 text-sm">{client.comuna}</p>
                  </div>
                )}
                <button
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="w-full mt-4 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition text-sm"
                >
                  Ver Perfil Completo
                </button>
              </div>
            </div>

            {/* Equipment Info - Moved here */}
            {equipment && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Equipo
                </h3>
                <div className="space-y-3">
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
                  {equipment.installerTechnician && (
                    <div>
                      <p className="text-sm text-gray-500">Técnico Instalador</p>
                      <p className="font-medium text-gray-800">{equipment.installerTechnician}</p>
                    </div>
                  )}
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

          {/* Right Column - History Timeline + Contract */}
          <div className="space-y-6">
            {/* Maintenance History Timeline */}
            <MaintenanceHistoryCard
              maintenances={clientMaintenances}
              currentMaintenanceId={maintenanceId}
            />

            {/* Contract Card - Moved to right column */}
            {contract && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Contrato
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Código de Plan</p>
                    <p className="font-medium text-gray-800">{contract.planCode}</p>
                  </div>
                  {contract.planType && (
                    <div>
                      <p className="text-sm text-gray-500">Tipo de Plan</p>
                      <p className="font-medium text-gray-800">{contract.planType}</p>
                    </div>
                  )}
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

      {/* Technician Assignment Modal */}
      <TechnicianAssignmentModal
        isOpen={showTechnicianModal}
        onClose={() => setShowTechnicianModal(false)}
        currentTechnician={maintenance.technicianId}
        onAssign={handleAssignTechnician}
      />

      {/* Incident Report Modal */}
      {showIncidentModal && (
        <IncidentFormModal
          onClose={() => setShowIncidentModal(false)}
          onSave={handleIncidentSaved}
          preSelectedClientId={client.id}
          preSelectedMaintenanceId={maintenanceId}
        />
      )}
    </div>
  )
}
