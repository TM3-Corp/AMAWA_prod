'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowLeft, Users, MapPin, Phone, Mail } from 'lucide-react'
import { cn, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'

interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  comuna: string | null
  equipmentType: string | null
  installationDate: Date | string | null
  status: string
  createdAt: Date | string
}

export default function ClientsListPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchClients()
  }, [page, search])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
      })
      const response = await fetch(`/api/clients?${params}`)
      const data = await response.json()

      setClients(data.clients)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
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
                <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
                <p className="text-sm text-gray-500">Gestión de clientes AMAWA</p>
              </div>
            </div>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, comuna o teléfono..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Cargando clientes...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron clientes</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 line-clamp-1">{client.name}</h3>
                        <p className="text-xs text-gray-500">{client.equipmentType || 'Sin equipo'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium',
                        getStatusColor(client.status)
                      )}
                    >
                      {getStatusLabel(client.status)}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    {client.comuna && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{client.comuna}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span className="line-clamp-1">{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span className="line-clamp-1">{client.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500">
                      Cliente desde {formatDate(client.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
