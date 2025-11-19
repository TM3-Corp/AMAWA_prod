'use client'

import { useState, useEffect } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  List,
  Plus,
  Edit,
  Trash2,
  Save,
  X as XIcon
} from 'lucide-react'
import DynamicIncidentChart from '@/components/DynamicIncidentChart'
import IncidentFormModal from '@/components/IncidentFormModal'

interface Incident {
  id: string
  clientId: string
  maintenanceId: string | null
  category: string | null
  status: string
  priority: string
  equipmentType: string | null
  color: string | null
  filterType: string | null
  deliveryType: string | null
  technicianName: string | null
  vtDate: string | null
  vtReason: string | null
  month: string | null
  comments: string | null
  createdAt: string
  resolvedAt: string | null
  client: {
    id: string
    name: string
    email: string | null
    phone: string | null
    comuna: string | null
  }
}

interface Stats {
  total: number
  byCategory: { category: string; count: number }[]
  byStatus: { status: string; count: number }[]
  byMonth: { month: string; count: number }[]
  byTechnician: { technician: string; count: number }[]
}

type TabType = 'gestion' | 'reporte'

export default function IncidenciasPage() {
  const [activeTab, setActiveTab] = useState<TabType>('gestion')
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [showFilters, setShowFilters] = useState(true) // Expanded by default

  // Pagination
  const [limit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  // CRUD State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null)
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null)
  const [statusChangeIncident, setStatusChangeIncident] = useState<{incident: Incident, newStatus: string} | null>(null)
  const [commentForStatusChange, setCommentForStatusChange] = useState('')

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('limit', limit.toString())
      params.set('offset', offset.toString())

      if (selectedStatus) {
        params.set('status', selectedStatus)
      }
      if (searchTerm) {
        params.set('search', searchTerm)
      }

      const response = await fetch(`/api/incidents?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar incidencias')
      }

      setIncidents(data.incidents)
      setTotal(data.pagination.total)
    } catch (err: any) {
      setError(err.message || 'Error al cargar las incidencias')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/incidents/stats')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar estadísticas')
      }

      setStats(data)
    } catch (err: any) {
      console.error('Error loading stats:', err)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [selectedStatus, searchTerm, offset])

  useEffect(() => {
    fetchStats()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <AlertCircle className="h-3 w-3" />
            Abierto
          </span>
        )
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            En Progreso
          </span>
        )
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Resuelto
          </span>
        )
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="h-3 w-3" />
            Cerrado
          </span>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // No frontend filtering - search is done on backend
  const filteredIncidents = incidents

  // Count open/closed incidents
  const openCount = stats?.byStatus.find(s => s.status === 'OPEN')?.count || 0
  const closedCount = stats?.byStatus.find(s => s.status === 'CLOSED')?.count || 0

  // CRUD Handlers
  const handleDelete = async (incidentId: string) => {
    try {
      const response = await fetch(`/api/incidents/${incidentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      setDeletingIncident(null)
      fetchIncidents()
      fetchStats()
    } catch (err) {
      console.error('Error deleting incident:', err)
      alert('Error al eliminar la incidencia')
    }
  }

  const handleSaveIncident = () => {
    fetchIncidents()
    fetchStats()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Incidencias</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestión y análisis de problemas reportados por clientes
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('gestion')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === 'gestion'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <List className="h-4 w-4" />
              Gestión Incidencias
            </button>
            <button
              onClick={() => setActiveTab('reporte')}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all ${
                activeTab === 'reporte'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Reporte Incidencias
            </button>
          </div>
        </div>

        {/* Gestión Incidencias Tab */}
        {activeTab === 'gestion' && (
          <>
            {/* Create Button */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="h-4 w-4" />
                Nueva Incidencia
              </button>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-blue-100 text-sm font-medium">Total Incidencias</div>
                      <div className="mt-2 text-3xl font-bold text-white">{stats.total}</div>
                    </div>
                    <div className="p-3 bg-white/20 rounded-lg">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-green-100 text-sm font-medium">Cerradas</div>
                      <div className="mt-2 text-3xl font-bold text-white">{closedCount}</div>
                    </div>
                    <div className="p-3 bg-white/20 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-lg mb-6 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-b border-gray-200">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Filtros y Búsqueda
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      showFilters ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {showFilters && (
                <div className="p-6 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Buscar
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Cliente, técnico, equipo..."
                          className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Status filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Estado
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Todos los estados</option>
                        <option value="OPEN">Abierto</option>
                        <option value="IN_PROGRESS">En Progreso</option>
                        <option value="RESOLVED">Resuelto</option>
                        <option value="CLOSED">Cerrado</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Table */}
            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
                <p className="mt-4 text-sm text-gray-600">Cargando incidencias...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No se encontraron incidencias</p>
                <p className="text-sm text-gray-500 mt-1">Intenta ajustar los filtros de búsqueda</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                      <tr>
                        <th className="w-[12%] px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th className="w-[10%] px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="w-[10%] px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Equipo
                        </th>
                        <th className="w-[8%] px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Filtrado
                        </th>
                        <th className="w-[10%] px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Técnico
                        </th>
                        <th className="w-[9%] px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="w-[8%] px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Fecha VT
                        </th>
                        <th className="w-[23%] px-3 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Razón VT / Comentarios
                        </th>
                        <th className="w-[10%] px-3 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredIncidents.map((incident, index) => (
                        <tr
                          key={incident.id}
                          className={`hover:bg-blue-50/50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                          }`}
                        >
                          <td className="px-3 py-3">
                            <div className="text-sm font-semibold text-gray-900 break-words">
                              {incident.client.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 break-words">
                              {incident.client.comuna || 'Sin comuna'}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 break-words">
                              {incident.category || 'Sin categoría'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-sm font-medium text-gray-900 break-words">
                              {incident.equipmentType || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-sm text-gray-700 break-words">
                              {incident.filterType || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-sm text-gray-700 break-words">
                              {incident.technicianName || '-'}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {getStatusBadge(incident.status)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(incident.vtDate || incident.createdAt)}
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-sm text-gray-700">
                              {incident.vtReason && (
                                <div className="font-medium text-gray-900 mb-1 break-words">
                                  {incident.vtReason}
                                </div>
                              )}
                              {incident.comments && (
                                <div className="text-xs text-gray-500 break-words line-clamp-3">
                                  {incident.comments}
                                </div>
                              )}
                              {!incident.vtReason && !incident.comments && '-'}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setEditingIncident(incident)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingIncident(incident)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-semibold">{offset + 1}</span> a{' '}
                    <span className="font-semibold">{Math.min(offset + limit, total)}</span> de{' '}
                    <span className="font-semibold">{total}</span> incidencias
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setOffset(offset + limit)}
                      disabled={offset + limit >= total}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Reporte Incidencias Tab */}
        {activeTab === 'reporte' && (
          <div className="mt-6">
            <DynamicIncidentChart />
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <IncidentFormModal
            onClose={() => setShowCreateModal(false)}
            onSave={handleSaveIncident}
          />
        )}

        {editingIncident && (
          <IncidentFormModal
            incident={editingIncident}
            onClose={() => setEditingIncident(null)}
            onSave={handleSaveIncident}
          />
        )}

        {deletingIncident && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Eliminar Incidencia</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Cliente:</span> {deletingIncident.client.name}
                </p>
                {deletingIncident.category && (
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-semibold">Categoría:</span> {deletingIncident.category}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingIncident(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deletingIncident.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
