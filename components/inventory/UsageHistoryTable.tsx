'use client'

interface UsageRecord {
  id: string
  quantityUsed: number
  deductedAt: Date
  maintenance: {
    id: string
    client: {
      name: string
    }
  }
}

interface UsageHistoryTableProps {
  usageRecords: UsageRecord[]
}

export default function UsageHistoryTable({ usageRecords }: UsageHistoryTableProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Historial de Uso</h2>
          <p className="text-sm text-gray-600 mt-1">
            Registro de filtros utilizados en mantenciones completadas
          </p>
        </div>
        <div className="px-4 py-2 bg-gray-100 rounded-lg">
          <span className="text-sm font-semibold text-gray-900">
            {usageRecords.length} registros
          </span>
        </div>
      </div>

      {/* Table */}
      {usageRecords.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 uppercase">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usageRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <span className="text-sm text-gray-900">
                      {new Date(record.deductedAt).toLocaleDateString('es-CL', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </span>
                    <p className="text-xs text-gray-500">
                      {new Date(record.deductedAt).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm font-medium text-gray-900">{record.maintenance.client.name}</span>
                  </td>
                  <td className="text-right py-3 px-2">
                    <span className="text-sm font-bold text-blue-600">{record.quantityUsed}</span>
                    <span className="text-xs text-gray-500 ml-1">uds</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 font-medium">No hay registros de uso todavía</p>
          <p className="text-sm text-gray-400 mt-1">
            Los registros aparecerán cuando completes mantenciones con filtros asignados
          </p>
        </div>
      )}
    </div>
  )
}
