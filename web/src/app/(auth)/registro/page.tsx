'use client'
import { useState } from 'react'
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
    <div className="min-h-screen bg-cobalt flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Crea tu cuenta</h1>
          <p className="text-white/40 text-sm">Solicita servicios creativos en SAPIENS COLAB</p>
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
              <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-2">{f.label}</label>
              <input
                type={f.type} required={f.required}
                value={form[f.key as keyof typeof form]}
                onChange={set(f.key)}
                className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-coral/50 text-sm"
                placeholder={f.placeholder}
              />
            </div>
          ))}
          <button
            type="submit" disabled={loading}
            className="w-full bg-coral hover:bg-coral-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/30">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-coral hover:underline">Ingresa aquí</a>
        </p>
      </div>
    </div>
  )
}
