'use client'

import { useState } from 'react'
import { User, MapPin, Wrench, FileText, DollarSign } from 'lucide-react'

interface ClientFormData {
  // Personal Info
  firstName?: string
  lastName?: string
  name: string
  rut?: string
  email?: string
  phone?: string
  contactChannel?: string

  // Address
  address?: string
  propertyType?: string
  propertyNumber?: string
  comuna?: string

  // Equipment
  equipmentType?: string
  serialNumber?: string
  color?: string
  filterType?: string
  deliveryType?: string
  installerTech?: string
  installationDate?: string

  // Contract
  planCode?: string
  planType?: string
  planCurrency?: string
  planValueCLP?: number
  monthlyValueCLP?: number
  monthlyValueUF?: number
  discountPercent?: number
  tokuEnabled?: boolean
  needsInvoice?: boolean

  // Status
  status?: string
  generalComments?: string
}

interface ClientFormProps {
  initialData?: Partial<ClientFormData>
  onSubmit: (data: ClientFormData) => Promise<void>
  onCancel: () => void
  submitLabel?: string
}

export function ClientForm({ initialData, onSubmit, onCancel, submitLabel = 'Crear Cliente' }: ClientFormProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    status: 'ACTIVE',
    tokuEnabled: false,
    needsInvoice: false,
    ...initialData,
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-generate full name from firstName + lastName
  const handleNameChange = (field: 'firstName' | 'lastName', value: string) => {
    const updated = { ...formData, [field]: value }
    if (updated.firstName || updated.lastName) {
      updated.name = `${updated.firstName || ''} ${updated.lastName || ''}`.trim()
    }
    setFormData(updated)
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es requerido'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setLoading(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Personal Info Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Información Personal</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => handleNameChange('firstName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Pablo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido
            </label>
            <input
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => handleNameChange('lastName', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ruiz-Tagle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Pablo Ruiz-Tagle"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RUT
            </label>
            <input
              type="text"
              value={formData.rut || ''}
              onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="12.345.678-9"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="cliente@ejemplo.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canal de Contacto
            </label>
            <select
              value={formData.contactChannel || ''}
              onChange={(e) => setFormData({ ...formData, contactChannel: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              <option value="Email">Email</option>
              <option value="Phone">Teléfono</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Family/friends">Familia/Amigos</option>
              <option value="Social Media">Redes Sociales</option>
            </select>
          </div>
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Dirección</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Av. Providencia 1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Propiedad
            </label>
            <select
              value={formData.propertyType || ''}
              onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              <option value="Casa">Casa</option>
              <option value="Depto">Departamento</option>
              <option value="Empresa">Empresa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número/Depto
            </label>
            <input
              type="text"
              value={formData.propertyNumber || ''}
              onChange={(e) => setFormData({ ...formData, propertyNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="101"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comuna
            </label>
            <input
              type="text"
              value={formData.comuna || ''}
              onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Las Condes"
            />
          </div>
        </div>
      </div>

      {/* Equipment Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <Wrench className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-bold text-gray-900">Equipo (Opcional)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Equipo
            </label>
            <select
              value={formData.equipmentType || ''}
              onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              <option value="WHP-3200">WHP-3200</option>
              <option value="WHP-4200">WHP-4200</option>
              <option value="WHP-4230">WHP-4230 (pedestal)</option>
              <option value="Llave">Llave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Serie
            </label>
            <input
              type="text"
              value={formData.serialNumber || ''}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="2B0001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <select
              value={formData.color || ''}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              <option value="Blanco">Blanco</option>
              <option value="Negro">Negro</option>
              <option value="Gris">Gris</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Filtro
            </label>
            <select
              value={formData.filterType || ''}
              onChange={(e) => setFormData({ ...formData, filterType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              <option value="Reverse Osmosis">Osmosis Inversa (RO)</option>
              <option value="Ultra Filtracion">Ultrafiltración (UF)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Entrega
            </label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Presencial"
                  checked={formData.deliveryType === 'Presencial'}
                  onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                  className="mr-2"
                />
                Presencial
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Delivery"
                  checked={formData.deliveryType === 'Delivery'}
                  onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
                  className="mr-2"
                />
                Delivery
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Técnico Instalador
            </label>
            <input
              type="text"
              value={formData.installerTech || ''}
              onChange={(e) => setFormData({ ...formData, installerTech: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Felipe González"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Instalación
            </label>
            <input
              type="date"
              value={formData.installationDate || ''}
              onChange={(e) => setFormData({ ...formData, installationDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Contract Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-bold text-gray-900">Contrato (Opcional)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Plan
            </label>
            <input
              type="text"
              value={formData.planCode || ''}
              onChange={(e) => setFormData({ ...formData, planCode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="3200RODE"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Plan
            </label>
            <select
              value={formData.planType || ''}
              onChange={(e) => setFormData({ ...formData, planType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Seleccionar...</option>
              <option value="Mensual">Mensual</option>
              <option value="Anual">Anual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda
            </label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="CLP"
                  checked={formData.planCurrency === 'CLP'}
                  onChange={(e) => setFormData({ ...formData, planCurrency: e.target.value })}
                  className="mr-2"
                />
                CLP
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="UF"
                  checked={formData.planCurrency === 'UF'}
                  onChange={(e) => setFormData({ ...formData, planCurrency: e.target.value })}
                  className="mr-2"
                />
                UF
              </label>
            </div>
          </div>

          {formData.planCurrency === 'CLP' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mensual (CLP)
              </label>
              <input
                type="number"
                value={formData.monthlyValueCLP || ''}
                onChange={(e) => setFormData({ ...formData, monthlyValueCLP: parseInt(e.target.value) || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="22900"
              />
            </div>
          )}

          {formData.planCurrency === 'UF' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mensual (UF)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.monthlyValueUF || ''}
                onChange={(e) => setFormData({ ...formData, monthlyValueUF: parseFloat(e.target.value) || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0.65"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descuento (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.discountPercent || ''}
              onChange={(e) => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pago
            </label>
            <select
              value={formData.tokuEnabled ? 'TOKU' : 'Transferencia'}
              onChange={(e) => setFormData({ ...formData, tokuEnabled: e.target.value === 'TOKU' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="TOKU">TOKU</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Documento
            </label>
            <select
              value={formData.needsInvoice ? 'Factura' : 'Boleta'}
              onChange={(e) => setFormData({ ...formData, needsInvoice: e.target.value === 'Factura' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Factura">Factura (Empresa)</option>
              <option value="Boleta">Boleta (Persona)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status & Comments */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-gray-600" />
          <h3 className="text-lg font-bold text-gray-900">Estado y Comentarios</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={formData.status || 'ACTIVE'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
              <option value="SUSPENDED">Suspendido</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios Generales
            </label>
            <textarea
              value={formData.generalComments || ''}
              onChange={(e) => setFormData({ ...formData, generalComments: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Notas adicionales sobre el cliente..."
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? 'Guardando...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
