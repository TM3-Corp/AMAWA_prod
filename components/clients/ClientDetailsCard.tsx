'use client'

import { User, Mail, Phone, MapPin, Home, Calendar } from 'lucide-react'

interface Client {
  firstName: string | null
  lastName: string | null
  name: string
  rut: string | null
  email: string | null
  phone: string | null
  address: string | null
  comuna: string | null
  propertyType: string | null
  propertyNumber: string | null
  installationDate: Date | string | null
  contactChannel: string | null
  status: string
}

interface ClientDetailsCardProps {
  client: Client
  tenure: number
}

export function ClientDetailsCard({ client, tenure }: ClientDetailsCardProps) {
  const fullName = client.firstName && client.lastName
    ? `${client.firstName} ${client.lastName}`
    : client.name

  const initials = fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* INACTIVE Status Badge */}
      {client.status === 'INACTIVE' && (
        <div className="mb-4 px-4 py-3 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-red-900 font-bold text-sm">CLIENTE INACTIVO</p>
              <p className="text-red-700 text-xs">Este cliente ya no está activo en el sistema</p>
            </div>
          </div>
        </div>
      )}

      {/* Header with Avatar */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md">
          {initials}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
          {client.rut && (
            <p className="text-sm text-gray-500">RUT: {client.rut}</p>
          )}
          {tenure > 0 && (
            <p className="text-sm text-blue-600 mt-1">
              Cliente desde hace {tenure} {tenure === 1 ? 'mes' : 'meses'}
            </p>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Información de Contacto
        </h3>

        {client.email && (
          <div className="flex items-center gap-3 text-gray-700">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <a href={`mailto:${client.email}`} className="text-sm hover:text-blue-600 transition">
                {client.email}
              </a>
            </div>
          </div>
        )}

        {client.phone && (
          <div className="flex items-center gap-3 text-gray-700">
            <Phone className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Teléfono</p>
              <a href={`tel:${client.phone}`} className="text-sm hover:text-blue-600 transition">
                {client.phone}
              </a>
            </div>
          </div>
        )}

        {client.contactChannel && (
          <div className="flex items-center gap-3 text-gray-700">
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Canal de Contacto</p>
              <p className="text-sm">{client.contactChannel}</p>
            </div>
          </div>
        )}
      </div>

      {/* Address Information */}
      {(client.address || client.comuna) && (
        <>
          <div className="border-t border-gray-100 my-4"></div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Dirección
            </h3>

            {client.address && (
              <div className="flex items-start gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Calle</p>
                  <p className="text-sm">{client.address}</p>
                  {client.propertyType && client.propertyNumber && (
                    <p className="text-sm text-gray-600 mt-1">
                      {client.propertyType} {client.propertyNumber}
                    </p>
                  )}
                </div>
              </div>
            )}

            {client.comuna && (
              <div className="flex items-center gap-3 text-gray-700">
                <Home className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Comuna</p>
                  <p className="text-sm font-medium">{client.comuna}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Installation Date */}
      {client.installationDate && (
        <>
          <div className="border-t border-gray-100 my-4"></div>
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Fecha de Instalación</p>
              <p className="text-sm font-medium">
                {new Date(client.installationDate).toLocaleDateString('es-CL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
