'use client'

import { Calendar, Clock, CheckCircle, AlertCircle, XCircle, TrendingDown, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Maintenance {
  id: string
  type: string
  scheduledDate: Date | string
  actualDate: Date | string | null
  status: string
  cycleNumber: number | null
  deviationDays: number | null
  responseRate: string | null
}

interface MaintenanceHistoryCardProps {
  maintenances: Maintenance[]
  currentMaintenanceId: string
}

export function MaintenanceHistoryCard({ maintenances, currentMaintenanceId }: MaintenanceHistoryCardProps) {
  const router = useRouter()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'SCHEDULED':
        return <Calendar className="w-5 h-5 text-blue-600" />
      case 'RESCHEDULED':
        return <Calendar className="w-5 h-5 text-orange-600" />
      case 'CANCELLED':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string, isCurrent: boolean) => {
    if (isCurrent) {
      return 'bg-purple-100 border-purple-400 text-purple-900 shadow-lg ring-2 ring-purple-300'
    }
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 cursor-pointer'
      case 'PENDING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 cursor-pointer'
      case 'SCHEDULED':
        return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer'
      case 'RESCHEDULED':
        return 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 cursor-pointer'
      case 'CANCELLED':
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 cursor-pointer'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 cursor-pointer'
    }
  }

  const getResponseRateColor = (rate: string | null) => {
    switch (rate) {
      case 'EXCELLENT':
        return 'bg-green-100 text-green-700'
      case 'GOOD':
        return 'bg-blue-100 text-blue-700'
      case 'FAIR':
        return 'bg-yellow-100 text-yellow-700'
      case 'POOR':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getDeviationColor = (days: number | null) => {
    if (!days) return 'text-gray-600'
    if (Math.abs(days) <= 7) return 'text-green-600'
    if (Math.abs(days) <= 14) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'No registrado'
    return new Date(date).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'COMPLETED': 'Completada',
      'PENDING': 'Pendiente',
      'SCHEDULED': 'Agendada',
      'RESCHEDULED': 'Reprogramada',
      'IN_PROGRESS': 'En Progreso',
      'CANCELLED': 'Cancelada'
    }
    return labels[status] || status
  }

  const sortedMaintenances = [...maintenances].sort((a, b) =>
    new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  )

  const handleMaintenanceClick = (maintenanceId: string) => {
    if (maintenanceId !== currentMaintenanceId) {
      router.push(`/maintenances/${maintenanceId}`)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-6 h-6 text-gray-600" />
        <h3 className="text-lg font-bold text-gray-900">Historial de Mantenciones</h3>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {sortedMaintenances.length > 0 ? (
          sortedMaintenances.map((maintenance, index) => {
            const isCurrent = maintenance.id === currentMaintenanceId

            return (
              <div key={maintenance.id} className="relative">
                {/* Timeline Line */}
                {index !== sortedMaintenances.length - 1 && (
                  <div className="absolute left-[22px] top-12 w-0.5 h-full bg-gray-200"></div>
                )}

                {/* Maintenance Card */}
                <div
                  className={`relative border rounded-lg p-4 transition-all ${getStatusColor(maintenance.status, isCurrent)}`}
                  onClick={() => handleMaintenanceClick(maintenance.id)}
                >
                  {/* Timeline Dot */}
                  <div className="absolute -left-3 top-4">
                    {getStatusIcon(maintenance.status)}
                  </div>

                  {/* Current Badge */}
                  {isCurrent && (
                    <div className="absolute -top-2 -right-2">
                      <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-bold shadow-md">
                        Actual
                      </span>
                    </div>
                  )}

                  <div className="ml-8">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">
                            Mantención {maintenance.cycleNumber || '—'}
                          </h4>
                          <span className="text-xs px-2 py-0.5 bg-white rounded-full font-medium">
                            {maintenance.type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {getStatusLabel(maintenance.status)}
                        </p>
                      </div>

                      {/* Response Rate Badge */}
                      {maintenance.responseRate && (
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getResponseRateColor(maintenance.responseRate)}`}>
                          {maintenance.responseRate}
                        </span>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      {/* Scheduled Date */}
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Fecha Programada</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(maintenance.scheduledDate)}
                        </p>
                      </div>

                      {/* Actual Date */}
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Fecha Real</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(maintenance.actualDate)}
                        </p>
                      </div>
                    </div>

                    {/* Deviation */}
                    {maintenance.deviationDays !== null && maintenance.deviationDays !== 0 && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                        {maintenance.deviationDays > 0 ? (
                          <TrendingDown className={`w-4 h-4 ${getDeviationColor(maintenance.deviationDays)}`} />
                        ) : (
                          <TrendingUp className={`w-4 h-4 ${getDeviationColor(maintenance.deviationDays)}`} />
                        )}
                        <p className={`text-sm font-medium ${getDeviationColor(maintenance.deviationDays)}`}>
                          {Math.abs(maintenance.deviationDays)} días {maintenance.deviationDays > 0 ? 'de retraso' : 'adelantada'}
                        </p>
                      </div>
                    )}

                    {/* Click Hint */}
                    {!isCurrent && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 italic">Click para ver detalles →</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <p className="text-sm">No hay registros de mantención disponibles</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {sortedMaintenances.length > 0 && (
        <>
          <div className="border-t border-gray-100 mt-6 pt-6">
            <div className="grid grid-cols-3 gap-4">
              {/* Total */}
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{sortedMaintenances.length}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
              </div>

              {/* Completed */}
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {sortedMaintenances.filter(m => m.status === 'COMPLETED').length}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Completadas</p>
              </div>

              {/* Pending */}
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {sortedMaintenances.filter(m => m.status === 'PENDING').length}
                </p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Pendientes</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
