'use client'

interface ForecastCardProps {
  forecast: Array<{
    sku: string
    name: string
    quantity: number
    maintenances: number
  }>
  totalPendingMaintenances: number
  stockByFilter: Array<{
    sku: string
    totalStock: number
    status: string
  }>
}

export default function ForecastCard({
  forecast,
  totalPendingMaintenances,
  stockByFilter
}: ForecastCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pronóstico de Demanda</h2>
          <p className="text-sm text-gray-600 mt-1">
            Basado en <span className="font-semibold">{totalPendingMaintenances}</span> mantenciones pendientes
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-sm font-semibold text-blue-900">
            {forecast.length} tipos de filtros
          </span>
        </div>
      </div>

      {/* Forecast Table */}
      {forecast.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600 uppercase">Filtro</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 uppercase">Stock Actual</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 uppercase">Necesarios</th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600 uppercase">Diferencia</th>
                <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forecast.map((item) => {
                const currentStock = stockByFilter.find(s => s.sku === item.sku)?.totalStock || 0
                const difference = currentStock - item.quantity
                const needsRestock = difference < 0

                return (
                  <tr key={item.sku} className={needsRestock ? 'bg-red-50' : ''}>
                    <td className="py-3 px-2">
                      <div>
                        <p className="font-medium text-gray-900">{item.sku}</p>
                        <p className="text-xs text-gray-500">{item.name}</p>
                      </div>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className="font-medium text-gray-900">{currentStock}</span>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className="font-medium text-blue-600">{item.quantity}</span>
                      <p className="text-xs text-gray-500">{item.maintenances} mant.</p>
                    </td>
                    <td className="text-right py-3 px-2">
                      <span className={`font-bold ${needsRestock ? 'text-red-600' : 'text-green-600'}`}>
                        {difference > 0 ? '+' : ''}{difference}
                      </span>
                    </td>
                    <td className="text-center py-3 px-2">
                      {needsRestock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Reabastecer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Suficiente
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-500">No hay datos de pronóstico disponibles</p>
          <p className="text-sm text-gray-400 mt-1">Asegúrate de que las mantenciones tengan plan code asignado</p>
        </div>
      )}

      {/* Summary */}
      {forecast.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {forecast.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
              <p className="text-xs text-gray-600 mt-1">Total filtros necesarios</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {forecast.filter(item => {
                  const currentStock = stockByFilter.find(s => s.sku === item.sku)?.totalStock || 0
                  return currentStock >= item.quantity
                }).length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Tipos con stock suficiente</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {forecast.filter(item => {
                  const currentStock = stockByFilter.find(s => s.sku === item.sku)?.totalStock || 0
                  return currentStock < item.quantity
                }).length}
              </p>
              <p className="text-xs text-gray-600 mt-1">Tipos requieren reabastecimiento</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
