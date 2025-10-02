'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ClientDetailsCard } from '@/components/clients/ClientDetailsCard'
import { PlanInformationCard } from '@/components/clients/PlanInformationCard'
import { EquipmentDetailsCardExtended } from '@/components/clients/EquipmentDetailsCardExtended'
import { EditableCommentsCard } from '@/components/clients/EditableCommentsCard'
import { HealthScoreCard } from '@/components/clients/HealthScoreCard'
import { MaintenanceTimelineCard } from '@/components/clients/MaintenanceTimelineCard'

interface ClientData {
  client: {
    id: string
    name: string
    firstName: string | null
    lastName: string | null
    rut: string | null
    email: string | null
    phone: string | null
    address: string | null
    comuna: string | null
    propertyType: string | null
    propertyNumber: string | null
    contactChannel: string | null
    equipmentType: string | null
    serialNumber: string | null
    color: string | null
    filterType: string | null
    deliveryType: string | null
    installerTech: string | null
    installationDate: Date | string | null
    planCode: string | null
    planType: string | null
    planCurrency: string | null
    planValueCLP: number | null
    monthlyValueCLP: number | null
    monthlyValueUF: number | null
    discountPercent: number | null
    tokuEnabled: boolean
    needsInvoice: boolean | null
    generalComments: string | null
    status: string
    createdAt: Date | string
    updatedAt: Date | string
    maintenances: Array<{
      id: string
      scheduledDate: Date | string
      actualDate: Date | string | null
      type: string
      status: string
      cycleNumber: number | null
      deviationDays: number | null
      responseRate: string | null
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
  healthScore: number
  stats: {
    maintenance: {
      total: number
      completed: number
      pending: number
      complianceRate: number
      avgDeviationDays: number
      responseRates: {
        excellent: number
        good: number
        fair: number
        poor: number
      }
      nextMaintenance?: {
        id: string
        scheduledDate: Date | string
        type: string
        status: string
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
          {/* Left Column - Personal Info & Plan */}
          <div className="lg:col-span-1 space-y-6">
            <ClientDetailsCard client={data.client} tenure={data.stats.tenure} />
            <PlanInformationCard
              planCode={data.client.planCode}
              planType={data.client.planType}
              planCurrency={data.client.planCurrency}
              planValueCLP={data.client.planValueCLP}
              monthlyValueCLP={data.client.monthlyValueCLP}
              monthlyValueUF={data.client.monthlyValueUF}
              discountPercent={data.client.discountPercent}
              tokuEnabled={data.client.tokuEnabled}
              needsInvoice={data.client.needsInvoice}
            />
            <EquipmentDetailsCardExtended
              equipmentType={data.client.equipmentType}
              serialNumber={data.client.serialNumber}
              color={data.client.color}
              filterType={data.client.filterType}
              deliveryType={data.client.deliveryType}
              installerTech={data.client.installerTech}
            />
          </div>

          {/* Middle Column - Health Score & Comments */}
          <div className="lg:col-span-1 space-y-6">
            <HealthScoreCard
              healthScore={data.healthScore}
              stats={data.stats}
            />
            <EditableCommentsCard
              clientId={data.client.id}
              initialComments={data.client.generalComments}
            />
          </div>

          {/* Right Column - Maintenance Timeline */}
          <div className="lg:col-span-1">
            <MaintenanceTimelineCard maintenances={data.client.maintenances} />
          </div>
        </div>
      </div>
    </div>
  )
}
