'use client'

import { User, Mail, Phone, MapPin, Calendar, CheckCircle } from 'lucide-react'
import { cn, formatDate, calculateTenure, getStatusColor, getStatusLabel } from '@/lib/utils'

interface ClientOverviewCardProps {
  client: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    comuna: string | null
    equipmentType: string | null
    installationDate: Date | string | null
    status: string
    createdAt: Date | string
    updatedAt: Date | string
  }
  tenure: number
}

export function ClientOverviewCard({ client, tenure }: ClientOverviewCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{client.name}</h2>
            <p className="text-sm text-gray-500">ID: {client.id.slice(0, 8)}</p>
          </div>
        </div>
        <span
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium',
            getStatusColor(client.status)
          )}
        >
          {getStatusLabel(client.status)}
        </span>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Mail className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm font-medium text-gray-800">
              {client.email || 'No registrado'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Teléfono</p>
            <p className="text-sm font-medium text-gray-800">
              {client.phone || 'No registrado'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Dirección</p>
            <p className="text-sm font-medium text-gray-800">
              {client.address || 'No registrada'}
            </p>
            {client.comuna && (
              <p className="text-xs text-gray-500">{client.comuna}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Instalación</p>
            <p className="text-sm font-medium text-gray-800">
              {formatDate(client.installationDate)}
            </p>
            <p className="text-xs text-gray-500">
              {calculateTenure(client.installationDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Cliente desde</span>
          <span className="font-medium text-gray-800">{formatDate(client.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-600">Última actualización</span>
          <span className="font-medium text-gray-800">{formatDate(client.updatedAt)}</span>
        </div>
      </div>
    </div>
  )
}
