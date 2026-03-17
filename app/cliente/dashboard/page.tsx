'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Scissors, 
  Sparkles, 
  User,
  Calendar,
  LogOut,
  ChevronRight,
  Heart
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Profissional {
  id: string
  nome: string
  foto_url: string | null
  profissao: string
  especialidades: string[]
  avaliacao: number
  total_avaliacoes: number
  preco_min: number
  distancia?: string
  tempo?: string
}

interface Agendamento {
  id: string
  profissional_nome: string
  servico: string
  data: string
  horario: string
  status: string
  foto_profissional?: string
}

export default function ClienteDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('todos')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    getUser()
    fetchProfissionais()
    fetchAgendamentos()
  }, [])

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
  }

  async function fetchProfissionais() {
    const { data, error } = await supabase
      .from('profissionais')
      .select('*')
      .eq('status', 'ativo')
      .order('avaliacao', { ascending: false })
      .limit(20)

    if (data) {
      // Mock data para visualização se estiver vazio
      const mockData: Profissional[] = data.length > 0 ? data : [
        {
          id: '1',
          nome: 'Ana Beauty',
          foto_url: null,
          profissao: 'Cabeleireira',
          especialidades: ['Coloração', 'Corte', 'Escova'],
          avaliacao: 4.9,
          total_avaliacoes: 127,
          preco_min: 80,
          distancia: '2.5 km',
          tempo: '15 min'
        },
        {
          id: '2',
          nome: 'Carlos Style',
          foto_url: null,
          profissao: 'Barbeiro',
          especialidades: ['Barba', 'Corte Masculino', 'Sobrancelha'],
          avaliacao: 4.8,
          total_avaliacoes: 89,
          preco_min: 50,
          distancia: '4.2 km',
          tempo: '25 min'
        },
        {
          id: '3',
          nome: 'Julia Nail',
          foto_url: null,
          profissao: 'Manicure',
          especialidades: ['Unha Gel', 'Spa dos Pés', 'Nail Art'],
          avaliacao: 5.0,
          total_avaliacoes: 203,
          preco_min: 45,
          distancia: '1.8 km',
          tempo: '10 min'
        }
      ]
      setProfissionais(mockData)
    }
    setLoading(false)
  }

  async function fetchAgendamentos() {
    // Buscar agendamentos do cliente
    const { data: agendamentosData } = await supabase
      .from('agendamentos')
      .select(`
        *,
        profissional:profissional_id(nome, foto_url)
      `)
      .eq('cliente_id', user?.id)
      .gte('data', new Date().toISOString().split('T')[0])
      .order('data', { ascending: true })
      .limit(3)

    if (agendamentosData) {
      setAgendamentos(agendamentosData.map((a: any) => ({
        id: a.id,
        profissional_nome: a.profissional?.nome || 'Profissional',
        servico: a.servico,
        data: new Date(a.data).toLocaleDateString('pt-BR'),
        horario: a.horario,
        status: a.status,
        foto_profissional: a.profissional?.foto_url
      })))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const categorias = [
    { id: 'todos', nome: 'Todos', icon: Sparkles },
    { id: 'cabelo', nome: 'Cabelo', icon: Scissors },
    { id: 'barba', nome: 'Barba', icon: User },
    { id: 'unha', nome: 'Unhas', icon: Sparkles },
    { id: 'maquiagem', nome: 'Make', icon: Sparkles },
    { id: 'estetica', nome: 'Estética', icon: Sparkles },
  ]

  const filteredProfissionais = profissionais.filter(prof => 
    prof.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.profissao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prof.especialidades.some(esp => esp.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header Fixo com Gradiente */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white shadow-lg">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs opacity-90">Bem-vinda(o) de volta 👋</p>
              <h1 className="text-lg font-bold">
                {user?.email?.split('@')[0] || 'Cliente'}
              </h1>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar Flutuante */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar profissionais, serviços..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white text-gray-800 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Categorias Scrolláveis */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categorias.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeTab === cat.id
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-rose-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{cat.nome}</span>
              </button>
            )
          })}
        </div>

        {/* Próximos Agendamentos (se houver) */}
        {agendamentos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Seus Agendamentos</h2>
              <Link href="/cliente/agendamentos" className="text-sm text-rose-500 font-medium">
                Ver todos
              </Link>
            </div>
            
            <div className="space-y-3">
              {agendamentos.map((agend) => (
                <div key={agend.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center text-2xl">
                    {agend.foto_profissional ? (
                      <img src={agend.foto_profissional} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{agend.profissional_nome}</h3>
                    <p className="text-sm text-gray-500">{agend.servico}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-rose-500 font-medium">
                      <Calendar className="w-3 h-3" />
                      {agend.data} às {agend.horario}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    agend.status === 'confirmado' ? 'bg-green-100 text-green-700' :
                    agend.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {agend.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profissionais Disponíveis */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Profissionais Disponíveis</h2>
          
          <div className="grid gap-4">
            {filteredProfissionais.map((prof) => (
              <div 
                key={prof.id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
              >
                <div className="p-4">
                  <div className="flex gap-4">
                    {/* Foto */}
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-3xl overflow-hidden">
                        {prof.foto_url ? (
                          <img src={prof.foto_url} alt={prof.nome} className="w-full h-full object-cover" />
                        ) : (
                          <span>👤</span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                        <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-800 text-lg">{prof.nome}</h3>
                          <p className="text-rose-500 text-sm font-medium">{prof.profissao}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-bold text-gray-700">{prof.avaliacao}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {prof.especialidades.slice(0, 3).map((esp, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {esp}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          {prof.distancia && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {prof.distancia}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {prof.tempo || '30 min'}
                          </span>
                        </div>
                        <span className="font-bold text-gray-800">
                          R$ {prof.preco_min.toFixed(0)}+
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão Agendar */}
                  <Link 
                    href={`/profissional/${prof.id}`}
                    className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all group-hover:scale-[1.02]"
                  >
                    <Calendar className="w-4 h-4" />
                    Agendar Horário
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {filteredProfissionais.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum profissional encontrado</p>
              <p className="text-sm">Tente buscar por outro termo</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 max-w-md mx-auto">
        <div className="flex justify-around items-center">
          <button className="flex flex-col items-center gap-1 text-rose-500">
            <div className="p-2 bg-rose-50 rounded-xl">
              <Search className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Buscar</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
            <div className="p-2 hover:bg-gray-50 rounded-xl transition">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Agenda</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
            <div className="p-2 hover:bg-gray-50 rounded-xl transition">
              <Heart className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Favoritos</span>
          </button>
          
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600">
            <div className="p-2 hover:bg-gray-50 rounded-xl transition">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Perfil</span>
          </button>
        </div>
      </div>

      {/* Safe area para mobile */}
      <div className="h-8"></div>
    </div>
  )
}