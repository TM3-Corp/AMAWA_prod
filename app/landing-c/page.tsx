import Link from 'next/link'
import { Calendar, FileText, Package, Users, ArrowRight, Zap, Target, BarChart3, Clock } from 'lucide-react'

export default function LandingC() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero with Problem/Solution */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Problem/Solution */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Transforma tu Operación
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                La Plataforma que
                <span className="block text-blue-600">Elimina el Caos</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Deja atrás las planillas desactualizadas, las órdenes perdidas y el descontrol de inventario.
                AMAWA centraliza todo en un sistema inteligente.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Ver Dashboard
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-colors"
                >
                  Iniciar Sesión
                </Link>
              </div>

              {/* Quick wins */}
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">-70%</span>
                  </div>
                  <p className="text-sm text-gray-600">Tiempo en tareas manuales</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <Target className="w-4 h-4" />
                    <span className="font-semibold">100%</span>
                  </div>
                  <p className="text-sm text-gray-600">Trazabilidad</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <BarChart3 className="w-4 h-4" />
                    <span className="font-semibold">Real-time</span>
                  </div>
                  <p className="text-sm text-gray-600">Datos actualizados</p>
                </div>
              </div>
            </div>

            {/* Right: Visual element */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="flex items-center justify-between mb-6 pb-6 border-b">
                  <img src="/images/amawa_logo.png" alt="AMAWA" className="h-8" />
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"></div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Calendario Mensual</div>
                      <div className="text-xs text-gray-500">Vista ejecutiva simplificada</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Órdenes de Trabajo</div>
                      <div className="text-xs text-gray-500">Generación automática</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Package className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Inventario Inteligente</div>
                      <div className="text-xs text-gray-500">Control automático de stock</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Users className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Base de Clientes</div>
                      <div className="text-xs text-gray-500">Vista 360° completa</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Before vs After */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              El Cambio que Necesitas
            </h2>
            <p className="text-xl text-gray-600">
              Compara tu operación actual con lo que podrías lograr
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Before */}
            <div className="bg-red-50 rounded-2xl p-8 border-2 border-red-100">
              <div className="text-sm font-semibold text-red-600 uppercase mb-4">❌ Sin AMAWA</div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Planillas Excel dispersas y desactualizadas</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Órdenes de trabajo creadas manualmente</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Inventario descontrolado, quiebres de stock frecuentes</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Datos duplicados y errores constantes</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Horas perdidas en tareas administrativas</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Sin visibilidad en tiempo real del negocio</span>
                </li>
              </ul>
            </div>

            {/* After */}
            <div className="bg-green-50 rounded-2xl p-8 border-2 border-green-200">
              <div className="text-sm font-semibold text-green-600 uppercase mb-4">✅ Con AMAWA</div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Datos centralizados en una sola fuente de verdad</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Órdenes generadas automáticamente con un clic</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Control total con alertas automáticas de reposición</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Información siempre correcta y actualizada</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Automatización que libera tiempo para crecer</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <span className="text-green-500 mt-1">•</span>
                  <span>Dashboard ejecutivo con métricas en tiempo real</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features with Benefits */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades que Marcan la Diferencia
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Calendario Ejecutivo</h3>
              <p className="text-gray-600 text-sm">
                Vista mensual clara con resumen de paquetes y generación automática de OTs
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-2xl mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Órdenes Inteligentes</h3>
              <p className="text-gray-600 text-sm">
                Agrupa mantenciones y calcula filtros necesarios automáticamente
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-2xl mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Inventario Real-Time</h3>
              <p className="text-gray-600 text-sm">
                Seguimiento automático con alertas cuando alcanzas nivel mínimo
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 text-white rounded-2xl mb-4">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Vista 360° Clientes</h3>
              <p className="text-gray-600 text-sm">
                Toda la información en un lugar: contratos, equipos e historial
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Moderniza tu Gestión Hoy
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Únete a las empresas que ya dejaron atrás Excel y ahora operan con eficiencia profesional
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Ver Demo
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white rounded-lg font-semibold border-2 border-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              Comenzar Ahora
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm">© 2025 AMAWA - Sistema de Gestión de Purificación de Agua</p>
            <p className="text-xs mt-2">Desarrollado por <span className="font-semibold text-blue-400">TM3 Corp</span></p>
          </div>
        </div>
      </footer>
    </main>
  )
}
