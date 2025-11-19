'use client'

import { useEffect, useState } from 'react'
import { X, Users, TrendingUp, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

interface StatsData {
  totalClients: number
  contactChannelStats: Record<string, number>
  comunaStats: Record<string, number>
  statusStats: Record<string, number>
  propertyTypeStats: Record<string, number>
}

interface ClientStatsModalProps {
  isOpen: boolean
  onClose: () => void
}

const COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export function ClientStatsModal({ isOpen, onClose }: ClientStatsModalProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchStats()
    }
  }, [isOpen])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/clients/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  // Transform data for charts
  const contactChannelData = stats
    ? Object.entries(stats.contactChannelStats).map(([name, value]) => ({ name, value }))
    : []

  const comunaData = stats
    ? Object.entries(stats.comunaStats)
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .slice(0, 10) // Top 10 comunas
        .map(([name, value]) => ({ name, value }))
    : []

  const statusData = stats
    ? Object.entries(stats.statusStats).map(([name, value]) => ({ name, value }))
    : []

  const propertyTypeData = stats
    ? Object.entries(stats.propertyTypeStats).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Estadísticas de Clientes</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center">
            <p className="text-gray-600">Cargando estadísticas...</p>
          </div>
        ) : stats ? (
          <div className="p-6 space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Clientes</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">{stats.totalClients}</p>
                  </div>
                  <Users className="w-12 h-12 text-purple-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Canales de Contacto</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                      {Object.keys(stats.contactChannelStats).length}
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Comunas Atendidas</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {Object.keys(stats.comunaStats).length}
                    </p>
                  </div>
                  <BarChart3 className="w-12 h-12 text-green-400" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Clientes Activos</p>
                    <p className="text-3xl font-bold text-orange-900 mt-2">
                      {stats.statusStats.ACTIVE || 0}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-orange-400" />
                </div>
              </div>
            </div>

            {/* Canal de Contacto Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Distribución por Canal de Contacto
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contactChannelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Cantidad de Clientes" radius={[8, 8, 0, 0]}>
                    {contactChannelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Two column layout for Comuna and Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Comuna Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Top 10 Comunas
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={comunaData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="value" name="Clientes" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status Distribution Pie Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Estado de Clientes
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Property Type Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                Distribución por Tipo de Propiedad
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={propertyTypeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Cantidad de Clientes" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-gray-600">No se pudieron cargar las estadísticas</p>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full md:w-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
