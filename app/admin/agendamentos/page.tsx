'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  MapPin,
  Phone,
  CheckCircle,
  XCircle,
  Clock3,
  ArrowLeft,
  Filter,
  Trash2
} from 'lucide-react'
import Link from 'next/link'

interface Agendamento {
  id: string
  data_agendamento: string
  hora_inicio: string
  hora_fim: string
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
  valor_total: number
  endereco: string
  bairro: string
  cidade: string
  cliente_id: string
  profissional_id: string
  servico_id: string
  // Dados buscados separadamente
  cliente?: any
  profissional?: any
  servico?: any
}

export default function GerenciarAgendamentos() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')

  useEffect(() => {
    carregarAgendamentos()
  }, [])

  async function carregarAgendamentos() {
    setLoading(true)
    
    try {
      // Query simplificada - busca todos os agendamentos
      const { data, error } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data_agendamento', { ascending: false })

      if (error) {
        console.error('Erro ao buscar agendamentos:', error)
        setLoading(false)
        return
      }

      if (data) {
        // Buscar dados dos profissionais para enriquecer a lista
        const profissionaisIds = [...new Set(data.map(a => a.profissional_id).filter(Boolean))]
        
        const { data: profissionaisData } = await supabase
          .from('professionals')
          .select('id, nome, email, telefone')
          .in('id', profissionaisIds)

        // Criar mapa de profissionais
        const profissionaisMap = (profissionaisData || []).reduce((acc: any, prof: any) => {
          acc[prof.id] = prof
          return acc
        }, {})

        // Enriquecer agendamentos com dados do profissional
        const agendamentosCompletos = data.map((ag: any) => ({
          ...ag,
          profissional: profissionaisMap[ag.profissional_id] || null,
          cliente: { nome: 'Cliente', telefone: '-' }, // Simplificado por enquanto
          servico: { nome: 'Serviço', duracao: 60 }    // Simplificado por enquanto
        }))

        setAgendamentos(agendamentosCompletos)
      }
    } catch (err) {
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  async function atualizarStatus(id: string, novoStatus: string) {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: novoStatus })
      .eq('id', id)

    if (!error) {
      carregarAgendamentos() // Recarrega a lista
    }
  }

  async function deletarAgendamento(id: string) {
    const confirmar = window.confirm('Tem certeza que deseja excluir este agendamento?')
    if (!confirmar) return

    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id)

    if (!error) {
      alert('Agendamento excluído!')
      carregarAgendamentos()
    } else {
      alert('Erro ao excluir')
    }
  }

  const agendamentosFiltrados = filtroStatus === 'todos' 
    ? agendamentos 
    : agendamentos.filter(a => a.status === filtroStatus)

  const statusConfig = {
    pendente: { cor: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)', icone: Clock3 },
    confirmado: { cor: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)', icone: CheckCircle },
    concluido: { cor: '#10b981', bg: 'rgba(16, 185, 129, 0.2)', icone: CheckCircle },
    cancelado: { cor: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)', icone: XCircle }
  }

  function formatarData(dataString: string) {
    const data = new Date(dataString)
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/admin/dashboard" style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#f472b6', 
          textDecoration: 'none',
          marginBottom: '16px'
        }}>
          <ArrowLeft style={{ width: '20px', height: '20px' }} />
          Voltar ao Dashboard
        </Link>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
              Agendamentos
            </h1>
            <p style={{ color: '#9ca3af' }}>
              {agendamentos.length} agendamentos no sistema
            </p>
          </div>
          
          {/* Filtros */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['todos', 'pendente', 'confirmado', 'concluido', 'cancelado'].map((status) => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                  backgroundColor: filtroStatus === status ? '#ec4899' : '#374151',
                  color: 'white'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
          Carregando...
        </div>
      ) : agendamentosFiltrados.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px', 
          color: '#9ca3af',
          backgroundColor: 'rgba(31, 41, 55, 0.5)',
          borderRadius: '16px',
          border: '1px solid #374151'
        }}>
          <Calendar style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.5 }} />
          <p>Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {agendamentosFiltrados.map((agend) => {
            const config = statusConfig[agend.status] || statusConfig.pendente
            const IconeStatus = config.icone
            
            return (
              <div key={agend.id} style={{
                backgroundColor: 'rgba(31, 41, 55, 0.95)',
                border: '1px solid #374151',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                {/* Info principal */}
                <div style={{ display: 'flex', gap: '16px', flex: '1', minWidth: '280px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: config.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconeStatus style={{ width: '24px', height: '24px', color: config.cor }} />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px',
                      marginBottom: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'white' }}>
                        Serviço Agendado
                      </h3>
                      <span style={{
                        backgroundColor: config.bg,
                        color: config.cor,
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {agend.status}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gap: '6px', color: '#9ca3af', fontSize: '0.875rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User style={{ width: '14px', height: '14px' }} />
                        <strong style={{ color: '#d1d5db' }}>Profissional:</strong> 
                        {agend.profissional?.nome || 'Não atribuído'}
                      </span>
                      
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone style={{ width: '14px', height: '14px' }} />
                        <strong style={{ color: '#d1d5db' }}>Tel Profissional:</strong> 
                        {agend.profissional?.telefone || '-'}
                      </span>

                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin style={{ width: '14px', height: '14px' }} />
                        <strong style={{ color: '#d1d5db' }}>Endereço:</strong> 
                        {agend.endereco}, {agend.bairro} - {agend.cidade}
                      </span>

                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar style={{ width: '14px', height: '14px' }} />
                        <strong style={{ color: '#d1d5db' }}>Data:</strong> 
                        {formatarData(agend.data_agendamento)} às {agend.hora_inicio}
                        <span style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock style={{ width: '12px', height: '12px' }} />
                          até {agend.hora_fim}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações e valor */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'flex-end',
                  gap: '12px'
                }}>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: 'bold', 
                    color: '#10b981' 
                  }}>
                    R$ {agend.valor_total?.toFixed(2) || '0.00'}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {agend.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => atualizarStatus(agend.id, 'confirmado')}
                          style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.2)',
                            color: '#60a5fa',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => atualizarStatus(agend.id, 'cancelado')}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500'
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    )}

                    {agend.status === 'confirmado' && (
                      <button
                        onClick={() => atualizarStatus(agend.id, 'concluido')}
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        Marcar Concluído
                      </button>
                    )}

                    {/* Botão de excluir */}
                    <button
                      onClick={() => deletarAgendamento(agend.id)}
                      style={{
                        backgroundColor: 'rgba(107, 114, 128, 0.2)',
                        color: '#9ca3af',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}