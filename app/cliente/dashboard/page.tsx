'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  Calendar, 
  Clock, 
  LogOut, 
  User, 
  Scissors, 
  Sparkles,
  Star,
  MapPin,
  MessageCircle,
  Search,
  ArrowRight,
  Paintbrush,
  Gem,
  ChevronRight,
  Clock3,
  Send,
  X,
  ArrowLeft,
  Phone,
  CalendarDays
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
  profissional_foto: string
  profissional_telefone: string
  servico: string
  data: string
  horario: string
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado'
  endereco?: string
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
  const [abaAtiva, setAbaAtiva] = useState<'agendamentos' | 'novo' | 'perfil'>('agendamentos')
  
  // Estados do Chat
  const [chatAberto, setChatAberto] = useState(false)
  const [agendamentoChat, setAgendamentoChat] = useState<Agendamento | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      carregarAgendamentos()
      // Atualiza a cada 10 segundos
      const interval = setInterval(carregarAgendamentos, 10000)
      return () => clearInterval(interval)
    }
  }, [user])

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
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        profissional:profissional_id(nome, foto_url, telefone)
      `)
      .eq('cliente_id', user?.id)
      .order('data', { ascending: true })
      .gte('data', new Date().toISOString().split('T')[0]) // Apenas futuros

    if (data) {
      setAgendamentos(data.map((a: any) => ({
        id: a.id,
        profissional_id: a.profissional_id,
        profissional_nome: a.profissional?.nome || 'Profissional',
        profissional_foto: a.profissional?.foto_url || '',
        profissional_telefone: a.profissional?.telefone || '',
        servico: a.servico,
        data: new Date(a.data).toLocaleDateString('pt-BR', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short' 
        }),
        horario: a.horario,
        status: a.status,
        endereco: a.endereco,
        preco: a.preco
      })))
    }
  }

  async function abrirChat(agendamento: Agendamento) {
    setAgendamentoChat(agendamento)
    setChatAberto(true)
    carregarMensagens(agendamento.id)
    
    // Marcar mensagens como lidas
    await supabase
      .from('mensagens')
      .update({ lida: true })
      .eq('agendamento_id', agendamento.id)
      .eq('remetente', 'profissional')
  }

  async function carregarMensagens(agendamentoId: string) {
    const { data } = await supabase
      .from('mensagens')
      .select('*')
      .eq('agendamento_id', agendamentoId)
      .order('created_at', { ascending: true })

    if (data) setMensagens(data)
  }

  async function enviarMensagem() {
    if (!novaMensagem.trim() || !agendamentoChat) return

    const mensagem = {
      agendamento_id: agendamentoChat.id,
      remetente: 'cliente',
      texto: novaMensagem,
      lida: false,
      created_at: new Date().toISOString()
    }

    await supabase.from('mensagens').insert(mensagem)

    setMensagens([...mensagens, { ...mensagem, id: Date.now().toString() }])
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

  // Mock de agendamentos para teste visual
  const agendamentosMock: Agendamento[] = [
    {
      id: '1',
      profissional_id: 'uuid-1',
      profissional_nome: 'Sandra Lima',
      profissional_foto: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&h=200&fit=crop',
      profissional_telefone: '(11) 98765-4321',
      servico: 'Coloração e Corte',
      data: 'Sex, 18 Mar',
      horario: '14:00',
      status: 'confirmado',
      endereco: 'Av. Paulista, 1000 - São Paulo',
      preco: 150
    },
    {
      id: '2',
      profissional_id: 'uuid-2',
      profissional_nome: 'Helena Costa',
      profissional_foto: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=200&h=200&fit=crop',
      profissional_telefone: '(11) 91234-5678',
      servico: 'Maquiagem Social',
      data: 'Sáb, 19 Mar',
      horario: '10:00',
      status: 'pendente',
      preco: 120
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {abaAtiva === 'agendamentos' ? 'Meus Agendamentos' : 'Novo Agendamento'}
              </h1>
              <p className="text-sm text-gray-500">
                {abaAtiva === 'agendamentos' 
                  ? 'Gerencie seus horários marcados' 
                  : 'Escolha um serviço'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* ABA: MEUS AGENDAMENTOS */}
        {abaAtiva === 'agendamentos' && (
          <div className="space-y-4">
            {/* Agendamentos Reais (ou Mock) */}
            {(agendamentos.length > 0 ? agendamentos : agendamentosMock).map((agend) => (
              <div key={agend.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={agend.profissional_foto} 
                      alt={agend.profissional_nome}
                      className="w-14 h-14 rounded-2xl object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{agend.profissional_nome}</h3>
                      <p className="text-pink-600 text-sm font-medium">{agend.servico}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    agend.status === 'confirmado' 
                      ? 'bg-green-100 text-green-700' 
                      : agend.status === 'pendente'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {agend.status === 'confirmado' ? 'Confirmado' : 'Pendente'}
                  </div>
                </div>

                {/* Detalhes */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-pink-500" />
                    <span className="font-medium">{agend.data}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-pink-500" />
                    <span className="font-medium">{agend.horario}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-pink-500" />
                    <span className="truncate">{agend.endereco || 'A definir'}</span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => abrirChat(agend)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition active:scale-95"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Conversar
                    {mensagens.filter(m => m.remetente === 'profissional' && !m.lida && m.agendamento_id === agend.id).length > 0 && (
                      <span className="ml-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {mensagens.filter(m => m.remetente === 'profissional' && !m.lida && m.agendamento_id === agend.id).length}
                      </span>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => window.open(`https://wa.me/55${agend.profissional_telefone.replace(/\D/g, '')}`, '_blank')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition active:scale-95"
                  >
                    <Phone className="w-5 h-5" />
                  </button>

                  <button 
                    onClick={() => router.push(`/agendamento/${agend.id}`)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {agendamentos.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-bold text-gray-600 mb-2">Nenhum agendamento</h3>
                <p className="text-gray-500 mb-6">Você ainda não tem horários marcados</p>
                <button 
                  onClick={() => setAbaAtiva('novo')}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-bold"
                >
                  Agendar Agora
                </button>
              </div>
            )}
          </div>
        )}

        {/* ABA: NOVO AGENDAMENTO (simplificada) */}
        {abaAtiva === 'novo' && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { nome: 'Cabelo', icon: Scissors, cor: 'from-yellow-400 to-orange-500' },
              { nome: 'Maquiagem', icon: Paintbrush, cor: 'from-pink-400 to-rose-500' },
              { nome: 'Manicure', icon: Sparkles, cor: 'from-red-400 to-pink-500' },
              { nome: 'Pedicure', icon: Gem, cor: 'from-purple-400 to-violet-500' },
            ].map((servico) => (
              <button
                key={servico.nome}
                onClick={() => router.push(`/servico/${servico.nome.toLowerCase()}`)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition text-center"
              >
                <div className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${servico.cor} flex items-center justify-center mb-3`}>
                  <servico.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-800">{servico.nome}</h3>
                <p className="text-xs text-gray-500 mt-1">Ver profissionais</p>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DE CHAT MESSENGER */}
      {chatAberto && agendamentoChat && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white w-full max-w-md h-[90vh] sm:h-[650px] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            
            {/* Header Messenger Style */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setChatAberto(false)}
                  className="p-1 hover:bg-white/20 rounded-full transition"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                
                <div className="relative">
                  <img 
                    src={agendamentoChat.profissional_foto} 
                    alt={agendamentoChat.profissional_nome}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                </div>
                
                <div>
                  <h3 className="font-bold text-sm">{agendamentoChat.profissional_nome}</h3>
                  <p className="text-xs opacity-90 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Online • {agendamentoChat.servico}
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

            {/* Info do Agendamento no Chat */}
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{agendamentoChat.data} às {agendamentoChat.horario}</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                agendamentoChat.status === 'confirmado' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {agendamentoChat.status}
              </span>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
              {/* Data separadora */}
              <div className="text-center text-xs text-gray-400 my-4">
                Hoje
              </div>

              {/* Mensagem de sistema */}
              <div className="text-center text-xs text-gray-500 bg-white/50 py-2 px-4 rounded-full mx-auto w-fit">
                Agendamento confirmado! Você pode conversar com {agendamentoChat.profissional_nome.split(' ')[0]} aqui.
              </div>

              {mensagens.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.remetente === 'cliente' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                      msg.remetente === 'cliente' 
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-white text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.texto}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                      msg.remetente === 'cliente' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      <span>{new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}</span>
                      {msg.remetente === 'cliente' && (
                        <span className="ml-1">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Messenger Style */}
            <div className="p-3 bg-white border-t border-gray-200">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
                <input
                  type="text"
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()}
                  placeholder="Mensagem..."
                  className="flex-1 bg-transparent focus:outline-none text-gray-800 placeholder-gray-500"
                />
                <button 
                  onClick={enviarMensagem}
                  disabled={!novaMensagem.trim()}
                  className={`p-2 rounded-full transition ${
                    novaMensagem.trim() 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 max-w-md mx-auto z-40">
        <div className="flex justify-around items-center">
          <button 
            onClick={() => setAbaAtiva('agendamentos')}
            className={`flex flex-col items-center gap-1 ${abaAtiva === 'agendamentos' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${abaAtiva === 'agendamentos' ? 'bg-blue-50' : ''}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Agendamentos</span>
            {mensagens.filter(m => m.remetente === 'profissional' && !m.lida).length > 0 && (
              <span className="absolute top-2 left-10 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {mensagens.filter(m => m.remetente === 'profissional' && !m.lida).length}
              </span>
            )}
          </button>
          
          <button 
            onClick={() => setAbaAtiva('novo')}
            className={`flex flex-col items-center gap-1 ${abaAtiva === 'novo' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${abaAtiva === 'novo' ? 'bg-blue-50' : ''}`}>
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Novo</span>
          </button>
          
          <button 
            onClick={() => setAbaAtiva('perfil')}
            className={`flex flex-col items-center gap-1 ${abaAtiva === 'perfil' ? 'text-blue-500' : 'text-gray-400'}`}
          >
            <div className={`p-2 rounded-xl ${abaAtiva === 'perfil' ? 'bg-blue-50' : ''}`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Perfil</span>
          </button>
        </div>
      </div>
    </div>
  )
}