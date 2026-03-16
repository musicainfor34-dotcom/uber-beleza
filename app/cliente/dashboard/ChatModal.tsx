'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { X, Send, MessageCircle, User } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Message {
  id: string
  content: string
  sender_id: string
  sender_type: 'professional' | 'client'
  created_at: string
  read: boolean
}

interface Conversation {
  id: string
  professional_id: string
  professional_name?: string
  professional_email?: string
  last_message?: string
  unread_client: boolean
  updated_at: string
}

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
}

export default function ChatModalClient({ isOpen, onClose, clientId }: ChatModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !clientId) return
    
    fetchConversations()
    
    const subscription = supabase
      .channel('conversations-client')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations', filter: `client_id=eq.${clientId}` },
        () => fetchConversations()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [isOpen, clientId])

  useEffect(() => {
    if (!selectedConversation) return
    
    fetchMessages(selectedConversation.id)
    markAsRead(selectedConversation.id)
    
    const subscription = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConversation.id}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          professional:professional_id (
            nome,
            email
          )
        `)
        .eq('client_id', clientId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar conversas:', error)
        return
      }

      if (data) {
        const formatted = data.map((conv: any) => ({
          ...conv,
          professional_name: conv.professional?.nome || conv.professional?.email?.split('@')[0] || 'Profissional',
          professional_email: conv.professional?.email
        }))
        setConversations(formatted)
      }
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Erro ao buscar mensagens:', error)
        return
      }

      if (data) {
        setMessages(data)
        scrollToBottom()
      }
    } catch (err) {
      console.error('Erro:', err)
    }
  }

  const markAsRead = async (conversationId: string) => {
    await supabase
      .from('conversations')
      .update({ unread_client: false })
      .eq('id', conversationId)
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: clientId,
          sender_type: 'client',
          content: newMessage.trim()
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao enviar:', error)
        alert('Erro ao enviar mensagem: ' + error.message)
        return
      }

      // Atualizar last_message na conversa
      await supabase
        .from('conversations')
        .update({ 
          last_message: newMessage.trim(),
          updated_at: new Date().toISOString(),
          unread_professional: true 
        })
        .eq('id', selectedConversation.id)
      
      setNewMessage('')
      
      // Adicionar mensagem localmente
      setMessages(prev => [...prev, data])
      
    } catch (err: any) {
      console.error('Erro no envio:', err)
      alert('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden">
        
        {/* Lista de Conversas */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800">
              <MessageCircle className="w-5 h-5 text-purple-600" />
              Minhas Conversas
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                Carregando...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma conversa ainda</p>
                <p className="text-xs mt-1">Quando um profissional entrar em contato, aparecerá aqui</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 text-left border-b border-gray-100 hover:bg-white transition-all ${
                    selectedConversation?.id === conv.id ? 'bg-white border-l-4 border-l-purple-500 shadow-sm' : ''
                  } ${conv.unread_client ? 'bg-yellow-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {conv.professional_name?.[0]?.toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-gray-800 truncate">
                          {conv.professional_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(conv.updated_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-1">{conv.professional_email}</p>
                      {conv.last_message && (
                        <p className={`text-sm truncate ${conv.unread_client ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                          {conv.last_message}
                        </p>
                      )}
                      {conv.unread_client && (
                        <span className="inline-block mt-1 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Área de Mensagens */}
        <div className="w-2/3 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedConversation.professional_name?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{selectedConversation.professional_name}</h4>
                    <p className="text-xs text-gray-500">{selectedConversation.professional_email}</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <User className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                    <p className="text-xs">Envie uma mensagem para o profissional!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isClient = msg.sender_type === 'client'
                    const showDate = index === 0 || 
                      new Date(messages[index-1].created_at).toDateString() !== new Date(msg.created_at).toDateString()
                    
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                              {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isClient ? 'order-2' : 'order-1'}`}>
                            <div
                              className={`p-3 rounded-2xl ${
                                isClient
                                  ? 'bg-purple-600 text-white rounded-br-none'
                                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                            </div>
                            <span className={`text-xs mt-1 block ${
                              isClient ? 'text-right text-gray-400' : 'text-gray-400'
                            }`}>
                              {formatTime(msg.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {sending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
              <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium">Selecione uma conversa</p>
              <p className="text-sm">Escolha um profissional na lista ao lado</p>
              <button 
                onClick={onClose}
                className="mt-6 px-6 py-2 text-gray-600 hover:bg-white rounded-lg border border-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}