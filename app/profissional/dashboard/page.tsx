'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  Settings, 
  LogOut,
  Star,
  Briefcase
} from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function DashboardProfissional() {
  const router = useRouter()
  const [profissional, setProfissional] = useState<any>(null)
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      // Pega usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Verifica se é profissional
      const { data: profData } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profData) {
        // Se não for profissional, redireciona
        router.push('/cliente/dashboard')
        return
      }

      setProfissional(profData)

      // Busca agendamentos deste profissional
      const { data: agendData } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('profissional_id', user.id)
        .order('data', { ascending: true })

      setAgendamentos(agendData || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        Carregando...
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Beleza Connect</h1>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Painel do Profissional</p>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>
              Olá, {profissional?.nome?.split(' ')[0] || 'Profissional'}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        
        {/* Cards de Resumo */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Calendar style={{ color: '#667eea' }} />
              <span style={{ color: '#666' }}>Agendamentos Hoje</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '32px', color: '#333' }}>
              {agendamentos.filter(a => {
                const hoje = new Date().toISOString().split('T')[0]
                return a.data === hoje
              }).length}
            </h2>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Users style={{ color: '#764ba2' }} />
              <span style={{ color: '#666' }}>Total Clientes</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '32px', color: '#333' }}>
              {new Set(agendamentos.map(a => a.cliente_id)).size}
            </h2>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Star style={{ color: '#f59e0b' }} />
              <span style={{ color: '#666' }}>Avaliação</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '32px', color: '#333' }}>
              {profissional?.avaliacao || '5.0'} ⭐
            </h2>
          </div>

          <div 
            onClick={() => router.push('/profissional/perfil')}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              color: 'white'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Briefcase style={{ color: 'white' }} />
              <span>Meus Serviços</span>
            </div>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              {profissional?.especialidade || 'Clique para definir sua especialidade'}
            </p>
          </div>
        </div>

        {/* Grid Principal */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px'
        }}>
          
          {/* Próximos Agendamentos */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
              Próximos Agendamentos
            </h3>
            
            {agendamentos.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>
                Nenhum agendamento ainda
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {agendamentos.slice(0, 5).map((agend, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    padding: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ margin: '0 0 5px 0', fontWeight: '600', color: '#333' }}>
                        {agend.servico}
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#666', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} /> {agend.data} às {agend.hora}
                      </p>
                    </div>
                    <span style={{
                      background: agend.status === 'confirmado' ? '#dcfce7' : '#fef3c7',
                      color: agend.status === 'confirmado' ? '#166534' : '#92400e',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {agend.status || 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Perfil Resumido */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
              Meu Perfil
            </h3>
            
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                margin: '0 auto 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                color: 'white',
                fontWeight: 'bold'
              }}>
                {profissional?.nome?.charAt(0) || 'P'}
              </div>
              <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{profissional?.nome}</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{profissional?.email}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>Especialidade:</span>
                <span style={{ color: '#333', fontWeight: '600' }}>{profissional?.especialidade || 'Não definida'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>Telefone:</span>
                <span style={{ color: '#333', fontWeight: '600' }}>{profissional?.telefone || 'Não cadastrado'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <span style={{ color: '#666' }}>Cidade:</span>
                <span style={{ color: '#333', fontWeight: '600' }}>{profissional?.cidade || 'Não definida'}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/profissional/perfil')}
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              <Settings size={16} />
              Editar Perfil e Serviços
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}