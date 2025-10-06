'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { ClientForm } from '@/components/clients/ClientForm'

export default function EditClientPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<any>(null)

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

      const data = await response.json()

      // Extract client data with flattened Equipment and Contract fields
      const client = data.client
      setInitialData({
        // Personal Info
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        name: client.name || '',
        rut: client.rut || '',
        email: client.email || '',
        phone: client.phone || '',
        contactChannel: client.contactChannel || '',

        // Address
        address: client.address || '',
        propertyType: client.propertyType || '',
        propertyNumber: client.propertyNumber || '',
        comuna: client.comuna || '',

        // Equipment (from normalized Equipment table)
        equipmentType: client.equipmentType || '',
        serialNumber: client.serialNumber || '',
        color: client.color || '',
        filterType: client.filterType || '',
        deliveryType: client.deliveryType || '',
        installerTech: client.installerTech || '',
        installationDate: client.installationDate
          ? new Date(client.installationDate).toISOString().split('T')[0]
          : '',

        // Contract (from normalized Contract table)
        planCode: client.planCode || '',
        planType: client.planType || '',
        planCurrency: client.planCurrency || 'CLP',
        planValueCLP: client.planValueCLP || '',
        monthlyValueCLP: client.monthlyValueCLP || '',
        monthlyValueUF: client.monthlyValueUF || '',
        discountPercent: client.discountPercent || '',
        tokuEnabled: client.tokuEnabled || false,
        needsInvoice: client.needsInvoice || false,

        // Status & Comments
        status: client.status || 'ACTIVE',
        generalComments: client.generalComments || '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Error al actualizar cliente')
    }

    router.push(`/clients/${clientId}`)
  }

  const handleCancel = () => {
    router.push(`/clients/${clientId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando datos del cliente...</p>
        </div>
      </div>
    )
  }

  if (error || !initialData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'No se pudo cargar la información'}</p>
          <button
            onClick={() => router.push('/clients')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Volver a Clientes
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/clients/${clientId}`)}
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
              <h1 className="text-2xl font-bold text-gray-800">Editar Cliente</h1>
              <p className="text-sm text-gray-500">Actualizar información del cliente</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <ClientForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Actualizar Cliente"
        />
      </div>
    </div>
  )
}
