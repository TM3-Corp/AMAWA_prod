'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface Maintenance {
  id: string
  scheduledDate: string
  actualDate: string | null
  completedDate: string | null
  status: string
  type: string
  isOverdue: boolean
  client: {
    id: string
    name: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    comuna: string | null
    equipment: any[]
    contracts: any[]
  }
}

interface MaintenanceCalendarProps {
  maintenances: Maintenance[]
  onDateClick: (date: Date, maintenances: Maintenance[]) => void
}

export default function MaintenanceCalendar({ maintenances, onDateClick }: MaintenanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<Date[]>([])

  useEffect(() => {
    generateCalendarDays()
  }, [currentDate])

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)

    // Start from the previous month to fill the grid
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    // Generate 42 days (6 weeks)
    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      days.push(new Date(startDate))
      startDate.setDate(startDate.getDate() + 1)
    }

    setCalendarDays(days)
  }

  const getMaintenancesForDate = (date: Date): Maintenance[] => {
    const dateStr = date.toISOString().split('T')[0]
    return maintenances.filter(m => {
      const mDate = new Date(m.scheduledDate).toISOString().split('T')[0]
      return mDate === dateStr
    })
  }

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth()
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const monthYear = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500'
      case 'SCHEDULED': return 'bg-blue-500'
      case 'IN_PROGRESS': return 'bg-purple-500'
      case 'COMPLETED': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold capitalize">{monthYear}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Hoy
          </button>
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const dayMaintenances = getMaintenancesForDate(date)
          const isOtherMonth = !isCurrentMonth(date)
          const isTodayDate = isToday(date)

          return (
            <div
              key={index}
              className={`min-h-[120px] p-2 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                isOtherMonth ? 'bg-gray-50' : ''
              } ${isTodayDate ? 'bg-blue-50' : ''}`}
              onClick={() => onDateClick(date, dayMaintenances)}
            >
              {/* Date Number */}
              <div className={`text-sm font-medium mb-1 ${
                isOtherMonth ? 'text-gray-400' : 'text-gray-700'
              } ${isTodayDate ? 'text-blue-600 font-bold' : ''}`}>
                {date.getDate()}
              </div>

              {/* Maintenance Indicators */}
              <div className="space-y-1">
                {dayMaintenances.slice(0, 3).map((maintenance, idx) => {
                  const isOverdue = new Date(maintenance.scheduledDate) < new Date() &&
                                   maintenance.status === 'PENDING'

                  return (
                    <div
                      key={maintenance.id}
                      className={`text-xs p-1 rounded truncate ${
                        isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}
                      title={`${maintenance.client.firstName} ${maintenance.client.lastName} - ${maintenance.type}`}
                    >
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(maintenance.status)}`} />
                        <span className="truncate">
                          {maintenance.client.firstName} {maintenance.client.lastName}
                        </span>
                      </div>
                    </div>
                  )
                })}

                {/* Show count if more than 3 */}
                {dayMaintenances.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{dayMaintenances.length - 3} más
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-4 border-t text-xs">
        <span className="font-medium text-gray-600">Estado:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Agendada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>En Progreso</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Completada</span>
        </div>
      </div>
    </div>
  )
}
