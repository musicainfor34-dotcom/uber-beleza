'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, Check, User, Phone, Star, MapPin, Scissors, Sparkles } from 'lucide-react'

export default function AgendarPage() {
  const params = useParams()
  const router = useRouter()
  const [profissional, setProfissional] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [step, setStep] = useState(1)
  const [clienteNome, setClienteNome] = useState('')
  const [clienteTelefone, setClienteTelefone] = useState('')
  const [agendando, setAgendando] = useState(false)

  const getNextDays = () => {
    const days = []
    const today = new Date()
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: weekDays[date.getDay()],
        dayNumber: date.getDate(),
        fullDate: date
      })
    }
    return days
  }

  const horarios = [
    { periodo: 'Manhã', horas: ['08:00', '09:00', '10:00', '11:00'] },
    { periodo: 'Tarde', horas: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] },
    { periodo: 'Noite', horas: ['19:00', '20:00'] }
  ]

  useEffect(() => {
    fetchProfissional()
  }, [params.id])

  const fetchProfissional = async () => {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*, profiles(nome, telefone, avatar_url, bio)')
        .eq('id', params.id)
        .single()

      if (data) setProfissional(data)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmar = async () => {
    setAgendando(true)
    setTimeout(() => {
      alert(`✨ Agendamento confirmado!\n\nProfissional: ${profissional.profiles?.nome}\nData: ${new Date(selectedDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}\nHorário: ${selectedTime}\n\nEm breve você receberá uma confirmação!`)
      router.push('/')
    }, 1500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
          <Sparkles className="w-6 h-6 text-pink-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    )
  }

  const days = getNextDays()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Moderno */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center gap-3">
          <button 
            onClick={() => step === 1 ? router.back() : setStep(1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="font-bold text-gray-800 text-lg">Agendar</h1>
            <p className="text-xs text-gray-500">{profissional?.profiles?.nome}</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100 w-full">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>
      </div>

      <main className="max-w-lg mx-auto pb-32">
        {step === 1 ? (
          <div className="animate-in slide-in-from-right duration-300">
            {/* Card Profissional Destaque */}
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
              
              <div className="relative flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-bold border-2 border-white/30">
                  {profissional?.profiles?.nome?.[0] || 'P'}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-xl">{profissional?.profiles?.nome}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-white/80">(4.9)</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">R${profissional?.preco_hora}</p>
                  <p className="text-xs text-white/70">por hora</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-2 text-sm text-white/90">
                <MapPin className="w-4 h-4" />
                <span>Atende em domicílio • 2km de você</span>
              </div>
            </div>

            <div className="p-4 space-y-8">
              {/* Seletor de Data */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-pink-500" />
                    Escolha a data
                  </h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Próximos 7 dias</span>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {days.map((day) => {
                    const isSelected = selectedDate === day.date
                    const isToday = day.dayNumber === new Date().getDate()
                    
                    return (
                      <button
                        key={day.date}
                        onClick={() => setSelectedDate(day.date)}
                        className={`flex-shrink-0 w-[72px] h-24 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 border-2 ${
                          isSelected 
                            ? 'bg-gradient-to-br from-pink-500 to-purple-600 border-transparent text-white shadow-lg shadow-pink-500/30 scale-105' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-pink-300 hover:shadow-md'
                        }`}
                      >
                        <span className={`text-[10px] font-medium uppercase ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                          {day.dayName}
                        </span>
                        <span className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                          {day.dayNumber}
                        </span>
                        {isToday && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-pink-100 text-pink-600'}`}>
                            Hoje
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>

              {/* Seletor de Horário */}
              {selectedDate && (
                <section className="animate-in slide-in-from-bottom-4 duration-300">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-purple-500" />
                    Escolha o horário
                  </h3>
                  
                  <div className="space-y-4">
                    {horarios.map(({ periodo, horas }) => (
                      <div key={periodo}>
                        <p className="text-sm font-medium text-gray-500 mb-3 ml-1">{periodo}</p>
                        <div className="grid grid-cols-4 gap-2">
                          {horas.map((hora) => {
                            const isSelected = selectedTime === hora
                            return (
                              <button
                                key={hora}
                                onClick={() => setSelectedTime(hora)}
                                className={`py-3 px-2 rounded-xl font-semibold text-sm transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-gray-800 text-white shadow-lg transform scale-105'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400 hover:shadow-md'
                                }`}
                              >
                                {hora}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Resumo Seleção */}
              {selectedDate && selectedTime && (
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-5 border border-pink-200 animate-in zoom-in duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Seu agendamento</p>
                      <p className="font-bold text-gray-800">
                        {new Date(selectedDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-pink-600 font-semibold bg-white/50 rounded-lg p-2">
                    <Clock className="w-4 h-4" />
                    {selectedTime}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Step 2 - Confirmação */
          <div className="min-h-screen bg-white animate-in slide-in-from-right duration-300">
            {/* Header Step 2 - CORRIGIDO */}
            <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
              
              <div className="relative">
                <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30">
                  <Scissors className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Quase pronto!</h2>
                <p className="text-white/80">Complete seus dados abaixo</p>
              </div>
            </div>

            <div className="p-6 space-y-6 -mt-4 bg-white rounded-t-3xl relative">
              {/* Card Resumo */}
              <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
                <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                  <span className="text-gray-500 text-sm">Profissional</span>
                  <span className="font-semibold text-gray-800">{profissional?.profiles?.nome}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Data</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(selectedDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Horário</span>
                  <span className="font-semibold text-gray-800">{selectedTime}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="text-gray-500 text-sm">Total</span>
                  <span className="font-bold text-xl text-pink-600">R$ {profissional?.preco_hora}</span>
                </div>
              </div>

              {/* Formulário */}
              <div className="space-y-4">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-pink-500" />
                    Seu nome completo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:bg-white transition-all outline-none text-gray-800 font-medium placeholder:text-gray-400"
                      placeholder="Digite seu nome"
                    />
                    {clienteNome && <Check className="w-5 h-5 text-green-500 absolute right-4 top-1/2 -translate-y-1/2" />}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-500" />
                    WhatsApp
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={clienteTelefone}
                      onChange={(e) => setClienteTelefone(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:bg-white transition-all outline-none text-gray-800 font-medium placeholder:text-gray-400"
                      placeholder="(99) 99999-9999"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2 ml-1">Você receberá a confirmação por WhatsApp</p>
                </div>
              </div>

              <button 
                onClick={() => setStep(1)}
                className="w-full text-center text-gray-400 text-sm py-2 hover:text-gray-600 transition-colors"
              >
                ← Voltar para alterar data
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Botão Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-lg mx-auto">
          {step === 1 ? (
            <Button 
              className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl text-lg font-bold shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95"
              disabled={!selectedDate || !selectedTime}
              onClick={() => setStep(2)}
            >
              Continuar
              <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
            </Button>
          ) : (
            <div className="space-y-3">
              <Button 
                className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-2xl text-lg font-bold shadow-xl shadow-pink-500/30 disabled:opacity-50 transition-all transform active:scale-95"
                disabled={!clienteNome || !clienteTelefone || agendando}
                onClick={handleConfirmar}
              >
                {agendando ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Confirmando...
                  </span>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}