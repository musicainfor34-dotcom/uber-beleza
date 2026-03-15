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
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Bell
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Agendamento {
  id: string
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

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchProfissional()
    }
  }, [user])

  useEffect(() => {
    if (profissional) {
      fetchAgendamentos()
    }
  }, [profissional])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user)
  }

  async function fetchProfissional() {
    try {
      // Busca por user_id
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Erro:', error)
        setLoading(false)
        return
      }

      if (data) {
        console.log('Profissional encontrado:', data)
        setProfissional(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAgendamentos() {
    if (!profissional) return
    
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          cliente:cliente_id (email),
          servico:servico_id (nome, duracao_minutos)
        `)
        .eq('profissional_id', profissional.id)
        .order('data_agendamento', { ascending: true })

      if (error) throw error
      setAgendamentos(data || [])
    } catch (error) {
      console.error('Erro:', error)
    }
  }

  async function atualizarStatus(agendamentoId: string, novoStatus: string) {
    await supabase
      .from('agendamentos')
      .update({ status: novoStatus })
      .eq('id', agendamentoId)
    fetchAgendamentos()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-100 text-green-700'
      case 'pendente': return 'bg-yellow-100 text-yellow-700'
      case 'cancelado': return 'bg-red-100 text-red-700'
      case 'concluido': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!profissional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Cadastro não encontrado</h2>
          <p className="text-gray-500 mb-6">
            Sua conta de usuário não está vinculada a um perfil de profissional.
          </p>
          <button 
            onClick={handleLogout}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold"
          >
            Sair e fazer login correto
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Beleza Connect</h1>
            <p className="text-sm opacity-90">Painel do Profissional</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">Olá, {profissional.nome}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-600">Hoje</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {agendamentos.filter(a => a.data_agendamento === new Date().toISOString().split('T')[0]).length}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Total</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{agendamentos.length}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">Nota</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">5.0</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl shadow-sm text-white">
            <div className="flex items-center gap-3 mb-2">
              <Scissors className="w-5 h-5" />
              <span className="text-sm opacity-90">Serviço</span>
            </div>
            <p className="text-lg font-semibold">{profissional.especialidade?.[0] || 'N/A'}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Agendamentos */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Agendamentos</h2>
            
            {agendamentos.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum agendamento ainda</p>
                <p className="text-sm text-gray-400 mt-1">
                  Quando clientes agendarem, aparecerão aqui
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agendamentos.map((agendamento) => (
                  <div 
                    key={agendamento.id}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-800">
                          {agendamento.servico?.nome}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(agendamento.status)}`}>
                          {agendamento.status}
                        </span>
                      </div>
                      <p className="font-bold text-purple-600">
                        R$ {agendamento.valor_total?.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatarData(agendamento.data_agendamento)} às {agendamento.hora_inicio}
                    </p>
                    <p className="text-sm text-gray-500">
                      Cliente: {agendamento.cliente?.email}
                    </p>
                    
                    {agendamento.status === 'pendente' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => atualizarStatus(agendamento.id, 'confirmado')}
                          className="flex-1 py-2 bg-green-500 text-white rounded-lg text-sm"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => atualizarStatus(agendamento.id, 'cancelado')}
                          className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Perfil */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm h-fit">
            <h3 className="font-bold text-gray-800 mb-4">Meu Perfil</h3>
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold mb-3">
                {profissional.nome?.[0]}
              </div>
              <h4 className="font-bold text-lg">{profissional.nome}</h4>
              <p className="text-sm text-gray-500">{profissional.email}</p>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-600">Tel:</span> {profissional.telefone}</p>
              <p><span className="text-gray-600">Cidade:</span> {profissional.cidade}</p>
              <p><span className="text-gray-600">Preço:</span> R$ {profissional.preco_hora}/hora</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}