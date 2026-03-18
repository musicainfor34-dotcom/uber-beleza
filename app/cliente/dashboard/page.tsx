'use client'

import { useEffect, useState, useRef } from 'react'
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
  ChevronRight,
  Loader2,
  MessageCircle,
  Send,
  X,
  Calendar,
  ArrowLeft,
  Phone,
  DollarSign,
  Check
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CATEGORIAS = [
  { id: 'Cabelo', nome: 'Cabelo', icone: Scissors, cor: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-400', text: 'text-yellow-500', desc: 'Corte, coloração, hidratação' },
  { id: 'Maquiagem', nome: 'Maquiagem', icone: Paintbrush, cor: 'from-pink-400 to-rose-500', bg: 'bg-pink-400', text: 'text-pink-500', desc: 'Social, festa e noiva' },
  { id: 'Manicure', nome: 'Manicure', icone: Sparkles, cor: 'from-red-400 to-pink-500', bg: 'bg-red-400', text: 'text-red-500', desc: 'Esmaltação e nail art' },
  { id: 'Pedicure', nome: 'Pedicure', icone: Gem, cor: 'from-purple-400 to-violet-500', bg: 'bg-purple-400', text: 'text-purple-500', desc: 'Spa dos pés e cuidados' }
]

interface Profissional {
  id: string
  nome: string
  email: string
  telefone: string
  cidade: string
  preco_hora: number
  avaliacao: number
  especialidade: string[]
  ativo: boolean
}

interface Conversa {
  id: string
  professional_id: string
  professional_nome: string
  last_message?: string
  unread_client: boolean
  updated_at: string
}

interface Mensagem {
  id: string
  sender_type: 'client' | 'professional'
  content: string
  created_at: string
}

export default function ClienteDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<'servicos' | 'conversas'>('servicos')
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(null)
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loadingProfissionais, setLoadingProfissionais] = useState(false)
  
  // Chat
  const [chatAberto, setChatAberto] = useState(false)
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [conversas, setConversas] = useState<Conversa[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatChannelRef = useRef<any>(null)

  // Agendamento
  const [modalAgendamento, setModalAgendamento] = useState(false)
  const [profissionalAgendar, setProfissionalAgendar] = useState<Profissional | null>(null)
  const [dataAgendamento, setDataAgendamento] = useState('')
  const [horaAgendamento, setHoraAgendamento] = useState('09:00')
  const [enderecoAgendamento, setEnderecoAgendamento] = useState('')
  const [salvandoAgendamento, setSalvandoAgendamento] = useState(false)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user?.id && abaAtiva === 'conversas') {
      carregarConversas()
    }
  }, [user, abaAtiva])

  useEffect(() => {
    if (categoriaSelecionada) {
      buscarProfissionais(categoriaSelecionada)
    }
  }, [categoriaSelecionada])

  // 🎯 SUBSCRIPTION EM TEMPO REAL PARA O CHAT
  useEffect(() => {
    if (chatAberto && conversaSelecionada?.id) {
      // Cria canal para escutar novas mensagens
      const channel = supabase
        .channel(`chat-cliente:${conversaSelecionada.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversaSelecionada.id}`
          },
          (payload) => {
            const novaMsg = payload.new as Mensagem
            
            // Adiciona mensagem apenas se não existir (evita duplicatas)
            setMensagens((prev) => {
              if (prev.some(m => m.id === novaMsg.id)) return prev
              return [...prev, novaMsg]
            })
            
            // Scroll para baixo quando chegar nova mensagem
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }
        )
        .subscribe()

      chatChannelRef.current = channel

      return () => {
        if (chatChannelRef.current) {
          supabase.removeChannel(chatChannelRef.current)
        }
      }
    }
  }, [chatAberto, conversaSelecionada?.id])

  // Scroll quando mensagens mudam
  useEffect(() => {
    if (chatAberto && mensagens.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [mensagens, chatAberto])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user)
    setLoading(false)
  }

  // BUSCA CORRIGIDA DE PROFISSIONAIS
  async function buscarProfissionais(categoria: string) {
    setLoadingProfissionais(true)
    try {
      console.log('Buscando profissionais para:', categoria)
      
      // Tenta buscar usando contains (array)
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('ativo', true)
        .contains('especialidade', [categoria])

      if (error) {
        console.error('Erro na busca:', error)
        throw error
      }

      console.log('Profissionais encontrados:', data)

      // Se não encontrou nada, tenta busca case-insensitive
      if (!data || data.length === 0) {
        console.log('Tentando busca alternativa...')
        const { data: todos } = await supabase
          .from('professionals')
          .select('*')
          .eq('ativo', true)
        
        const filtrados = (todos || []).filter((p: Profissional) => {
          const especs = p.especialidade || []
          return especs.some((e: string) => 
            e.toLowerCase().includes(categoria.toLowerCase())
          )
        })
        
        console.log('Filtrados manualmente:', filtrados)
        setProfissionais(filtrados)
      } else {
        setProfissionais(data)
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoadingProfissionais(false)
    }
  }

  async function carregarConversas() {
    if (!user?.id) return
    setLoadingProfissionais(true)
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (data) {
        // Busca nomes dos profissionais
        const profIds = data.map(c => c.professional_id)
        const { data: profs } = await supabase
          .from('professionals')
          .select('id, nome')
          .in('id', profIds)
        
        const profMap = (profs || []).reduce((acc, p) => {
          acc[p.id] = p.nome
          return acc
        }, {} as any)

        const conversasFormatadas = data.map((conv: any) => ({
          id: conv.id,
          professional_id: conv.professional_id,
          professional_nome: profMap[conv.professional_id] || 'Profissional',
          last_message: conv.last_message,
          unread_client: conv.unread_client,
          updated_at: conv.updated_at
        }))
        setConversas(conversasFormatadas)
      }
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoadingProfissionais(false)
    }
  }

  async function abrirChat(profissional: Profissional) {
    if (!user?.id) return

    // Verifica se já existe conversa
    const { data: existente } = await supabase
      .from('conversations')
      .select('*')
      .eq('client_id', user.id)
      .eq('professional_id', profissional.id)
      .single()

    let conversaId = existente?.id

    // Se não existe, cria uma
    if (!existente) {
      const { data: nova, error } = await supabase
        .from('conversations')
        .insert({
          client_id: user.id,
          professional_id: profissional.id,
          client_email: user.email,
          professional_email: profissional.email,
          unread_client: false,
          unread_professional: false
        })
        .select()
        .single()
      
      if (error) {
        console.error('Erro criando conversa:', error)
        return
      }
      conversaId = nova.id
    }

    // Busca mensagens históricas
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversaId)
      .order('created_at', { ascending: true })

    setConversaSelecionada({
      id: conversaId,
      professional_id: profissional.id,
      professional_nome: profissional.nome,
      last_message: '',
      unread_client: false,
      updated_at: new Date().toISOString()
    })
    
    setMensagens(msgs || [])
    setChatAberto(true)
    
    // Marca como lida
    await supabase.from('conversations').update({ unread_client: false }).eq('id', conversaId)
    
    // Atualiza lista de conversas em background
    carregarConversas()
  }

  // 🎯 ABRE CHAT A PARTIR DA LISTA DE CONVERSAS (já existente)
  async function abrirChatExistente(conversa: Conversa) {
    if (!user?.id) return

    // Busca mensagens históricas
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversa.id)
      .order('created_at', { ascending: true })

    setConversaSelecionada(conversa)
    setMensagens(msgs || [])
    setChatAberto(true)
    
    // Marca como lida
    await supabase.from('conversations').update({ unread_client: false }).eq('id', conversa.id)
    
    // Atualiza lista
    setConversas(prev => prev.map(c => 
      c.id === conversa.id ? { ...c, unread_client: false } : c
    ))
  }

  async function enviarMensagem() {
    if (!novaMensagem.trim() || !conversaSelecionada || !user?.id) return

    const mensagemTemp = novaMensagem.trim()
    
    // Limpa input imediatamente para melhor UX
    setNovaMensagem('')

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversaSelecionada.id,
      sender_id: user.id,
      sender_type: 'client',
      content: mensagemTemp,
      read: false
    })

    if (error) {
      console.error('Erro:', error)
      // Restaura mensagem se deu erro
      setNovaMensagem(mensagemTemp)
      return
    }

    // Atualiza conversa com última mensagem
    await supabase.from('conversations').update({ 
      last_message: mensagemTemp,
      updated_at: new Date().toISOString(),
      unread_professional: true 
    }).eq('id', conversaSelecionada.id)

    // Atualiza localmente
    setMensagens(prev => [...prev, {
      id: Date.now().toString(),
      sender_type: 'client',
      content: mensagemTemp,
      created_at: new Date().toISOString()
    }])
    
    // Scroll imediato
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
    
    // Atualiza lista de conversas em background
    carregarConversas()
  }

  function abrirModalAgendamento(prof: Profissional) {
    setProfissionalAgendar(prof)
    setModalAgendamento(true)
    setDataAgendamento(new Date().toISOString().split('T')[0])
  }

  async function salvarAgendamento(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id || !profissionalAgendar) return

    setSalvandoAgendamento(true)
    try {
      const { error } = await supabase.from('agendamentos').insert({
        cliente_id: user.id,
        profissional_id: profissionalAgendar.id,
        data_agendamento: dataAgendamento,
        hora_inicio: horaAgendamento,
        hora_fim: calcularHoraFim(horaAgendamento, 60),
        endereco: enderecoAgendamento || 'A combinar',
        bairro: 'Centro',
        cidade: profissionalAgendar.cidade || 'Porto Velho',
        status: 'pendente',
        valor_total: profissionalAgendar.preco_hora || 80,
        servico_id: 'servico-padrao'
      })

      if (error) throw error
      
      alert('✅ Agendamento solicitado! O profissional irá confirmar.')
      setModalAgendamento(false)
      setEnderecoAgendamento('')
    } catch (error) {
      console.error('Erro:', error)
      alert('❌ Erro ao agendar. Tente novamente.')
    } finally {
      setSalvandoAgendamento(false)
    }
  }

  function calcularHoraFim(hora: string, minutos: number) {
    const [h, m] = hora.split(':').map(Number)
    const data = new Date()
    data.setHours(h, m + minutos)
    return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    )
  }

  const categoriaAtual = CATEGORIAS.find(c => c.id === categoriaSelecionada)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Desktop/Mobile */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Beleza Connect</h1>
            <p className="text-xs md:text-sm text-gray-500">Olá, {user?.email?.split('@')[0]}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm md:text-base">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
        {/* Sidebar - Mobile: horizontal / Desktop: vertical lateral */}
        <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="flex gap-2">
              <button
                onClick={() => {setAbaAtiva('servicos'); setCategoriaSelecionada(null)}}
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
                Conversas
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {abaAtiva === 'servicos' ? (
              <div className="space-y-3">
                {CATEGORIAS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaSelecionada(cat.id)}
                    className={`w-full flex items-center gap-4 p-3 md:p-4 rounded-2xl border-2 transition-all text-left ${
                      categoriaSelecionada === cat.id 
                        ? 'border-pink-400 bg-pink-50' 
                        : 'border-gray-100 bg-white hover:border-pink-200 hover:shadow-md'
                    }`}
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${cat.bg} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                      <cat.icone className={`w-5 h-5 md:w-6 md:h-6 ${cat.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-sm md:text-base ${categoriaSelecionada === cat.id ? 'text-pink-700' : 'text-gray-800'}`}>
                        {cat.nome}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{cat.desc}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 flex-shrink-0 ${categoriaSelecionada === cat.id ? 'text-pink-400' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {conversas.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Nenhuma conversa ainda</p>
                  </div>
                ) : (
                  conversas.map((conv) => (
                    <div 
                      key={conv.id}
                      onClick={() => abrirChatExistente(conv)}
                      className={`p-3 md:p-4 rounded-2xl border cursor-pointer transition ${
                        conv.unread_client 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {conv.professional_nome.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-gray-800 truncate">{conv.professional_nome}</h4>
                          <p className="text-xs text-gray-500 truncate">{conv.last_message || 'Clique para conversar'}</p>
                        </div>
                        {conv.unread_client && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 w-full">
          {abaAtiva === 'servicos' ? (
            !categoriaSelecionada ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Scissors className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-700 mb-2 text-center">Escolha um serviço</h2>
                <p className="text-center max-w-md text-sm px-4">Selecione uma categoria à esquerda para ver os profissionais disponíveis.</p>
              </div>
            ) : (
              <div>
                {/* Header da Categoria */}
                <div className="flex items-center gap-4 mb-6">
                  <button 
                    onClick={() => setCategoriaSelecionada(null)}
                    className="p-2 hover:bg-white rounded-lg transition"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  {categoriaAtual && (
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${categoriaAtual.bg} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                        <categoriaAtual.icone className={`w-5 h-5 md:w-6 md:h-6 ${categoriaAtual.text}`} />
                      </div>
                      <div>
                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">{categoriaAtual.nome}</h2>
                        <p className="text-gray-500 text-sm md:text-base">
                          {loadingProfissionais ? 'Carregando...' : `${profissionais.length} profissionais encontrados`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lista de Profissionais */}
                {loadingProfissionais ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                  </div>
                ) : profissionais.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 md:p-12 text-center border border-gray-200">
                    <div className="text-5xl md:text-6xl mb-4">🔍</div>
                    <h3 className="text-base md:text-lg font-bold text-gray-700 mb-2">Nenhum profissional encontrado</h3>
                    <p className="text-gray-500 mb-4 text-sm md:text-base">Não encontramos profissionais para {categoriaAtual?.nome} no momento.</p>
                    <button 
                      onClick={() => setCategoriaSelecionada(null)}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm md:text-base"
                    >
                      Ver outras categorias
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {profissionais.map((prof) => (
                      <div key={prof.id} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-lg md:text-xl font-bold flex-shrink-0">
                            {prof.nome?.charAt(0).toUpperCase() || 'P'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div className="min-w-0">
                                <h3 className="font-bold text-base md:text-lg text-gray-800 truncate">{prof.nome}</h3>
                                <div className="flex items-center gap-1 text-xs md:text-sm text-gray-500">
                                  <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                                  <span className="truncate">{prof.cidade || 'Porto Velho'}</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="flex items-center gap-1 text-xs md:text-sm">
                                  <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                                  <span className="font-medium">{prof.avaliacao || 5.0}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-1 md:gap-2 my-2 md:my-3">
                              {prof.especialidade?.slice(0, 3).map((esp, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] md:text-xs px-2 py-1 rounded-full">
                                  {esp}
                                </span>
                              ))}
                              {prof.especialidade?.length > 3 && (
                                <span className="bg-gray-100 text-gray-600 text-[10px] md:text-xs px-2 py-1 rounded-full">
                                  +{prof.especialidade.length - 3}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-gray-100">
                              <div>
                                <span className="text-xl md:text-2xl font-bold text-purple-600">R$ {prof.preco_hora || 0}</span>
                                <span className="text-xs md:text-sm text-gray-400">/hora</span>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => abrirChat(prof)}
                                  className="px-3 py-1.5 md:px-4 md:py-2 border-2 border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 font-medium text-xs md:text-sm flex items-center gap-1 md:gap-2"
                                >
                                  <MessageCircle className="w-3 h-3 md:w-4 md:h-4" />
                                  <span className="hidden sm:inline">Conversar</span>
                                  <span className="sm:hidden">Chat</span>
                                </button>
                                <button 
                                  onClick={() => abrirModalAgendamento(prof)}
                                  className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:opacity-90 font-medium text-xs md:text-sm flex items-center gap-1 md:gap-2"
                                >
                                  <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                                  <span className="hidden sm:inline">Agendar</span>
                                  <span className="sm:hidden">Agendar</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <MessageCircle className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-30" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-700 mb-2 text-center">Suas Conversas</h2>
              <p className="text-center text-sm px-4">Selecione uma conversa à esquerda para começar.</p>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Chat */}
      {chatAberto && conversaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4">
          <div className="bg-white w-full md:max-w-lg md:h-[600px] h-[100vh] md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setChatAberto(false)} className="p-1 hover:bg-white/20 rounded">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  {conversaSelecionada.professional_nome.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold">{conversaSelecionada.professional_nome}</h3>
                  <p className="text-xs opacity-90">Online</p>
                </div>
              </div>
              <button onClick={() => setChatAberto(false)} className="p-2 hover:bg-white/20 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {mensagens.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] md:max-w-[70%] px-4 py-2 rounded-2xl ${
                    msg.sender_type === 'client' 
                      ? 'bg-purple-600 text-white rounded-br-md' 
                      : 'bg-white text-gray-800 rounded-bl-md border border-gray-200'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-purple-500 text-base text-gray-900 bg-white placeholder:text-gray-400"
                />
                <button 
                  onClick={enviarMensagem}
                  disabled={!novaMensagem.trim()}
                  className="p-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Agendamento */}
      {modalAgendamento && profissionalAgendar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Agendar com {profissionalAgendar.nome}</h3>
                <p className="text-sm opacity-90">{categoriaAtual?.nome}</p>
              </div>
              <button onClick={() => setModalAgendamento(false)} className="p-2 hover:bg-white/20 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarAgendamento} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input 
                  type="date" 
                  required
                  value={dataAgendamento}
                  onChange={(e) => setDataAgendamento(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                <select 
                  value={horaAgendamento}
                  onChange={(e) => setHoraAgendamento(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 text-gray-900 bg-white"
                >
                  {['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <textarea 
                  value={enderecoAgendamento}
                  onChange={(e) => setEnderecoAgendamento(e.target.value)}
                  placeholder="Seu endereço completo"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 h-20 resize-none text-gray-900 bg-white placeholder:text-gray-400"
                />
              </div>

              <div className="bg-purple-50 p-4 rounded-xl flex items-center justify-between">
                <span className="text-gray-600">Valor estimado:</span>
                <span className="text-2xl font-bold text-purple-600">R$ {profissionalAgendar.preco_hora}</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setModalAgendamento(false)}
                  className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={salvandoAgendamento}
                  className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
                >
                  {salvandoAgendamento ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}