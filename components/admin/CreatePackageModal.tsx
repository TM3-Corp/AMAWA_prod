'use client'

import { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react'

interface Filter {
  id: string
  sku: string
  name: string
  category: string
}

interface PackageItem {
  filterId: string
  quantity: number
}

interface CreatePackageModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function CreatePackageModal({ onClose, onSuccess }: CreatePackageModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingFilters, setLoadingFilters] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availableFilters, setAvailableFilters] = useState<Filter[]>([])
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: ''
  })
  
  const [items, setItems] = useState<PackageItem[]>([{ filterId: '', quantity: 1 }])

  useEffect(() => {
    fetchFilters()
  }, [])

  const fetchFilters = async () => {
    try {
      const response = await fetch('/api/admin/filters')
      const result = await response.json()
      if (result.success) {
        setAvailableFilters(result.data)
      }
    } catch (err) {
      console.error('Error fetching filters:', err)
    } finally {
      setLoadingFilters(false)
    }
  }

  const handleAddItem = () => {
    setItems([...items, { filterId: '', quantity: 1 }])
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof PackageItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate items
    const validItems = items.filter(item => item.filterId && item.quantity > 0)
    if (validItems.length === 0) {
      setError('Debe agregar al menos un filtro')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/filter-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: validItems
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Error al crear paquete')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between sticky top-0">
          <h2 className="text-xl font-bold">Crear Nuevo Paquete de Filtros</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Package Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Información del Paquete</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="1.1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="UF Partial"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción del paquete..."
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filtros del Paquete</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
              >
                <Plus className="w-4 h-4" />
                Agregar Filtro
              </button>
            </div>

            {loadingFilters ? (
              <p className="text-sm text-gray-600">Cargando filtros...</p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
                    {/* Filter Select */}
                    <div className="flex-1">
                      <select
                        value={item.filterId}
                        onChange={(e) => handleItemChange(index, 'filterId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      >
                        <option value="">Seleccionar filtro...</option>
                        {availableFilters.map((filter) => (
                          <option key={filter.id} value={filter.id}>
                            {filter.sku} - {filter.name} ({filter.category})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || loadingFilters}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>Creando...</>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Crear Paquete
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
