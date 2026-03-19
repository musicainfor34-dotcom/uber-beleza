'use client'

import { useEffect, useState } from 'react'
import { MapPin, Navigation, X } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Localizacao {
  latitude: number
  longitude: number
  updated_at: string
}

export default function RastreamentoMapa({ 
  agendamentoId, 
  profissionalId,
  onClose 
}: { 
  agendamentoId: string
  profissionalId: string
  onClose: () => void 
}) {
  const [localizacao, setLocalizacao] = useState<Localizacao | null>(null)
  const [distancia, setDistancia] = useState<string>('Calculando...')
  const [tempoEstimado, setTempoEstimado] = useState<string>('Calculando...')

  useEffect(() => {
    // Busca localização inicial
    fetchLocalizacao()

    // Subscribe em tempo real no Supabase
    const channel = supabase
      .channel(`localizacao:${profissionalId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'localizacao_profissional',
          filter: `profissional_id=eq.${profissionalId}`
        },
        (payload) => {
          console.log('📍 Nova localização recebida:', payload.new)
          const novaLoc = payload.new as Localizacao
          setLocalizacao(novaLoc)
          calcularDistancia(novaLoc)
        }
      )
      .subscribe()

    // Atualiza a cada 10 segundos também (backup)
    const interval = setInterval(fetchLocalizacao, 10000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [profissionalId])

  async function fetchLocalizacao() {
    const { data } = await supabase
      .from('localizacao_profissional')
      .select('*')
      .eq('profissional_id', profissionalId)
      .single()
    
    if (data) {
      setLocalizacao(data)
      calcularDistancia(data)
    }
  }

  function calcularDistancia(loc: Localizacao) {
    // Simulação - em produção usar API de rotas do Google Maps
    // Aqui você pode integrar com a API Directions do Google
    const dist = Math.floor(Math.random() * 8) + 1
    setDistancia(`${dist} km`)
    setTempoEstimado(`${dist * 4} minutos`)
  }

  if (!localizacao) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando localização do profissional...</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 animate-pulse" />
            <div>
              <h3 className="font-bold">Profissional a caminho</h3>
              <p className="text-xs opacity-90">Atualizado em: {new Date(localizacao.updated_at).toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50">
          <div className="bg-white p-3 rounded-xl text-center shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Distância aproximada</p>
            <p className="font-bold text-purple-600 text-lg">{distancia}</p>
          </div>
          <div className="bg-white p-3 rounded-xl text-center shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Tempo estimado</p>
            <p className="font-bold text-purple-600 text-lg">{tempoEstimado}</p>
          </div>
        </div>

        {/* Mapa Google Maps Embed */}
        <div className="h-96 bg-gray-100 relative">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d1000!2d${localizacao.longitude}!3d${localizacao.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1spt-BR!2sbr!4v1`}
            className="grayscale-[20%]"
            allowFullScreen
          />
          
          {/* Pin animado sobreposto */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full pointer-events-none">
            <div className="relative">
              <div className="absolute -inset-4 bg-purple-500/30 rounded-full animate-ping"></div>
              <MapPin className="w-10 h-10 text-purple-600 fill-purple-600 relative z-10 drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Atualizando em tempo real
          </p>
          <button 
            onClick={fetchLocalizacao}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition"
          >
            Atualizar agora
          </button>
        </div>
      </div>
    </div>
  )
}