'use client'

import { Wrench, CheckCircle, Clock, AlertCircle, Calendar, TrendingUp } from 'lucide-react'
import { cn, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'

interface Maintenance {
  id: string
  scheduledDate: Date | string
  type: string
  status: string
  completedDate: Date | string | null
  notes: string | null
}

interface Incident {
  id: string
  type: string
  description: string
  status: string
  priority: string
  createdAt: Date | string
  resolvedAt: Date | string | null
}

interface ServiceStatusDashboardProps {
  maintenances: Maintenance[]
  incidents: Incident[]
  stats: {
    maintenance: {
      total: number
      completed: number
      pending: number
      nextMaintenance?: Maintenance
    }
    incidents: {
      total: number
      open: number
      resolved: number
    }
  }
}

export function ServiceStatusDashboard({ maintenances, incidents, stats }: ServiceStatusDashboardProps) {
  const complianceRate = stats.maintenance.total > 0
    ? Math.round((stats.maintenance.completed / stats.maintenance.total) * 100)
    : 0

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
        <Wrench className="w-5 h-5 mr-2 text-purple-600" />
        Estado de Servicio
      </h3>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Maintenance Compliance */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-purple-700 font-medium">Cumplimiento</p>
            <CheckCircle className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-900">{complianceRate}%</p>
          <p className="text-xs text-purple-600 mt-1">
            {stats.maintenance.completed} de {stats.maintenance.total} completadas
          </p>
        </div>

        {/* Pending Maintenances */}
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-yellow-700 font-medium">Pendientes</p>
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-900">{stats.maintenance.pending}</p>
          <p className="text-xs text-yellow-600 mt-1">Mantenciones por realizar</p>
        </div>

        {/* Open Incidents */}
        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-red-700 font-medium">Incidentes</p>
            <AlertCircle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-900">{stats.incidents.open}</p>
          <p className="text-xs text-red-600 mt-1">Abiertos actualmente</p>
        </div>
      </div>

      {/* Next Maintenance */}
      {stats.maintenance.nextMaintenance && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Próxima Mantención</p>
                <p className="text-xs text-gray-600 mt-1">
                  {formatDate(stats.maintenance.nextMaintenance.scheduledDate)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Tipo: {getMaintenanceTypeLabel(stats.maintenance.nextMaintenance.type)}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium',
                getStatusColor(stats.maintenance.nextMaintenance.status)
              )}
            >
              {getStatusLabel(stats.maintenance.nextMaintenance.status)}
            </span>
          </div>
        </div>
      )}

      {/* Recent Maintenances */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-gray-700 mb-3">Historial de Mantenciones</h4>
        {maintenances.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No hay mantenciones registradas
          </p>
        ) : (
          <div className="space-y-2">
            {maintenances.slice(0, 5).map((maintenance) => (
              <div
                key={maintenance.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    maintenance.status === 'COMPLETED' ? 'bg-green-100' : 'bg-yellow-100'
                  )}>
                    {maintenance.status === 'COMPLETED' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {getMaintenanceTypeLabel(maintenance.type)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(maintenance.scheduledDate)}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getStatusColor(maintenance.status)
                  )}
                >
                  {getStatusLabel(maintenance.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Incidents */}
      {incidents.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-3">Incidentes Recientes</h4>
          <div className="space-y-2">
            {incidents.slice(0, 3).map((incident) => (
              <div
                key={incident.id}
                className="flex items-start justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition"
              >
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{incident.type}</p>
                    <p className="text-xs text-gray-600 line-clamp-1">{incident.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(incident.createdAt)}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2',
                    getStatusColor(incident.status)
                  )}
                >
                  {getStatusLabel(incident.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getMaintenanceTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SIX_MONTHS: '6 Meses',
    TWELVE_MONTHS: '12 Meses',
    EIGHTEEN_MONTHS: '18 Meses',
    TWENTY_FOUR_MONTHS: '24 Meses',
  }
  return labels[type] || type
}
