'use client'

import { Activity, TrendingUp, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface HealthScoreCardProps {
  healthScore: number
  stats: {
    maintenance: {
      complianceRate: number
      avgDeviationDays: number
      responseRates: {
        excellent: number
        good: number
        fair: number
        poor: number
      }
    }
  }
}

export function HealthScoreCard({ healthScore, stats }: HealthScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-yellow-500 to-orange-500'
    if (score >= 40) return 'from-orange-500 to-red-500'
    return 'from-red-500 to-pink-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente'
    if (score >= 60) return 'Bueno'
    if (score >= 40) return 'Regular'
    return 'Necesita Atención'
  }

  const { excellent, good, fair, poor } = stats.maintenance.responseRates;
  const total = excellent + good + fair + poor || 1;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-gray-600" />
        <h3 className="text-lg font-bold text-gray-900">Salud del Cliente</h3>
      </div>

      {/* Health Score Circle */}
      <div className="flex flex-col items-center mb-6">
        <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getScoreBg(healthScore)} flex items-center justify-center shadow-lg mb-3`}>
          <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${getScoreColor(healthScore)}`}>
              {healthScore}
            </span>
            <span className="text-xs text-gray-500 mt-1">de 100</span>
          </div>
        </div>
        <span className={`text-lg font-semibold ${getScoreColor(healthScore)}`}>
          {getScoreLabel(healthScore)}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        {/* Compliance Rate */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Cumplimiento</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{stats.maintenance.complianceRate}%</p>
        </div>

        {/* Average Deviation */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-purple-600 uppercase tracking-wide font-semibold">Desviación Prom.</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {Math.abs(stats.maintenance.avgDeviationDays)}
            <span className="text-sm ml-1">días</span>
          </p>
        </div>
      </div>

      {/* Response Rate Distribution */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Distribución de Respuestas</span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex mb-3">
          {excellent > 0 && (
            <div
              className="bg-green-500"
              style={{ width: `${(excellent / total) * 100}%` }}
              title={`Excelente: ${excellent}`}
            />
          )}
          {good > 0 && (
            <div
              className="bg-blue-500"
              style={{ width: `${(good / total) * 100}%` }}
              title={`Bueno: ${good}`}
            />
          )}
          {fair > 0 && (
            <div
              className="bg-yellow-500"
              style={{ width: `${(fair / total) * 100}%` }}
              title={`Regular: ${fair}`}
            />
          )}
          {poor > 0 && (
            <div
              className="bg-red-500"
              style={{ width: `${(poor / total) * 100}%` }}
              title={`Pobre: ${poor}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
            <span className="text-gray-600">Excelente ({excellent})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
            <span className="text-gray-600">Bueno ({good})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
            <span className="text-gray-600">Regular ({fair})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
            <span className="text-gray-600">Pobre ({poor})</span>
          </div>
        </div>
      </div>

      {/* Health Insights */}
      {healthScore < 60 && (
        <div className="mt-5 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Recomendación</p>
              <p className="text-xs text-yellow-700 mt-1">
                Este cliente podría beneficiarse de un seguimiento más cercano para mejorar su historial de mantenciones.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
