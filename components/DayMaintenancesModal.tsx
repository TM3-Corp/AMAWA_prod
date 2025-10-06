'use client'

import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Maintenance {
  id: string
  scheduledDate: string
  actualDate: string | null
  completedDate: string | null
  status: string
  type: string
  isOverdue: boolean
  client: {
    id: string
    name: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    comuna: string | null
    equipment: any[]
    contracts: any[]
  }
}

interface DayMaintenancesModalProps {
  date: Date
  maintenances: Maintenance[]
  isOpen: boolean
  onClose: () => void
}

export default function DayMaintenancesModal({
  date,
  maintenances,
  isOpen,
  onClose
}: DayMaintenancesModalProps) {
  const router = useRouter()

  if (!isOpen) return null

  const dateStr = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      SCHEDULED: { label: 'Agendada', color: 'bg-blue-100 text-blue-800' },
      IN_PROGRESS: { label: 'En Progreso', color: 'bg-purple-100 text-purple-800' },
      COMPLETED: { label: 'Completada', color: 'bg-green-100 text-green-800' },
      CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
      RESCHEDULED: { label: 'Reprogramada', color: 'bg-orange-100 text-orange-800' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getTypeLabel = (type: string) => {
    const typeLabels = {
      '6_months': '6 meses',
      '12_months': '12 meses',
      '18_months': '18 meses',
      '24_months': '24 meses'
    }
    return typeLabels[type as keyof typeof typeLabels] || type
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold capitalize">{dateStr}</h2>
            <p className="text-gray-600 mt-1">
              {maintenances.length} mantención{maintenances.length !== 1 ? 'es' : ''} programada{maintenances.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {maintenances.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay mantenciones programadas para este día
            </p>
          ) : (
            <div className="space-y-4">
              {maintenances.map(maintenance => {
                const isOverdue = new Date(maintenance.scheduledDate) < new Date() &&
                                 maintenance.status === 'PENDING'

                return (
                  <div
                    key={maintenance.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                      isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => router.push(`/maintenances/${maintenance.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {maintenance.client.firstName} {maintenance.client.lastName}
                          </h3>
                          {getStatusBadge(maintenance.status)}
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Tipo:</span> Mantención {getTypeLabel(maintenance.type)}
                          </p>
                          {maintenance.client.email && (
                            <p>
                              <span className="font-medium">Email:</span> {maintenance.client.email}
                            </p>
                          )}
                          {maintenance.client.phone && (
                            <p>
                              <span className="font-medium">Teléfono:</span> {maintenance.client.phone}
                            </p>
                          )}
                        </div>

                        {isOverdue && (
                          <div className="mt-2 text-red-600 text-sm font-medium">
                            ⚠️ Mantención vencida
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
