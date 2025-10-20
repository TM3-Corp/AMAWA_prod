'use client'

import { useState } from 'react'
import { X, Save, Info } from 'lucide-react'

interface CreateEquipmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CreateEquipmentModal({ isOpen, onClose, onSuccess }: CreateEquipmentModalProps) {
  const [formData, setFormData] = useState({
    equipmentModel: '',
    quantity: '0',
    minStock: '5',
    location: 'Bodega Principal',
    unitCost: '',
    lastRestocked: '',
    notes: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/admin/equipment-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentModel: formData.equipmentModel.trim(),
          quantity: parseInt(formData.quantity),
          minStock: parseInt(formData.minStock),
          location: formData.location.trim(),
          unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
          lastRestocked: formData.lastRestocked || null,
          notes: formData.notes.trim() || null
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear el equipo')
      }

      // Success!
      setSuccess(true)
      setFormData({
        equipmentModel: '',
        quantity: '0',
        minStock: '5',
        location: 'Bodega Principal',
        unitCost: '',
        lastRestocked: '',
        notes: ''
      })

      // Wait a bit to show success message, then close and refresh
      setTimeout(() => {
        onSuccess()
        onClose()
        setSuccess(false)
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Error al crear el equipo')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      equipmentModel: '',
      quantity: '0',
      minStock: '5',
      location: 'Bodega Principal',
      unitCost: '',
      lastRestocked: '',
      notes: ''
    })
    setError(null)
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Agregar Nuevo Equipo</h2>
            <p className="text-sm text-gray-600 mt-1">Registra un nuevo modelo de equipo en el inventario</p>
          </div>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="ml-3 text-sm font-medium text-green-800">
              ¡Equipo creado exitosamente!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Format Helper */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Formato sugerido para el modelo:</p>
              <p className="font-mono text-xs bg-white px-2 py-1 rounded">
                WHP-XXXX [Color] ([Tipo de Filtración])
              </p>
              <p className="mt-2 text-xs text-blue-700">
                Ejemplos: "WHP-3200 Blanco (Ultrafiltración)", "Llave Cromada (Ósmosis Inversa)"
              </p>
            </div>
          </div>

          {/* Equipment Model - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modelo de Equipo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.equipmentModel}
              onChange={(e) => setFormData({ ...formData, equipmentModel: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: WHP-4200S Negro (Ósmosis Inversa)"
              disabled={isSubmitting}
            />
          </div>

          {/* Quantity and Min Stock - Side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantidad Inicial <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Mínimo <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Location - Required */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              <option value="Bodega Principal">Bodega Principal</option>
              <option value="Bodega Secundaria">Bodega Secundaria</option>
              <option value="Bodega Lillo">Bodega Lillo</option>
              <option value="Otra">Otra</option>
            </select>
          </div>

          {/* Unit Cost and Last Restocked - Side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Costo Unitario (CLP)
              </label>
              <input
                type="number"
                min="0"
                value={formData.unitCost}
                onChange={(e) => setFormData({ ...formData, unitCost: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 250000"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Última Reposición
              </label>
              <input
                type="date"
                value={formData.lastRestocked}
                onChange={(e) => setFormData({ ...formData, lastRestocked: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Notes - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Notas adicionales sobre este equipo..."
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Equipo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
