'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Users, 
  Scissors, 
  Calendar, 
  DollarSign,
  TrendingUp
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProfissionais: 0,
    totalClientes: 0,
    agendamentosHoje: 0,
    faturamentoMes: 0
  })

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    // Buscar estatísticas reais do Supabase
    const { count: profissionaisCount } = await supabase
      .from('profissionais')
      .select('*', { count: 'exact', head: true })

    const { count: clientesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'cliente')

    setStats({
      totalProfissionais: profissionaisCount || 0,
      totalClientes: clientesCount || 0,
      agendamentosHoje: 0, // Você pode implementar depois
      faturamentoMes: 0    // Você pode implementar depois
    })
  }

  const cards = [
    {
      label: 'Profissionais',
      value: stats.totalProfissionais,
      icon: Scissors,
      color: 'from-pink-500 to-rose-600',
      bgColor: 'bg-pink-500'
    },
    {
      label: 'Clientes',
      value: stats.totalClientes,
      icon: Users,
      color: 'from-purple-500 to-violet-600',
      bgColor: 'bg-purple-500'
    },
    {
      label: 'Agendamentos Hoje',
      value: stats.agendamentosHoje,
      icon: Calendar,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-500'
    },
    {
      label: 'Faturamento Mês',
      value: `R$ ${stats.faturamentoMes}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-500'
    }
  ]

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
                <card.icon className={`w-6 h-6 ${card.bgColor.replace('bg-', 'text-')}`} />
              </div>
              <span className="text-xs text-gray-500 font-medium">+12%</span>
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
              <h3 className="font-medium text-white">Adicionar Profissional</h3>
              <p className="text-sm text-gray-400">Cadastrar novo profissional</p>
            </div>
          </a>

          <a
            href="/admin/servicos"
            className="flex items-center gap-4 p-4 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500 bg-opacity-20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Scissors className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Gerenciar Serviços</h3>
              <p className="text-sm text-gray-400">Editar preços e descrições</p>
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
              <p className="text-sm text-gray-400">Todas as reservas do dia</p>
            </div>
          </a>
        </div>
      </div>

      {/* Gráfico ou Lista (placeholder) */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Agendamentos Recentes</h2>
          <a href="/admin/agendamentos" className="text-pink-400 hover:text-pink-300 text-sm font-medium">
            Ver todos →
          </a>
        </div>
        
        <div className="text-center py-12 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum agendamento recente</p>
          <p className="text-sm mt-1">Os agendamentos aparecerão aqui quando começarem</p>
        </div>
      </div>
    </div>
  )
}