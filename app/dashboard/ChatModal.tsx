'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { X, Send, User, MessageCircle, Loader2 } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userType: 'client' | 'professional'
  professionalId?: string // Opcional: se já souber com qual profissional falar
  professionalName?: string
}

export default function ChatModal({ 
  isOpen, 
  onClose, 
  userId, 
  userType,
  professionalId,
  professionalName 
}: ChatModalProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Buscar conversas ao abrir
  useEffect(() => {
    if (isOpen && userId) {
      fetchConversations()
    }
  }, [isOpen, userId])

  // Realtime: escutar novas mensagens na conversa ativa
  useEffect(() => {
    if (!activeConversation) return

    const subscription = supabase
      .channel(`messages:${activeConversation}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [activeConversation])

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchConversations() {
    setLoadingConversations(true)
    try {
      const column = userType === 'client' ? 'client_id' : 'professional_id'
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          client:client_id(id, email),
          professional:professional_id(id, nome)
        `)
        .eq(column, userId)
        .order('updated_at', { ascending: false })

      if (error) throw error

      setConversations(data || [])
      
      // Se tiver professionalId pré-selecionado, abre conversa com ele
      if (professionalId) {
        const existing = data?.find(c => 
          userType === 'client' 
            ? c.professional_id === professionalId
            : c.client_id === professionalId
        )
        if (existing) {
          setActiveConversation(existing.id)
          fetchMessages(existing.id)
        } else {
          // Criar nova conversa
          createConversation(professionalId)
        }
      } else if (data && data.length > 0 && !activeConversation) {
        setActiveConversation(data[0].id)
        fetchMessages(data[0].id)
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error)
    } finally {
      setLoadingConversations(false)
    }
  }

  async function createConversation(otherId: string) {
    try {
      const newConversation = {
        client_id: userType === 'client' ? userId : otherId,
        professional_id: userType === 'client' ? otherId : userId,
        unread_client: userType === 'professional',
        unread_professional: userType === 'client'
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert(newConversation)
        .select()
        .single()

      if (error) throw error

      setConversations(prev => [data, ...prev])
      setActiveConversation(data.id)
    } catch (error) {
      console.error('Erro ao criar conversa:', error)
    }
  }

  async function fetchMessages(conversationId: string) {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages(data || [])
      
      // Marcar como lida
      await markAsRead(conversationId)
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(conversationId: string) {
    const updateField = userType === 'client' ? 'unread_client' : 'unread_professional'
    await supabase
      .from('conversations')
      .update({ [updateField]: false })
      .eq('id', conversationId)
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation) return

    const message = {
      conversation_id: activeConversation,
      sender_id: userId,
      sender_type: userType,
      content: newMessage.trim()
    }

    try {
      const { error } = await supabase.from('messages').insert(message)
      if (error) throw error

      // Atualizar timestamp da conversa
      await supabase
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString(),
          [userType === 'client' ? 'unread_professional' : 'unread_client']: true
        })
        .eq('id', activeConversation)

      setNewMessage('')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[80vh] md:h-[600px] flex overflow-hidden shadow-2xl">
        
        {/* Sidebar - Lista de Conversas */}
        <div className="w-full md:w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-pink-500" />
              Conversas
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p>Nenhuma conversa ainda.</p>
                <p className="text-sm mt-2">Inicie um agendamento para conversar!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((conv) => {
                  const otherUser = userType === 'client' ? conv.professional : conv.client
                  const hasUnread = userType === 'client' ? conv.unread_client : conv.unread_professional
                  
                  return (
                    <button
                      key={conv.id}
                      onClick={() => {
                        setActiveConversation(conv.id)
                        fetchMessages(conv.id)
                      }}
                      className={`w-full p-4 text-left hover:bg-gray-100 transition-colors ${
                        activeConversation === conv.id ? 'bg-pink-50 border-l-4 border-pink-500' : ''
                      } ${hasUnread ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold">
                          {otherUser?.nome?.charAt(0) || otherUser?.email?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${hasUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                            {otherUser?.nome || otherUser?.email || 'Usuário'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(conv.updated_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        {hasUnread && (
                          <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Área de Chat */}
        <div className="flex-1 flex flex-col bg-white hidden md:flex">
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">
                      {userType === 'client' 
                        ? conversations.find(c => c.id === activeConversation)?.professional?.nome || 'Profissional'
                        : conversations.find(c => c.id === activeConversation)?.client?.email || 'Cliente'
                      }
                    </h4>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Envie uma mensagem para iniciar a conversa!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === userId
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-2xl ${
                            isMe 
                              ? 'bg-pink-500 text-white rounded-br-none' 
                              : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-pink-100' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 p-3 bg-gray-100 rounded-xl border-0 focus:ring-2 focus:ring-pink-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-3 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Selecione uma conversa para começar</p>
              </div>
            </div>
          )}
        </div>

        {/* Mobile: Botão fechar quando não tem conversa selecionada */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden p-2 bg-white rounded-full shadow-lg z-10"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
      </div>
    </div>
  )
}