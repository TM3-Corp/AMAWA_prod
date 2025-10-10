'use client'

import { useEffect, useState } from 'react'
import { Users, Wrench, Package, AlertCircle, TrendingUp, Calendar, ArrowUpRight, Clock, CheckCircle2, FileText } from 'lucide-react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

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
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Cargando dashboard...</p>
          </div>
        </div>
      </>
    )
  }

  if (!stats) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error al cargar estadísticas</h2>
            <p className="text-gray-600 mb-6">No se pudieron obtener los datos del dashboard.</p>
            <button
              onClick={() => { setLoading(true); fetchStats(); }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105"
            >
              Reintentar
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido al Dashboard
          </h1>
          <p className="text-gray-600">
            Resumen ejecutivo de operaciones AMAWA
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Clients Card */}
          <Link href="/clients" className="group">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100 hover:border-blue-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.clients.total}
              </div>
              <p className="text-sm text-gray-600 mb-3">Clientes Totales</p>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <TrendingUp className="w-4 h-4 mr-1" />
                {stats.clients.active} activos
              </div>
            </div>
          </Link>

          {/* Pending Maintenances Card */}
          <Link href="/maintenances" className="group">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100 hover:border-purple-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <Wrench className="w-6 h-6 text-white" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.maintenances.pending}
              </div>
              <p className="text-sm text-gray-600 mb-3">Mantenciones Pendientes</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {stats.maintenances.completed} completadas
                </span>
                <div className="flex items-center">
                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${stats.maintenances.complianceRate}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{stats.maintenances.complianceRate}%</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Inventory Card */}
          <Link href="/inventory" className="group">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100 hover:border-green-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/50">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.inventory.totalItems}
              </div>
              <p className="text-sm text-gray-600 mb-3">Items en Inventario</p>
              <div className="flex items-center text-orange-600 text-sm font-medium">
                <AlertCircle className="w-4 h-4 mr-1" />
                {stats.inventory.lowStock} bajo stock
              </div>
            </div>
          </Link>

          {/* Work Orders Card */}
          <Link href="/work-orders" className="group">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border border-gray-100 hover:border-orange-200 transform hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats.maintenances.nextMonth}
              </div>
              <p className="text-sm text-gray-600 mb-3">Próximo Mes</p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <Calendar className="w-4 h-4 mr-1" />
                Ver órdenes de trabajo
              </div>
            </div>
          </Link>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Comunas */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Distribución por Comuna</h3>
              <Link href="/clients" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Ver todos
              </Link>
            </div>
            <div className="space-y-4">
              {stats.topComunas.map((comuna, index) => {
                const percentage = (comuna.count / stats.clients.total) * 100
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{comuna.name}</span>
                      <span className="text-sm font-bold text-gray-900">{comuna.count}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/clients/new"
                className="group p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Nuevo Cliente</p>
                <p className="text-xs text-gray-600 mt-1">Registrar cliente</p>
              </Link>

              <Link
                href="/maintenances"
                className="group p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Calendario</p>
                <p className="text-xs text-gray-600 mt-1">Ver mantenciones</p>
              </Link>

              <Link
                href="/work-orders"
                className="group p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Órdenes</p>
                <p className="text-xs text-gray-600 mt-1">Gestionar OTs</p>
              </Link>

              <Link
                href="/inventory"
                className="group p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg mb-3 shadow-sm group-hover:shadow-md transition-shadow">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Inventario</p>
                <p className="text-xs text-gray-600 mt-1">Ver stock</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
