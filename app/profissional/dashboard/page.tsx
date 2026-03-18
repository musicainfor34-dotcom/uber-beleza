'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  Calendar,
  Users,
  Star,
  Scissors,
  LogOut,
  MapPin,
  Phone,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bell,
  Trash2,
  MessageCircle,
  X,
  Save
} from 'lucide-react'
import ChatModal from './ChatModal'

// Contexto de áudio global
let audioContext: AudioContext | null = null

// Função para inicializar o contexto de áudio (deve ser chamada após interação do usuário)
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
}

// Função para tocar som de notificação (beep)
const playNotificationSound = () => {
  try {
    initAudioContext()
    
    if (!audioContext) return
    
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
    
    // Segundo beep
    setTimeout(() => {
      if (!audioContext) return
      const osc2 = audioContext.createOscillator()
      const gain2 = audioContext.createGain()
      osc2.connect(gain2)
      gain2.connect(audioContext.destination)
      osc2.frequency.value = 1000
      osc2.type = 'sine'
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime)
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      osc2.start(audioContext.currentTime)
      osc2.stop(audioContext.currentTime + 0.5)
    }, 200)
    
    console.log('🔊 Beep tocado!')
  } catch (e) {
    console.error('Erro ao tocar som:', e)
  }
}


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Agendamento {
  id: string
  cliente_id: string
  data_agendamento: string
  hora_inicio: string
  hora_fim: string
  endereco: string
  bairro: string
  cidade: string
  referencia: string
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
  valor_total: number
  cliente: {
    email: string
    user_metadata?: {
      nome?: string
    }
  }
  servico: {
    nome: string
    duracao_minutos: number
  }
}

export default function DashboardProfissional() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profissional, setProfissional] = useState<any>(null)
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Estados do chat
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [chatClientId, setChatClientId] = useState<string | null>(null)
  const [chatClientName, setChatClientName] = useState<string>('')
  const [chatClientEmail, setChatClientEmail] = useState<string>('')

  // Estados para edição do perfil
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  // Estado para controle do alerta sonoro
  const [alertaInterval, setAlertaInterval] = useState<NodeJS.Timeout | null>(null)
  const agendamentosPendentesRef = useRef<Agendamento[]>([])
  
  // Atualiza a ref quando agendamentos mudam
  useEffect(() => {
    agendamentosPendentesRef.current = agendamentos.filter(ag => ag.status === 'pendente')
  }, [agendamentos])
  // Toca som quando agendamentos são carregados e há pendentes
useEffect(() => {
  const pendentes = agendamentos.filter(ag => ag.status === 'pendente')
  if (pendentes.length > 0) {
    console.log('🔔 Agendamentos carregados com pendentes:', pendentes.length)
    playNotificationSound()
  }
}, [agendamentos])


  const [editForm, setEditForm] = useState({
    nome: '',
    telefone: '',
    cidade: '',
    preco_hora: '',
    especialidade: ''
  })

  useEffect(() => {
    checkUser()
  }, [])
  // Efeito para desbloquear áudio no primeiro clique do usuário
useEffect(() => {
  const handleFirstInteraction = () => {
    initAudioContext()
    console.log('🔓 Áudio desbloqueado pelo usuário')
    document.removeEventListener('click', handleFirstInteraction)
  }
  
  document.addEventListener('click', handleFirstInteraction)
  
  return () => {
    document.removeEventListener('click', handleFirstInteraction)
  }
}, [])

// Efeito para alerta sonoro de agendamentos pendentes (a cada 5 minutos)
useEffect(() => {
  // Função que verifica e toca o som
  const verificarEAlertar = () => {
    const pendentes = agendamentosPendentesRef.current
    if (pendentes.length > 0) {
      console.log(`🔔 Alerta: ${pendentes.length} agendamento(s) pendente(s)!`)
      playNotificationSound()
    }
  }

  // Toca imediatamente se houver pendentes ao carregar a página
  verificarEAlertar()

  // Configura intervalo de 5 minutos (60000ms)
  const interval = setInterval(verificarEAlertar, 60000)
  setAlertaInterval(interval)

  // Limpa o intervalo quando o componente desmontar
  return () => {
    if (interval) {
      clearInterval(interval)
    }
  }
}, []) // Array vazio - executa apenas ao montar o componente



  useEffect(() => {
    if (user) {
      fetchProfissional()
    }
  }, [user])

  // Preenche formulário quando abrir modal
  useEffect(() => {
    if (isEditModalOpen && profissional) {
      setEditForm({
        nome: profissional.nome || '',
        telefone: profissional.telefone || '',
        cidade: profissional.cidade || '',
        preco_hora: profissional.preco_hora?.toString() || '',
        especialidade: profissional.especialidade?.join(', ') || ''
      })
    }
  }, [isEditModalOpen, profissional])

  useEffect(() => {
    if (profissional) {
      fetchAgendamentos()
      fetchUnreadCount()
      
      const channel = supabase
        .channel(`agendamentos:${profissional.id}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'agendamentos', filter: `profissional_id=eq.${profissional.id}` },
          () => fetchAgendamentos()
        )
        .subscribe()
      
      const chatChannel = supabase
        .channel(`chat:${profissional.id}`)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `professional_id=eq.${profissional.id}` },
          () => fetchUnreadCount()
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
        supabase.removeChannel(chatChannel)
      }
    }
  }, [profissional])

  async function fetchUnreadCount() {
    if (!profissional?.id) return
    const { count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('professional_id', profissional.id)
      .eq('unread_professional', true)
    if (count !== null) setUnreadCount(count)
  }

  const handleOpenChat = (clientId: string, clientName: string, clientEmail: string) => {
    setChatClientId(clientId)
    setChatClientName(clientName)
    setChatClientEmail(clientEmail)
    setIsChatOpen(true)
  }

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/login'); return }
    setUser(session.user)
  }

  async function fetchProfissional() {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) setProfissional(data)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profissional?.id) return
    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from('professionals')
        .update({
          nome: editForm.nome,
          telefone: editForm.telefone,
          cidade: editForm.cidade,
          preco_hora: parseFloat(editForm.preco_hora) || 0,
          especialidade: editForm.especialidade.split(',').map(s => s.trim()).filter(s => s)
        })
        .eq('id', profissional.id)

      if (error) throw error
      alert('✅ Perfil atualizado!')
      setIsEditModalOpen(false)
      fetchProfissional()
    } catch (error) {
      alert('❌ Erro ao atualizar perfil')
    } finally {
      setSavingProfile(false)
    }
  }

  async function fetchAgendamentos() {
    if (!profissional) return
    setRefreshing(true)
    try {
      const { data } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('profissional_id', profissional.id)
        .order('data_agendamento', { ascending: true })
      
      if (data) {
        const agendamentosCompletos = await Promise.all(
          data.map(async (ag: any) => {
            const { data: clienteData } = await supabase
              .from('auth.users') // ou a tabela correta de usuários/clientes
              .select('email, raw_user_meta_data')
              .eq('id', ag.cliente_id)
              .single()
            
            return { 
              ...ag, 
              cliente: {
                email: clienteData?.email || 'Sem email',
                user_metadata: clienteData?.raw_user_meta_data || { nome: 'Cliente' }
              }
            }
          })
        )
        setAgendamentos(agendamentosCompletos)
      }
    } finally { setRefreshing(false) }
  }

  async function atualizarStatus(agendamentoId: string, novoStatus: string) {
    await supabase.from('agendamentos').update({ status: novoStatus }).eq('id', agendamentoId)
    fetchAgendamentos()
  }

  async function deletarAgendamento(agendamentoId: string) {
    if (!window.confirm('Excluir permanentemente?')) return
    await supabase.from('agendamentos').delete().eq('id', agendamentoId)
    fetchAgendamentos()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-100 text-green-700 border-green-200'
      case 'pendente': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'cancelado': return 'bg-red-100 text-red-700 border-red-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Beleza Connect</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsChatOpen(true)} className="relative p-2 bg-white/20 rounded-full">
              <MessageCircle className="w-6 h-6" />
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">{unreadCount}</span>}
            </button>
            <button onClick={() => { supabase.auth.signOut(); router.push('/login') }} className="p-2 bg-white/20 rounded-lg"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Agendamentos</h2>
            <button onClick={fetchAgendamentos} className="p-2 border rounded-lg hover:bg-white"><RefreshCw className={refreshing ? 'animate-spin' : ''} /></button>
          </div>
          
          {agendamentos.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum agendamento ainda</p>
              <p className="text-sm text-gray-400 mt-1">Quando clientes agendarem, aparecerão aqui automaticamente</p>
            </div>
          ) : (
            agendamentos.map((ag) => (
              <div key={ag.id} className="bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold">{ag.servico?.nome}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(ag.status)}`}>{ag.status}</span>
                    <p className="text-sm text-gray-600 mt-1">Cliente: {ag.cliente?.user_metadata?.nome || ag.cliente?.email}</p>
                  </div>
                  <p className="font-bold text-purple-600">R$ {ag.valor_total?.toFixed(2)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />
                   {new Date(ag.data_agendamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                    </div>
                  <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {ag.hora_inicio}</div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button 
                    onClick={() => handleOpenChat(ag.cliente_id, ag.cliente?.user_metadata?.nome || 'Cliente', ag.cliente?.email)} 
                    className="flex-1 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Conversar
                  </button>
                  {ag.status === 'pendente' && (
                    <>
                      <button onClick={() => atualizarStatus(ag.id, 'confirmado')} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm">Confirmar</button>
                      <button onClick={() => atualizarStatus(ag.id, 'cancelado')} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm">Cancelar</button>
                    </>
                  )}
                  {ag.status === 'confirmado' && (
                    <button onClick={() => atualizarStatus(ag.id, 'concluido')} className="flex-1 py-2 bg-blue-500 text-white rounded-lg text-sm">Concluir</button>
                  )}
                  <button onClick={() => deletarAgendamento(ag.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-2">
              {profissional?.nome?.[0]}
            </div>
            <h3 className="font-bold text-lg">{profissional?.nome}</h3>
            <p className="text-sm text-gray-500">{profissional?.cidade}</p>
          </div>
          
          <div className="space-y-3 mb-6 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600 flex items-center gap-2"><Phone className="w-4 h-4" /> Telefone</span>
              <span>{profissional?.telefone || '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Preço/Hora</span>
              <span className="font-bold text-purple-600">R$ {profissional?.preco_hora}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600 flex items-center gap-2"><Scissors className="w-4 h-4" /> Especialidade</span>
              <span>{profissional?.especialidade?.join(', ')}</span>
            </div>
          </div>

          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="w-full py-3 border-2 border-purple-500 text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-colors"
          >
            Editar Perfil
          </button>
        </div>
      </main>

      {/* Modal de Edição */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Editar Perfil</h3>
              <button onClick={() => setIsEditModalOpen(false)}><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input type="text" required value={editForm.nome} onChange={(e) => setEditForm({...editForm, nome: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <input type="text" value={editForm.telefone} onChange={(e) => setEditForm({...editForm, telefone: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cidade</label>
                <input type="text" value={editForm.cidade} onChange={(e) => setEditForm({...editForm, cidade: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preço/Hora (R$)</label>
                <input type="number" value={editForm.preco_hora} onChange={(e) => setEditForm({...editForm, preco_hora: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Especialidades (separadas por vírgula)</label>
                <input type="text" value={editForm.especialidade} onChange={(e) => setEditForm({...editForm, especialidade: e.target.value})} className="w-full px-4 py-2 border rounded-lg" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={savingProfile} className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-bold flex justify-center items-center gap-2">
                  {savingProfile ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Chat */}
      <ChatModal 
        isOpen={isChatOpen}
        onClose={() => { setIsChatOpen(false); fetchUnreadCount() }}
        professionalId={profissional?.id}
        initialClientId={chatClientId}
        initialClientName={chatClientName}
        initialClientEmail={chatClientEmail}
      />
    </div>
  )
}