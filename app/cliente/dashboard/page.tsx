'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Scissors, 
  Paintbrush,
  Sparkles,
  Gem,
  Star,
  MapPin,
  LogOut,
  ArrowRight,
  ChevronRight,
  Clock
} from 'lucide-react'

export default function ClienteDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [servicoSelecionado, setServicoSelecionado] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const servicos = [
    {
      id: 'cabelo',
      nome: 'Cabelo',
      descricao: 'Corte, coloração, hidratação',
      cor: 'from-yellow-400 to-orange-500',
      bgIcon: 'bg-yellow-400',
      textColor: 'text-yellow-400',
      icon: Scissors,
      profissionais: 8,
      preco: 'R$ 50'
    },
    {
      id: 'maquiagem',
      nome: 'Maquiagem',
      descricao: 'Social, festa e noiva',
      cor: 'from-pink-400 to-rose-500',
      bgIcon: 'bg-pink-400',
      textColor: 'text-pink-400',
      icon: Paintbrush,
      profissionais: 6,
      preco: 'R$ 120'
    },
    {
      id: 'manicure',
      nome: 'Manicure',
      descricao: 'Esmaltação e nail art',
      cor: 'from-red-400 to-pink-500',
      bgIcon: 'bg-red-400',
      textColor: 'text-red-400',
      icon: Sparkles,
      profissionais: 10,
      preco: 'R$ 35'
    },
    {
      id: 'pedicure',
      nome: 'Pedicure',
      descricao: 'Spa dos pés e cuidados',
      cor: 'from-purple-400 to-violet-500',
      bgIcon: 'bg-purple-400',
      textColor: 'text-purple-400',
      icon: Gem,
      profissionais: 8,
      preco: 'R$ 40'
    }
  ]

  const profissionaisPorServico: Record<string, any[]> = {
    'cabelo': [
      { id: 1, nome: 'Sandra Lima', avaliacao: 4.9, preco: 'R$ 80', foto: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&h=200&fit=crop', online: true },
      { id: 2, nome: 'Carlos Mendes', avaliacao: 4.8, preco: 'R$ 60', foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', online: true },
      { id: 3, nome: 'Ana Paula', avaliacao: 5.0, preco: 'R$ 100', foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', online: false },
    ],
    'maquiagem': [
      { id: 4, nome: 'Helena Costa', avaliacao: 4.9, preco: 'R$ 150', foto: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=200&h=200&fit=crop', online: true },
      { id: 5, nome: 'Julia Santos', avaliacao: 4.8, preco: 'R$ 120', foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', online: true },
    ],
    'manicure': [
      { id: 6, nome: 'Fernanda Dias', avaliacao: 4.9, preco: 'R$ 40', foto: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&h=200&fit=crop', online: true },
      { id: 7, nome: 'Patricia Lima', avaliacao: 4.7, preco: 'R$ 35', foto: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop', online: true },
    ],
    'pedicure': [
      { id: 8, nome: 'Roberta Souza', avaliacao: 4.8, preco: 'R$ 45', foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop', online: false },
      { id: 9, nome: 'Daniela Rocha', avaliacao: 4.9, preco: 'R$ 50', foto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop', online: true },
    ]
  }

  const profissionaisAtuais = servicoSelecionado ? (profissionaisPorServico[servicoSelecionado] || []) : []

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 md:bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 md:border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 md:bg-gray-50">
      {/* ===== MOBILE LAYOUT (< md) ===== */}
      <div className="md:hidden flex flex-col min-h-screen pb-20">
        <header className="p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Serviços</h1>
            <p className="text-slate-400 text-sm">Escolha uma categoria</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white">
              <LogOut className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
              <span className="text-slate-900 font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {!servicoSelecionado ? (
          <main className="flex-1 px-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              {servicos.map((servico) => (
                <button
                  key={servico.id}
                  onClick={() => setServicoSelecionado(servico.id)}
                  className="aspect-square bg-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform border border-slate-700 hover:border-slate-600"
                >
                  <div className={`w-16 h-16 rounded-2xl ${servico.bgIcon} bg-opacity-20 flex items-center justify-center`}>
                    <servico.icon className={`w-8 h-8 ${servico.textColor}`} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-white font-bold text-lg">{servico.nome}</h3>
                    <p className="text-slate-400 text-xs mt-1">{servico.profissionais} profissionais</p>
                  </div>
                </button>
              ))}
            </div>
          </main>
        ) : (
          <main className="flex-1 px-4 py-2">
            <button 
              onClick={() => setServicoSelecionado(null)}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-4"
            >
              <ArrowRight className="w-5 h-5 rotate-180" />
              <span>Voltar</span>
            </button>

            {(() => {
              const servico = servicos.find(s => s.id === servicoSelecionado)
              if (!servico) return null
              return (
                <div className="bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-700">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl ${servico.bgIcon} bg-opacity-20 flex items-center justify-center`}>
                      <servico.icon className={`w-7 h-7 ${servico.textColor}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{servico.nome}</h2>
                      <p className="text-slate-400 text-sm">{servico.profissionais} disponíveis</p>
                    </div>
                  </div>
                </div>
              )
            })()}

            <div className="space-y-3">
              {profissionaisAtuais.map((prof) => (
                <div 
                  key={prof.id}
                  onClick={() => router.push(`/agendar/${prof.id}?servico=${servicoSelecionado}`)}
                  className="bg-slate-800 rounded-2xl p-4 border border-slate-700 active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={prof.foto} alt={prof.nome} className="w-14 h-14 rounded-xl object-cover" />
                      {prof.online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{prof.nome}</h4>
                      <div className="flex items-center gap-1 text-sm text-slate-400">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span>{prof.avaliacao}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-lg font-bold text-white">{prof.preco}</span>
                      <button className="mt-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 text-xs font-bold rounded-lg">
                        Agendar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}
      </div>

      {/* ===== DESKTOP LAYOUT (>= md) ===== */}
      <div className="hidden md:flex h-screen">
        <aside className="w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Serviços</h1>
                <p className="text-sm text-gray-500">Escolha o serviço desejado</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500">
                  <LogOut className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {servicos.map((servico) => (
              <button
                key={servico.id}
                onClick={() => setServicoSelecionado(servico.id)}
                className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                  servicoSelecionado === servico.id 
                    ? 'border-pink-400 bg-pink-50' 
                    : 'border-gray-100 bg-white hover:border-pink-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-1 h-12 rounded-full bg-gradient-to-b ${servico.cor}`}></div>
                  
                  <div className={`w-12 h-12 rounded-xl ${servico.bgIcon} bg-opacity-10 flex items-center justify-center`}>
                    <servico.icon className={`w-6 h-6 ${servico.textColor}`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${servicoSelecionado === servico.id ? 'text-pink-600' : 'text-gray-800'}`}>
                      {servico.nome}
                    </h3>
                    <p className="text-sm text-gray-500">{servico.descricao}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <span className="text-green-600 font-medium">{servico.profissionais} profissionais</span>
                      <span>•</span>
                      <span>A partir de {servico.preco}</span>
                    </div>
                  </div>

                  <ChevronRight className={`w-5 h-5 ${servicoSelecionado === servico.id ? 'text-pink-400' : 'text-gray-300'}`} />
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 bg-gray-50 p-8 overflow-y-auto">
          {!servicoSelecionado ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Scissors className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Escolha um serviço</h2>
              <p className="text-gray-500 max-w-md">
                Selecione uma categoria à esquerda para visualizar os profissionais disponíveis e agendar seu horário.
              </p>
            </div>
          ) : (
            <div className="max-w-4xl">
              {(() => {
                const servico = servicos.find(s => s.id === servicoSelecionado)
                if (!servico) return null
                return (
                  <div className="mb-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-16 h-16 rounded-2xl ${servico.bgIcon} bg-opacity-10 flex items-center justify-center`}>
                        <servico.icon className={`w-8 h-8 ${servico.textColor}`} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-800">{servico.nome}</h2>
                        <p className="text-gray-500">{servico.profissionais} profissionais disponíveis</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {profissionaisAtuais.map((prof) => (
                        <div 
                          key={prof.id}
                          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => router.push(`/agendar/${prof.id}?servico=${servicoSelecionado}`)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative">
                              <img src={prof.foto} alt={prof.nome} className="w-20 h-20 rounded-2xl object-cover" />
                              {prof.online && (
                                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-bold text-xl text-gray-800 group-hover:text-pink-600 transition-colors">{prof.nome}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="font-medium text-gray-700">{prof.avaliacao}</span>
                                    <span className="text-gray-400 text-sm">(128 avaliações)</span>
                                  </div>
                                </div>
                                <span className="text-2xl font-bold text-gray-800">{prof.preco}</span>
                              </div>
                              
                              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4 text-green-500" />
                                  2.3 km de distância
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4 text-blue-500" />
                                  Disponível hoje
                                </span>
                              </div>

                              <button className="mt-4 w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity">
                                Agendar Horário
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}