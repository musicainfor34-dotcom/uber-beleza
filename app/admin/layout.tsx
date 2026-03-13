'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  LayoutDashboard, 
  Users, 
  Scissors, 
  Calendar,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/login')
      return
    }

    // Verificar se é admin (você pode ajustar essa lógica depois)
    // Por enquanto, vamos verificar por email específico ou uma tabela de admins
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/cliente/dashboard') // Redireciona se não for admin
      return
    }

    setUser(session.user)
    setIsAdmin(true)
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!isAdmin) return null

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/profissionais', label: 'Profissionais', icon: Users },
    { href: '/admin/servicos', label: 'Serviços', icon: Scissors },
    { href: '/admin/agendamentos', label: 'Agendamentos', icon: Calendar },
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-gray-800 border-r border-gray-700 flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white">Admin</h1>
          <p className="text-gray-400 text-sm">Painel de Controle</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all"
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-white">Admin</h1>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-300 hover:text-white"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="px-4 pb-4 space-y-2 border-t border-gray-700">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded-xl transition-all"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sair</span>
            </button>
          </nav>
        )}
      </div>

      {/* Content */}
      <main className="flex-1 md:ml-0 mt-16 md:mt-0 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}