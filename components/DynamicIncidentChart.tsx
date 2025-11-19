'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { BarChart3, TrendingUp } from 'lucide-react'

interface ChartData {
  label: string
  count: number
}

interface DynamicStatsResponse {
  success: boolean
  groupBy: string
  filterField: string | null
  filterValue: string | null
  limit: number
  total: number
  data: ChartData[]
}

const CHART_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // amber-500
  '#eab308', // yellow-500
  '#84cc16', // lime-500
  '#22c55e', // green-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#a855f7', // purple-500
]

const VARIABLE_OPTIONS = [
  { value: 'category', label: 'Categoría' },
  { value: 'equipmentType', label: 'Equipo' },
  { value: 'technicianName', label: 'Técnico Instalador' },
  { value: 'filterType', label: 'Tipo de Filtrado' },
  { value: 'deliveryType', label: 'Delivery/Presencial' },
  { value: 'status', label: 'Estado' },
  { value: 'month', label: 'Mes' },
]

const TOP_N_OPTIONS = [5, 10, 20, 50]

export default function DynamicIncidentChart() {
  const [groupBy, setGroupBy] = useState('equipmentType')
  const [topN, setTopN] = useState(10)
  const [filterField, setFilterField] = useState('')
  const [filterValue, setFilterValue] = useState('')
  const [data, setData] = useState<ChartData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Available filter values for the selected filter field
  const [filterOptions, setFilterOptions] = useState<string[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.set('groupBy', groupBy)
      params.set('limit', topN.toString())

      if (filterField && filterValue) {
        params.set('filterField', filterField)
        params.set('filterValue', filterValue)
      }

      const response = await fetch(`/api/incidents/dynamic-stats?${params.toString()}`)
      const result: DynamicStatsResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar datos')
      }

      setData(result.data)
      setTotal(result.total)
    } catch (err: any) {
      console.error('Error fetching dynamic stats:', err)
      setError(err.message || 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  const fetchFilterOptions = async () => {
    if (!filterField) {
      setFilterOptions([])
      return
    }

    try {
      const params = new URLSearchParams()
      params.set('groupBy', filterField)
      params.set('limit', '100') // Get all unique values

      const response = await fetch(`/api/incidents/dynamic-stats?${params.toString()}`)
      const result: DynamicStatsResponse = await response.json()

      if (response.ok) {
        setFilterOptions(result.data.map(item => item.label).filter(Boolean))
      }
    } catch (err) {
      console.error('Error fetching filter options:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [groupBy, topN, filterField, filterValue])

  useEffect(() => {
    fetchFilterOptions()
    setFilterValue('') // Reset filter value when filter field changes
  }, [filterField])

  const handleResetFilters = () => {
    setFilterField('')
    setFilterValue('')
  }

  const getVariableLabel = (value: string) => {
    return VARIABLE_OPTIONS.find(opt => opt.value === value)?.label || value
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = total > 0 ? ((data.count / total) * 100).toFixed(1) : '0.0'

      return (
        <div className="bg-white px-4 py-3 rounded-lg shadow-xl border-2 border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-1">{data.label}</p>
          <p className="text-lg font-bold text-blue-600">{data.count} incidencias</p>
          <p className="text-xs text-gray-500 mt-0.5">{percentage}% del total filtrado</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-white" />
            <h2 className="text-lg font-semibold text-white">
              Análisis Dinámico de Incidencias
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-blue-100">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">{total} incidencias</span>
            {filterField && filterValue && (
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                Filtrado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 px-6 py-5 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Variable Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Variable a Visualizar
            </label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
            >
              {VARIABLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Top N Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Top N Resultados
            </label>
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
            >
              {TOP_N_OPTIONS.map(n => (
                <option key={n} value={n}>
                  Top {n}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Field Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Filtrar Por
            </label>
            <select
              value={filterField}
              onChange={(e) => setFilterField(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium"
            >
              <option value="">Sin filtro</option>
              {VARIABLE_OPTIONS.filter(opt => opt.value !== groupBy).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Value Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Valor del Filtro
            </label>
            <div className="flex gap-2">
              <select
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                disabled={!filterField}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Seleccionar...</option>
                {filterOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {filterField && (
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                  title="Limpiar filtros"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Display */}
        {filterField && filterValue && (
          <div className="mt-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Filtro activo:</span> Mostrando Top {topN} de{' '}
              <span className="font-bold text-blue-700">{getVariableLabel(groupBy)}</span> cuando{' '}
              <span className="font-bold text-blue-700">{getVariableLabel(filterField)}</span> = "{filterValue}"
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
              <p className="text-sm text-gray-600">Cargando datos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-80">
            <div className="text-center text-red-600">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-80">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No hay datos para mostrar</p>
              <p className="text-sm text-gray-500 mt-1">Intenta ajustar los filtros</p>
            </div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  tick={{ fontSize: 12, fill: '#4b5563' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#4b5563' }}
                  label={{ value: 'Cantidad', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#4b5563' } }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Data Table Below Chart */}
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-t border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      {getVariableLabel(groupBy)}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Cantidad</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">% del Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((item, index) => {
                    const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : '0.0'
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500 font-medium">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.label}</td>
                        <td className="px-4 py-3 text-sm font-bold text-right text-gray-900">
                          {item.count}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          {percentage}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
