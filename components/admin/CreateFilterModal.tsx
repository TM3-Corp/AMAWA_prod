'use client'

import { useState, useEffect } from 'react'
import { X, Save, Info, Filter as FilterIcon } from 'lucide-react'

interface Filter {
  id: string
  sku: string
  name: string
  category: string
}

interface CreateFilterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type TabType = 'new' | 'existing'

export default function CreateFilterModal({ isOpen, onClose, onSuccess }: CreateFilterModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('new')
  const [existingFilters, setExistingFilters] = useState<Filter[]>([])
  const [loadingFilters, setLoadingFilters] = useState(false)

  // New Filter Form (creates both Filter + Inventory)
  const [newFilterForm, setNewFilterForm] = useState({
    sku: '',
    name: '',
    description: '',
    category: 'UF' as 'UF' | 'RO',
    unitCost: '',
    // Inventory fields
    quantity: '0',
    minStock: '50',
    location: 'Bodega Principal',
    lastRestocked: ''
  })

  // Existing Filter Form (creates only Inventory)
  const [existingFilterForm, setExistingFilterForm] = useState({
    filterId: '',
    quantity: '0',
    minStock: '50',
    location: 'Bodega Principal',
    lastRestocked: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen && activeTab === 'existing') {
      fetchExistingFilters()
    }
  }, [isOpen, activeTab])

  const fetchExistingFilters = async () => {
    try {
      setLoadingFilters(true)
      const response = await fetch('/api/admin/filters')
      const data = await response.json()

      if (data.success) {
        setExistingFilters(data.data)
      }
    } catch (err) {
      console.error('Error fetching filters:', err)
    } finally {
      setLoadingFilters(false)
    }
  }

  const handleSubmitNewFilter = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Step 1: Create the filter
      const filterResponse = await fetch('/api/admin/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: newFilterForm.sku.trim(),
          name: newFilterForm.name.trim(),
          description: newFilterForm.description.trim() || null,
          category: newFilterForm.category,
          unitCost: newFilterForm.unitCost ? parseFloat(newFilterForm.unitCost) : null
        })
      })

      const filterData = await filterResponse.json()

      if (!filterResponse.ok || !filterData.success) {
        throw new Error(filterData.error || 'Error al crear el filtro')
      }

      // Step 2: Create the inventory location for the new filter
      const inventoryResponse = await fetch('/api/admin/filter-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterId: filterData.data.id,
          quantity: parseInt(newFilterForm.quantity),
          minStock: parseInt(newFilterForm.minStock),
          location: newFilterForm.location.trim(),
          lastRestocked: newFilterForm.lastRestocked || null
        })
      })

      const inventoryData = await inventoryResponse.json()

      if (!inventoryResponse.ok || !inventoryData.success) {
        throw new Error(inventoryData.error || 'Error al crear ubicación de inventario')
      }

      // Success!
      setSuccess(true)
      setNewFilterForm({
        sku: '',
        name: '',
        description: '',
        category: 'UF',
        unitCost: '',
        quantity: '0',
        minStock: '50',
        location: 'Bodega Principal',
        lastRestocked: ''
      })

      setTimeout(() => {
        onSuccess()
        onClose()
        setSuccess(false)
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Error al crear el filtro')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitExistingFilter = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/admin/filter-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filterId: existingFilterForm.filterId,
          quantity: parseInt(existingFilterForm.quantity),
          minStock: parseInt(existingFilterForm.minStock),
          location: existingFilterForm.location.trim(),
          lastRestocked: existingFilterForm.lastRestocked || null
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear ubicación')
      }

      // Success!
      setSuccess(true)
      setExistingFilterForm({
        filterId: '',
        quantity: '0',
        minStock: '50',
        location: 'Bodega Principal',
        lastRestocked: ''
      })

      setTimeout(() => {
        onSuccess()
        onClose()
        setSuccess(false)
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Error al crear ubicación')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setNewFilterForm({
      sku: '',
      name: '',
      description: '',
      category: 'UF',
      unitCost: '',
      quantity: '0',
      minStock: '50',
      location: 'Bodega Principal',
      lastRestocked: ''
    })
    setExistingFilterForm({
      filterId: '',
      quantity: '0',
      minStock: '50',
      location: 'Bodega Principal',
      lastRestocked: ''
    })
    setError(null)
    setSuccess(false)
    setActiveTab('new')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Agregar Filtro al Inventario</h2>
              <p className="text-sm text-gray-600 mt-1">Crea un nuevo filtro o agrega ubicación a uno existente</p>
            </div>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('new')}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'new'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Nuevo Filtro
            </button>
            <button
              onClick={() => setActiveTab('existing')}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'existing'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Ubicación Existente
            </button>
          </div>
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
              {activeTab === 'new' ? '¡Filtro creado exitosamente!' : '¡Ubicación creada exitosamente!'}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'new' ? (
            // NEW FILTER TAB
            <form onSubmit={handleSubmitNewFilter} className="space-y-6">
              {/* Format Helper */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Crea un nuevo tipo de filtro con su ubicación inicial</p>
                  <p className="text-xs text-blue-700">
                    El SKU se guardará en mayúsculas automáticamente
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <FilterIcon className="w-5 h-5 mr-2" />
                  Datos del Filtro
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newFilterForm.sku}
                      onChange={(e) => setNewFilterForm({ ...newFilterForm, sku: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                      placeholder="PP-10CF"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoría <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={newFilterForm.category}
                      onChange={(e) => setNewFilterForm({ ...newFilterForm, category: e.target.value as 'UF' | 'RO' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSubmitting}
                    >
                      <option value="UF">Ultrafiltración (UF)</option>
                      <option value="RO">Ósmosis Inversa (RO)</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newFilterForm.name}
                      onChange={(e) => setNewFilterForm({ ...newFilterForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Filtro de Polipropileno"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      rows={2}
                      value={newFilterForm.description}
                      onChange={(e) => setNewFilterForm({ ...newFilterForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Descripción detallada del filtro..."
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Costo Unitario (CLP)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={newFilterForm.unitCost}
                      onChange={(e) => setNewFilterForm({ ...newFilterForm, unitCost: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="15000"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Ubicación Inicial</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad Inicial <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newFilterForm.quantity}
                      onChange={(e) => setNewFilterForm({ ...newFilterForm, quantity: e.target.value })}
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
                      value={newFilterForm.minStock}
                      onChange={(e) => setNewFilterForm({ ...newFilterForm, minStock: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={newFilterForm.location}
                      onChange={(e) => setNewFilterForm({ ...newFilterForm, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSubmitting}
                    >
                      <option value="Bodega Principal">Bodega Principal</option>
                      <option value="Bodega Secundaria">Bodega Secundaria</option>
                      <option value="Bodega Lillo">Bodega Lillo</option>
                      <option value="Otra">Otra</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Última Reposición
                    </label>
                    <input
                      type="date"
                      value={newFilterForm.lastRestocked}
                      onChange={(e) => setNewFilterForm({ ...newFilterForm, lastRestocked: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
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
                      Guardar Filtro
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            // EXISTING FILTER TAB
            <form onSubmit={handleSubmitExistingFilter} className="space-y-6">
              {/* Info Helper */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start">
                <Info className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-purple-800">
                  <p className="font-medium mb-1">Agrega una nueva ubicación para un filtro existente</p>
                  <p className="text-xs text-purple-700">
                    Útil cuando el mismo filtro se almacena en múltiples bodegas
                  </p>
                </div>
              </div>

              {/* Filter Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Filtro <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={existingFilterForm.filterId}
                  onChange={(e) => setExistingFilterForm({ ...existingFilterForm, filterId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSubmitting || loadingFilters}
                >
                  <option value="">
                    {loadingFilters ? 'Cargando filtros...' : 'Seleccione un filtro'}
                  </option>
                  {existingFilters.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.sku} - {filter.name} ({filter.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Inventory Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={existingFilterForm.quantity}
                    onChange={(e) => setExistingFilterForm({ ...existingFilterForm, quantity: e.target.value })}
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
                    value={existingFilterForm.minStock}
                    onChange={(e) => setExistingFilterForm({ ...existingFilterForm, minStock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={existingFilterForm.location}
                    onChange={(e) => setExistingFilterForm({ ...existingFilterForm, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  >
                    <option value="Bodega Principal">Bodega Principal</option>
                    <option value="Bodega Secundaria">Bodega Secundaria</option>
                    <option value="Bodega Lillo">Bodega Lillo</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Última Reposición
                  </label>
                  <input
                    type="date"
                    value={existingFilterForm.lastRestocked}
                    onChange={(e) => setExistingFilterForm({ ...existingFilterForm, lastRestocked: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>
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
                      Guardar Ubicación
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
