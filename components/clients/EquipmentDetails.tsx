'use client'

import { Package, Droplets, Hash, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface EquipmentDetailsProps {
  client: {
    equipmentType: string | null
    installationDate: Date | string | null
  }
}

export function EquipmentDetails({ client }: EquipmentDetailsProps) {
  // Parse equipment type to extract model and filter type
  const equipmentInfo = parseEquipmentType(client.equipmentType)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
        <Package className="w-5 h-5 mr-2 text-purple-600" />
        Equipo Instalado
      </h3>

      <div className="space-y-4">
        {/* Equipment Model */}
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Modelo</p>
            <p className="text-lg font-bold text-gray-800">
              {equipmentInfo.model || 'No especificado'}
            </p>
            {equipmentInfo.color && (
              <p className="text-sm text-gray-600 mt-1">Color: {equipmentInfo.color}</p>
            )}
          </div>
        </div>

        {/* Filter Type */}
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Droplets className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Sistema de Filtración</p>
            <p className="text-base font-medium text-gray-800">
              {equipmentInfo.filterType || 'No especificado'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {equipmentInfo.filterDescription}
            </p>
          </div>
        </div>

        {/* Installation Date */}
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Fecha de Instalación</p>
            <p className="text-base font-medium text-gray-800">
              {formatDate(client.installationDate)}
            </p>
          </div>
        </div>

        {/* Serial Number (Placeholder - not in current schema) */}
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Hash className="w-5 h-5 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">Número de Serie</p>
            <p className="text-base font-medium text-gray-800">No disponible</p>
            <p className="text-xs text-gray-400 mt-1">Por agregar en próxima actualización</p>
          </div>
        </div>
      </div>

      {/* Equipment Status */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800">Estado del Equipo</p>
            <p className="text-xs text-gray-600 mt-1">Operativo y en servicio</p>
          </div>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

// Helper function to parse equipment type
function parseEquipmentType(equipmentType: string | null) {
  if (!equipmentType) {
    return {
      model: null,
      color: null,
      filterType: 'No especificado',
      filterDescription: 'Sistema de filtración no definido',
    }
  }

  // Extract model (e.g., "WHP-3200", "WHP-4200S")
  const modelMatch = equipmentType.match(/WHP-\d+\w*/i)
  const model = modelMatch ? modelMatch[0].toUpperCase() : equipmentType

  // Extract color
  const colorMatch = equipmentType.match(/(?:negro|blanco|cromado)/i)
  const color = colorMatch ? colorMatch[0].charAt(0).toUpperCase() + colorMatch[0].slice(1).toLowerCase() : null

  // Determine filter type based on model
  let filterType = 'No especificado'
  let filterDescription = 'Sistema de filtración no definido'

  if (model.includes('WHP-3200') || model.includes('WHP-4200')) {
    filterType = 'Ósmosis Inversa'
    filterDescription = 'Sistema de 5 etapas con membrana de ósmosis inversa'
  } else if (model.includes('WHP')) {
    filterType = 'Ultrafiltración'
    filterDescription = 'Sistema de filtración por membrana de ultrafiltración'
  }

  return {
    model,
    color,
    filterType,
    filterDescription,
  }
}
