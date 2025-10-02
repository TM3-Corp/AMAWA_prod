'use client'

import { CreditCard, DollarSign, Tag, TrendingUp, Check } from 'lucide-react'

interface PlanInformationCardProps {
  planCode: string | null
  planType: string | null
  planCurrency: string | null
  planValueCLP: number | null
  monthlyValueCLP: number | null
  monthlyValueUF: number | null
  discountPercent: number | null
  tokuEnabled: boolean
  needsInvoice: boolean | null
}

export function PlanInformationCard({
  planCode,
  planType,
  planCurrency,
  planValueCLP,
  monthlyValueCLP,
  monthlyValueUF,
  discountPercent,
  tokuEnabled,
  needsInvoice
}: PlanInformationCardProps) {
  const formatCLP = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatUF = (value: number) => {
    return `${value.toFixed(4)} UF`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Plan Contratado</h3>
        {planCode && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            {planCode}
          </span>
        )}
      </div>

      {/* Plan Type */}
      {planType && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">Tipo de Plan</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{planType}</p>
        </div>
      )}

      {/* Pricing */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 uppercase tracking-wide">Valor Mensual</span>
        </div>

        {planCurrency === 'CLP' && monthlyValueCLP ? (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
            <p className="text-3xl font-bold text-green-700">
              {formatCLP(monthlyValueCLP)}
            </p>
            <p className="text-sm text-green-600 mt-1">por mes</p>
            {planValueCLP && planValueCLP !== monthlyValueCLP && (
              <p className="text-xs text-gray-500 mt-2">
                Valor original: {formatCLP(planValueCLP)}
              </p>
            )}
          </div>
        ) : planCurrency === 'UF' && monthlyValueUF ? (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
            <p className="text-3xl font-bold text-purple-700">
              {formatUF(monthlyValueUF)}
            </p>
            <p className="text-sm text-purple-600 mt-1">por mes</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-500">Información de precio no disponible</p>
          </div>
        )}

        {/* Discount */}
        {discountPercent && discountPercent > 0 && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-semibold text-orange-700">
                {discountPercent}% de descuento aplicado
              </p>
              <p className="text-xs text-orange-600">Beneficio activo</p>
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="border-t border-gray-100 mt-6 pt-6">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 uppercase tracking-wide">Métodos de Pago</span>
        </div>

        <div className="space-y-2">
          {tokuEnabled && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-blue-600" />
              </div>
              <span className="font-medium text-gray-700">TOKU</span>
              <span className="text-xs text-gray-500 ml-auto">Habilitado</span>
            </div>
          )}

          {needsInvoice && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-purple-600" />
              </div>
              <span className="font-medium text-gray-700">Requiere Factura</span>
            </div>
          )}

          {!tokuEnabled && !needsInvoice && (
            <p className="text-sm text-gray-400">No especificado</p>
          )}
        </div>
      </div>
    </div>
  )
}
