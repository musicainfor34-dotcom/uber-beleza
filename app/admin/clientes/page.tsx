'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Mail, Phone, Search, MapPin } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    carregarClientes()
  }, [])

  async function carregarClientes() {
    try {
      // Buscar IDs dos profissionais para excluir
      const { data: profissionais } = await supabase
        .from('professionals')
        .select('id')
      
      const profissionaisIds = profissionais?.map(p => p.id) || []

      // Buscar todos os usuários da tabela profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filtrar apenas clientes (que não são profissionais)
      const clientesFiltrados = (data || []).filter(
        user => !profissionaisIds.includes(user.id)
      )

      setClientes(clientesFiltrados)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  const clientesFiltrados = clientes.filter(cliente => 
    cliente.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(busca.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="flex items-center gap-2 text-pink-400 hover:text-pink-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Clientes Cadastrados</h1>
              <p className="text-gray-400">{clientes.length} cliente(s) no sistema</p>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar cliente por nome ou email..."
              className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 rounded-xl border border-gray-700 focus:border-pink-500 focus:outline-none"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Nenhum cliente encontrado</p>
              <p className="text-sm">Os clientes aparecerão aqui quando se cadastrarem</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientesFiltrados.map((cliente) => (
                <div
                  key={cliente.id}
                  className="flex items-center gap-4 p-4 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                    {cliente.nome?.charAt(0).toUpperCase() || cliente.email?.charAt(0).toUpperCase() || 'C'}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">
                      {cliente.nome || 'Sem nome'}
                    </h3>
                    <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {cliente.email}
                      </span>
                      {cliente.telefone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {cliente.telefone}
                        </span>
                      )}
                      {cliente.cidade && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {cliente.cidade}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge */}
                  <span className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-400 rounded-full text-xs font-medium">
                    Ativo
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}