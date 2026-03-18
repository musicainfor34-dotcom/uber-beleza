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
  
  const [chatAberto, setChatAberto] = useState(false)
  const [conversaSelecionada, setConversaSelecionada] = useState<Conversa | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [conversas, setConversas] = useState<Conversa[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    setUser(session.user)
    setLoading(false)
  }

  async function buscarProfissionais(categoria: string) {
    setLoadingProfissionais(true)
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('ativo', true)
        .contains('especialidade', [categoria])

      if (error) throw error

      if (!data || data.length === 0) {
        const { data: todos } = await supabase.from('professionals').select('*').eq('ativo', true)
        const filtrados = (todos || []).filter((p: Profissional) => 
          (p.especialidade || []).some((e: string) => e.toLowerCase().includes(categoria.toLowerCase()))
        )
        setProfissionais(filtrados)
      } else {
        setProfissionais(data)
      }
    } catch (error) { console.error(error) } finally { setLoadingProfissionais(false) }
  }

  async function carregarConversas() {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', user.id)
        .order('updated_at', { ascending: false })

      if (data) {
        const profIds = data.map(c => c.professional_id)
        const { data: profs } = await supabase.from('professionals').select('id, nome').in('id', profIds)
        const profMap = (profs || []).reduce((acc, p) => { acc[p.id] = p.nome; return acc }, {} as any)
        const conversasFormatadas = data.map((conv: any) => ({
          ...conv,
          professional_nome: profMap[conv.professional_id] || 'Profissional'
        }))
        setConversas(conversasFormatadas)
      }
    } catch (error) { console.error(error) }
  }

  async function abrirChat(profissional: Profissional) {
    if (!user?.id) return
    const { data: existente } = await supabase.from('conversations').select('*').eq('client_id', user.id).eq('professional_id', profissional.id).single()
    let conversaId = existente?.id
    if (!existente) {
      const { data: nova } = await supabase.from('conversations').insert({ client_id: user.id, professional_id: profissional.id, client_email: user.email, professional_email: profissional.email }).select().single()
      conversaId = nova.id
    }
    const { data: msgs } = await supabase.from('messages').select('*').eq('conversation_id', conversaId).order('created_at', { ascending: true })
    setConversaSelecionada({ id: conversaId, professional_id: profissional.id, professional_nome: profissional.nome, unread_client: false, updated_at: new Date().toISOString() })
    setMensagens(msgs || [])
    setChatAberto(true)
  }

  async function enviarMensagem() {
    if (!novaMensagem.trim() || !conversaSelecionada || !user?.id) return
    const { error } = await supabase.from('messages').insert({ conversation_id: conversaSelecionada.id, sender_id: user.id, sender_type: 'client', content: novaMensagem.trim() })
    if (error) return
    await supabase.from('conversations').update({ last_message: novaMensagem.trim(), updated_at: new Date().toISOString(), unread_professional: true }).eq('id', conversaSelecionada.id)
    setMensagens(prev => [...prev, { id: Date.now().toString(), sender_type: 'client', content: novaMensagem.trim(), created_at: new Date().toISOString() }])
    setNovaMensagem('')
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function salvarAgendamento(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id || !profissionalAgendar) return

    setSalvandoAgendamento(true)
    try {
      // Calculando uma hora de fim (adicionando 1 hora por padrão)
      const [h, m] = horaAgendamento.split(':').map(Number)
      const horaFim = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`

      const { error } = await supabase.from('agendamentos').insert({
        cliente_id: user.id,
        profissional_id: profissionalAgendar.id,
        data_agendamento: dataAgendamento,
        hora_inicio: horaAgendamento,
        hora_fim: horaFim,
        endereco: enderecoAgendamento,
        bairro: 'Centro',
        cidade: profissionalAgendar.cidade || 'Porto Velho',
        status: 'pendente',
        valor_total: profissionalAgendar.preco_hora || 80
        // REMOVIDO: servico_id: 'servico-padrao' - estava causando erro de UUID
      })

      if (error) {
        console.error('Erro detalhado do Supabase:', error)
        throw error
      }
      
      alert('✅ Agendamento solicitado com sucesso!')
      setModalAgendamento(false)
      setEnderecoAgendamento('')
    } catch (error: any) {
      console.error('Erro ao agendar:', error)
      alert(`❌ Erro ao agendar: ${error.message || 'Verifique os campos'}`)
    } finally {
      setSalvandoAgendamento(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>

  const categoriaAtual = CATEGORIAS.find(c => c.id === categoriaSelecionada)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      {/* Header Fixo */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Beleza Connect</h1>
            <p className="text-xs text-gray-500">Olá, {user?.email?.split('@')[0]}</p>
          </div>
          <button onClick={() => { supabase.auth.signOut(); router.push('/login') }} className="p-2 text-gray-400 hover:text-red-500"><LogOut /></button>
        </div>
      </header>

      {/* Container Principal Responsivo */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
        
        {/* Sidebar / Menu de Categorias */}
        <aside className={`w-full md:w-80 bg-white border-r flex flex-col ${categoriaSelecionada ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b flex gap-2">
            <button onClick={() => setAbaAtiva('servicos')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${abaAtiva === 'servicos' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100'}`}>Serviços</button>
            <button onClick={() => setAbaAtiva('conversas')} className={`flex-1 py-2 rounded-lg text-sm font-bold ${abaAtiva === 'conversas' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>Conversas</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {abaAtiva === 'servicos' ? (
              CATEGORIAS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaSelecionada(cat.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${categoriaSelecionada === cat.id ? 'border-pink-400 bg-pink-50' : 'border-gray-100 bg-white'}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${cat.bg} bg-opacity-20 flex items-center justify-center`}><cat.icone className={`w-5 h-5 ${cat.text}`} /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-gray-800">{cat.nome}</h3>
                    <p className="text-xs text-gray-500">{cat.desc}</p>
                  </div>
                </button>
              ))
            ) : (
              conversas.map((conv) => (
                <div key={conv.id} onClick={() => { setConversaSelecionada(conv); setChatAberto(true) }} className="p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
                  <h4 className="font-bold text-sm">{conv.professional_nome}</h4>
                  <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Conteúdo Principal */}
        <main className={`flex-1 p-4 md:p-6 bg-gray-50 ${!categoriaSelecionada && abaAtiva === 'servicos' ? 'hidden md:block' : 'block'}`}>
          {categoriaSelecionada ? (
            <div className="max-w-4xl mx-auto">
              <button onClick={() => setCategoriaSelecionada(null)} className="flex items-center gap-2 text-purple-600 mb-4 font-bold md:hidden"><ArrowLeft className="w-4 h-4" /> Voltar</button>
              
              <div className="flex items-center gap-4 mb-6">
                 <div className={`w-12 h-12 rounded-xl ${categoriaAtual?.bg} bg-opacity-20 flex items-center justify-center`}>
                    {categoriaAtual && <categoriaAtual.icone className={`w-6 h-6 ${categoriaAtual.text}`} />}
                 </div>
                 <div>
                    <h2 className="text-xl font-bold text-gray-800">{categoriaAtual?.nome}</h2>
                    <p className="text-sm text-gray-500">{profissionais.length} profissionais disponíveis</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {profissionais.map((prof) => (
                  <div key={prof.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center font-bold text-purple-600">{prof.nome[0]}</div>
                        <div>
                          <h3 className="font-bold text-gray-800">{prof.nome}</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3"/> {prof.cidade}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-yellow-500"><Star className="w-4 h-4 fill-current"/> {prof.avaliacao || '5.0'}</div>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="font-bold text-purple-600 text-lg">R$ {prof.preco_hora}<span className="text-xs text-gray-400 font-normal">/h</span></span>
                      <div className="flex gap-2">
                        <button onClick={() => abrirChat(prof)} className="p-2 border rounded-lg text-purple-600"><MessageCircle className="w-5 h-5"/></button>
                        <button onClick={() => { setProfissionalAgendar(prof); setModalAgendamento(true); setDataAgendamento(new Date().toISOString().split('T')[0]) }} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold">Agendar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4"><Scissors className="w-8 h-8 text-gray-300" /></div>
              <h2 className="text-lg font-bold text-gray-700">O que você precisa hoje?</h2>
              <p className="text-sm text-gray-400">Selecione uma categoria ao lado para ver profissionais</p>
            </div>
          )}
        </main>
      </div>

      {/* MODAL AGENDAMENTO */}
      {modalAgendamento && profissionalAgendar && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Agendar com {profissionalAgendar.nome}</h3>
                <p className="text-xs opacity-80">{categoriaSelecionada}</p>
              </div>
              <button onClick={() => setModalAgendamento(false)} className="p-2 bg-white/20 rounded-full"><X className="w-5 h-5"/></button>
            </div>

            <form onSubmit={salvarAgendamento} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data</label>
                <input type="date" required value={dataAgendamento} onChange={(e) => setDataAgendamento(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-white text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Horário</label>
                <select value={horaAgendamento} onChange={(e) => setHoraAgendamento(e.target.value)}
                  className="w-full p-3 border rounded-xl bg-white text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00','18:00'].map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Endereço</label>
                <textarea required value={enderecoAgendamento} onChange={(e) => setEnderecoAgendamento(e.target.value)} placeholder="Rua, número, bairro..."
                  className="w-full p-3 border rounded-xl bg-white text-gray-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none h-24"
                />
              </div>
              
              <div className="bg-purple-50 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor total:</span>
                <span className="text-xl font-bold text-purple-600">R$ {profissionalAgendar.preco_hora}</span>
              </div>

              <div className="flex gap-3 pt-2 pb-6 md:pb-0">
                <button type="button" onClick={() => setModalAgendamento(false)} className="flex-1 py-3 border-2 rounded-xl font-bold text-gray-400">Cancelar</button>
                <button type="submit" disabled={salvandoAgendamento} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold shadow-lg shadow-purple-200">
                  {salvandoAgendamento ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHAT */}
      {chatAberto && conversaSelecionada && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white md:inset-auto md:right-4 md:bottom-4 md:w-96 md:h-[500px] md:rounded-2xl md:shadow-2xl overflow-hidden">
          <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button onClick={() => setChatAberto(false)} className="md:hidden"><ArrowLeft /></button>
              <span className="font-bold">{conversaSelecionada.professional_nome}</span>
            </div>
            <button onClick={() => setChatAberto(false)} className="hidden md:block"><X /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {mensagens.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender_type === 'client' ? 'bg-purple-600 text-white' : 'bg-white text-gray-800 border'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 border-t bg-white flex gap-2">
            <input type="text" value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && enviarMensagem()} placeholder="Mensagem..." className="flex-1 p-2 border rounded-full text-gray-900 bg-gray-100 px-4 outline-none" />
            <button onClick={enviarMensagem} className="p-2 bg-purple-600 text-white rounded-full"><Send className="w-5 h-5" /></button>
          </div>
        </div>
      )}
    </div>
  )
}