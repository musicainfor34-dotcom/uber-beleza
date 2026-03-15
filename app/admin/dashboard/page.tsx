'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Users, 
  Scissors, 
  Calendar, 
  DollarSign
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProfissionais: 0,
    totalClientes: 0,
    agendamentosHoje: 0,
    faturamentoMes: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      // 1. Contar PROFISSIONAIS das DUAS tabelas (profiles + professionals)
      const { data: profissionaisProfiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .eq('tipo', 'profissional')
      
      const { data: profissionaisAntigos } = await supabase
        .from('professionals')
        .select('id, nome')
      
      // Combinar e remover duplicados pelo nome
      const todosProfissionais = [...(profissionaisProfiles || [])]
      
      if (profissionaisAntigos) {
        profissionaisAntigos.forEach((prof: any) => {
          const jaExiste = todosProfissionais.some((p: any) => 
            p.nome?.toLowerCase() === prof.nome?.toLowerCase()
          )
          if (!jaExiste) {
            todosProfissionais.push(prof)
          }
        })
      }
      
      const profissionaisCount = todosProfissionais.length

      // 2. Contar CLIENTES (todos da profiles)
      const { data: clientesData } = await supabase
        .from('profiles')
        .select('id')
      
      const clientesCount = clientesData?.length || 0

      // 3. Agendamentos de HOJE
      const hoje = new Date().toISOString().split('T')[0]
      const { data: agendamentosData } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('data_agendamento', hoje)
        .neq('status', 'cancelado')
      
      const agendamentosCount = agendamentosData?.length || 0

      // 4. FATURAMENTO DO MÊS
      const primeiroDiaMes = new Date()
      primeiroDiaMes.setDate(1)
      const inicioMes = primeiroDiaMes.toISOString().split('T')[0]
      
      const { data: faturamentoData } = await supabase
        .from('agendamentos')
        .select('valor_total')
        .gte('data_agendamento', inicioMes)
        .in('status', ['confirmado', 'concluido'])

      let faturamentoMes = 0
      if (faturamentoData) {
        faturamentoMes = faturamentoData.reduce((sum, ag) => sum + (ag.valor_total || 0), 0)
      }

      setStats({
        totalProfissionais: profissionaisCount,
        totalClientes: clientesCount,
        agendamentosHoje: agendamentosCount,
        faturamentoMes: faturamentoMes
      })

    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      label: 'Profissionais',
      value: stats.totalProfissionais,
      icon: Scissors,
      bgColor: 'bg-pink-500',
      textColor: 'text-pink-400'
    },
    {
      label: 'Clientes',
      value: stats.totalClientes,
      icon: Users,
      bgColor: 'bg-purple-500',
      textColor: 'text-purple-400'
    },
    {
      label: 'Agendamentos Hoje',
      value: stats.agendamentosHoje,
      icon: Calendar,
      bgColor: 'bg-blue-500',
      textColor: 'text-blue-400'
    },
    {
      label: 'Faturamento Mês',
      value: `R$ ${stats.faturamentoMes}`,
      icon: DollarSign,
      bgColor: 'bg-green-500',
      textColor: 'text-green-400'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Visão geral do seu negócio</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700 hover:border-gray-600 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${card.bgColor} bg-opacity-20 flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              <span className="text-xs text-gray-500 font-medium">+0%</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{card.value}</h3>
            <p className="text-gray-400 text-sm">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Ações Rápidas */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/admin/profissionais"
            className="flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-pink-500 bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Gerenciar Profissionais</h3>
              <p className="text-sm text-gray-400">Ver todos os profissionais</p>
            </div>
          </a>

          <a
            href="/admin/clientes"
            className="flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500 bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Ver Clientes</h3>
              <p className="text-sm text-gray-400">Lista de clientes cadastrados</p>
            </div>
          </a>

          <a
            href="/admin/agendamentos"
            className="flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Ver Agendamentos</h3>
              <p className="text-sm text-gray-400">Todas as reservas</p>
            </div>
          </a>
        </div>
      </div>

      {/* Lista de Profissionais Recentes */}
      <ProfissionaisRecentes />
    </div>
  )
}

// Componente para mostrar profissionais recentes
function ProfissionaisRecentes() {
  const [profissionais, setProfissionais] = useState<any[]>([])

  useEffect(() => {
    loadProfissionais()
  }, [])

  async function loadProfissionais() {
    try {
      // Buscar das DUAS tabelas
      const { data: profissionaisProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('tipo', 'profissional')
        .order('created_at', { ascending: false })
      
      const { data: profissionaisAntigos } = await supabase
        .from('professionals')
        .select('*')
        .order('created_at', { ascending: false })
      
      // Combinar e remover duplicados
      const listaProfissionais: any[] = [...(profissionaisProfiles || [])]
      
      if (profissionaisAntigos) {
        profissionaisAntigos.forEach((prof: any) => {
          const jaExiste = listaProfissionais.some((p: any) => 
            p.nome?.toLowerCase() === prof.nome?.toLowerCase()
          )
          if (!jaExiste) {
            listaProfissionais.push({
              ...prof,
              tabela_origem: 'professionals'
            })
          }
        })
      }
      
      // Ordenar por data e pegar os 5 mais recentes
      listaProfissionais.sort((a, b) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateB.getTime() - dateA.getTime()
      })
      
      setProfissionais(listaProfissionais.slice(0, 5))
    } catch (error) {
      console.error('Erro ao carregar profissionais recentes:', error)
    }
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Profissionais Recentes</h2>
        <a href="/admin/profissionais" className="text-pink-400 hover:text-pink-300 text-sm font-medium">
          Ver todos →
        </a>
      </div>
      
      {profissionais.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Scissors className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum profissional cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profissionais.map((prof) => (
            <div key={prof.id} className="flex items-center gap-4 p-4 bg-gray-700 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {prof.nome?.charAt(0).toUpperCase() || 'P'}
              </div>
              <div className="flex-1">
                <h4 className="text-white font-medium">{prof.nome}</h4>
                <p className="text-gray-400 text-sm">
                  {Array.isArray(prof.especialidade) 
                    ? prof.especialidade.join(', ') 
                    : prof.especialidade || 'Sem especialidade'} 
                  {prof.cidade && ` • ${prof.cidade}`}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs ${prof.ativo ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-red-500 bg-opacity-20 text-red-400'}`}>
                {prof.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}