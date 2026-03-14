'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, User, ArrowRight, Loader2, Sparkles, Scissors, Eye, EyeOff } from 'lucide-react'

export default function CadastroPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: { nome: nome }
        }
      })
      
      if (error) throw error
      
      if (data.user) {
        setSucesso(true)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    } catch (error: any) {
      setErro(error.message || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#111827',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        height: '288px',
        background: 'linear-gradient(to bottom right, #ec4899, #9333ea, #db2777)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <Sparkles style={{ width: '40px', height: '40px', color: 'white' }} />
          <Scissors style={{ width: '32px', height: '32px', color: '#fbcfe8' }} />
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
          Beleza Connect
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#fbcfe8', letterSpacing: '0.1em' }}>
          Criar Conta
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '400px',
        marginTop: '-64px',
        padding: '0 16px',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          border: '1px solid #374151',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            Nova Conta
          </h2>

          {sucesso ? (
            <div style={{
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.5)',
              borderRadius: '12px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
              <h3 style={{ color: '#86efac', fontWeight: 'bold', marginBottom: '8px' }}>
                Conta criada com sucesso!
              </h3>
              <p style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
                Redirecionando para o login...
              </p>
            </div>
          ) : (
            <>
              {erro && (
                <div style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fca5a5',
                  textAlign: 'center',
                  marginBottom: '16px',
                  fontSize: '0.875rem'
                }}>
                  {erro}
                </div>
              )}

              <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
                    Nome completo
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} />
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(17, 24, 39, 0.5)',
                        border: '1px solid #4b5563',
                        borderRadius: '12px',
                        padding: '16px 16px 16px 48px',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      placeholder="Seu nome"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
                    Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(17, 24, 39, 0.5)',
                        border: '1px solid #4b5563',
                        borderRadius: '12px',
                        padding: '16px 16px 16px 48px',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
                    Senha
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} />
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                      minLength={6}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(17, 24, 39, 0.5)',
                        border: '1px solid #4b5563',
                        borderRadius: '12px',
                        padding: '16px 48px 16px 48px',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280'
                      }}
                    >
                      {mostrarSenha ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db', marginBottom: '8px' }}>
                    Confirmar senha
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} />
                    <input
                      type="password"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(17, 24, 39, 0.5)',
                        border: '1px solid #4b5563',
                        borderRadius: '12px',
                        padding: '16px 16px 16px 48px',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                      placeholder="••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(to right, #ec4899, #9333ea)',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '8px',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  {loading ? <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} /> : <>Criar conta <ArrowRight style={{ width: '20px', height: '20px' }} /></>}
                </button>
              </form>

              <Link href="/login" style={{ textDecoration: 'none' }}>
                <div style={{
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: 'rgba(55, 65, 81, 0.5)',
                  borderRadius: '12px',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}>
                  <p style={{ color: '#d1d5db', fontSize: '0.875rem' }}>
                    <span style={{ color: '#f472b6', fontWeight: '600' }}>Já tem conta?</span><br/>
                    <span style={{ textDecoration: 'underline' }}>Fazer login</span>
                  </p>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}