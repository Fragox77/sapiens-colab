'use client'
import { useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { saveSession, dashboardPath } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { token, user } = await authApi.login(form.email, form.password)
      saveSession(token, user)
      router.push(dashboardPath(user.role))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0F172A] flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%)]" />
      </div>

      <div className="relative w-full max-w-md bg-white/8 border border-white/15 rounded-2xl p-10 backdrop-blur-xl shadow-[0_20px_50px_rgba(2,8,23,0.45)]">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Accede a tu cuenta</h1>
          <p className="text-slate-300 text-sm">SAPIENS COLAB · Plataforma de proyectos</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-coral/10 border border-coral/30 rounded-lg text-coral text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">Email</label>
            <input
              type="email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-slate-900/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-white/50 text-sm"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">Contraseña</label>
            <input
              type="password" required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-slate-900/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-white/50 text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? 'Ingresando...' : 'Ingresar →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-white hover:underline">Regístrate como cliente</Link>
        </p>
      </div>
    </div>
  )
}
