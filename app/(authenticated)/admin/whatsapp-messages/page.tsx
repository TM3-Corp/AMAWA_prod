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

interface MessageGroup {
  batchKey: string
  messages: WhatsAppMessage[]
  processingNotes: string | null
  processedAt: string | null
  processed: boolean
}

export default function WhatsAppMessagesPage() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [unprocessedCount, setUnprocessedCount] = useState(0)
  const [showUnprocessedOnly, setShowUnprocessedOnly] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [phoneFilter, setPhoneFilter] = useState('')
  const [phoneSearch, setPhoneSearch] = useState('')

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(showUnprocessedOnly && { unprocessed: 'true' }),
        ...(phoneSearch && { phone: phoneSearch })
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
  }, [showUnprocessedOnly, autoRefresh, phoneSearch])

  const handlePhoneSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPhoneSearch(phoneFilter)
  }

  const clearPhoneFilter = () => {
    setPhoneFilter('')
    setPhoneSearch('')
  }

  // Group messages by batch (same processingNotes + processedAt = same batch)
  const groupMessages = (messages: WhatsAppMessage[]): MessageGroup[] => {
    const groups: MessageGroup[] = []
    const groupMap = new Map<string, WhatsAppMessage[]>()

    messages.forEach(msg => {
      // Create a unique key for each batch
      // Batched messages have identical processingNotes and processedAt
      const batchKey = msg.processed && msg.processedAt && msg.processingNotes
        ? `${msg.fromPhone}-${msg.processedAt}-${msg.processingNotes}`
        : `single-${msg.id}`

      if (!groupMap.has(batchKey)) {
        groupMap.set(batchKey, [])
      }
      groupMap.get(batchKey)!.push(msg)
    })

    // Convert map to array of groups
    groupMap.forEach((msgs, key) => {
      const isBatch = msgs.length > 1 && msgs[0].processed
      groups.push({
        batchKey: key,
        messages: msgs.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
        processingNotes: msgs[0].processingNotes,
        processedAt: msgs[0].processedAt,
        processed: msgs[0].processed
      })
    })

    return groups
  }

  const messageGroups = groupMessages(messages)

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
        <div className="flex items-center justify-between mb-4">
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

        {/* Phone filter */}
        <form onSubmit={handlePhoneSearch} className="flex items-center gap-2">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              placeholder="Filtrar por número de teléfono..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
          >
            🔍 Buscar
          </button>
          {phoneSearch && (
            <button
              type="button"
              onClick={clearPhoneFilter}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm font-medium"
            >
              ✕ Limpiar
            </button>
          )}
        </form>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            {showUnprocessedOnly ? 'No hay mensajes sin procesar' : 'No hay mensajes recibidos'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messageGroups.map((group) => {
            const isBatch = group.messages.length > 1
            const firstMessage = group.messages[0]

            return (
              <div
                key={group.batchKey}
                className={`bg-white rounded-lg shadow ${
                  !group.processed ? 'border-l-4 border-yellow-400' : ''
                } ${isBatch ? 'border-2 border-blue-200' : ''}`}
              >
                {/* Batch header */}
                {isBatch && (
                  <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-semibold">📦 Lote de {group.messages.length} mensajes</span>
                        <span className="text-sm text-blue-600">
                          (procesados juntos)
                        </span>
                      </div>
                      {group.processedAt && (
                        <span className="text-xs text-blue-600">
                          Procesado {formatDistanceToNow(new Date(group.processedAt), {
                            addSuffix: true,
                            locale: es
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Client header (same for all messages in group) */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{getMessageTypeIcon(firstMessage.messageType)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {firstMessage.client ? firstMessage.client.name : 'Cliente desconocido'}
                      </h3>
                      <p className="text-sm text-gray-500">{firstMessage.fromPhone}</p>
                    </div>
                    {getStatusBadge(firstMessage)}
                  </div>

                  {/* Individual messages in the batch */}
                  <div className={`space-y-3 ${isBatch ? 'pl-4 border-l-2 border-blue-100' : ''}`}>
                    {group.messages.map((message, idx) => (
                      <div key={message.id}>
                        {isBatch && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-blue-600">
                              Mensaje {idx + 1}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(message.timestamp), {
                                addSuffix: true,
                                locale: es
                              })}
                            </span>
                          </div>
                        )}

                        {message.textBody && (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-gray-800 whitespace-pre-wrap">{message.textBody}</p>
                          </div>
                        )}

                        {message.buttonTitle && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-gray-600">Botón presionado:</p>
                            <p className="font-medium text-blue-800">{message.buttonTitle}</p>
                            {message.buttonId && (
                              <p className="text-xs text-gray-500 mt-1">ID: {message.buttonId}</p>
                            )}
                          </div>
                        )}

                        {message.relatedMaintenance && (
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-800">
                              Mantención vinculada: {message.relatedMaintenance.id.slice(0, 8)}...
                            </p>
                            <p className="text-xs text-green-600">
                              Estado: {message.relatedMaintenance.status}
                            </p>
                          </div>
                        )}

                        {!isBatch && !message.processed && (
                          <div className="text-sm text-gray-400 mt-2">
                            {formatDistanceToNow(new Date(message.timestamp), {
                              addSuffix: true,
                              locale: es
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Processing notes (shared for entire batch) */}
                  {group.processingNotes && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg border-t border-purple-100">
                      <p className="text-sm text-purple-800">{group.processingNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
