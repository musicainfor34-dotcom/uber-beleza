'use client'

import { useEffect, useState } from 'react'
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
  
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [chatClientId, setChatClientId] = useState<string | null>(null)
  const [chatClientName, setChatClientName] = useState<string>('')
  const [chatClientEmail, setChatClientEmail] = useState<string>('')

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
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

  useEffect(() => {
    if (user) {
      fetchProfissional()
    }
  }, [user])

  // Sincroniza o formulário sempre que o modal abrir ou o profissional carregar
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
      
      return () => { supabase.removeChannel(channel) }
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
              .from('professionals')
              .select('nome, email')
              .eq('user_id', ag.cliente_id)
              .single()
            return { ...ag, cliente: clienteData || { email: 'Cliente não encontrado', nome: '' } }
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
      {/* Header */}
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
          
          {agendamentos.map((ag) => (
            <div key={ag.id} className="bg-white p-4 rounded-xl border shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{ag.servico?.nome}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(ag.status)}`}>{ag.status}</span>
                  <p className="text-sm text-gray-600 mt-1">Cliente: {ag.cliente?.nome || ag.cliente?.email}</p>
                </div>
                <p className="font-bold text-purple-600">R$ {ag.valor_total?.toFixed(2)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(ag.data_agendamento).toLocaleDateString()}</div>
                <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {ag.hora_inicio}</div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => handleOpenChat(ag.cliente_id, ag.cliente?.nome, ag.cliente?.email)} className="flex-1 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">Chat</button>
                {ag.status === 'pendente' && <button onClick={() => atualizarStatus(ag.id, 'confirmado')} className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm">Confirmar</button>}
                <button onClick={() => deletarAgendamento(ag.id)} className="p-2 text-red-500"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Perfil Sidebar */}
        <div className="bg-white p-6 rounded-xl border shadow-sm h-fit">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold mb-2">
              {profissional?.nome?.[0]}
            </div>
            <h3 className="font-bold text-lg">{profissional?.nome}</h3>
            <p className="text-sm text-gray-500">{profissional?.cidade}</p>
          </div>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="w-full py-3 border-2 border-purple-500 text-purple-600 rounded-xl font-bold hover:bg-purple-50"
          >
            Editar Perfil
          </button>
        </div>
      </main>

      {/* MODAL DE EDIÇÃO - FIX: Cor do texto nos inputs */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Editar Perfil</h3>
              <button onClick={() => setIsEditModalOpen(false)}><X /></button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={editForm.nome}
                  onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={editForm.telefone}
                  onChange={(e) => setEditForm({...editForm, telefone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  type="text"
                  value={editForm.cidade}
                  onChange={(e) => setEditForm({...editForm, cidade: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço/Hora (R$)</label>
                <input
                  type="number"
                  value={editForm.preco_hora}
                  onChange={(e) => setEditForm({...editForm, preco_hora: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidades (separadas por vírgula)</label>
                <input
                  type="text"
                  value={editForm.especialidade}
                  onChange={(e) => setEditForm({...editForm, especialidade: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" disabled={savingProfile} className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-bold flex justify-center items-center gap-2">
                  {savingProfile ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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