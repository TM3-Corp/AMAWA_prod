/**
 * Standard incident categories used across the platform
 * Based on historical data analysis
 */
export const INCIDENT_CATEGORIES = [
  'Retiro de equipo',
  'Filtración',
  'Mantención',
  'Problema de filtros',
  'Cambio de sistema',
  'Problema de funcionamiento',
  'Cambio de domicilio',
  'Cambio de equipo',
  'Problema de instalación',
  'Cambio de ubicación',
  'Instalación',
  'Reinstalación',
  'Problema estético',
  'Disconformidad',
  'Cambio de color',
] as const

export type IncidentCategory = typeof INCIDENT_CATEGORIES[number]

/**
 * Maintenance status values
 * - PENDING: Default status, awaiting work order
 * - SCHEDULED: Linked to a GENERATED work order
 * - NO_RESPONDE: Client not responding
 * - COMPLETED: Maintenance completed successfully
 * - RESCHEDULED: Maintenance rescheduled to another date
 * - Dynamic: When linked to incident, uses incident category as status
 */
export const MAINTENANCE_STATUSES = {
  PENDING: 'PENDING',
  SCHEDULED: 'SCHEDULED',
  NO_RESPONDE: 'NO_RESPONDE',
  COMPLETED: 'COMPLETED',
  RESCHEDULED: 'RESCHEDULED',
} as const

export type MaintenanceStatus = typeof MAINTENANCE_STATUSES[keyof typeof MAINTENANCE_STATUSES] | IncidentCategory

/**
 * Get display label for maintenance status
 */
export function getMaintenanceStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    PENDING: 'Pendiente',
    SCHEDULED: 'Agendada',
    NO_RESPONDE: 'No Responde',
    COMPLETED: 'Completada',
    RESCHEDULED: 'Reagendada',
    // Incident categories are used as-is
  }

  return statusLabels[status] || status
}

/**
 * Get color class for maintenance status badge
 */
export function getMaintenanceStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-800',
    SCHEDULED: 'bg-blue-100 text-blue-800',
    NO_RESPONDE: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    RESCHEDULED: 'bg-purple-100 text-purple-800',
    // Incident categories - use red/warning colors
    'Retiro de equipo': 'bg-red-100 text-red-800',
    'Filtración': 'bg-yellow-100 text-yellow-800',
    'Mantención': 'bg-blue-100 text-blue-800',
    'Problema de filtros': 'bg-red-100 text-red-800',
    'Cambio de sistema': 'bg-purple-100 text-purple-800',
    'Problema de funcionamiento': 'bg-red-100 text-red-800',
    'Cambio de domicilio': 'bg-indigo-100 text-indigo-800',
    'Cambio de equipo': 'bg-purple-100 text-purple-800',
    'Problema de instalación': 'bg-red-100 text-red-800',
    'Cambio de ubicación': 'bg-indigo-100 text-indigo-800',
    'Instalación': 'bg-blue-100 text-blue-800',
    'Reinstalación': 'bg-purple-100 text-purple-800',
    'Problema estético': 'bg-yellow-100 text-yellow-800',
    'Disconformidad': 'bg-orange-100 text-orange-800',
    'Cambio de color': 'bg-indigo-100 text-indigo-800',
  }

  return colorMap[status] || 'bg-gray-100 text-gray-800'
}

/**
 * Work order statuses
 */
export const WORK_ORDER_STATUSES = {
  DRAFT: 'DRAFT',
  GENERATED: 'GENERATED',
  CANCELLED: 'CANCELLED',
} as const

export type WorkOrderStatus = typeof WORK_ORDER_STATUSES[keyof typeof WORK_ORDER_STATUSES]
