'use client'

import { useState } from 'react'
import { X, Calendar } from 'lucide-react'

interface BulkRescheduleModalProps {
  isOpen: boolean
  onClose: () => void
  selectedIds: string[]
  onReschedule: (newDate: string, notes: string) => Promise<void>
}

export default function BulkRescheduleModal({
  isOpen,
  onClose,
  selectedIds,
  onReschedule
}: BulkRescheduleModalProps) {
  const [newDate, setNewDate] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newDate) {
      setError('Por favor selecciona una nueva fecha')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await onReschedule(newDate, notes)
      setNewDate('')
      setNotes('')
      onClose()
    } catch (err) {
      setError('Error al reprogramar mantenciones. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Reprogramar Mantenciones</h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedIds.length} mantención{selectedIds.length !== 1 ? 'es' : ''} seleccionada{selectedIds.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          {/* New Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nueva Fecha
            </label>
            <div className="relative">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
              <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (Opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Motivo de la reprogramación..."
              disabled={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Reprogramando...' : 'Reprogramar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
