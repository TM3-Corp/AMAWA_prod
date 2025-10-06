'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X, Loader2 } from 'lucide-react'

interface DeleteClientModalProps {
  clientId: string
  clientName: string
  isOpen: boolean
  onClose: () => void
}

export function DeleteClientModal({
  clientId,
  clientName,
  isOpen,
  onClose,
}: DeleteClientModalProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError(null)

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar cliente')
      }

      // Redirect to clients list
      router.push('/clients')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cliente')
      setIsDeleting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Eliminar Cliente</h3>
              <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            ¿Estás seguro que deseas eliminar el cliente <span className="font-semibold">{clientName}</span>?
          </p>
          <p className="text-sm text-gray-600">
            Se eliminarán todos los datos asociados incluyendo:
          </p>
          <ul className="mt-2 ml-4 text-sm text-gray-600 list-disc space-y-1">
            <li>Información personal y de contacto</li>
            <li>Equipo y contratos asociados</li>
            <li>Historial de mantenciones</li>
            <li>Incidentes registrados</li>
          </ul>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              'Eliminar Cliente'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
