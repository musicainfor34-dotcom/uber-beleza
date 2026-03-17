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
  Filter
} from 'lucide-react'
import Link from 'next/link'

interface Agendamento {
  id: string
  data_agendamento: string
  horario: string
  status: 'pendente' | 'confirmado' | 'cancelado' | 'concluido'
  valor_total: number
  cliente: {
    nome: string
    telefone: string
  }
  profissional: {
    nome: string
  }
  servico: {
    nome: string
    duracao: number
  }
}

export default function GerenciarAgendamentos() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('todos')

  useEffect(() => {
    carregarAgendamentos()
  }, [])

  async function carregarAgendamentos() {
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        cliente:cliente_id (nome, telefone),
        profissional:profissional_id (nome),
        servico:servico_id (nome, duracao)
      `)
      .order('data_agendamento', { ascending: false })

    if (!error && data) {
      setAgendamentos(data)
    }
    setLoading(false)
  }

  async function atualizarStatus(id: string, novoStatus: string) {
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: novoStatus })
      .eq('id', id)

    if (!error) {
      setAgendamentos(agendamentos.map(a => 
        a.id === id ? { ...a, status: novoStatus as any } : a
      ))
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
                        {agend.servico?.nome || 'Serviço não especificado'}
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
                        <strong style={{ color: '#d1d5db' }}>Cliente:</strong> {agend.cliente?.nome || 'Não informado'}
                        {agend.cliente?.telefone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                            <Phone style={{ width: '12px', height: '12px' }} />
                            {agend.cliente.telefone}
                          </span>
                        )}
                      </span>
                      
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Scissors style={{ width: '14px', height: '14px' }} />
                        <strong style={{ color: '#d1d5db' }}>Profissional:</strong> {agend.profissional?.nome || 'Não atribuído'}
                      </span>

                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar style={{ width: '14px', height: '14px' }} />
                        <strong style={{ color: '#d1d5db' }}>Data:</strong> {formatarData(agend.data_agendamento)} às {agend.horario}
                        <span style={{ marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock style={{ width: '12px', height: '12px' }} />
                          {agend.servico?.duracao || 60} min
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

                  {agend.status === 'pendente' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
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
                    </div>
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
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
