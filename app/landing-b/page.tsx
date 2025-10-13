import Link from 'next/link'
import { Calendar, FileText, Package, Users, ArrowRight } from 'lucide-react'

export default function LandingB() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section - Minimalist */}
      <section className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center space-y-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img
                src="/images/amawa_logo.png"
                alt="AMAWA Logo"
                className="h-16 w-auto opacity-90"
              />
            </div>

            {/* Simple headline */}
            <h1 className="text-6xl md:text-7xl font-bold text-gray-900 tracking-tight">
              Gestión Simple.<br />
              <span className="text-blue-600">Resultados Profesionales.</span>
            </h1>

            {/* Minimal description */}
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Plataforma completa para empresas de purificación de agua.
              Mantenciones, inventario y operaciones en un solo lugar.
            </p>

            {/* Clean CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Acceder al Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-900 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features - Clean Grid */}
      <section className="py-32 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cuatro Pilares, Una Plataforma
            </h2>
            <p className="text-lg text-gray-600">
              Todo lo que necesitas para gestionar tu operación eficientemente
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Feature 1 */}
            <div className="group">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Calendario Ejecutivo</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Vista mensual con resumen de mantenciones y generación automática de órdenes de trabajo.
                  Distingue entre entregas domicilio y presenciales.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-lg mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Órdenes de Trabajo</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Agrupa mantenciones por mes y tipo. Genera listas completas de filtros necesarios
                  y deduce inventario automáticamente.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-lg mb-4">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Control de Inventario</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Seguimiento en tiempo real de stock de filtros. Alertas automáticas cuando
                  se alcanza el nivel mínimo de reposición.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 text-orange-600 rounded-lg mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Gestión de Clientes</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Vista completa de cada cliente con contratos, equipos instalados,
                  historial de mantenciones y datos de contacto.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Value Prop */}
      <section className="py-32 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            De Excel a la Nube
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed mb-12">
            Centraliza tu operación, automatiza procesos repetitivos y toma decisiones
            basadas en datos reales. Todo accesible desde cualquier dispositivo.
          </p>
          <div className="grid md:grid-cols-3 gap-8 pt-8">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-gray-600">Cloud-Based</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">Disponibilidad</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">0</div>
              <div className="text-gray-600">Instalaciones</div>
            </div>
          </div>
        </div>
      </section>

      {/* Minimal CTA */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">
            Empieza Hoy
          </h2>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Acceder a la Plataforma
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-500 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm">© 2025 AMAWA</p>
            <p className="text-xs mt-2">Desarrollado por TM3 Corp</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
