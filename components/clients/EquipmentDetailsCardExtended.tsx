'use client'

import { Droplet, Package, Palette, Truck, User, Hash, Filter } from 'lucide-react'

interface EquipmentDetailsCardExtendedProps {
  equipmentType: string | null
  serialNumber: string | null
  color: string | null
  filterType: string | null
  deliveryType: string | null
  installerTech: string | null
}

export function EquipmentDetailsCardExtended({
  equipmentType,
  serialNumber,
  color,
  filterType,
  deliveryType,
  installerTech
}: EquipmentDetailsCardExtendedProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Droplet className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Equipo Instalado</h3>
      </div>

      {/* Equipment Model */}
      {equipmentType && (
        <div className="mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Modelo</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{equipmentType}</p>
          </div>
        </div>
      )}

      {/* Equipment Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Serial Number */}
        {serialNumber && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hash className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">Serie</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 font-mono">{serialNumber}</p>
          </div>
        )}

        {/* Color */}
        {color && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">Color</span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{color}</p>
          </div>
        )}

        {/* Filter Type */}
        {filterType && (
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">Tipo de Filtración</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                filterType.includes('Reverse Osmosis') || filterType.includes('RO')
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {filterType}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Installation Details */}
      {(deliveryType || installerTech) && (
        <>
          <div className="border-t border-gray-100 my-5"></div>
          <div className="space-y-3">
            <h4 className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Detalles de Instalación</h4>

            {deliveryType && (
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Tipo de Entrega</p>
                  <p className="text-sm font-medium text-gray-900">{deliveryType}</p>
                </div>
              </div>
            )}

            {installerTech && (
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Técnico Instalador</p>
                  <p className="text-sm font-medium text-gray-900">{installerTech}</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
