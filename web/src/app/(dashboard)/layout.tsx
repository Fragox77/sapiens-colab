'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getStoredUser, clearSession } from '@/lib/auth'
import type { User } from '@/types'
import Sidebar from '@/components/ui/template/Sidebar'
import Navbar from '@/components/ui/template/Navbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const u = getStoredUser()
    if (!u) { router.push('/login'); return }
    setUser(u)
  }, [router])

  useEffect(() => {
    const stored = window.localStorage.getItem('sc_theme')
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored)
      document.documentElement.setAttribute('data-theme', stored)
      return
    }
    const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = preferredDark ? 'dark' : 'light'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      window.localStorage.setItem('sc_theme', next)
      document.documentElement.setAttribute('data-theme', next)
      return next
    })
  }

  if (!user) return (
    <div className="theme-dashboard-shell min-h-screen flex items-center justify-center">
      <div className="theme-dashboard-muted text-sm">Cargando...</div>
    </div>
  )

  return (
    <div className="theme-dashboard-shell relative flex h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.12),_transparent_45%)]" />
      </div>

      <Sidebar
        user={user}
        pathname={pathname}
        onSignOut={() => { clearSession(); router.push('/') }}
      />

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Navbar
          title="SAPIENS COLAB"
          subtitle="Operacion, finanzas y productividad"
          theme={theme}
          onToggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="theme-dashboard-panel mx-auto w-full max-w-[1600px] rounded-2xl border p-6 backdrop-blur">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
