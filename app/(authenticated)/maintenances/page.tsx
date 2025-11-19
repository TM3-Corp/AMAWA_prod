'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  User,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react'
import { getMaintenanceStatusLabel, getMaintenanceStatusColor } from '@/lib/constants'

interface Maintenance {
  id: string
  scheduledDate: string
  type: string
  status: string
  notes: string | null
  completedAt: string | null
  client: {
    id: string
    name: string
    comuna: string
    address: string
    equipment: Array<{
      installationDate: string | null
    }>
  }
  incidents?: Array<{
    id: string
    category: string | null
    status: string
    createdAt: string
  }>
}

type StatusFilter = 'ALL' | 'PENDING' | 'SCHEDULED' | 'NO_RESPONDE' | 'COMPLETED' | 'RESCHEDULED'
type TypeFilter = 'ALL' | '6_months' | '12_months' | '18_months' | '24_months'

export default function MaintenancesPage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Get current month in YYYY-MM format for default
  const getCurrentMonth = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [monthFilter, setMonthFilter] = useState<string>(getCurrentMonth())
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'scheduledDate' | 'client'>('scheduledDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchMaintenances()
    // Check URL params for filters
    const params = new URLSearchParams(window.location.search)
    const monthParam = params.get('month')
    const deliveryParam = params.get('deliveryType')
    if (monthParam) setMonthFilter(monthParam)
    if (deliveryParam) setDeliveryTypeFilter(deliveryParam)
  }, [])

  const fetchMaintenances = async () => {
    try {
      setLoading(true)
      // TODO: Create API endpoint for maintenances list
      const response = await fetch('/api/maintenances')

      if (!response.ok) {
        throw new Error('Error al cargar mantenciones')
      }

      const data = await response.json()
      setMaintenances(data.maintenances || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort maintenances
  const filteredMaintenances = maintenances
    .filter(m => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false
      if (typeFilter !== 'ALL' && m.type !== typeFilter) return false

      // Delivery type filter
      if (deliveryTypeFilter !== 'ALL') {
        const maintenanceDeliveryType = (m as any).deliveryType || 'Delivery' // Default to Delivery if missing
        if (maintenanceDeliveryType !== deliveryTypeFilter) return false
      }

      // Month filter (YYYY-MM format)
      if (monthFilter) {
        const scheduledDate = new Date(m.scheduledDate)
        const scheduledMonth = `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, '0')}`
        if (scheduledMonth !== monthFilter) return false
      }

      // Improved search: split query by spaces and check if all parts match
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim()
        const searchTerms = query.split(/\s+/) // Split by whitespace
        const clientName = m.client.name.toLowerCase()
        const clientComuna = m.client.comuna.toLowerCase()
        const searchText = `${clientName} ${clientComuna}`

        // Check if ALL search terms are found in the combined text
        const allTermsMatch = searchTerms.every(term => searchText.includes(term))
        if (!allTermsMatch) return false
      }

      return true
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortField === 'scheduledDate') {
        comparison = new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      } else {
        comparison = a.client.name.localeCompare(b.client.name)
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

  // Bulk action handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredMaintenances.map(m => m.id))
      setSelectedIds(allIds)
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkStatusUpdate = async (status: 'COMPLETED' | 'PENDING') => {
    if (selectedIds.size === 0) {
      alert('No hay mantenciones seleccionadas')
      return
    }

    try {
      setBulkActionLoading(true)

      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/maintenances/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            ...(status === 'COMPLETED' ? {
              completedDate: new Date(),
              actualDate: new Date()
            } : {})
          })
        })
      )

      await Promise.all(promises)

      alert(`✅ ${selectedIds.size} mantenciones actualizadas a ${status === 'COMPLETED' ? 'Completada' : 'Pendiente'}`)
      setSelectedIds(new Set())
      await fetchMaintenances()
    } catch (error) {
      alert('❌ Error al actualizar mantenciones')
      console.error(error)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const getStatusBadge = (maintenance: Maintenance) => {
    // If there's a linked incident with a category, show that as the status
    const activeIncident = maintenance.incidents?.[0]
    const displayStatus = activeIncident?.category || maintenance.status

    const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      PENDING: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock, label: 'Pendiente' },
      SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Calendar, label: 'Agendada' },
      NO_RESPONDE: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertCircle, label: 'No Responde' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Completada' },
      RESCHEDULED: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Calendar, label: 'Reagendada' },
    }

    // Use config if it's a standard status, otherwise use helper functions for incident categories
    const config = statusConfig[displayStatus]

    if (config) {
      const Icon = config.icon
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          <Icon className="w-3 h-3" />
          {config.label}
        </span>
      )
    }

    // For incident categories, use the helper functions
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getMaintenanceStatusColor(displayStatus)}`}>
        <AlertCircle className="w-3 h-3" />
        {displayStatus}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      '6_months': '6 Meses',
      '12_months': '12 Meses',
      '18_months': '18 Meses',
      '24_months': '24 Meses',
    }

    return (
      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
        {typeLabels[type] || type}
      </span>
    )
  }

  const stats = {
    total: maintenances.length,
    pending: maintenances.filter(m => m.status === 'PENDING').length,
    scheduled: maintenances.filter(m => m.status === 'SCHEDULED').length,
    completed: maintenances.filter(m => m.status === 'COMPLETED').length,
  }

  if (loading) {
    return (
      <>
        
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Cargando mantenciones...</p>
          </div>
        </div>
      </>
    )
  }

  if (error) {
    return (
      <>
        
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar mantenciones</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchMaintenances}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </>
    )
  }

  // Helper to format month display
  const getMonthDisplay = () => {
    if (!monthFilter) return 'Todos los meses'
    const [year, month] = monthFilter.split('-')
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${monthNames[parseInt(month) - 1]} ${year}`
  }

  const isCurrentMonth = monthFilter === getCurrentMonth()

  return (
    <>

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Gestión de Mantenciones
                </h1>
                <p className="text-gray-600">
                  Lista completa de mantenciones programadas y completadas
                </p>
              </div>

              {/* Filtered Month Badge */}
              {monthFilter && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-6 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700 uppercase">
                      {isCurrentMonth ? 'Mes Actual' : 'Mes Seleccionado'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-blue-900 mb-1">
                    {getMonthDisplay()}
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {filteredMaintenances.length}
                  </div>
                  <div className="text-xs text-blue-700">
                    mantenciones programadas
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Pendientes</div>
              <div className="text-3xl font-bold text-gray-600">{stats.pending}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Agendadas</div>
              <div className="text-3xl font-bold text-blue-600">{stats.scheduled}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Completadas</div>
              <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Search - spans 1 column */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar cliente o comuna..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Month Filter - spans 2 columns at XL to give room for X button */}
              <div className="relative flex items-center gap-2 xl:col-span-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600 w-4 h-4 pointer-events-none" />
                  <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none font-semibold text-blue-900"
                  />
                </div>
                {monthFilter && (
                  <button
                    onClick={() => setMonthFilter('')}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Ver todos los meses"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Delivery Type Filter */}
              <select
                value={deliveryTypeFilter}
                onChange={(e) => setDeliveryTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Todos los tipos de entrega</option>
                <option value="Delivery">📦 Delivery</option>
                <option value="Presencial">👨‍🔧 Presencial</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="SCHEDULED">Agendada</option>
                <option value="NO_RESPONDE">No Responde</option>
                <option value="COMPLETED">Completada</option>
                <option value="RESCHEDULED">Reagendada</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Todos los ciclos</option>
                <option value="6_months">6 Meses</option>
                <option value="12_months">12 Meses</option>
                <option value="18_months">18 Meses</option>
                <option value="24_months">24 Meses</option>
              </select>

              {/* Sort */}
              <select
                value={`${sortField}-${sortDirection}`}
                onChange={(e) => {
                  const [field, direction] = e.target.value.split('-')
                  setSortField(field as 'scheduledDate' | 'client')
                  setSortDirection(direction as 'asc' | 'desc')
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="scheduledDate-asc">Fecha (más antigua)</option>
                <option value="scheduledDate-desc">Fecha (más reciente)</option>
                <option value="client-asc">Cliente (A-Z)</option>
                <option value="client-desc">Cliente (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900">
                  {selectedIds.size} {selectedIds.size === 1 ? 'mantención seleccionada' : 'mantenciones seleccionadas'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleBulkStatusUpdate('COMPLETED')}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {bulkActionLoading ? 'Procesando...' : 'Marcar como Completadas'}
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('PENDING')}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium disabled:opacity-50"
                >
                  {bulkActionLoading ? 'Procesando...' : 'Marcar como Pendientes'}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  disabled={bulkActionLoading}
                  className="px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Maintenances Table */}
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[3%] px-2 py-3">
                    <input
                      type="checkbox"
                      checked={filteredMaintenances.length > 0 && selectedIds.size === filteredMaintenances.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="w-[17%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Instalación
                  </th>
                  <th className="w-[12%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Programada
                  </th>
                  <th className="w-[9%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="w-[13%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="w-[15%] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaintenances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron mantenciones
                    </td>
                  </tr>
                ) : (
                  filteredMaintenances.map((maintenance) => (
                    <tr key={maintenance.id} className="hover:bg-gray-50">
                      <td className="px-2 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(maintenance.id)}
                          onChange={(e) => handleSelectOne(maintenance.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start">
                          <User className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 break-words">
                              {maintenance.client.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {maintenance.client.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start text-sm text-gray-900">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="break-words">{maintenance.client.comuna}</div>
                            <div className="text-xs text-gray-500 break-words line-clamp-2">
                              {maintenance.client.address}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {maintenance.client.equipment?.[0]?.installationDate ? (
                            new Date(maintenance.client.equipment[0].installationDate).toLocaleDateString('es-CL')
                          ) : (
                            <span className="text-gray-400 text-xs">Sin fecha</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-start text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="break-words">
                              {new Date(maintenance.scheduledDate).toLocaleDateString('es-CL')}
                            </div>
                            {maintenance.completedAt && (
                              <div className="text-xs text-green-600 mt-1 break-words">
                                Completada: {new Date(maintenance.completedAt).toLocaleDateString('es-CL')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getTypeBadge(maintenance.type)}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(maintenance)}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <Link
                          href={`/maintenances/${maintenance.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium inline-block break-words"
                        >
                          Ver Detalles
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600 text-center">
            Mostrando {filteredMaintenances.length} de {maintenances.length} mantenciones
          </div>
        </div>
      </div>
    </>
  )
}
