'use client'

import { Calendar, Wrench, AlertCircle, User, Package } from 'lucide-react'
import { formatDateTime, getStatusColor } from '@/lib/utils'

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

interface ActivityTimelineProps {
  client: {
    createdAt: Date | string
    installationDate: Date | string | null
  }
  maintenances: Maintenance[]
  incidents: Incident[]
}

type TimelineEvent = {
  id: string
  type: 'client_created' | 'installation' | 'maintenance' | 'incident'
  date: Date
  title: string
  description: string
  status?: string
  icon: typeof Calendar
  color: string
}

export function ActivityTimeline({ client, maintenances, incidents }: ActivityTimelineProps) {
  // Build timeline events
  const events: TimelineEvent[] = []

  // Add client creation
  events.push({
    id: 'created',
    type: 'client_created',
    date: new Date(client.createdAt),
    title: 'Cliente Registrado',
    description: 'Registro inicial del cliente en el sistema',
    icon: User,
    color: 'bg-purple-500',
  })

  // Add installation
  if (client.installationDate) {
    events.push({
      id: 'installation',
      type: 'installation',
      date: new Date(client.installationDate),
      title: 'Equipo Instalado',
      description: 'Instalación del equipo de purificación',
      icon: Package,
      color: 'bg-green-500',
    })
  }

  // Add maintenances
  maintenances.forEach((maintenance) => {
    const date = maintenance.completedDate
      ? new Date(maintenance.completedDate)
      : new Date(maintenance.scheduledDate)

    events.push({
      id: maintenance.id,
      type: 'maintenance',
      date,
      title: `Mantención ${getMaintenanceTypeLabel(maintenance.type)}`,
      description: maintenance.notes || `Estado: ${maintenance.status}`,
      status: maintenance.status,
      icon: Wrench,
      color: maintenance.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-yellow-500',
    })
  })

  // Add incidents
  incidents.forEach((incident) => {
    events.push({
      id: incident.id,
      type: 'incident',
      date: new Date(incident.createdAt),
      title: `Incidente: ${incident.type}`,
      description: incident.description,
      status: incident.status,
      icon: AlertCircle,
      color: incident.status === 'RESOLVED' ? 'bg-green-500' : 'bg-red-500',
    })
  })

  // Sort events by date (most recent first)
  events.sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-purple-600" />
        Línea de Tiempo
      </h3>

      {events.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">
          No hay actividades registradas
        </p>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          {/* Events */}
          <div className="space-y-6">
            {events.map((event, index) => {
              const Icon = event.icon
              return (
                <div key={`${event.type}-${event.id}`} className="relative flex items-start space-x-4">
                  {/* Icon */}
                  <div
                    className={`relative z-10 w-10 h-10 ${event.color} rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-white`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-800">{event.title}</h4>
                        {event.status && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}
                          >
                            {event.status}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{event.description}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(event.date)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
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
