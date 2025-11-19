'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface WhatsAppMessage {
  id: string
  waMessageId: string
  fromPhone: string
  messageType: string
  textBody: string | null
  buttonId: string | null
  buttonTitle: string | null
  timestamp: string
  processed: boolean
  processedAt: string | null
  processingNotes: string | null
  client: {
    id: string
    name: string
    phone: string
  } | null
  relatedMaintenance: {
    id: string
    status: string
    scheduledDate: string
  } | null
}

interface MessagesResponse {
  messages: WhatsAppMessage[]
  totalCount: number
  unprocessedCount: number
  limit: number
}

export default function WhatsAppMessagesPage() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [unprocessedCount, setUnprocessedCount] = useState(0)
  const [showUnprocessedOnly, setShowUnprocessedOnly] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(showUnprocessedOnly && { unprocessed: 'true' })
      })

      const response = await fetch(`/api/whatsapp/messages?${params}`)
      const data: MessagesResponse = await response.json()

      setMessages(data.messages)
      setUnprocessedCount(data.unprocessedCount)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()

    // Auto-refresh every 10 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchMessages, 10000)
      return () => clearInterval(interval)
    }
  }, [showUnprocessedOnly, autoRefresh])

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '💬'
      case 'interactive':
        return '🔘'
      case 'image':
        return '📷'
      case 'document':
        return '📄'
      default:
        return '📱'
    }
  }

  const getStatusBadge = (message: WhatsAppMessage) => {
    if (message.processed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✅ Procesado
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        ⏳ Pendiente
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitor de Mensajes WhatsApp</h1>
            <p className="text-sm text-gray-500 mt-1">
              Mensajes recibidos de clientes en tiempo real
            </p>
          </div>

          <div className="flex items-center gap-4">
            {unprocessedCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                {unprocessedCount} sin procesar
              </span>
            )}

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                autoRefresh
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {autoRefresh ? '🔄 Auto-actualización' : '⏸️  Pausado'}
            </button>

            <button
              onClick={() => setShowUnprocessedOnly(!showUnprocessedOnly)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                showUnprocessedOnly
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {showUnprocessedOnly ? 'Mostrar todos' : 'Solo sin procesar'}
            </button>

            <button
              onClick={fetchMessages}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            {showUnprocessedOnly ? 'No hay mensajes sin procesar' : 'No hay mensajes recibidos'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`bg-white rounded-lg shadow p-6 ${
                !message.processed ? 'border-l-4 border-yellow-400' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getMessageTypeIcon(message.messageType)}</span>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {message.client ? message.client.name : 'Cliente desconocido'}
                      </h3>
                      <p className="text-sm text-gray-500">{message.fromPhone}</p>
                    </div>

                    {getStatusBadge(message)}
                  </div>

                  {message.textBody && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap">{message.textBody}</p>
                    </div>
                  )}

                  {message.buttonTitle && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600">Botón presionado:</p>
                      <p className="font-medium text-blue-800">{message.buttonTitle}</p>
                      {message.buttonId && (
                        <p className="text-xs text-gray-500 mt-1">ID: {message.buttonId}</p>
                      )}
                    </div>
                  )}

                  {message.relatedMaintenance && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        Mantención vinculada: {message.relatedMaintenance.id.slice(0, 8)}...
                      </p>
                      <p className="text-xs text-green-600">
                        Estado: {message.relatedMaintenance.status}
                      </p>
                    </div>
                  )}

                  {message.processingNotes && (
                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-800">{message.processingNotes}</p>
                    </div>
                  )}
                </div>

                <div className="ml-4 text-right text-sm text-gray-500">
                  <p>
                    {formatDistanceToNow(new Date(message.timestamp), {
                      addSuffix: true,
                      locale: es
                    })}
                  </p>
                  {message.processedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Procesado {formatDistanceToNow(new Date(message.processedAt), {
                        addSuffix: true,
                        locale: es
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
