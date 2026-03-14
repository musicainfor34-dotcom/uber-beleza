'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { ArrowLeft, Save } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const especialidades =[
  'Cabelo',
  'Maquiagem', 
  'Manicure',
  'Pedicure',
  'Design de Sobrancelhas',
  'Depilação',
  'Massagem',
  'Outro'
]

export default function PerfilProfissional() {
  const router = useRouter()
  const[loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [message, setMessage] = useState('')
  const [mounted, setMounted] = useState(false)
  
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    cidade: '',
    especialidade: '',
    bio: '',
    preco_hora: '',
    instagram: ''
  })

  useEffect(() => {
    setMounted(true)
    carregarPerfil()
  },[])

  async function carregarPerfil() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (data && !error) {
        const espString = Array.isArray(data.especialidade) 
          ? data.especialidade[0] 
          : data.especialidade || ''

        setForm({
          nome: data.nome || '',
          telefone: data.telefone || '',
          cidade: data.cidade || '',
          especialidade: espString,
          bio: data.bio || '',
          preco_hora: data.preco_hora || '',
          instagram: data.instagram || ''
        })
      }
    } catch (err) {
      console.error('Erro ao carregar perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Não autenticado')

      // Formatação segura do preço (troca vírgula por ponto para não dar erro no banco)
      let parsedPreco = null;
      if (form.preco_hora) {
        const precoFormatado = form.preco_hora.toString().replace(',', '.');
        const precoFloat = parseFloat(precoFormatado);
        if (!isNaN(precoFloat)) {
          parsedPreco = precoFloat;
        }
      }

      const { data, error } = await supabase
        .from('professionals')
        .upsert({
          id: user.id,
          nome: form.nome,
          telefone: form.telefone,
          cidade: form.cidade,
          
          // ATENÇÃO: Se no banco a coluna especialidade for apenas TEXTO (e não Array), 
          // apague os colchetes e deixe apenas: form.especialidade
          especialidade: form.especialidade ? [form.especialidade] :[],
          
          bio: form.bio,
          preco_hora: parsedPreco,
          instagram: form.instagram,
          email: user.email,
          ativo: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) {
        console.error("Erro completo detalhado do Supabase:", error);
        throw error;
      }

      setMessage('✅ Perfil atualizado com sucesso!')
    } catch (error: any) {
      console.error(error);
      setMessage(`❌ Erro ao salvar. Olhe o Console (F12) para ver detalhes do erro: ${error.message}`);
    } finally {
      setSalvando(false)
    }
  }

  if (loading || !mounted) return <div style={{ padding: '40px', textAlign: 'center' }}>Carregando...</div>

  // Variável com o estilo padrão forçando a letra preta e o fundo branco
  const inputStyle = {
    width: '100%',
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    color: '#333',         // <-- Letra escura
    backgroundColor: '#fff' // <-- Fundo branco
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        color: 'white'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <button
            onClick={() => router.push('/profissional/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
          
          <h1 style={{ margin: 0, fontSize: '28px' }}>Meu Perfil Profissional</h1>
          <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
            Configure seus serviços e dados profissionais. O admin verá estas informações.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '30px 20px' }}>
        
        {message && (
          <div style={{
            padding: '15px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: message.includes('✅') ? '#dcfce7' : '#fee2e2',
            color: message.includes('✅') ? '#166534' : '#991b1b'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSalvar} style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          
          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333', borderBottom: '2px solid #667eea', paddingBottom: '10px' }}>
              Informações Básicas
            </h3>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' }}>
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={e => setForm({...form, nome: e.target.value})}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' }}>
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={e => setForm({...form, telefone: e.target.value})}
                    required
                    placeholder="(11) 99999-9999"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' }}>
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={e => setForm({...form, cidade: e.target.value})}
                    required
                    placeholder="São Paulo"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333', borderBottom: '2px solid #667eea', paddingBottom: '10px' }}>
              Especialidade e Serviços *
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' }}>
                Qual sua área de atuação?
              </label>
              <select
                value={form.especialidade}
                onChange={e => setForm({...form, especialidade: e.target.value})}
                required
                style={inputStyle}
              >
                <option value="">Selecione uma especialidade...</option>
                {especialidades.map(esp => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' }}>
                Sobre você (Bio)
              </label>
              <textarea
                value={form.bio}
                onChange={e => setForm({...form, bio: e.target.value})}
                rows={4}
                placeholder="Conte um pouco sobre sua experiência..."
                style={{...inputStyle, resize: 'vertical'}}
              />
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333', borderBottom: '2px solid #667eea', paddingBottom: '10px' }}>
              Valores e Redes Sociais
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' }}>
                  Preço médio (R$)
                </label>
                <input
                  type="text"
                  value={form.preco_hora}
                  onChange={e => setForm({...form, preco_hora: e.target.value})}
                  placeholder="80,00"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#555', fontWeight: '600' }}>
                  Instagram
                </label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={e => setForm({...form, instagram: e.target.value})}
                  placeholder="@seuinstagram"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={salvando}
            style={{
              width: '100%',
              padding: '15px',
              background: salvando ? '#999' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: salvando ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <Save size={20} />
            {salvando ? 'Salvando...' : 'Salvar Perfil Profissional'}
          </button>

          <p style={{ 
            marginTop: '20px', 
            textAlign: 'center', 
            fontSize: '12px', 
            color: '#666' 
          }}>
            💡 Dica: Ao salvar, o admin verá automaticamente seus dados no painel administrativo.
          </p>
        </form>
      </div>
    </div>
  )
}