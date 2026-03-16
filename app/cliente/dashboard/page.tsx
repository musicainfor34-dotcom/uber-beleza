'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { 
  Scissors, 
  Paintbrush,
  Sparkles,
  Gem,
  Star,
  LogOut,
  ArrowLeft,
  Loader2,
  MessageCircle,
  MapPin,
  ChevronRight
} from 'lucide-react'
import ChatModal from '@/app/dashboard/ChatModal'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function ClienteDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [servicoSelecionado, setServicoSelecionado] = useState<string | null>(null)
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [loadingProfissionais, setLoadingProfissionais] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user?.id) {
      fetchUnreadCount()
      const subscription = supabase
        .channel(`chat-client:${user.id}`)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'conversations', filter: `client_id=eq.${user.id}` },
          () => fetchUnreadCount()
        )
        .subscribe()
      return () => { supabase.removeChannel(subscription) }
    }
  }, [user])

  async function fetchUnreadCount() {
    if (!user?.id) return
    const { count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', user.id)
      .eq('unread_client', true)
    if (count !== null) setUnreadCount(count)
  }

  useEffect(() => {
    if (servicoSelecionado) buscarProfissionais(servicoSelecionado)
  }, [servicoSelecionado])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { 
      router.push('/login')
      return 
    }
    setUser(session.user)
    setLoading(false)
  }

  async function buscarProfissionais(especialidade: string) {
    setLoadingProfissionais(true)
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      const filtrados = (data || []).filter((prof: any) => {
        const especs = prof.especialidade || []
        return especs.some((esp: string) => 
          esp.toLowerCase() === especialidade.toLowerCase()
        )
      })

      setProfissionais(filtrados)
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error)
    } finally {
      setLoadingProfissionais(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const servicos = [
    {
      id: 'Cabelo',
      nome: 'Cabelo',
      descricao: 'Corte, coloração, hidratação',
      gradient: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-400',
      textColor: 'text-yellow-400',
      icon: Scissors
    },
    {
      id: 'Maquiagem',
      nome: 'Maquiagem',
      descricao: 'Social, festa e noiva',
      gradient: 'from-pink-400 to-rose-500',
      bgColor: 'bg-pink-400',
      textColor: 'text-pink-400',
      icon: Paintbrush
    },
    {
      id: 'Manicure',
      nome: 'Manicure',
      descricao: 'Esmaltação e nail art',
      gradient: 'from-red-400 to-pink-500',
      bgColor: 'bg-red-400',
      textColor: 'text-red-400',
      icon: Sparkles
    },
    {
      id: 'Pedicure',
      nome: 'Pedicure',
      descricao: 'Spa dos pés e cuidados',
      gradient: 'from-purple-400 to-violet-500',
      bgColor: 'bg-purple-400',
      textColor: 'text-purple-400',
      icon: Gem
    }
  ]

  const servicoAtual = servicos.find(s => s.id === servicoSelecionado)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-20">
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-slate-900 sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-white">Serviços</h1>
          <p className="text-slate-400 text-sm">Escolha uma categoria</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Botão de Chat */}
          <button 
            onClick={() => setIsChatOpen(true)}
            className="relative p-2 text-slate-400 hover:text-white transition-colors"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Botão de Logout */}
          <button 
            onClick={handleLogout} 
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
          
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <span className="text-slate-900 font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="px-4 py-2">
        {!servicoSelecionado ? (
          /* Grid de Serviços 2x2 */
          <div className="grid grid-cols-2 gap-4">
            {servicos.map((servico) => (
              <button
                key={servico.id}
                onClick={() => setServicoSelecionado(servico.id)}
                className="aspect-square bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-slate-700 hover:border-slate-600 shadow-lg"
              >
                <div className={`w-16 h-16 rounded-2xl ${servico.bgColor} bg-opacity-20 flex items-center justify-center`}>
                  <servico.icon className={`w-8 h-8 ${servico.textColor}`} />
                </div>
                <div className="text-center">
                  <h3 className="text-white font-bold text-lg">{servico.nome}</h3>
                  <p className="text-slate-400 text-xs mt-1">Ver profissionais</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          /* Lista de Profissionais */
          <div className="space-y-4">
            {/* Botão Voltar */}
            <button 
              onClick={() => setServicoSelecionado(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </button>

            {/* Card do Serviço Selecionado */}
            {servicoAtual && (
              <div className="bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-700 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl ${servicoAtual.bgColor} bg-opacity-20 flex items-center justify-center`}>
                    <servicoAtual.icon className={`w-7 h-7 ${servicoAtual.textColor}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{servicoAtual.nome}</h2>
                    <p className="text-slate-400 text-sm">
                      {loadingProfissionais ? 'Carregando...' : `${profissionais.length} profissionais`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Lista de Profissionais */}
            {loadingProfissionais ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
              </div>
            ) : profissionais.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-800 rounded-2xl border border-slate-700">
                <p>Nenhum profissional disponível para esta categoria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {profissionais.map((prof) => (
                  <div 
                    key={prof.id}
                    onClick={() => router.push(`/profissional/${prof.id}`)}
                    className="bg-slate-800 rounded-2xl p-4 border border-slate-700 active:scale-95 transition-transform shadow-lg cursor-pointer hover:border-slate-600"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar do Profissional */}
                      <div className="relative">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                          {prof.nome?.charAt(0).toUpperCase() || 'P'}
                        </div>
                        {prof.ativo && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-lg">{prof.nome}</h4>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span>{prof.avaliacao || 5.0}</span>
                          <span className="mx-1">•</span>
                          <MapPin className="w-3 h-3" />
                          <span className="text-xs">{prof.cidade || 'Sem cidade'}</span>
                        </div>
                      </div>
                      
                      {/* Preço e Seta */}
                      <div className="text-right">
                        <span className="block text-lg font-bold text-white">
                          R$ {prof.preco_hora || '0'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-slate-400 mt-1 ml-auto" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Chat Modal */}
      <ChatModal 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        userId={user?.id}
        userType="client"
      />
    </div>
  )
}