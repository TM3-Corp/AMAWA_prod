import Link from 'next/link'
import { CheckCircle, Users, BarChart3, Wrench, Droplets, Shield, Zap, TrendingUp, ArrowRight, Calendar, Package, FileText } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <img
                src="/images/amawa_logo.png"
                alt="AMAWA Logo"
                className="h-16 w-auto"
              />
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                AMAWA
              </h1>
            </div>
            <p className="text-2xl md:text-3xl text-gray-700 font-semibold mb-4">
              Gestión Inteligente de Purificación de Agua
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Plataforma integral para automatizar mantenciones, gestionar inventario y optimizar operaciones
            </p>
          </div>

          {/* Status Card */}
          <div className="max-w-2xl mx-auto mb-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-3">
                Sistema en Producción
              </h2>
              <p className="text-center text-gray-600 mb-8 text-lg">
                Todos los servicios operando normalmente
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-100">
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">675</p>
                  <p className="text-sm text-gray-600 mt-1">Clientes Activos</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">142</p>
                  <p className="text-sm text-gray-600 mt-1">Mantenciones/mes</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">98%</p>
                  <p className="text-sm text-gray-600 mt-1">Disponibilidad</p>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  href="/dashboard"
                  className="flex-1 group flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/50 hover:shadow-xl hover:scale-105 transition-all"
                >
                  <BarChart3 className="w-5 h-5" />
                  Ir al Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/login"
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-700 rounded-xl font-semibold border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  Iniciar Sesión
                </Link>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="max-w-6xl mx-auto mb-16">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Características Principales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Calendario Ejecutivo
                </h4>
                <p className="text-gray-600">
                  Vista mensual de mantenciones con generación automática de órdenes de trabajo
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/50">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Órdenes de Trabajo
                </h4>
                <p className="text-gray-600">
                  Gestión mensual agrupada por tipo de entrega con control de inventario
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/50">
                  <Package className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Control de Inventario
                </h4>
                <p className="text-gray-600">
                  Seguimiento automático de stock con alertas de reabastecimiento
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/50">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Vista 360° de Clientes
                </h4>
                <p className="text-gray-600">
                  Información completa de contratos, equipos y historial de mantenciones
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/50">
                  <Droplets className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Gestión de Filtros
                </h4>
                <p className="text-gray-600">
                  Sistema completo de paquetes y mapeo de filtros por equipo
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-pink-500/50">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  Analytics y Reportes
                </h4>
                <p className="text-gray-600">
                  Estadísticas en tiempo real y reportes de cumplimiento
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack Badge */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex flex-wrap items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Supabase Auth</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Next.js 14</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">PostgreSQL</span>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-cyan-600" />
                  <span className="text-sm font-medium text-gray-700">Prisma ORM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">© 2025 AMAWA - Sistema de Gestión de Purificación de Agua</p>
            <p className="text-xs mt-2">Desarrollado por <span className="font-semibold text-blue-600">TM3 Corp</span></p>
          </div>
        </div>
      </footer>
    </main>
  )
}
