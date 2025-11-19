'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, TrendingUp, BarChart3, MapPin, Activity } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'

interface StatsData {
  totalClients: number
  contactChannelStats: Record<string, number>
  comunaStats: Record<string, number>
  statusStats: Record<string, number>
  propertyTypeStats: Record<string, number>
}

const COLORS = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

export default function ClientStatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/clients')}
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
              <h1 className="text-2xl font-bold text-gray-800">Estadísticas de Clientes</h1>
              <p className="text-sm text-gray-500">Análisis y métricas de la base de clientes</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Activity className="w-16 h-16 text-purple-600 animate-pulse mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Cargando estadísticas...</p>
            </div>
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Clientes</p>
                    <p className="text-4xl font-bold text-purple-600">{stats.totalClients}</p>
                    <p className="text-xs text-gray-500 mt-1">Base total de clientes</p>
                  </div>
                  <div className="p-4 bg-purple-100 rounded-full">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Canales de Contacto</p>
                    <p className="text-4xl font-bold text-blue-600">
                      {Object.keys(stats.contactChannelStats).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Canales activos</p>
                  </div>
                  <div className="p-4 bg-blue-100 rounded-full">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Comunas Atendidas</p>
                    <p className="text-4xl font-bold text-green-600">
                      {Object.keys(stats.comunaStats).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Cobertura geográfica</p>
                  </div>
                  <div className="p-4 bg-green-100 rounded-full">
                    <MapPin className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Clientes Activos</p>
                    <p className="text-4xl font-bold text-orange-600">
                      {stats.statusStats.ACTIVE || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.totalClients > 0
                        ? `${((stats.statusStats.ACTIVE / stats.totalClients) * 100).toFixed(1)}%`
                        : '0%'} del total
                    </p>
                  </div>
                  <div className="p-4 bg-orange-100 rounded-full">
                    <Activity className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Canal de Contacto Chart */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Distribución por Canal de Contacto</h3>
                  <p className="text-sm text-gray-500">Cómo llegaron los clientes a AMAWA</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={contactChannelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                  <YAxis tick={{ fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Comuna Chart */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Top 10 Comunas</h3>
                    <p className="text-sm text-gray-500">Principales ubicaciones de clientes</p>
                  </div>
                </div>
                {comunaData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={comunaData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" tick={{ fill: '#6b7280' }} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={140} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Bar dataKey="value" name="Clientes" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[450px] text-gray-400">
                    <p>No hay datos de comunas disponibles</p>
                  </div>
                )}
              </div>

              {/* Status Distribution Pie Chart */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Estado de Clientes</h3>
                    <p className="text-sm text-gray-500">Distribución por estado</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={450}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={140}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Property Type Chart */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Distribución por Tipo de Propiedad</h3>
                  <p className="text-sm text-gray-500">Clasificación de clientes por tipo de propiedad</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={propertyTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fill: '#6b7280' }} />
                  <YAxis tick={{ fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="value" name="Cantidad de Clientes" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-20">
            <div className="text-center bg-white rounded-xl shadow-lg p-12 max-w-md">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg font-medium">No se pudieron cargar las estadísticas</p>
              <button
                onClick={fetchStats}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
