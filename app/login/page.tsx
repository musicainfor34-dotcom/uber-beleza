'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, ArrowRight, Loader2, Sparkles, Scissors } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      })
      
      if (error) throw error
      
      if (data.user) {
        const userEmail = data.user.email?.toLowerCase()
        
        if (userEmail === 'musicainfor34@gmail.com') {
          window.location.href = '/admin/dashboard'
          return
        }
        
        const { data: profData } = await supabase
          .from('professionals')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profData) {
          window.location.href = '/profissional/dashboard'
          return
        }
        
        window.location.href = '/cliente/dashboard'
      }
    } catch (error: any) {
      setErro('Email ou senha incorretos')
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
          Agendamentos
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
            Beleza Connect
          </h2>

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

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#d1d5db' }}>
                  Senha
                </label>
                <span style={{ fontSize: '0.75rem', color: '#f472b6', cursor: 'pointer' }}>
                  Esqueceu a senha?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '20px', color: '#6b7280' }} />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
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
              {loading ? <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} /> : <>Entrar <ArrowRight style={{ width: '20px', height: '20px' }} /></>}
            </button>
          </form>

          {/* SEÇÃO: Seja um Cliente */}
          <Link href="/cadastro" style={{ textDecoration: 'none' }}>
            <div style={{
              marginTop: '20px',
              padding: '16px',
              backgroundColor: 'rgba(55, 65, 81, 0.5)',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              border: '1px solid transparent',
              transition: 'all 0.2s'
            }}>
              <p style={{ color: '#fbbf24', fontSize: '0.875rem', fontWeight: '600', marginBottom: '4px' }}>
                seja um cliente
              </p>
              <p style={{ color: '#f472b6', fontSize: '0.875rem', fontWeight: '500' }}>
                Ainda não tem conta?
              </p>
              <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '4px', textDecoration: 'underline' }}>
                Clique aqui para se cadastrar
              </p>
            </div>
          </Link>

          {/* SEÇÃO: Cadastro Profissional (Destaque) */}
          <Link href="/cadastro-profissional" style={{ textDecoration: 'none' }}>
            <div style={{
              marginTop: '12px',
              padding: '16px',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              border: '1px solid rgba(236, 72, 153, 0.5)',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <p style={{ color: '#fbbf24', fontSize: '0.875rem', fontWeight: '600' }}>
                cadastro profissional
              </p>
            </div>
          </Link>

        </div>
      </div>
    </div>
  )
}