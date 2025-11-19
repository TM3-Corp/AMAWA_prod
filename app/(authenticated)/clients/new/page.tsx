'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ClientForm } from '@/components/clients/ClientForm'

export default function NewClientPage() {
  const router = useRouter()

  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Error al crear cliente')
    }

    const client = await response.json()
    router.push(`/clients/${client.id}`)
  }

  const handleCancel = () => {
    router.push('/clients')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/clients')}
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
              <h1 className="text-2xl font-bold text-gray-800">Nuevo Cliente</h1>
              <p className="text-sm text-gray-500">Registrar un nuevo cliente en el sistema</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <ClientForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Crear Cliente"
        />
      </div>
    </div>
  )
}
