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

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#0F172A] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%)]" />
      </div>

      <Sidebar
        user={user}
        pathname={pathname}
        onSignOut={() => { clearSession(); router.push('/') }}
      />

      <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
        <Navbar title="SAPIENS COLAB" subtitle="Operacion, finanzas y productividad" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto w-full max-w-[1600px] rounded-2xl border border-[#2A3352] bg-[linear-gradient(180deg,#141A2E_0%,#101525_100%)] p-6 text-slate-100 shadow-[0_30px_90px_rgba(2,6,23,0.55)] backdrop-blur">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
