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
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
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
  const [error, setError] = useState<string>('')
  const [stats, setStats] = useState({
    hoje: 0,
    total: 0,
    avaliacao: 5.0
  })

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
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
    } catch (err) {
      console.error('Erro ao verificar usuário:', err)
      router.push('/login')
    }
  }

  async function fetchProfissional() {
    try {
      console.log('Buscando profissional com user_id:', user.id)
      
      // Tenta buscar pelo user_id primeiro
      let { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('user_id', user.id)
        .single()

      // Se não encontrar, tenta buscar pelo email como fallback
      if (!data && !error) {
        const { data: dataByEmail, error: errorByEmail } = await supabase
          .from('professionals')
          .select('*')
          .eq('email', user.email)
          .single()
        
        if (dataByEmail) {
          data = dataByEmail
          error = errorByEmail
        }
      }

      if (error) {
        console.error('Erro na query:', error)
        // Se for erro de "não encontrado", não trata como erro crítico
        if (error.code === 'PGRST116') {
          setProfissional(null)
        } else {
          setError('Erro ao buscar dados do profissional')
        }
      } else if (data) {
        console.log('Profissional encontrado:', data)
        setProfissional(data)
      } else {
        setProfissional(null)
      }
    } catch (err) {
      console.error('Erro ao buscar profissional:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAgendamentos() {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`
          *,
          cliente:cliente_id (email),
          servico:servico_id (nome, duracao_minutos)
        `)
        .eq('profissional_id', profissional.id)
        .order('data_agendamento', { ascending: true })
        .order('hora_inicio', { ascending: true })

      if (error) throw error

      const agendamentosData = data || []
      setAgendamentos(agendamentosData)

      const hoje = agendamentosData.filter((a: Agendamento) => 
        a.data_agendamento === today && a.status !== 'cancelado'
      ).length
      
      const total = agendamentosData.filter((a: Agendamento) => 
        a.status !== 'cancelado'
      ).length

      setStats({
        hoje,
        total,
        avaliacao: profissional.avaliacao || 5.0
      })

    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
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
      console.error('Erro ao atualizar status:', error)
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
      case 'confirmado':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'pendente':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'cancelado':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'concluido':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-700 mb-2">{error}</p>
          <button 
            onClick={fetchProfissional}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  // Se não encontrou o profissional, mostra opção de completar cadastro
  if (!profissional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-10 h-10 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Complete seu cadastro</h2>
          <p className="text-gray-500 mb-6">
            Para acessar o painel do profissional, você precisa completar seu cadastro primeiro.
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/cadastro-profissional')}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Completar Cadastro
            </button>
            
            <button 
              onClick={handleLogout}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Sair e entrar com outra conta
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left text-sm text-gray-600">
            <p className="font-semibold mb-1">Debug:</p>
            <p>User ID: {user?.id}</p>
            <p>Email: {user?.email}</p>
            <button 
              onClick={fetchProfissional}
              className="mt-2 text-purple-600 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Tentar buscar novamente
            </button>
          </div>
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
              <span className="text-sm text-gray-600">Agendamentos Hoje</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.hoje}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Total Clientes</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">Avaliação</span>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-3xl font-bold text-gray-800">{stats.avaliacao}</p>
              <Star className="w-5 h-5 text-yellow-400 fill-current" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl shadow-sm text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Scissors className="w-5 h-5" />
              </div>
              <span className="text-sm opacity-90">Meus Serviços</span>
            </div>
            <p className="text-lg font-semibold">
              {profissional.especialidade?.join(', ') || 'Não definido'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Lista de Agendamentos */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Próximos Agendamentos</h2>
            
            {agendamentos.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
                    className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800">
                            {agendamento.servico?.nome || 'Serviço'}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(agendamento.status)}`}>
                            {agendamento.status.charAt(0).toUpperCase() + agendamento.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Cliente: {agendamento.cliente?.email?.split('@')[0] || 'Cliente'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">
                          R$ {agendamento.valor_total?.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {agendamento.servico?.duracao_minutos} min
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-2 mb-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatarData(agendamento.data_agendamento)} às {agendamento.hora_inicio}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{agendamento.bairro}, {agendamento.cidade}</span>
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <span className="text-gray-400">📍</span>
                        <span className="truncate">{agendamento.endereco}</span>
                        {agendamento.referencia && (
                          <span className="text-gray-400 text-xs">({agendamento.referencia})</span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    {agendamento.status === 'pendente' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
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
                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => atualizarStatus(agendamento.id, 'concluido')}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
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
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold mb-3">
                {profissional.nome?.[0] || 'P'}
              </div>
              <h4 className="font-bold text-lg text-gray-800">{profissional.nome}</h4>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Especialidade:</span>
                <span className="font-medium text-gray-800">
                  {profissional.especialidade?.join(', ') || 'Não definido'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Telefone:</span>
                <span className="font-medium text-gray-800">{profissional.telefone}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Cidade:</span>
                <span className="font-medium text-gray-800">{profissional.cidade}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Preço/hora:</span>
                <span className="font-bold text-purple-600">R$ {profissional.preco_hora}</span>
              </div>
            </div>

            <button className="w-full mt-6 px-4 py-2 border-2 border-purple-500 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
              <span>⚙️</span>
              Editar Perfil e Serviços
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}