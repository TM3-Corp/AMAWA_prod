'use client'

import Link from 'next/link'
import { Eye, Palette } from 'lucide-react'

export default function PreviewLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Palette className="w-4 h-4" />
            Preview de Diseños
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Elige tu Landing Page Favorita
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Compara tres diseños alternativos. Haz clic en cada uno para verlo en acción.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Option A */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Opción A</h2>
              <p className="text-blue-100 text-sm">Modern SaaS Hero Style</p>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Características:</h3>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>• Hero con gradiente llamativo</li>
                <li>• 6 features detalladas con checkmarks</li>
                <li>• Sección de beneficios con íconos</li>
                <li>• Multiple CTAs</li>
                <li>• Trust badges</li>
                <li>• Estilo moderno y vibrante</li>
              </ul>

              <div className="mb-6">
                <div className="text-xs text-gray-500 mb-2">Vista previa:</div>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 h-48 flex items-center justify-center">
                  <div className="text-white text-center p-4">
                    <div className="text-2xl font-bold mb-2">AMAWA</div>
                    <div className="text-sm opacity-80">Modern SaaS Hero</div>
                  </div>
                </div>
              </div>

              <Link
                href="/landing-a"
                target="_blank"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Ver Completa
              </Link>
            </div>
          </div>

          {/* Option B */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all">
            <div className="bg-gray-900 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Opción B</h2>
              <p className="text-gray-400 text-sm">Minimalist & Clean</p>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Características:</h3>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>• Diseño limpio y espacioso</li>
                <li>• 4 features principales</li>
                <li>• Tipografía grande y bold</li>
                <li>• Paleta monocromática</li>
                <li>• CTAs simples y directos</li>
                <li>• Estilo profesional y sobrio</li>
              </ul>

              <div className="mb-6">
                <div className="text-xs text-gray-500 mb-2">Vista previa:</div>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-900 h-48 flex items-center justify-center">
                  <div className="text-white text-center p-4">
                    <div className="text-4xl font-bold mb-2">AMAWA</div>
                    <div className="text-sm text-gray-400">Minimalist & Clean</div>
                  </div>
                </div>
              </div>

              <Link
                href="/landing-b"
                target="_blank"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Ver Completa
              </Link>
            </div>
          </div>

          {/* Option C */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-transparent hover:border-green-500 transition-all">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Opción C</h2>
              <p className="text-green-100 text-sm">Benefits-Driven</p>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Características:</h3>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>• Enfoque en transformación</li>
                <li>• Before/After comparison</li>
                <li>• Quick wins destacados</li>
                <li>• Preview visual del sistema</li>
                <li>• Métricas de mejora</li>
                <li>• Estilo persuasivo y orientado a valor</li>
              </ul>

              <div className="mb-6">
                <div className="text-xs text-gray-500 mb-2">Vista previa:</div>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gradient-to-r from-green-600 to-blue-600 h-48 flex items-center justify-center">
                  <div className="text-white text-center p-4">
                    <div className="text-3xl font-bold mb-2">AMAWA</div>
                    <div className="text-sm opacity-90">Benefits-Driven</div>
                  </div>
                </div>
              </div>

              <Link
                href="/landing-c"
                target="_blank"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                <Eye className="w-4 h-4" />
                Ver Completa
              </Link>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Comparación Rápida
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Característica</th>
                  <th className="text-center py-3 px-4 text-blue-700 font-semibold">Opción A</th>
                  <th className="text-center py-3 px-4 text-gray-700 font-semibold">Opción B</th>
                  <th className="text-center py-3 px-4 text-green-700 font-semibold">Opción C</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Longitud</td>
                  <td className="py-3 px-4 text-center">Larga</td>
                  <td className="py-3 px-4 text-center">Media</td>
                  <td className="py-3 px-4 text-center">Larga</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Estilo</td>
                  <td className="py-3 px-4 text-center">Moderno SaaS</td>
                  <td className="py-3 px-4 text-center">Minimalista</td>
                  <td className="py-3 px-4 text-center">Persuasivo</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Colores</td>
                  <td className="py-3 px-4 text-center">Vibrantes</td>
                  <td className="py-3 px-4 text-center">Sobrios</td>
                  <td className="py-3 px-4 text-center">Equilibrados</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Enfoque</td>
                  <td className="py-3 px-4 text-center">Features</td>
                  <td className="py-3 px-4 text-center">Simplicidad</td>
                  <td className="py-3 px-4 text-center">Transformación</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 px-4 text-gray-700">Estadísticas públicas</td>
                  <td className="py-3 px-4 text-center text-green-600">❌ Ninguna</td>
                  <td className="py-3 px-4 text-center text-green-600">❌ Ninguna</td>
                  <td className="py-3 px-4 text-center text-green-600">❌ Ninguna</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-700">Mejor para</td>
                  <td className="py-3 px-4 text-center">Impacto visual</td>
                  <td className="py-3 px-4 text-center">Elegancia profesional</td>
                  <td className="py-3 px-4 text-center">Conversión</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
