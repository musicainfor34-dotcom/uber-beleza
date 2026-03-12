'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X, Calendar, Clock, MapPin, Scissors, Loader2 } from 'lucide-react'

interface Servico {
  id: string
  nome: string
  descricao: string
  duracao_minutos: number
  preco_base: number
}

interface ModalAgendamentoProps {
  isOpen: boolean
  onClose: () => void
  profissionalId: string
  profissionalNome: string
  userId: string
}

export default function ModalAgendamento({ 
  isOpen, 
  onClose, 
  profissionalId, 
  profissionalNome,
  userId 
}: ModalAgendamentoProps) {
  const [servicos, setServicos] = useState<Servico[]>([])
  const [servicoSelecionado, setServicoSelecionado] = useState<string>('')
  const [data, setData] = useState<string>('')
  const [horario, setHorario] = useState<string>('')
  const [endereco, setEndereco] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [referencia, setReferencia] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingServicos, setLoadingServicos] = useState(true)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  useEffect(() => {
    if (isOpen) {
      buscarServicos()
    }
  }, [isOpen])

  const buscarServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('*')
        .order('nome')
      
      if (error) throw error
      setServicos(data || [])
    } catch (error) {
      console.error('Erro ao buscar serviços:', error)
    } finally {
      setLoadingServicos(false)
    }
  }

  const horariosDisponiveis = () => {
    const horarios = []
    for (let hora = 9; hora <= 18; hora++) {
      horarios.push(`${hora.toString().padStart(2, '0')}:00`)
      if (hora !== 18) horarios.push(`${hora.toString().padStart(2, '0')}:30`)
    }
    return horarios
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')

    if (!servicoSelecionado || !data || !horario || !endereco) {
      setErro('Preencha todos os campos obrigatórios')
      setLoading(false)
      return
    }

    try {
      const servico = servicos.find(s => s.id === servicoSelecionado)
      if (!servico) throw new Error('Serviço não encontrado')

      const [hora, minuto] = horario.split(':').map(Number)
      const dataInicio = new Date(data)
      dataInicio.setHours(hora, minuto)
      const dataFim = new Date(dataInicio.getTime() + servico.duracao_minutos * 60000)
      const horaFim = `${dataFim.getHours().toString().padStart(2, '0')}:${dataFim.getMinutes().toString().padStart(2, '0')}`

      const { error } = await supabase
        .from('agendamentos')
        .insert({
          cliente_id: userId,
          profissional_id: profissionalId,
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
        onClose()
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
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Agendar Serviço</h2>
            <p className="text-sm text-gray-500">com {profissionalNome}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
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
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                        servicoSelecionado === servico.id 
                          ? 'border-pink-500 bg-pink-50' 
                          : 'border-gray-200 hover:border-pink-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="servico"
                          value={servico.id}
                          checked={servicoSelecionado === servico.id}
                          onChange={(e) => setServicoSelecionado(e.target.value)}
                          className="mt-1 text-pink-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
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
                Endereço do Atendimento *
              </label>
              
              <input
                type="text"
                placeholder="Rua, número, apto"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
              
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Bairro"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <input
                type="text"
                placeholder="Ponto de referência (opcional)"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            {/* Resumo */}
            {servicoSelecionado && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Serviço:</span>
                  <span className="font-medium">
                    {servicos.find(s => s.id === servicoSelecionado)?.nome}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duração:</span>
                  <span className="font-medium">
                    {servicos.find(s => s.id === servicoSelecionado)?.duracao_minutos} min
                  </span>
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
              disabled={loading}
              className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
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
  )
}