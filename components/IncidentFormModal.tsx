'use client'

import { useState, useEffect, useRef } from 'react'
import { X as XIcon, Save, Search } from 'lucide-react'
import { INCIDENT_CATEGORIES } from '@/lib/constants'

interface Client {
  id: string
  name: string
}

interface Maintenance {
  id: string
  scheduledDate: string
  type: string
  cycleNumber: number | null
}

interface Incident {
  id: string
  clientId: string
  maintenanceId: string | null
  category: string | null
  equipmentType: string | null
  color: string | null
  filterType: string | null
  deliveryType: string | null
  technicianName: string | null
  vtDate: string | null
  vtReason: string | null
  month: string | null
  comments: string | null
  status: string
  client: {
    id: string
    name: string
  }
}

interface Props {
  incident?: Incident | null
  onClose: () => void
  onSave: () => void
  preSelectedClientId?: string
  preSelectedMaintenanceId?: string
}

export default function IncidentFormModal({ incident, onClose, onSave, preSelectedClientId, preSelectedMaintenanceId }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [equipmentData, setEquipmentData] = useState<any>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const [formData, setFormData] = useState({
    clientId: incident?.clientId || preSelectedClientId || '',
    maintenanceId: incident?.maintenanceId || preSelectedMaintenanceId || '',
    category: incident?.category || '',
    equipmentType: incident?.equipmentType || '',
    color: incident?.color || '',
    filterType: incident?.filterType || '',
    deliveryType: incident?.deliveryType || '',
    technicianName: incident?.technicianName || '',
    vtDate: incident?.vtDate ? incident.vtDate.split('T')[0] : '',
    vtReason: incident?.vtReason || '',
    comments: incident?.comments || '',
    status: incident?.status || 'OPEN',
  })

  useEffect(() => {
    // If editing, set the selected client and fetch maintenances
    if (incident?.client) {
      setSelectedClient(incident.client)
      setClientSearch(incident.client.name || '')
      // Fetch maintenances and equipment for this client
      fetchMaintenances(incident.client.id)
      fetchClientEquipment(incident.client.id)
    }
  }, [incident])

  useEffect(() => {
    // If pre-selected client, fetch their data
    if (preSelectedClientId && !incident) {
      fetchClientData(preSelectedClientId)
    }
  }, [preSelectedClientId, incident])

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Fetch clients based on search term
    const timeoutId = setTimeout(() => {
      if (clientSearch.length >= 2) {
        fetchClients(clientSearch)
      } else if (clientSearch.length === 0) {
        setClients([])
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [clientSearch])

  const fetchClients = async (search: string) => {
    try {
      const response = await fetch(`/api/clients?search=${encodeURIComponent(search)}&limit=50`)
      const data = await response.json()
      setClients(data.clients || [])
      setShowClientDropdown(true)
    } catch (err) {
      console.error('Error fetching clients:', err)
    }
  }

  const handleClientSelect = (client: Client) => {
    setSelectedClient(client)
    setClientSearch(client.name || '')
    setFormData({ ...formData, clientId: client.id, maintenanceId: '' })
    setShowClientDropdown(false)
    // Fetch maintenances and equipment for this client
    fetchMaintenances(client.id)
    fetchClientEquipment(client.id)
  }

  const fetchMaintenances = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}/maintenances`)
      const data = await response.json()
      setMaintenances(data.maintenances || [])
    } catch (err) {
      console.error('Error fetching maintenances:', err)
      setMaintenances([])
    }
  }

  const fetchClientData = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      const data = await response.json()
      const client = data.client // API returns { client: {...}, stats: {...}, healthScore: ... }
      setSelectedClient({ id: client.id, name: client.name || '' })
      setClientSearch(client.name || '')
      // Fetch maintenances and equipment
      fetchMaintenances(clientId)
      fetchClientEquipment(clientId)
    } catch (err) {
      console.error('Error fetching client data:', err)
    }
  }

  const fetchClientEquipment = async (clientId: string) => {
    try {
      const response = await fetch(`/api/clients/${clientId}`)
      const data = await response.json()
      const client = data.client // API returns { client: {...}, stats: {...}, healthScore: ... }

      // Get active equipment
      const activeEquipment = client.equipment?.find((eq: any) => eq.isActive)

      if (activeEquipment) {
        setEquipmentData(activeEquipment)
        // Auto-populate form fields from equipment
        setFormData(prev => ({
          ...prev,
          equipmentType: activeEquipment.equipmentType || '',
          color: activeEquipment.color || '',
          filterType: activeEquipment.filterType || '',
          deliveryType: activeEquipment.deliveryType || '',
          technicianName: activeEquipment.installerTechnician || '',
        }))
      }
    } catch (err) {
      console.error('Error fetching client equipment:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = incident ? `/api/incidents/${incident.id}` : '/api/incidents'
      const method = incident ? 'PUT' : 'POST'

      const payload = {
        ...formData,
        vtDate: formData.vtDate ? new Date(formData.vtDate).toISOString() : null,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar')
      }

      onSave()
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
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <h2 className="text-xl font-bold text-white">
            {incident ? 'Editar Incidencia' : 'Nueva Incidencia'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Search */}
            <div className="md:col-span-2" ref={searchRef}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Cliente *
              </label>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value)
                      if (e.target.value.length < 2) {
                        setFormData({ ...formData, clientId: '' })
                        setSelectedClient(null)
                      }
                    }}
                    onFocus={() => {
                      if (clients.length > 0) setShowClientDropdown(true)
                    }}
                    placeholder="Buscar cliente por nombre... (mínimo 2 caracteres)"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Dropdown results */}
                {showClientDropdown && clients.length > 0 && (
                  <div className="absolute z-40 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleClientSelect(client)}
                        className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{client.name}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Show message when search is too short */}
                {clientSearch.length > 0 && clientSearch.length < 2 && (
                  <div className="absolute z-40 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-2">
                    <p className="text-sm text-gray-500">Ingrese al menos 2 caracteres para buscar</p>
                  </div>
                )}

                {/* Show no results message */}
                {showClientDropdown && clientSearch.length >= 2 && clients.length === 0 && (
                  <div className="absolute z-40 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg px-4 py-2">
                    <p className="text-sm text-gray-500">No se encontraron clientes</p>
                  </div>
                )}
              </div>

              {/* Show selected client */}
              {selectedClient && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                    ✓ {selectedClient.name}
                  </span>
                </div>
              )}
            </div>

            {/* Maintenance Selector - only show if client selected and has maintenances */}
            {selectedClient && maintenances.length > 0 && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mantención Relacionada (Opcional)
                </label>
                <select
                  value={formData.maintenanceId}
                  onChange={(e) => setFormData({ ...formData, maintenanceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sin vincular a mantención</option>
                  {maintenances.map(m => (
                    <option key={m.id} value={m.id}>
                      {new Date(m.scheduledDate).toLocaleDateString('es-CL')} -
                      Ciclo {m.cycleNumber} ({m.type})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Vincule esta incidencia a una mantención específica si aplica
                </p>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione una categoría</option>
                {INCIDENT_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Equipment Information - Auto-populated from client */}
            {selectedClient && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium mb-2">
                  ℹ️ Información del Equipo (Auto-completada)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Equipo:</span>
                    <p className="font-medium text-gray-900">{formData.equipmentType || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Filtrado:</span>
                    <p className="font-medium text-gray-900">{formData.filterType || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Color:</span>
                    <p className="font-medium text-gray-900">{formData.color || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Entrega:</span>
                    <p className="font-medium text-gray-900">{formData.deliveryType || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Técnico Instalador:</span>
                    <p className="font-medium text-gray-900">{formData.technicianName || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* VT Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha de VT
              </label>
              <input
                type="date"
                value={formData.vtDate}
                onChange={(e) => setFormData({ ...formData, vtDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Estado *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="OPEN">Abierta</option>
                <option value="RESOLVED">Resuelta</option>
              </select>
            </div>

            {/* VT Reason */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Razón de VT
              </label>
              <textarea
                value={formData.vtReason}
                onChange={(e) => setFormData({ ...formData, vtReason: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción de la razón de visita técnica"
              />
            </div>

            {/* Comments */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Comentarios
              </label>
              <textarea
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Comentarios adicionales"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Guardando...' : incident ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
