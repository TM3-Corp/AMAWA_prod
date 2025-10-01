'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ClientOverviewCard } from '@/components/clients/ClientOverviewCard'
import { EquipmentDetails } from '@/components/clients/EquipmentDetails'
import { ServiceStatusDashboard } from '@/components/clients/ServiceStatusDashboard'
import { ActivityTimeline } from '@/components/clients/ActivityTimeline'

interface ClientData {
  client: {
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
    updatedAt: Date | string
    maintenances: Array<{
      id: string
      scheduledDate: Date | string
      type: string
      status: string
      completedDate: Date | string | null
      notes: string | null
    }>
    incidents: Array<{
      id: string
      type: string
      description: string
      status: string
      priority: string
      createdAt: Date | string
      resolvedAt: Date | string | null
    }>
  }
  stats: {
    maintenance: {
      total: number
      completed: number
      pending: number
      nextMaintenance?: {
        id: string
        scheduledDate: Date | string
        type: string
        status: string
        completedDate: Date | string | null
        notes: string | null
      }
    }
    incidents: {
      total: number
      open: number
      resolved: number
    }
    tenure: number
  }
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [data, setData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClientData()
  }, [clientId])

  const fetchClientData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/clients/${clientId}`)

      if (!response.ok) {
        throw new Error('Cliente no encontrado')
      }

      const clientData = await response.json()
      setData(clientData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando información del cliente...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'No se pudo cargar la información'}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Volver al Dashboard
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Vista 360° del Cliente</h1>
                <p className="text-sm text-gray-500">Información completa y estado de servicio</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                Editar
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                Acciones
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Client Info & Equipment */}
          <div className="lg:col-span-1 space-y-6">
            <ClientOverviewCard client={data.client} tenure={data.stats.tenure} />
            <EquipmentDetails client={data.client} />
          </div>

          {/* Middle Column - Service Status */}
          <div className="lg:col-span-1">
            <ServiceStatusDashboard
              maintenances={data.client.maintenances}
              incidents={data.client.incidents}
              stats={data.stats}
            />
          </div>

          {/* Right Column - Activity Timeline */}
          <div className="lg:col-span-1">
            <ActivityTimeline
              client={data.client}
              maintenances={data.client.maintenances}
              incidents={data.client.incidents}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
