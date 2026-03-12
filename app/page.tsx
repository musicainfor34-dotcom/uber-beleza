'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function Home() {
  const router = useRouter()
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfissionais()
  }, [])

  const fetchProfissionais = async () => {
    const { data, error } = await supabase
      .from('professionals')
      .select('*, profiles(nome, avatar_url)')
      .eq('ativo', true)
    
    if (data) setProfissionais(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Beleza Connect</h1>
            <p className="text-sm opacity-90">Encontre profissionais de beleza perto de você</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              className="bg-white text-pink-600 hover:bg-gray-100"
              onClick={() => router.push('/cadastro-profissional')}
            >
              Seja um profissional
            </Button>
            <Button variant="secondary" className="bg-white text-pink-600 hover:bg-gray-100">
              Entrar
            </Button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar por especialidade (maquiagem, cabelo...)"
            className="w-full p-4 rounded-lg border shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>

        {loading ? (
          <p className="text-center py-8">Carregando profissionais...</p>
        ) : (
          <div className="grid gap-4">
            {profissionais.map((prof) => (
              <div 
                key={prof.id} 
                onClick={() => router.push(`/profissional/${prof.id}`)}
                className="bg-white p-4 rounded-lg shadow-md border hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {prof.profiles?.nome?.[0] || 'P'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{prof.profiles?.nome}</h3>
                    <p className="text-gray-600 text-sm">{prof.especialidade?.join(', ')}</p>
                    <p className="text-gray-500 text-sm mt-1">{prof.bio || 'Sem descrição'}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-pink-600 font-bold text-lg">R$ {prof.preco_hora}/h</span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-medium">{prof.avaliacao}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation() // Impede que o clique no botão dispare o clique do card 2x
                      router.push(`/profissional/${prof.id}`)
                    }}
                  >
                    Agendar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}