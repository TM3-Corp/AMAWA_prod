'use client'

interface StockLevelCardProps {
  sku: string
  name: string
  category: string
  totalStock: number
  minStock: number
  status: 'LOW' | 'WARNING' | 'OK'
  locations?: Array<{
    location: string | null
    quantity: number
    minStock: number
    lastRestocked: Date | null
  }>
}

export default function StockLevelCard({
  sku,
  name,
  category,
  totalStock,
  minStock,
  status,
  locations = []
}: StockLevelCardProps) {
  const percentage = minStock > 0 ? (totalStock / (minStock * 2)) * 100 : 100
  const cappedPercentage = Math.min(percentage, 100)

  const statusColors = {
    LOW: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800',
      progress: 'bg-red-500'
    },
    WARNING: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-800',
      progress: 'bg-yellow-500'
    },
    OK: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800',
      progress: 'bg-green-500'
    }
  }

  const colors = statusColors[status]

  return (
    <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-6 transition-all hover:shadow-md`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{sku}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${colors.badge}`}>
              {status}
            </span>
          </div>
          <p className="text-sm text-gray-600">{name}</p>
          <p className="text-xs text-gray-500 mt-1">{category === 'UF' ? 'Ultrafiltración' : 'Ósmosis Inversa'}</p>
        </div>
      </div>

      {/* Stock Numbers */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold ${colors.text}`}>{totalStock}</span>
          <span className="text-sm text-gray-500">unidades</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Mínimo requerido: <span className="font-semibold">{minStock}</span>
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.progress} transition-all duration-300`}
            style={{ width: `${cappedPercentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {totalStock < minStock
            ? `Faltan ${minStock - totalStock} unidades`
            : totalStock < minStock * 2
            ? `${totalStock - minStock} unidades sobre el mínimo`
            : `Stock adecuado`}
        </p>
      </div>

      {/* Locations */}
      {locations.length > 0 && (
        <div className="border-t border-gray-200 pt-3 mt-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">Ubicaciones:</p>
          <div className="space-y-1">
            {locations.map((loc, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <span className="text-gray-600">{loc.location || 'Principal'}</span>
                <span className="font-medium text-gray-900">{loc.quantity} uds</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
