'use client'
import { useState } from 'react'
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
    <div className="min-h-screen bg-cobalt flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Accede a tu cuenta</h1>
          <p className="text-white/40 text-sm">SAPIENS COLAB · Plataforma de proyectos</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-coral/10 border border-coral/30 rounded-lg text-coral text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-2">Email</label>
            <input
              type="email" required value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-coral/50 text-sm"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-2">Contraseña</label>
            <input
              type="password" required value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-coral/50 text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-coral hover:bg-coral-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? 'Ingresando...' : 'Ingresar →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/30">
          ¿No tienes cuenta?{' '}
          <a href="/registro" className="text-coral hover:underline">Regístrate como cliente</a>
        </p>
      </div>
    </div>
  )
}
