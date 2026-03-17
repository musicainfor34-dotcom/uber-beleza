'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  Scissors, 
  Paintbrush,
  Sparkles,
  Gem,
  Star,
  MapPin,
  LogOut,
  ArrowRight,
  ChevronRight,
  Clock,
  Loader2,
  MessageCircle,
  Send,
  X,
  Calendar,
  ArrowLeft,
  Phone
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Interfaces atualizadas para o novo schema
interface Conversa {
  id: string
  professional_id: string
  professional_nome: string
  professional_email: string
  last_message?: string
  unread_client: boolean
  updated_at: string
  created_at: string
}

interface Mensagem {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'client' | 'professional'
  content: string
  created_at: string
  read: boolean
}

export default function ClienteDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<'servicos' | 'conversas'>('servicos')
  const [servicoSelecionado, setServicoSelecionado] = useState<string | null>(null)
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [loadingProfissionais, setLoadingProfissionais] = useState(false)
  
  // Estados do Chat atualizados
  const [chatAberto, setChatAberto] = useState(false)
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [loadingConversas, setLoadingConversas] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user?.id && abaAtiva === 'conversas') {
      carregarConversas()
    }
  }, [user, abaAtiva])

  useEffect(() => {
    if (servicoSelecionado && abaAtiva === 'servicos') {
      buscarProfissionais(servicoSelecionado)
    }
  }, [servicoSelecionado, abaAtiva])

  useEffect(() => {
    scrollToBottom()
  }, [mensagens])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user)
    setLoading(false)
  }

  // NOVA FUNÇÃO: Carregar conversas do cliente
async function carregarConversas() {
  if (!user?.id) return
  
  setLoadingConversas(true)
  try {
    // Busca SEM join primeiro
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Erro detalhado:', error)
      return
    }

    if (data) {
      // Busca dados dos profissionais separadamente
      const profIds = data.map(c => c.professional_id)
      const { data: profs } = await supabase
        .from('professionals')
        .select('id, nome, email')
        .in('id', profIds)
      
      const profMap = (profs || []).reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {} as any)

      const conversasFormatadas = data.map((conv: any) => ({
        id: conv.id,
        professional_id: conv.professional_id,
        professional_nome: profMap[conv.professional_id]?.nome || profMap[conv.professional_id]?.email?.split('@')[0] || 'Profissional',
        professional_email: profMap[conv.professional_id]?.email || '',
        last_message: conv.last_message,
        unread_client: conv.unread_client,
        updated_at: conv.updated_at,
        created_at: conv.created_at
      }))
      setConversas(conversasFormatadas)
    }
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    setLoadingConversas(false)
  }
}

  // NOVA FUNÇÃO: Buscar mensagens da conversa
  async function buscarMensagens(conversationId: string) {
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
        setMensagens(data)
        scrollToBottom()
      }
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  // NOVA FUNÇÃO: Marcar como lida
  async function marcarComoLida(conversationId: string) {
    await supabase
      .from('conversations')
      .update({ unread_client: false })
      .eq('id', conversationId)
  }

  // FUNÇÃO ATUALIZADA: Abrir chat
  async function abrirChat(conversa: Conversa) {
    setConversaSelecionada(conversa)
    setChatAberto(true)
    await buscarMensagens(conversa.id)
    await marcarComoLida(conversa.id)
    
    // Atualizar lista de conversas para refletir "lida"
    carregarConversas()
  }

  // FUNÇÃO ATUALIZADA: Enviar mensagem
  async function enviarMensagem() {
    if (!novaMensagem.trim() || !conversaSelecionada || !user?.id) return

    const mensagemTemp: Mensagem = {
      id: Date.now().toString(),
      conversation_id: conversaSelecionada.id,
      sender_id: user.id,
      sender_type: 'client',
      content: novaMensagem.trim(),
      created_at: new Date().toISOString(),
      read: false
    }

    // Inserir na tabela messages
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversaSelecionada.id,
      sender_id: user.id,
      sender_type: 'client',
      content: novaMensagem.trim(),
      read: false
    })

    if (error) {
      console.error('Erro ao enviar mensagem:', error)
      return
    }

    // Atualizar last_message na conversa
    await supabase
      .from('conversations')
      .update({ 
        last_message: novaMensagem.trim(),
        updated_at: new Date().toISOString(),
        unread_professional: true 
      })
      .eq('id', conversaSelecionada.id)

    setMensagens(prev => [...prev, mensagemTemp])
    setNovaMensagem('')
    scrollToBottom()
    
    // Recarregar lista de conversas para atualizar preview
    carregarConversas()
  }

  // Realtime: ouvir novas mensagens na conversa ativa
  useEffect(() => {
    if (!conversaSelecionada) return

    const subscription = supabase
      .channel(`messages:${conversaSelecionada.id}`)
      .on('postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${conversaSelecionada.id}` 
        },
        (payload) => {
          const novaMsg = payload.new as Mensagem
          // Só adiciona se não for a mensagem que o próprio usuário acabou de enviar
          if (novaMsg.sender_id !== user?.id) {
            setMensagens(prev => [...prev, novaMsg])
            scrollToBottom()
            marcarComoLida(conversaSelecionada.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [conversaSelecionada, user?.id])

  async function buscarProfissionais(especialidade: string) {
    setLoadingProfissionais(true)
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const filtrados = (data || []).filter((prof: any) => {
        const especs = prof.especialidade || []
        return especs.some((esp: string) => 
          esp.toLowerCase() === especialidade.toLowerCase()
        )
      })

      setProfissionais(filtrados)
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error)
    } finally {
      setLoadingProfissionais(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const servicos = [
    {
      id: 'Cabelo',
      nome: 'Cabelo',
      descricao: 'Corte, coloração, hidratação',
      cor: 'from-yellow-400 to-orange-500',
      bgIcon: 'bg-yellow-400',
      textColor: 'text-yellow-400',
      icon: Scissors,
      preco: 'R$ 50'
    },
    {
      id: 'Maquiagem',
      nome: 'Maquiagem',
      descricao: 'Social, festa e noiva',
      cor: 'from-pink-400 to-rose-500',
      bgIcon: 'bg-pink-400',
      textColor: 'text-pink-400',
      icon: Paintbrush,
      preco: 'R$ 120'
    },
    {
      id: 'Manicure',
      nome: 'Manicure',
      descricao: 'Esmaltação e nail art',
      cor: 'from-red-400 to-pink-500',
      bgIcon: 'bg-red-400',
      textColor: 'text-red-400',
      icon: Sparkles,
      preco: 'R$ 35'
    },
    {
      id: 'Pedicure',
      nome: 'Pedicure',
      descricao: 'Spa dos pés e cuidados',
      cor: 'from-purple-400 to-violet-500',
      bgIcon: 'bg-purple-400',
      textColor: 'text-purple-400',
      icon: Gem,
      preco: 'R$ 40'
    }
  ]

  const servicoAtual = servicos.find(s => s.id === servicoSelecionado)

  // Contar conversas não lidas
  const conversasNaoLidas = conversas.filter(c => c.unread_client).length

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 md:bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 md:border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 md:bg-gray-50">
      {/* ===== MOBILE LAYOUT (< md) ===== */}
      <div className="md:hidden flex flex-col min-h-screen pb-20">
        <header className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {abaAtiva === 'conversas' ? 'Conversas' : 'Serviços'}
            </h1>
            <p className="text-slate-400 text-sm">
              {abaAtiva === 'conversas' ? 'Seus chats' : 'Escolha uma categoria'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* CONTEÚDO: SERVIÇOS */}
        {abaAtiva === 'servicos' && !servicoSelecionado && (
          <main className="flex-1 px-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              {servicos.map((servico) => (
                <button
                  key={servico.id}
                  onClick={() => setServicoSelecionado(servico.id)}
                  className="aspect-square bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-slate-700 hover:border-slate-600"
                >
                  <div className={`w-16 h-16 rounded-2xl ${servico.bgIcon} bg-opacity-20 flex items-center justify-center`}>
                    <servico.icon className={`w-8 h-8 ${servico.textColor}`} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-bold text-lg">{servico.nome}</h3>
                    <p className="text-slate-400 text-xs mt-1">Ver profissionais</p>
                  </div>
                </button>
              ))}
            </div>
          </main>
        )}

        {/* CONTEÚDO: PROFISSIONAIS DE UM SERVIÇO */}
        {abaAtiva === 'servicos' && servicoSelecionado && (
          <main className="flex-1 px-4 py-2">
            <button 
              onClick={() => setServicoSelecionado(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              <span>Voltar</span>
            </button>

            {servicoAtual && (
              <div className="bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-700">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl ${servicoAtual.bgIcon} bg-opacity-20 flex items-center justify-center`}>
                    <servicoAtual.icon className={`w-7 h-7 ${servicoAtual.textColor}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{servicoAtual.nome}</h2>
                    <p className="text-slate-400 text-sm">
                      {loadingProfissionais ? 'Carregando...' : `${profissionais.length} profissionais`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loadingProfissionais ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
              </div>
            ) : profissionais.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>Nenhum profissional disponível para esta categoria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profissionais.map((prof) => (
                  <div 
                    key={prof.id}
                    onClick={() => router.push(`/profissional/${prof.id}`)}
                    className="bg-slate-800 rounded-2xl p-4 border border-slate-700 active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                          {prof.nome?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        {prof.ativo && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{prof.nome}</h4>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span>{prof.avaliacao || 5.0}</span>
                          <span className="text-xs">({prof.cidade || 'Sem cidade'})</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-lg font-bold text-white">
                          R$ {prof.preco_hora || '0'}
                        </span>
                        <button className="mt-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 text-xs font-bold rounded-lg">
                          Agendar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        )}

        {/* CONTEÚDO: CONVERSAS - ATUALIZADO */}
        {abaAtiva === 'conversas' && (
          <main className="flex-1 px-4 py-2">
            <div className="space-y-3">
              {loadingConversas ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              ) : conversas.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Nenhuma conversa ainda</p>
                  <p className="text-sm mt-2">Agende um serviço para conversar</p>
                </div>
              ) : (
                conversas.map((conversa) => (
                  <div 
                    key={conversa.id}
                    onClick={() => abrirChat(conversa)}
                    className="bg-slate-800 rounded-2xl p-4 border border-slate-700 active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {conversa.professional_nome.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white">{conversa.professional_nome}</h4>
                          <span className="text-xs text-slate-400">
                            {new Date(conversa.updated_at).toLocaleDateString('pt-BR', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 truncate">
                          {conversa.last_message || 'Clique para conversar'}
                        </p>
                      </div>
                      {conversa.unread_client && (
                        <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </main>
        )}

        {/* BOTTOM NAV MOBILE */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4">
          <div className="flex justify-around items-center">
            <button 
              onClick={() => {setAbaAtiva('servicos'); setServicoSelecionado(null)}}
              className={`flex flex-col items-center gap-1 ${abaAtiva === 'servicos' ? 'text-yellow-400' : 'text-slate-400'}`}
            >
              <Scissors className="w-6 h-6" />
              <span className="text-xs">Serviços</span>
            </button>
            
            <button 
              onClick={() => setAbaAtiva('conversas')}
              className={`flex flex-col items-center gap-1 ${abaAtiva === 'conversas' ? 'text-blue-400' : 'text-slate-400'}`}
            >
              <div className="relative">
                <MessageCircle className="w-6 h-6" />
                {conversasNaoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                    {conversasNaoLidas}
                  </span>
                )}
              </div>
              <span className="text-xs">Conversas</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT (>= md) ===== */}
      <div className="hidden md:flex h-screen">
        <aside className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Beleza Connect</h1>
                <p className="text-sm text-gray-500">Olá, {user?.email?.split('@')[0]}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500">
                  <LogOut className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Tabs Desktop */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {setAbaAtiva('servicos'); setServicoSelecionado(null)}}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                  abaAtiva === 'servicos' 
                    ? 'bg-pink-100 text-pink-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Serviços
              </button>
              <button
                onClick={() => setAbaAtiva('conversas')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
                  abaAtiva === 'conversas' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Conversas ({conversas.length})
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {abaAtiva === 'servicos' ? (
              <div className="space-y-3">
                {servicos.map((servico) => (
                  <button
                    key={servico.id}
                    onClick={() => setServicoSelecionado(servico.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                      servicoSelecionado === servico.id 
                        ? 'border-pink-400 bg-pink-50' 
                        : 'border-gray-100 bg-white hover:border-pink-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-1 h-12 rounded-full bg-gradient-to-b ${servico.cor}`}></div>
                      <div className={`w-12 h-12 rounded-xl ${servico.bgIcon} bg-opacity-10 flex items-center justify-center`}>
                        <servico.icon className={`w-6 h-6 ${servico.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-lg ${servicoSelecionado === servico.id ? 'text-pink-600' : 'text-gray-800'}`}>
                          {servico.nome}
                        </h3>
                        <p className="text-sm text-gray-500">{servico.descricao}</p>
                      </div>
                      <ChevronRight className={`w-5 h-5 ${servicoSelecionado === servico.id ? 'text-pink-400' : 'text-gray-300'}`} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {loadingConversas ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : conversas.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma conversa ainda</p>
                    <p className="text-xs mt-2">Agende um serviço para conversar</p>
                  </div>
                ) : (
                  conversas.map((conversa) => (
                    <div 
                      key={conversa.id}
                      onClick={() => abrirChat(conversa)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                        conversa.unread_client 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                          {conversa.professional_nome.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-gray-800">{conversa.professional_nome}</h4>
                            <span className="text-xs text-gray-400">
                              {new Date(conversa.updated_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${conversa.unread_client ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                            {conversa.last_message || 'Clique para conversar'}
                          </p>
                        </div>
                        {conversa.unread_client && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">
          {abaAtiva === 'servicos' ? (
            !servicoSelecionado ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Scissors className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-700 mb-2">Escolha um serviço</h2>
                <p className="text-gray-500 max-w-md">
                  Selecione uma categoria à esquerda para visualizar os profissionais disponíveis.
                </p>
              </div>
            ) : (
              <div className="max-w-4xl">
                {servicoAtual && (
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-2xl ${servicoAtual.bgIcon} bg-opacity-10 flex items-center justify-center`}>
                        <servicoAtual.icon className={`w-8 h-8 ${servicoAtual.textColor}`} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-800">{servicoAtual.nome}</h2>
                        <p className="text-gray-500">
                          {loadingProfissionais ? 'Carregando...' : `${profissionais.length} profissionais disponíveis`}
                        </p>
                      </div>
                    </div>

                    {loadingProfissionais ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                      </div>
                    ) : profissionais.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-200">
                        <p className="text-lg">Nenhum profissional disponível.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {profissionais.map((prof) => (
                          <div 
                            key={prof.id}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => router.push(`/profissional/${prof.id}`)}
                          >
                            <div className="flex items-start gap-4">
                              <div className="relative">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                  {prof.nome?.charAt(0).toUpperCase() || 'P'}
                                </div>
                                {prof.ativo && (
                                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-bold text-xl text-gray-800 group-hover:text-pink-600 transition-colors">{prof.nome}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                      <span className="font-medium text-gray-700">{prof.avaliacao || 5.0}</span>
                                    </div>
                                  </div>
                                  <span className="text-2xl font-bold text-gray-800">
                                    R$ {prof.preco_hora || 0}
                                  </span>
                                </div>
                                <button className="mt-4 w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
                                  Agendar Horário
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
              <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Suas Conversas</h2>
              <p>Selecione uma conversa à esquerda para começar a conversar.</p>
            </div>
          )}
        </main>
      </div>

      {/* MODAL DE CHAT ATUALIZADO (Funciona em ambos) */}
      {chatAberto && conversaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-0 md:p-4">
          <div className="bg-slate-900 md:bg-white w-full md:w-full md:max-w-lg h-[85vh] md:h-[600px] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up border border-slate-700 md:border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setChatAberto(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                  {conversaSelecionada.professional_nome.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold">{conversaSelecionada.professional_nome}</h3>
                  <p className="text-xs opacity-90 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setChatAberto(false)}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-800 md:bg-gray-100">
              <div className="text-center text-xs text-slate-500 md:text-gray-400 my-4">
                {new Date().toLocaleDateString('pt-BR')}
              </div>
              
              {mensagens.length === 0 && (
                <div className="text-center text-xs text-slate-500 md:text-gray-500 bg-slate-700/50 md:bg-white/50 py-2 px-4 rounded-full mx-auto w-fit">
                  Inicie a conversa com {conversaSelecionada.professional_nome}
                </div>
              )}

              {mensagens.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                      msg.sender_type === 'client' 
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-slate-700 md:bg-white text-white md:text-gray-800 rounded-bl-md border border-slate-600 md:border-gray-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      msg.sender_type === 'client' ? 'text-blue-100' : 'text-slate-400 md:text-gray-400'
                    }`}>
                      <span>{new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                      {msg.sender_type === 'client' && <span className="ml-1">✓✓</span>}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-slate-900 md:bg-white border-t border-slate-700 md:border-gray-200">
              <div className="flex items-center gap-2 bg-slate-800 md:bg-gray-100 rounded-full px-4 py-2">
                <input
                  type="text"
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                  placeholder="Mensagem..."
                  className="flex-1 bg-transparent focus:outline-none text-white md:text-gray-800 placeholder-slate-400 md:placeholder-gray-500"
                />
                <button 
                  onClick={enviarMensagem}
                  disabled={!novaMensagem.trim()}
                  className={`p-2 rounded-full transition ${
                    novaMensagem.trim() 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-slate-700 md:bg-gray-300 text-slate-400 md:text-gray-500'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}