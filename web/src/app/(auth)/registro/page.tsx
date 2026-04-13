'use client'
import { useState } from 'react'
import Link from 'next/link'
import { authApi } from '@/lib/api'
import { saveSession, dashboardPath } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function RegistroPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', phone: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { token, user } = await authApi.register(form)
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
          <h1 className="text-2xl font-bold text-white mb-1">Crea tu cuenta</h1>
          <p className="text-slate-300 text-sm">Solicita servicios creativos en SAPIENS COLAB</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-coral/10 border border-coral/30 rounded-lg text-coral text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name',     label: 'Nombre completo', type: 'text',     placeholder: 'Tu nombre', required: true },
            { key: 'email',    label: 'Email',            type: 'email',    placeholder: 'tu@email.com', required: true },
            { key: 'password', label: 'Contraseña',       type: 'password', placeholder: 'Mínimo 6 caracteres', required: true },
            { key: 'company',  label: 'Empresa (opcional)', type: 'text',   placeholder: 'Nombre de tu empresa' },
            { key: 'phone',    label: 'WhatsApp / Teléfono', type: 'tel',   placeholder: '+57 300 000 0000' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium uppercase tracking-wider text-slate-300 mb-2">{f.label}</label>
              <input
                type={f.type} required={f.required}
                value={form[f.key as keyof typeof form]}
                onChange={set(f.key)}
                className="w-full bg-slate-900/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-white/50 text-sm"
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <button
            type="submit" disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-white hover:underline">Ingresa aquí</Link>
        </p>
      </div>
    </div>
  )
}
