'use client'

import { useState } from 'react'
import { MessageSquare, Edit2, Save, X, Check } from 'lucide-react'

interface EditableCommentsCardProps {
  clientId: string
  initialComments: string | null
}

export function EditableCommentsCard({ clientId, initialComments }: EditableCommentsCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [comments, setComments] = useState(initialComments || '')
  const [savedComments, setSavedComments] = useState(initialComments || '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generalComments: comments }),
      })

      if (!response.ok) throw new Error('Failed to save')

      setSavedComments(comments)
      setIsEditing(false)
      setSaveStatus('success')

      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      console.error('Error saving comments:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setComments(savedComments)
    setIsEditing(false)
    setSaveStatus('idle')
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Comentarios Generales</h3>
        </div>

        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <Edit2 className="w-4 h-4" />
            Editar
          </button>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Agregar notas sobre el cliente..."
            className="w-full min-h-[120px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            disabled={isSaving}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar
                </>
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>

          {/* Error Message */}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <X className="w-4 h-4" />
              Error al guardar los comentarios. Intenta nuevamente.
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Display Mode */}
          {savedComments ? (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{savedComments}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-gray-400">
              <p className="text-sm">No hay comentarios. Haz clic en "Editar" para agregar notas.</p>
            </div>
          )}

          {/* Success Message */}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <Check className="w-4 h-4" />
              Comentarios guardados exitosamente
            </div>
          )}
        </div>
      )}
    </div>
  )
}
