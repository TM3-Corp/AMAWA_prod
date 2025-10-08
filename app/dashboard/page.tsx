'use client'

import { useEffect, useState } from 'react'
import { Users, Wrench, Package, AlertCircle, TrendingUp, Calendar } from 'lucide-react'
import UserMenu from '@/components/auth/UserMenu'

interface Stats {
  clients: {
    total: number
    active: number
    inactive: number
  }
  maintenances: {
    pending: number
    completed: number
    complianceRate: number
    nextMonth: number
  }
  inventory: {
    totalItems: number
    lowStock: number
    categories: number
  }
  incidents: {
    open: number
  }
  topComunas: Array<{
    name: string
    count: number
  }>
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()

      // Check if API returned an error
      if (data.error || !data.clients) {
        console.error('Stats API error:', data.error || 'Invalid data structure')
        setStats(null)
      } else {
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando dashboard...</div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">Error al cargar estadísticas</div>
          <p className="text-gray-600 mb-6">No se pudieron obtener los datos del dashboard.</p>
          <button
            onClick={() => { setLoading(true); fetchStats(); }}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/images/amawa_logo.png"
                alt="AMAWA Logo"
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Dashboard AMAWA</h1>
                <p className="text-sm text-gray-500">Sistema de Gestión Integral</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/clients" className="px-4 py-2 text-gray-600 hover:text-purple-600">
                Clientes
              </a>
              <a href="/maintenances" className="px-4 py-2 text-gray-600 hover:text-purple-600">
                Mantenciones
              </a>
              <a href="/inventory" className="px-4 py-2 text-gray-600 hover:text-purple-600">
                Inventario
              </a>
              <div className="border-l border-gray-300 h-8 mx-2"></div>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Clients */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs text-gray-500">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {stats?.clients.total || 0}
            </div>
            <p className="text-sm text-gray-600 mt-2">Clientes Activos</p>
            <div className="mt-3 flex items-center text-green-500 text-sm">
              <TrendingUp className="w-4 h-4 mr-1" />
              {stats?.clients.active || 0} activos
            </div>
          </div>

          {/* Pending Maintenances */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">Este mes</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {stats?.maintenances.pending || 0}
            </div>
            <p className="text-sm text-gray-600 mt-2">Mantenciones Pendientes</p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Compliance</span>
                <span>{stats?.maintenances.complianceRate || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats?.maintenances.complianceRate || 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">Stock</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {stats?.inventory.totalItems || 0}
            </div>
            <p className="text-sm text-gray-600 mt-2">Items en Inventario</p>
            <div className="mt-3 flex items-center text-orange-500 text-sm">
              <AlertCircle className="w-4 h-4 mr-1" />
              {stats?.inventory.lowStock || 0} bajo stock
            </div>
          </div>

          {/* Open Incidents */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-xs text-gray-500">Abiertos</span>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {stats?.incidents.open || 0}
            </div>
            <p className="text-sm text-gray-600 mt-2">Incidentes Activos</p>
            <div className="mt-3 flex items-center text-gray-500 text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              Requieren atención
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Comunas */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Top Comunas</h3>
            <div className="space-y-3">
              {stats?.topComunas.map((comuna, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{comuna.name}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ 
                          width: `${(comuna.count / (stats?.clients.total || 1)) * 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-800 w-12 text-right">
                      {comuna.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="/clients/new" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition text-left cursor-pointer">
                <Users className="w-5 h-5 text-purple-600 mb-2" />
                <p className="text-sm font-medium text-gray-800">Nuevo Cliente</p>
              </a>
              <a href="/maintenances" className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition text-left cursor-pointer">
                <Wrench className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-sm font-medium text-gray-800">Ver Mantenciones</p>
              </a>
              <a href="/inventory" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition text-left cursor-pointer">
                <Package className="w-5 h-5 text-green-600 mb-2" />
                <p className="text-sm font-medium text-gray-800">Ver Inventario</p>
              </a>
              <a href="/clients" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition text-left cursor-pointer">
                <AlertCircle className="w-5 h-5 text-orange-600 mb-2" />
                <p className="text-sm font-medium text-gray-800">Ver Clientes</p>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}