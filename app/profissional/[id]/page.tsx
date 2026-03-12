'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Star, MapPin, Phone, Clock, ArrowLeft, Calendar, X, Scissors, Loader2 } from 'lucide-react'

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
)

interface Servico {
  id: string
  nome: string
  descricao: string
  duracao_minutos: number
  preco_base: number
}

export default function PerfilProfissional() {
  const params = useParams()
  const router = useRouter()
  const [profissional, setProfissional] = useState<any>(null)
  const[loading, setLoading] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [userId, setUserId] = useState<string>('')
  
  // Estados do modal
  const [servicos, setServicos] = useState<Servico[]>([])
  const[servicoSelecionado, setServicoSelecionado] = useState<string>('')
  const[data, setData] = useState<string>('')
  const [horario, setHorario] = useState<string>('')
  const [endereco, setEndereco] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const[referencia, setReferencia] = useState('')
  const [loadingServicos, setLoadingServicos] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    fetchProfissional()
    getUser()
  }, [params.id])

  useEffect(() => {
    if (modalAberto) {
      buscarServicos()
    }
  },[modalAberto])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)
  }

  const fetchProfissional = async () => {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*, profiles(nome, telefone, avatar_url)')
        .eq('id', params.id)
        .single()

      if (error) throw error
      if (data) setProfissional(data)
    } catch (error) {
      console.error('Erro:', error)
    } finally {
      setLoading(false)
    }
  }

  const buscarServicos = async () => {
    setLoadingServicos(true)
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome')
      
      if (error) throw error
      setServicos(data ||[])
    } catch (error) {
      console.error('Erro ao buscar serviços:', error)
    } finally {
      setLoadingServicos(false)
    }
  }

  const horariosDisponiveis = () => {
    const horarios =[]
    for (let hora = 9; hora <= 18; hora++) {
      horarios.push(`${hora.toString().padStart(2, '0')}:00`)
      if (hora !== 18) horarios.push(`${hora.toString().padStart(2, '0')}:30`)
    }
    return horarios
  }

  // FUNÇÃO CORRIGIDA --------------------------------------------------------
  const handleAgendar = () => {
    console.log('Botão Agendar clicado!')
    
    // Verifica se o usuário está logado
    if (!userId) {
      // Adicionamos um alerta visual para você saber que a trava de login funcionou
      alert('Você precisa fazer login para agendar um horário!')
      router.push('/login')
      return
    }
    
    // Se passar da trava do login, abre o modal
    setModalAberto(true)
  }
  // -------------------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingSubmit(true)
    setErro('')

    if (!servicoSelecionado || !data || !horario || !endereco) {
      setErro('Preencha todos os campos obrigatórios')
      setLoadingSubmit(false)
      return
    }

    try {
      const servico = servicos.find(s => s.id === servicoSelecionado)
      if (!servico) throw new Error('Serviço não encontrado')

      const[hora, minuto] = horario.split(':').map(Number)
      const dataInicio = new Date(data)
      dataInicio.setHours(hora, minuto)
      const dataFim = new Date(dataInicio.getTime() + servico.duracao_minutos * 60000)
      const horaFim = `${dataFim.getHours().toString().padStart(2, '0')}:${dataFim.getMinutes().toString().padStart(2, '0')}`

      const { error } = await supabase
        .from('agendamentos')
        .insert({
          cliente_id: userId,
          profissional_id: profissional.id,
          servico_id: servicoSelecionado,
          data_agendamento: data,
          hora_inicio: horario,
          hora_fim: horaFim,
          endereco,
          bairro,
          cidade,
          referencia,
          valor_total: servico.preco_base,
          status: 'pendente'
        })

      if (error) throw error
      
      setSucesso(true)
      setTimeout(() => {
        setModalAberto(false)
        setSucesso(false)
        setServicoSelecionado('')
        setData('')
        setHorario('')
        setEndereco('')
        setBairro('')
        setCidade('')
        setReferencia('')
      }, 2000)
    } catch (error: any) {
      setErro(error.message || 'Erro ao criar agendamento')
    } finally {
      setLoadingSubmit(false)
    }
  }

  const handleWhatsApp = () => {
    const telefone = profissional?.profiles?.telefone || profissional?.telefone
    if (telefone) {
      const mensagem = `Olá ${profissional.profiles?.nome}, encontrei seu perfil no Beleza Connect e gostaria de agendar um horário!`
      window.open(`https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!profissional) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">Profissional não encontrado</p>
          <button onClick={() => router.push('/')} className="px-4 py-2 border rounded-lg">
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/20 rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Perfil do Profissional</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Cover e Avatar */}
          <div className="bg-gradient-to-br from-pink-100 to-purple-100 p-8 text-center">
            <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white">
              {profissional.profiles?.nome?.[0] || 'P'}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mt-4">
              {profissional.profiles?.nome || profissional.nome}
            </h2>
            
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {profissional.especialidade?.map((esp: string, index: number) => (
                <span key={index} className="px-4 py-1 bg-white/80 text-pink-600 rounded-full text-sm font-medium">
                  {esp}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-center gap-1 mt-3">
              {[1,2,3,4,5].map((star) => (
                <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-gray-600 text-sm">(4.8)</span>
            </div>
          </div>

          {/* Informações */}
          <div className="p-6 space-y-6">
            <div className="bg-pink-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor</p>
                <p className="text-3xl font-bold text-pink-600">
                  R$ {profissional.preco_hora || profissional.preco || '0,00'}
                  <span className="text-base font-normal text-gray-500">/hora</span>
                </p>
              </div>
              <Clock className="w-8 h-8 text-pink-400" />
            </div>

            {profissional.bio && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Sobre</h3>
                <p className="text-gray-600">{profissional.bio}</p>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">Informações</h3>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="w-5 h-5 text-pink-500" />
                <span>Atende em domicílio</span>
              </div>
              {(profissional.profiles?.telefone || profissional.telefone) && (
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5 text-pink-500" />
                  <span>{profissional.profiles?.telefone || profissional.telefone}</span>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Serviços</h3>
              <div className="grid grid-cols-2 gap-2">
                {['Corte', 'Coloração', 'Manicure', 'Pedicure', 'Maquiagem', 'Penteado'].map((servico) => (
                  <div key={servico} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                    <span className="text-sm text-gray-700">{servico}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* BOTÕES FIXOS - GARANTIDO VISÍVEIS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
        <div className="max-w-4xl mx-auto flex gap-3">
          {/* WhatsApp */}
          <button 
            onClick={handleWhatsApp}
            className="flex-1 h-14 bg-white border-2 border-green-500 text-green-600 rounded-xl font-bold flex items-center justify-center hover:bg-green-50"
            type="button"
          >
            <WhatsAppIcon />
            <span className="ml-2">WhatsApp</span>
          </button>
          
          {/* AGENDAR - BOTÃO ROXO/ROSA VISÍVEL */}
          <button 
            onClick={handleAgendar}
            className="flex-1 h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl font-bold flex items-center justify-center shadow-lg"
            type="button"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Agendar Horário
          </button>
        </div>
      </div>

      {/* MODAL */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Agendar Serviço</h2>
                <p className="text-sm text-gray-500">com {profissional.profiles?.nome || profissional.nome}</p>
              </div>
              <button onClick={() => setModalAberto(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {sucesso ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Agendamento Confirmado!</h3>
                <p className="text-gray-600">Você receberá uma confirmação em breve.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {erro && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {erro}
                  </div>
                )}

                {/* Serviço */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Scissors className="w-4 h-4" />
                    Serviço *
                  </label>
                  {loadingServicos ? (
                    <div className="flex items-center gap-2 text-gray-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando...
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {servicos.map((servico) => (
                        <label 
                          key={servico.id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer ${servicoSelecionado === servico.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="radio"
                              name="servico"
                              value={servico.id}
                              checked={servicoSelecionado === servico.id}
                              onChange={(e) => setServicoSelecionado(e.target.value)}
                            />
                            <div>
                              <p className="font-medium text-gray-900">{servico.nome}</p>
                              <p className="text-xs text-gray-500">{servico.duracao_minutos} min</p>
                            </div>
                          </div>
                          <span className="font-semibold text-pink-600">
                            R$ {servico.preco_base.toFixed(2)}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Data e Horário */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4" />
                      Data *
                    </label>
                    <input
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4" />
                      Horário *
                    </label>
                    <select
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Selecione</option>
                      {horariosDisponiveis().map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <MapPin className="w-4 h-4" />
                    Endereço *
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, número, apto"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Bairro"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Cidade"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Referência (opcional)"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                {/* Resumo */}
                {servicoSelecionado && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Serviço:</span>
                      <span className="font-medium">{servicos.find(s => s.id === servicoSelecionado)?.nome}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="font-medium text-gray-900">Total:</span>
                      <span className="font-bold text-pink-600 text-lg">
                        R$ {servicos.find(s => s.id === servicoSelecionado)?.preco_base.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Botão */}
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  {loadingSubmit ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Confirmar Agendamento'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}