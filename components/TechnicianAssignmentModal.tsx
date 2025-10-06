'use client'

import { useState } from 'react'
import { X, User } from 'lucide-react'

interface TechnicianAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  currentTechnician: string | null
  onAssign: (technicianName: string) => Promise<void>
}

// Common technicians list (can be moved to database later)
const COMMON_TECHNICIANS = [
  'Juan Pérez',
  'María González',
  'Carlos Rodríguez',
  'Ana Martínez',
  'Luis Silva',
  'Carmen Torres'
]

export default function TechnicianAssignmentModal({
  isOpen,
  onClose,
  currentTechnician,
  onAssign
}: TechnicianAssignmentModalProps) {
  const [technicianName, setTechnicianName] = useState(currentTechnician || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!technicianName.trim()) {
      setError('Por favor ingresa el nombre del técnico')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await onAssign(technicianName)
      onClose()
    } catch (err) {
      setError('Error al asignar técnico. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <User className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-bold">Asignar Técnico</h2>
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

          {/* Technician Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Técnico
            </label>
            <input
              type="text"
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
              list="technicians"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Selecciona o ingresa nombre..."
              disabled={isLoading}
              required
            />
            <datalist id="technicians">
              {COMMON_TECHNICIANS.map(tech => (
                <option key={tech} value={tech} />
              ))}
            </datalist>
          </div>

          {/* Quick Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selección Rápida
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COMMON_TECHNICIANS.map(tech => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => setTechnicianName(tech)}
                  className={`px-3 py-2 text-sm border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition ${
                    technicianName === tech
                      ? 'bg-purple-100 border-purple-500 text-purple-700'
                      : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  {tech}
                </button>
              ))}
            </div>
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
