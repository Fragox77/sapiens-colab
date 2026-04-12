'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getStoredUser, clearSession } from '@/lib/auth'
import type { User } from '@/types'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const u = getStoredUser()
    if (!u) { router.push('/login'); return }
    setUser(u)
  }, [router])

  if (!user) return (
    <div className="min-h-screen bg-cobalt flex items-center justify-center">
      <div className="text-white/40 text-sm">Cargando...</div>
    </div>
  )

  const navItems = {
    cliente:   [{ href: '/cliente',         label: 'Mis proyectos' }, { href: '/cliente/nuevo', label: '+ Nuevo pedido' }],
    disenador: [{ href: '/disenador', label: 'Cola de trabajo' }, { href: '/disenador/financiero', label: 'Mis finanzas' }, { href: '/disenador/perfil', label: 'Mi perfil' }],
    admin:     [{ href: '/admin', label: 'Dashboard' }, { href: '/admin/proyectos', label: 'Proyectos' }, { href: '/admin/financiero', label: 'Finanzas' }, { href: '/admin/postulaciones', label: 'Postulaciones' }],
  }

  const items = navItems[user.role] || []

  return (
    <div className="min-h-screen bg-platinum flex">
      {/* Sidebar */}
      <aside className="w-56 bg-cobalt flex flex-col fixed h-full z-10">
        <div className="px-6 py-5 border-b border-white/8">
          <a href="/" className="block">
            <div className="text-white font-bold text-sm tracking-wide">SAPIENS</div>
            <div className="text-coral text-xs font-medium tracking-widest uppercase">COLAB</div>
          </a>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(item => (
            <a
              key={item.href} href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/8">
          <div className="text-white/70 text-xs font-medium truncate mb-1">{user.name}</div>
          <div className="text-white/30 text-xs capitalize mb-3">{user.role}{user.level ? ` · Nivel ${user.level}` : ''}</div>
          <button
            onClick={() => { clearSession(); router.push('/') }}
            className="text-xs text-white/30 hover:text-coral transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-56 flex-1 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}
