'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Filter, Search, AlertCircle, CheckCircle, Clock, CalendarDays, RefreshCw } from 'lucide-react'
import MaintenanceCalendar from '@/components/MaintenanceCalendar'
import DayMaintenancesModal from '@/components/DayMaintenancesModal'
import BulkRescheduleModal from '@/components/BulkRescheduleModal'

interface Maintenance {
  id: string
  scheduledDate: string
  actualDate: string | null
  completedDate: string | null
  type: string
  status: string
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

export default function MaintenancesPage() {
  const router = useRouter()
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  })
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    overdue: 0,
    completed: 0,
    upcoming: 0
  })
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showDayModal, setShowDayModal] = useState(false)
  const [dayModalData, setDayModalData] = useState<{ date: Date; maintenances: Maintenance[] }>({
    date: new Date(),
    maintenances: []
  })
  const [showBulkReschedule, setShowBulkReschedule] = useState(false)

  useEffect(() => {
    fetchMaintenances()
  }, [filters, viewMode])

  const fetchMaintenances = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.status) params.append('status', filters.status)
      if (filters.type) params.append('type', filters.type)
      if (filters.search) params.append('search', filters.search)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      // For calendar view, fetch all maintenances (no limit)
      // For list view, use pagination
      if (viewMode === 'list') {
        params.append('limit', '100')
      } else {
        params.append('limit', '5000') // High limit for calendar to show all
      }

      const response = await fetch(`/api/maintenances?${params.toString()}`)
      const data = await response.json()

      setMaintenances(data.maintenances || [])

      // Calculate stats
      const pending = data.maintenances.filter((m: Maintenance) => m.status === 'PENDING' && !m.isOverdue).length
      const overdue = data.maintenances.filter((m: Maintenance) => m.isOverdue).length
      const completed = data.maintenances.filter((m: Maintenance) => m.status === 'COMPLETED').length
      const upcoming = data.maintenances.filter((m: Maintenance) =>
        m.status === 'PENDING' && new Date(m.scheduledDate) > new Date()
      ).length

      setStats({
        total: data.pagination.total,
        pending,
        overdue,
        completed,
        upcoming
      })
    } catch (error) {
      console.error('Error fetching maintenances:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (maintenance: Maintenance) => {
    if (maintenance.isOverdue) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Atrasada
        </span>
      )
    }

    const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
      PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      SCHEDULED: { label: 'Agendada', color: 'bg-blue-100 text-blue-800', icon: Calendar },
      IN_PROGRESS: { label: 'En Progreso', color: 'bg-purple-100 text-purple-800', icon: Clock },
      COMPLETED: { label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      CANCELLED: { label: 'Cancelada', color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      RESCHEDULED: { label: 'Reagendada', color: 'bg-orange-100 text-orange-800', icon: CalendarDays }
    }

    const config = statusConfig[maintenance.status] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      '6_months': '6 Meses',
      '12_months': '12 Meses',
      '18_months': '18 Meses',
      '24_months': '24 Meses'
    }
    return typeLabels[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Only select pending and scheduled maintenances
      const selectableIds = maintenances
        .filter(m => m.status === 'PENDING' || m.status === 'SCHEDULED')
        .map(m => m.id)
      setSelectedIds(selectableIds)
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const handleDayClick = (date: Date, dayMaintenances: Maintenance[]) => {
    setDayModalData({ date, maintenances: dayMaintenances })
    setShowDayModal(true)
  }

  const handleBulkReschedule = async (newDate: string, notes: string) => {
    try {
      const response = await fetch('/api/maintenances/bulk-reschedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          maintenanceIds: selectedIds,
          newDate,
          notes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reschedule')
      }

      // Refresh maintenances
      await fetchMaintenances()
      setSelectedIds([])
      setShowBulkReschedule(false)
    } catch (error) {
      console.error('Error rescheduling maintenances:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <img
                src="/images/amawa_logo.png"
                alt="AMAWA Logo"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Mantenciones</h1>
                <p className="text-sm text-gray-500">Gestión de mantenciones programadas</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Lista
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 rounded-lg transition ${
                  viewMode === 'calendar'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Calendario
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Próximas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="PENDING">Pendiente</option>
                <option value="OVERDUE">Atrasada</option>
                <option value="SCHEDULED">Agendada</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="COMPLETED">Completada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todos</option>
                <option value="6_months">6 Meses</option>
                <option value="12_months">12 Meses</option>
                <option value="18_months">18 Meses</option>
                <option value="24_months">24 Meses</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desde
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasta
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Cliente
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nombre del cliente..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && viewMode === 'list' && (
          <div className="bg-purple-600 text-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">
                {selectedIds.length} mantención{selectedIds.length !== 1 ? 'es' : ''} seleccionada{selectedIds.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBulkReschedule(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Reprogramar Seleccionadas
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-4 py-2 bg-purple-700 rounded-lg hover:bg-purple-800 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Maintenance List */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={selectedIds.length > 0 && selectedIds.length === maintenances.filter(m => m.status === 'PENDING' || m.status === 'SCHEDULED').length}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Programada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comuna
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : maintenances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No se encontraron mantenciones
                      </td>
                    </tr>
                  ) : (
                    maintenances.map((maintenance) => {
                      const canSelect = maintenance.status === 'PENDING' || maintenance.status === 'SCHEDULED'
                      return (
                        <tr
                          key={maintenance.id}
                          className={`hover:bg-gray-50 transition ${selectedIds.includes(maintenance.id) ? 'bg-purple-50' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(maintenance.id)}
                              onChange={() => handleSelectOne(maintenance.id)}
                              disabled={!canSelect}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer"
                            onClick={() => router.push(`/maintenances/${maintenance.id}`)}
                          >
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {maintenance.client.name}
                                </div>
                                {maintenance.client.phone && (
                                  <div className="text-sm text-gray-500">
                                    {maintenance.client.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer"
                            onClick={() => router.push(`/maintenances/${maintenance.id}`)}
                          >
                            <div className="text-sm text-gray-900">
                              {formatDate(maintenance.scheduledDate)}
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer"
                            onClick={() => router.push(`/maintenances/${maintenance.id}`)}
                          >
                            <span className="text-sm text-gray-900">
                              {getTypeBadge(maintenance.type)}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap cursor-pointer"
                            onClick={() => router.push(`/maintenances/${maintenance.id}`)}
                          >
                            {getStatusBadge(maintenance)}
                          </td>
                          <td
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                            onClick={() => router.push(`/maintenances/${maintenance.id}`)}
                          >
                            {maintenance.client.comuna || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/maintenances/${maintenance.id}`)
                              }}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <MaintenanceCalendar
            maintenances={maintenances}
            onDateClick={handleDayClick}
          />
        )}

        {/* Modals */}
        <DayMaintenancesModal
          date={dayModalData.date}
          maintenances={dayModalData.maintenances}
          isOpen={showDayModal}
          onClose={() => setShowDayModal(false)}
        />

        <BulkRescheduleModal
          isOpen={showBulkReschedule}
          onClose={() => setShowBulkReschedule(false)}
          selectedIds={selectedIds}
          onReschedule={handleBulkReschedule}
        />
      </div>
    </div>
  )
}
