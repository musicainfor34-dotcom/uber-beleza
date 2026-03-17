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

// Interfaces
interface Agendamento {
  id: string
  profissional_id: string
  profissional_nome: string
  profissional_telefone: string
  servico: string
  data: string
  horario: string
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado'
  preco: number
}

interface Mensagem {
  id: string
  agendamento_id: string
  remetente: 'cliente' | 'profissional'
  texto: string
  created_at: string
  lida: boolean
}

export default function ClienteDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState<'servicos' | 'conversas'>('servicos')
  const [servicoSelecionado, setServicoSelecionado] = useState<string | null>(null)
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [loadingProfissionais, setLoadingProfissionais] = useState(false)
  
  // Estados do Chat
  const [chatAberto, setChatAberto] = useState(false)
  const [agendamentoChat, setAgendamentoChat] = useState<Agendamento | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
    carregarAgendamentos()
  }, [])

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

  async function carregarAgendamentos() {
    if (!user?.id) return
    
    const { data } = await supabase
      .from('agendamentos')
      .select(`
        *,
        profissional:profissional_id(nome, telefone)
      `)
      .eq('cliente_id', user.id)
      .gte('data_agendamento', new Date().toISOString().split('T')[0])
      .order('data_agendamento', { ascending: true })

    if (data) {
      setAgendamentos(data.map((a: any) => ({
        id: a.id,
        profissional_id: a.profissional_id,
        profissional_nome: a.profissional?.nome || 'Profissional',
        profissional_telefone: a.profissional?.telefone || '',
        servico: a.servico?.nome || 'Serviço',
        data: new Date(a.data_agendamento).toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        }),
        horario: a.hora_inicio,
        status: a.status,
        preco: a.valor_total
      })))
    }
  }

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

  async function abrirChat(agendamento: Agendamento) {
    setAgendamentoChat(agendamento)
    setChatAberto(true)
    
    const { data } = await supabase
      .from('mensagens')
      .select('*')
      .eq('agendamento_id', agendamento.id)
      .order('created_at', { ascending: true })
    
    if (data) setMensagens(data)
    
    await supabase
      .from('mensagens')
      .update({ lida: true })
      .eq('agendamento_id', agendamento.id)
      .eq('remetente', 'profissional')
  }

  async function enviarMensagem() {
    if (!novaMensagem.trim() || !agendamentoChat) return

    const mensagemTemp: Mensagem = {
      id: Date.now().toString(),
      agendamento_id: agendamentoChat.id,
      remetente: 'cliente',
      texto: novaMensagem,
      created_at: new Date().toISOString(),
      lida: true
    }

    await supabase.from('mensagens').insert({
      agendamento_id: agendamentoChat.id,
      remetente: 'cliente',
      texto: novaMensagem,
      lida: false
    })

    setMensagens(prev => [...prev, mensagemTemp])
    setNovaMensagem('')
    scrollToBottom()
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

        {/* CONTEÚDO: CONVERSAS/AGENDAMENTOS */}
        {abaAtiva === 'conversas' && (
          <main className="flex-1 px-4 py-2">
            <div className="space-y-3">
              {agendamentos.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>Nenhum agendamento ativo</p>
                  <p className="text-sm mt-2">Agende um serviço para conversar</p>
                </div>
              ) : (
                agendamentos.map((agend) => (
                  <div 
                    key={agend.id}
                    className="bg-slate-800 rounded-2xl p-4 border border-slate-700"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                        {agend.profissional_nome.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white">{agend.profissional_nome}</h4>
                        <p className="text-sm text-slate-400">{agend.servico}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        agend.status === 'confirmado' ? 'bg-green-500/20 text-green-400' :
                        agend.status === 'pendente' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {agend.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                      <Calendar className="w-4 h-4" />
                      {agend.data} às {agend.horario}
                    </div>

                    <button 
                      onClick={() => abrirChat(agend)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500/20 text-blue-400 rounded-xl font-medium border border-blue-500/30"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Conversar
                    </button>
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
                {agendamentos.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                    {agendamentos.length}
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
                Conversas ({agendamentos.length})
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
                {agendamentos.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum agendamento ativo</p>
                  </div>
                ) : (
                  agendamentos.map((agend) => (
                    <div 
                      key={agend.id}
                      onClick={() => abrirChat(agend)}
                      className="w-full text-left p-4 rounded-2xl border border-gray-200 bg-white hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                          {agend.profissional_nome.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{agend.profissional_nome}</h4>
                          <p className="text-sm text-gray-500">{agend.servico}</p>
                          <p className="text-xs text-gray-400 mt-1">{agend.data} às {agend.horario}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          agend.status === 'confirmado' ? 'bg-green-100 text-green-700' :
                          agend.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {agend.status}
                        </span>
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
              <p>Selecione um agendamento à esquerda para conversar com o profissional.</p>
            </div>
          )}
        </main>
      </div>

      {/* MODAL DE CHAT (Funciona em ambos) */}
      {chatAberto && agendamentoChat && (
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
                  {agendamentoChat.profissional_nome.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold">{agendamentoChat.profissional_nome}</h3>
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

            {/* Info do Agendamento */}
            <div className="bg-blue-50 dark:bg-slate-800 px-4 py-3 border-b border-blue-100 dark:border-slate-700">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
                  <Calendar className="w-4 h-4" />
                  {agendamentoChat.data} às {agendamentoChat.horario}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  agendamentoChat.status === 'confirmado' ? 'bg-green-100 text-green-700' :
                  agendamentoChat.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {agendamentoChat.status}
                </span>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-800 md:bg-gray-100">
              <div className="text-center text-xs text-slate-500 md:text-gray-400 my-4">Hoje</div>
              
              {mensagens.length === 0 && (
                <div className="text-center text-xs text-slate-500 md:text-gray-500 bg-slate-700/50 md:bg-white/50 py-2 px-4 rounded-full mx-auto w-fit">
                  Inicie a conversa com {agendamentoChat.profissional_nome}
                </div>
              )}

              {mensagens.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.remetente === 'cliente' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                      msg.remetente === 'cliente' 
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-slate-700 md:bg-white text-white md:text-gray-800 rounded-bl-md border border-slate-600 md:border-gray-200'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.texto}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      msg.remetente === 'cliente' ? 'text-blue-100' : 'text-slate-400 md:text-gray-400'
                    }`}>
                      <span>{new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                      {msg.remetente === 'cliente' && <span className="ml-1">✓✓</span>}
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