'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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
    <div className="relative min-h-screen flex overflow-hidden bg-[#0F172A] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%)]" />
      </div>

      {/* Sidebar */}
      <aside className="w-56 bg-slate-950/65 backdrop-blur-xl border-r border-white/10 flex flex-col fixed h-full z-10">
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/" className="block">
            <div className="text-white font-bold text-sm tracking-wide">SAPIENS</div>
            <div className="text-white/55 text-xs font-medium tracking-widest uppercase">COLAB</div>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map(item => (
            <Link
              key={item.href} href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-white/15 text-white font-medium'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-white/80 text-xs font-medium truncate mb-1">{user.name}</div>
          <div className="text-white/45 text-xs capitalize mb-3">{user.role}{user.level ? ` · Nivel ${user.level}` : ''}</div>
          <button
            onClick={() => { clearSession(); router.push('/') }}
            className="text-xs text-white/45 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="relative ml-56 flex-1 p-6 min-h-screen lg:p-8">
        <div className="min-h-[calc(100vh-3rem)] rounded-2xl border border-white/20 bg-slate-50/95 p-5 shadow-[0_20px_60px_rgba(2,8,23,0.32)] backdrop-blur-md lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
