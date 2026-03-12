'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function CadastroProfissional() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    especialidade: '',
    preco: '',
    bio: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Criar usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Erro ao criar usuário')

      const userId = authData.user.id

      // 2. Criar profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          nome: formData.nome,
          tipo: 'profissional',
          telefone: formData.telefone
        })

      if (profileError) throw profileError

      // 3. Criar professional
      const { error: profError } = await supabase
        .from('professionals')
        .insert({
          id: userId,
          especialidade: formData.especialidade.split(',').map(e => e.trim()),
          bio: formData.bio,
          preco_hora: parseInt(formData.preco),
          ativo: true,
          avaliacao: 5.0
        })

      if (profError) throw profError

      alert('Cadastro realizado com sucesso! Faça login para continuar.')
      router.push('/')
      
    } catch (error: any) {
      alert('Erro no cadastro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Beleza Connect</h1>
            <p className="text-sm opacity-90">Cadastro de Profissional</p>
          </div>
          <Button 
            variant="secondary" 
            className="bg-white text-pink-600 hover:bg-gray-100"
            onClick={() => router.push('/')}
          >
            Voltar
          </Button>
        </div>
      </header>

      {/* Formulário */}
      <main className="max-w-2xl mx-auto p-4 mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Crie sua conta profissional</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input
                type="text"
                required
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                placeholder="Seu nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  required
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                  placeholder="(11) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                placeholder="Mínimo 6 caracteres"
                value={formData.senha}
                onChange={(e) => setFormData({...formData, senha: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidades</label>
                <input
                  type="text"
                  required
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                  placeholder="Maquiagem, Cabelo, Unha"
                  value={formData.especialidade}
                  onChange={(e) => setFormData({...formData, especialidade: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1">Separe por vírgula</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço por hora (R$)</label>
                <input
                  type="number"
                  required
                  min="1"
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                  placeholder="150"
                  value={formData.preco}
                  onChange={(e) => setFormData({...formData, preco: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Descrição</label>
              <textarea
                required
                rows={4}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-gray-900 bg-white"
                placeholder="Fale sobre sua experiência, serviços oferecidos..."
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white py-3 text-lg font-semibold"
              disabled={loading}
            >
              {loading ? 'Cadastrando...' : 'Criar conta profissional'}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Já tem conta?{' '}
              <button type="button" className="text-pink-600 hover:underline font-medium">
                Faça login
              </button>
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}