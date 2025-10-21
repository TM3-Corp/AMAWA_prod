'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
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
  ChevronUp
} from 'lucide-react'

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
  }
}

type StatusFilter = 'ALL' | 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type TypeFilter = 'ALL' | '6_months' | '12_months' | '18_months' | '24_months'

export default function MaintenancesPage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<'scheduledDate' | 'client'>('scheduledDate')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    fetchMaintenances()
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      PENDING: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock, label: 'Pendiente' },
      SCHEDULED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Calendar, label: 'Agendada' },
      IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle, label: 'En Progreso' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Completada' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle, label: 'Cancelada' },
      RESCHEDULED: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Calendar, label: 'Reagendada' },
    }

    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {config.label}
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

  // Filter and sort maintenances
  const filteredMaintenances = maintenances
    .filter(m => {
      if (statusFilter !== 'ALL' && m.status !== statusFilter) return false
      if (typeFilter !== 'ALL' && m.type !== typeFilter) return false
      if (searchQuery && !m.client.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !m.client.comuna.toLowerCase().includes(searchQuery.toLowerCase())) return false
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

  const stats = {
    total: maintenances.length,
    pending: maintenances.filter(m => m.status === 'PENDING').length,
    scheduled: maintenances.filter(m => m.status === 'SCHEDULED').length,
    completed: maintenances.filter(m => m.status === 'COMPLETED').length,
  }

  if (loading) {
    return (
      <>
        <Navbar />
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
        <Navbar />
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Mantenciones
            </h1>
            <p className="text-gray-600">
              Lista completa de mantenciones programadas y completadas
            </p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
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

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Todos los estados</option>
                <option value="PENDING">Pendiente</option>
                <option value="SCHEDULED">Agendada</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="COMPLETED">Completada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>

              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Todos los tipos</option>
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

          {/* Maintenances Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
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
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaintenances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No se encontraron mantenciones
                    </td>
                  </tr>
                ) : (
                  filteredMaintenances.map((maintenance) => (
                    <tr key={maintenance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {maintenance.client.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {maintenance.client.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-gray-900">
                          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                          {maintenance.client.comuna}
                        </div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {maintenance.client.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          {new Date(maintenance.scheduledDate).toLocaleDateString('es-CL')}
                        </div>
                        {maintenance.completedAt && (
                          <div className="text-xs text-green-600 mt-1">
                            Completada: {new Date(maintenance.completedAt).toLocaleDateString('es-CL')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getTypeBadge(maintenance.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(maintenance.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/maintenances/${maintenance.id}`}
                          className="text-blue-600 hover:text-blue-900 font-medium"
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
