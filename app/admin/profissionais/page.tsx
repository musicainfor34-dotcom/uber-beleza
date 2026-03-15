'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, Trash2, ArrowLeft, Star, X } from 'lucide-react'
import Link from 'next/link'

interface Professional {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  cidade: string | null
  especialidade: string[] | null
  bio: string | null
  preco_hora: number | null
  avaliacao: number | null
  ativo: boolean | null
  endereco: string | null
  created_at: string | null
  tabela_origem: string // Para identificar de qual tabela veio
}

export default function ProfissionaisAdmin() {
  const [profissionais, setProfissionais] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [cidade, setCidade] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [bio, setBio] = useState('')
  const [precoHora, setPrecoHora] = useState('')
  const [avaliacao, setAvaliacao] = useState('5')
  const [endereco, setEndereco] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarProfissionais()
  }, [])

  async function carregarProfissionais() {
    setLoading(true)
    setErro('')
    
    try {
      // 1. Buscar da tabela professionals (Marcos e Edenilton - dados completos)
      const { data: profissionaisAntigos, error: errorAntigos } = await supabase
        .from('professionals')
        .select('*')
        .order('created_at', { ascending: false })

      // 2. Buscar da tabela profiles (HELEN, Suelen, Susan... - cadastrados pelo app)
      const { data: profissionaisNovos, error: errorNovos } = await supabase
        .from('profiles')
        .select('*')
        .eq('tipo', 'profissional')
        .order('created_at', { ascending: false })

      if (errorAntigos) {
        console.error('Erro ao carregar professionals:', errorAntigos)
      }
      
      if (errorNovos) {
        console.error('Erro ao carregar profiles:', errorNovos)
      }

      // 3. Combinar os dois resultados
      const listaProfissionais: Professional[] = []

      // Adicionar da tabela professionals (antiga)
      if (profissionaisAntigos) {
        profissionaisAntigos.forEach((p: any) => {
          listaProfissionais.push({
            id: p.id,
            nome: p.nome,
            email: p.email,
            telefone: p.telefone,
            cidade: p.cidade,
            especialidade: p.especialidade,
            bio: p.bio,
            preco_hora: p.preco_hora,
            avaliacao: p.avaliacao,
            ativo: p.ativo ?? true,
            endereco: p.endereco,
            created_at: p.created_at,
            tabela_origem: 'professionals'
          })
        })
      }

      // Adicionar da tabela profiles (nova)
      if (profissionaisNovos) {
        profissionaisNovos.forEach((p: any) => {
          // Verificar se já não existe (pelo nome) para não duplicar
          const jaExiste = listaProfissionais.some(existing => 
            existing.nome?.toLowerCase() === p.nome?.toLowerCase()
          )
          
          if (!jaExiste) {
            listaProfissionais.push({
              id: p.id,
              nome: p.nome,
              email: p.email || null,
              telefone: p.telefone,
              cidade: p.cidade,
              especialidade: p.especialidade || [],
              bio: p.bio,
              preco_hora: p.preco_hora,
              avaliacao: p.avaliacao,
              ativo: p.ativo ?? true,
              endereco: p.endereco,
              created_at: p.created_at,
              tabela_origem: 'profiles'
            })
          }
        })
      }

      // Ordenar por data de criação (mais recente primeiro)
      listaProfissionais.sort((a, b) => {
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        return dateB.getTime() - dateA.getTime()
      })

      console.log('Total de profissionais carregados:', listaProfissionais.length)
      setProfissionais(listaProfissionais)

    } catch (error: any) {
      console.error('Erro ao carregar:', error)
      setErro('Erro ao carregar: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  async function salvarProfissional(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')

    const especArray = especialidade.split(',').map(s => s.trim()).filter(s => s)

    // Salvar na tabela professionals (mantém o padrão antigo)
    const { error } = await supabase.from('professionals').insert([{
      nome: nome,
      email: email,
      telefone: telefone || null,
      cidade: cidade || null,
      especialidade: especArray,
      bio: bio || null,
      preco_hora: parseFloat(precoHora) || 0,
      avaliacao: parseFloat(avaliacao) || 5,
      endereco: endereco || null,
      ativo: true
    }])

    if (error) {
      setErro('Erro ao salvar: ' + error.message)
      console.error('Erro completo:', error)
      setSalvando(false)
      return
    }

    // Limpar formulário
    setNome('')
    setEmail('')
    setTelefone('')
    setCidade('')
    setEspecialidade('')
    setBio('')
    setPrecoHora('')
    setAvaliacao('5')
    setEndereco('')
    setModalAberto(false)
    setSalvando(false)
    carregarProfissionais()
  }

  async function alternarStatus(id: string, atual: boolean, tabelaOrigem: string) {
    // Determinar qual tabela usar
    const tabela = tabelaOrigem === 'profiles' ? 'profiles' : 'professionals'
    
    const { error } = await supabase
      .from(tabela)
      .update({ ativo: !atual })
      .eq('id', id)
    
    if (error) {
      setErro('Erro ao atualizar: ' + error.message)
    } else {
      carregarProfissionais()
    }
  }

  async function excluir(id: string, tabelaOrigem: string) {
    if (!confirm('Tem certeza que deseja excluir?')) return
    
    // Determinar qual tabela usar
    const tabela = tabelaOrigem === 'profiles' ? 'profiles' : 'professionals'
    
    const { error } = await supabase
      .from(tabela)
      .delete()
      .eq('id', id)
    
    if (error) {
      setErro('Erro ao excluir: ' + error.message)
    } else {
      carregarProfissionais()
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111827', color: 'white', padding: '32px' }}>
      <div style={{ maxWidth: '1152px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '24px' }}>
          <Link href="/admin/dashboard" style={{ color: '#f472b6', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
            Voltar ao Dashboard
          </Link>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '30px', fontWeight: 'bold', margin: 0 }}>Gerenciar Profissionais</h1>
            <p style={{ color: '#9ca3af', marginTop: '8px' }}>{profissionais.length} profissionais cadastrados</p>
          </div>
          
          <button 
            onClick={() => setModalAberto(true)}
            style={{ 
              background: 'linear-gradient(to right, #ec4899, #9333ea)', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            <Plus size={20} />
            Novo Profissional
          </button>
        </div>

        {erro && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', color: '#fca5a5', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            {erro}
          </div>
        )}

        <div style={{ backgroundColor: '#1f2937', borderRadius: '16px', padding: '24px' }}>
          
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={20} />
            <input 
              type="text"
              placeholder="Buscar profissional..."
              style={{ 
                width: '100%', 
                backgroundColor: '#111827', 
                border: '1px solid #374151', 
                borderRadius: '12px', 
                padding: '12px 16px 12px 48px', 
                color: 'white',
                fontSize: '16px'
              }}
            />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#9ca3af' }}>
              Carregando...
            </div>
          ) : profissionais.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', backgroundColor: 'rgba(17, 24, 39, 0.5)', borderRadius: '12px' }}>
              <div style={{ fontSize: '60px', marginBottom: '16px' }}>👩‍💼</div>
              <p style={{ color: '#9ca3af', fontSize: '18px', margin: '0 0 8px 0' }}>Nenhum profissional encontrado</p>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Cadastre o primeiro profissional</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {profissionais.map((p) => (
                <div key={p.id} style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{ width: '48px', height: '48px', background: 'linear-gradient(to bottom right, #ec4899, #9333ea)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 }}>
                      {p.nome?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 'bold', color: 'white', margin: '0 0 4px 0' }}>
                        {p.nome || 'Sem nome'}
                      </h3>
                      {p.email && (
                        <p style={{ color: '#9ca3af', fontSize: '14px', margin: '0 0 4px 0' }}>{p.email}</p>
                      )}
                      <p style={{ color: '#6b7280', fontSize: '13px', margin: '0 0 8px 0' }}>
                        {Array.isArray(p.especialidade) ? p.especialidade.join(', ') : p.especialidade || 'Sem especialidade'} 
                        {p.cidade && ` • ${p.cidade}`}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px' }}>
                        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                          R$ {p.preco_hora || 0}/h
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#facc15' }}>
                          <Star size={14} fill="currentColor" /> {p.avaliacao || 5}
                        </span>
                        {p.telefone && (
                          <span style={{ color: '#6b7280', fontSize: '13px' }}>📞 {p.telefone}</span>
                        )}
                        {/* Indicador sutil de origem (pode remover depois) */}
                        <span style={{ 
                          color: '#6b7280', 
                          fontSize: '11px', 
                          backgroundColor: 'rgba(55, 65, 81, 0.5)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {p.tabela_origem === 'profiles' ? 'App' : 'Admin'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => alternarStatus(p.id, p.ativo || false, p.tabela_origem)}
                      style={{ 
                        padding: '8px 16px', 
                        borderRadius: '8px', 
                        fontSize: '14px',
                        fontWeight: '500',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: p.ativo ? 'rgba(74, 222, 128, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                        color: p.ativo ? '#4ade80' : '#9ca3af'
                      }}
                    >
                      {p.ativo ? '✓ Ativo' : 'Inativo'}
                    </button>
                    <button 
                      onClick={() => excluir(p.id, p.tabela_origem)} 
                      style={{ padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalAberto && (
        <>
          <div 
            onClick={() => setModalAberto(false)}
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0, 0, 0, 0.8)', 
              zIndex: 9998 
            }}
          />
          
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{ 
              backgroundColor: '#1f2937', 
              borderRadius: '16px', 
              padding: '32px', 
              width: '100%', 
              maxWidth: '500px', 
              border: '1px solid #374151',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <button 
                onClick={() => setModalAberto(false)}
                style={{ 
                  position: 'absolute', 
                  top: '16px', 
                  right: '16px', 
                  color: '#9ca3af', 
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={24} />
              </button>

              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Novo Profissional</h2>

              <form onSubmit={salvarProfissional} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>Nome *</label>
                  <input 
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Maria Silva"
                    required
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#111827', 
                      border: '1px solid #4b5563', 
                      borderRadius: '8px', 
                      padding: '12px 16px', 
                      color: 'white',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>Email *</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria@email.com"
                    required
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#111827', 
                      border: '1px solid #4b5563', 
                      borderRadius: '8px', 
                      padding: '12px 16px', 
                      color: 'white',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>Telefone</label>
                    <input 
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      style={{ 
                        width: '100%', 
                        backgroundColor: '#111827', 
                        border: '1px solid #4b5563', 
                        borderRadius: '8px', 
                        padding: '12px 16px', 
                        color: 'white',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>Cidade</label>
                    <input 
                      type="text"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="São Paulo"
                      style={{ 
                        width: '100%', 
                        backgroundColor: '#111827', 
                        border: '1px solid #4b5563', 
                        borderRadius: '8px', 
                        padding: '12px 16px', 
                        color: 'white',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>Especialidades *</label>
                  <input 
                    type="text"
                    value={especialidade}
                    onChange={(e) => setEspecialidade(e.target.value)}
                    placeholder="Ex: Maquiagem, Cabelo, Unhas"
                    required
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#111827', 
                      border: '1px solid #4b5563', 
                      borderRadius: '8px', 
                      padding: '12px 16px', 
                      color: 'white',
                      fontSize: '16px'
                    }}
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Separe por vírgulas</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>Bio/Descrição</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Descrição do profissional..."
                    rows={3}
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#111827', 
                      border: '1px solid #4b5563', 
                      borderRadius: '8px', 
                      padding: '12px 16px', 
                      color: 'white',
                      fontSize: '16px',
                      resize: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>Preço/Hora (R$) *</label>
                    <input 
                      type="number"
                      value={precoHora}
                      onChange={(e) => setPrecoHora(e.target.value)}
                      placeholder="150"
                      required
                      min="0"
                      step="0.01"
                      style={{ 
                        width: '100%', 
                        backgroundColor: '#111827', 
                        border: '1px solid #4b5563', 
                        borderRadius: '8px', 
                        padding: '12px 16px', 
                        color: 'white',
                        fontSize: '16px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>Avaliação</label>
                    <select 
                      value={avaliacao}
                      onChange={(e) => setAvaliacao(e.target.value)}
                      style={{ 
                        width: '100%', 
                        backgroundColor: '#111827', 
                        border: '1px solid #4b5563', 
                        borderRadius: '8px', 
                        padding: '12px 16px', 
                        color: 'white',
                        fontSize: '16px'
                      }}
                    >
                      <option value="5">5 ⭐</option>
                      <option value="4.5">4.5 ⭐</option>
                      <option value="4">4 ⭐</option>
                      <option value="3.5">3.5 ⭐</option>
                      <option value="3">3 ⭐</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>Endereço</label>
                  <input 
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua, número, bairro"
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#111827', 
                      border: '1px solid #4b5563', 
                      borderRadius: '8px', 
                      padding: '12px 16px', 
                      color: 'white',
                      fontSize: '16px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', paddingTop: '16px' }}>
                  <button 
                    type="button"
                    onClick={() => setModalAberto(false)}
                    style={{ 
                      flex: 1, 
                      backgroundColor: '#374151', 
                      color: 'white', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={salvando}
                    style={{ 
                      flex: 1, 
                      background: 'linear-gradient(to right, #ec4899, #9333ea)', 
                      color: 'white', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: salvando ? 0.5 : 1
                    }}
                  >
                    {salvando ? 'Salvando...' : 'Salvar Profissional'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  )
}