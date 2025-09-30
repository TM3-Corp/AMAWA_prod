import { CheckCircle, Users, BarChart3, Wrench } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            AMAWA
          </h1>
          <p className="text-xl text-gray-600">
            Sistema de Gestión de Servicios de Purificación de Agua
          </p>
        </div>

        {/* Status Card */}
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Sistema en Producción
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Todos los servicios operando normalmente
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t">
            <div className="text-center">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">675</p>
              <p className="text-xs text-gray-500">Clientes</p>
            </div>
            <div className="text-center">
              <Wrench className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">142</p>
              <p className="text-xs text-gray-500">Mantenciones/mes</p>
            </div>
            <div className="text-center">
              <BarChart3 className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">98%</p>
              <p className="text-xs text-gray-500">Disponibilidad</p>
            </div>
          </div>
        </div>

        {/* Access Links */}
        <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <a 
            href="/dashboard"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 block"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Dashboard</h3>
                <p className="text-sm text-gray-500">Panel de control principal</p>
              </div>
            </div>
          </a>

          <a 
            href="/maintenances"
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-all hover:scale-105 block"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Mantenciones</h3>
                <p className="text-sm text-gray-500">Gestión de mantenciones</p>
              </div>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-sm">
          <p>© 2025 AMAWA - Desarrollado por TM3 Corp</p>
        </div>
      </div>
    </main>
  )
}