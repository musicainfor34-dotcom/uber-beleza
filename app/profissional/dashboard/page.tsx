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
      
      // Realtime - atualiza quando cliente agenda
      const channel = supabase
        .channel(`agendamentos:${profissional.id}`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'agendamentos',
            filter: `profissional_id=eq.${profissional.id}`
          },
          (payload) => {
            console.log('Novo agendamento:', payload)
            fetchAgendamentos()
            if (payload.eventType === 'INSERT') {
              alert('📱 Novo agendamento recebido!')
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
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
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Erro ao buscar profissional:', error)
        return
      }

      if (data) {
        console.log('Profissional carregado:', data)
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
  
  setRefreshing(true)
  try {
    // Query simplificada - sem joins complexos primeiro
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('profissional_id', profissional.id)
      .order('data_agendamento', { ascending: true })

    if (error) {
      console.error('Erro na query:', error)
      return
    }

    console.log('Agendamentos brutos:', data)
    
    // Se der certo, vamos buscar os dados do cliente separadamente
    if (data && data.length > 0) {
      const agendamentosCompletos = await Promise.all(
        data.map(async (ag: any) => {
          // Buscar dados do cliente
          const { data: clienteData } = await supabase
            .from('professionals')
            .select('nome, email')
            .eq('user_id', ag.cliente_id)
            .single()
            
          return {
            ...ag,
            cliente: clienteData || { email: 'Cliente não encontrado', nome: '' }
          }
        })
      )
      setAgendamentos(agendamentosCompletos)
    } else {
      setAgendamentos([])
    }

  } catch (error) {
    console.error('Erro:', error)
  } finally {
    setRefreshing(false)
  }
}

  async function atualizarStatus(agendamentoId: string, novoStatus: string) {
    try {
      const { error } = await supabase
        .from('agendamentos')
        .update({ status: novoStatus })
        .eq('id', agendamentoId)

      if (error) throw error
      fetchAgendamentos()
    } catch (error) {
      alert('Erro ao atualizar status')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-100 text-green-700 border-green-200'
      case 'pendente': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'cancelado': return 'bg-red-100 text-red-700 border-red-200'
      case 'concluido': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  // Calcula estatísticas
  const today = new Date().toISOString().split('T')[0]
  const agendamentosHoje = agendamentos.filter(a => 
    a.data_agendamento === today && a.status !== 'cancelado'
  ).length
  const totalClientes = agendamentos.filter(a => 
    a.status !== 'cancelado'
  ).length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
            <span className="hidden md:inline">Olá, {profissional?.nome || 'Profissional'}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-600">Hoje</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{agendamentosHoje}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Total Clientes</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{totalClientes}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">Avaliação</span>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-3xl font-bold text-gray-800">{profissional?.avaliacao || 5.0}</p>
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl shadow-sm text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Scissors className="w-5 h-5" />
              </div>
              <span className="text-sm opacity-90">Serviço</span>
            </div>
            <p className="text-lg font-semibold">
              {profissional?.especialidade?.[0] || 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Lista de Agendamentos */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Agendamentos</h2>
              <button 
                onClick={fetchAgendamentos}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>
            
            {agendamentos.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum agendamento ainda</p>
                <p className="text-sm text-gray-400 mt-1">
                  Quando clientes agendarem, aparecerão aqui automaticamente
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agendamentos.map((agendamento) => (
                  <div 
                    key={agendamento.id}
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800">
                            {agendamento.servico?.nome || 'Serviço'}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agendamento.status)}`}>
                            {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          Cliente: {agendamento.cliente?.user_metadata?.nome || agendamento.cliente?.email?.split('@')[0] || 'Cliente'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {agendamento.cliente?.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600 text-lg">
                          R$ {agendamento.valor_total?.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {agendamento.servico?.duracao_minutos} min
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-2 mb-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">{formatarData(agendamento.data_agendamento)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">{agendamento.hora_inicio} - {agendamento.hora_fim}</span>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <MapPin className="w-4 h-4 text-purple-500" />
                        <span>{agendamento.endereco}, {agendamento.bairro} - {agendamento.cidade}</span>
                      </div>
                      {agendamento.referencia && (
                        <div className="flex items-center gap-2 md:col-span-2 text-xs text-gray-500">
                          <span>Ref: {agendamento.referencia}</span>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    {agendamento.status === 'pendente' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => atualizarStatus(agendamento.id, 'confirmado')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Confirmar
                        </button>
                        <button
                          onClick={() => atualizarStatus(agendamento.id, 'cancelado')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancelar
                        </button>
                      </div>
                    )}

                    {agendamento.status === 'confirmado' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => atualizarStatus(agendamento.id, 'concluido')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar como Concluído
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Perfil do Profissional */}
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm h-fit">
            <h3 className="font-bold text-gray-800 mb-4">Meu Perfil</h3>
            
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold mb-3 shadow-lg">
                {profissional?.nome?.[0] || 'P'}
              </div>
              <h4 className="font-bold text-lg text-gray-800">{profissional?.nome}</h4>
              <p className="text-sm text-gray-500">{profissional?.email}</p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>Telefone</span>
                </div>
                <span className="font-medium text-gray-800">{profissional?.telefone || 'Não informado'}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>Cidade</span>
                </div>
                <span className="font-medium text-gray-800">{profissional?.cidade || 'Não informada'}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>Preço/hora</span>
                </div>
                <span className="font-bold text-purple-600 text-lg">R$ {profissional?.preco_hora || '0'}</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                  <Scissors className="w-4 h-4" />
                  <span>Especialidade</span>
                </div>
                <span className="font-medium text-gray-800">
                  {profissional?.especialidade?.join(', ') || 'Não definida'}
                </span>
              </div>
            </div>

            <button className="w-full mt-6 px-4 py-3 border-2 border-purple-500 text-purple-600 rounded-xl font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
              <span>⚙️</span>
              Editar Perfil
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}