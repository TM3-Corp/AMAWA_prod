'use client'

import { useState } from 'react'
import { Lock, Pencil, Check, X } from 'lucide-react'

interface LockedFieldProps {
  label: string
  value: string | number | null
  fieldName: string
  recordId: string
  apiEndpoint: string
  type?: 'text' | 'number' | 'date' | 'textarea'
  onUpdate?: () => void
  placeholder?: string
}

export default function LockedField({
  label,
  value,
  fieldName,
  recordId,
  apiEndpoint,
  type = 'text',
  onUpdate,
  placeholder = ''
}: LockedFieldProps) {
  const [isLocked, setIsLocked] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [editValue, setEditValue] = useState(value?.toString() || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayValue = value !== null && value !== undefined && value !== ''
    ? (type === 'date'
        ? new Date(value).toLocaleDateString('es-CL')
        : value.toString())
    : '—'

  const handleUnlockClick = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmUnlock = () => {
    setIsLocked(false)
    setShowConfirmModal(false)
    setEditValue(value?.toString() || '')
    setError(null)
  }

  const handleCancel = () => {
    setIsLocked(true)
    setEditValue(value?.toString() || '')
    setError(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`${apiEndpoint}/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field: fieldName,
          value: type === 'number' ? (editValue === '' ? null : Number(editValue)) : editValue
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar')
      }

      setIsLocked(true)
      if (onUpdate) {
        onUpdate()
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>

        {isLocked ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {displayValue}
            </div>
            <button
              onClick={handleUnlockClick}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Editar campo"
            >
              <Lock className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {type === 'textarea' ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={placeholder}
                  rows={3}
                  disabled={isSaving}
                />
              ) : (
                <input
                  type={type}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={placeholder}
                  disabled={isSaving}
                />
              )}

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 rounded-md transition-colors"
                title="Guardar"
              >
                <Check className="h-5 w-5" />
              </button>

              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="p-2 text-gray-600 hover:bg-gray-100 disabled:bg-gray-200 rounded-md transition-colors"
                title="Cancelar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Pencil className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmar Edición
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  ¿Estás seguro que deseas editar el campo <strong>{label}</strong>?
                  Esta acción modificará los datos del sistema.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmUnlock}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Sí, Editar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
