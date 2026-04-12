'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getStoredUser, saveSession, getToken } from '@/lib/auth'
import type { User } from '@/types'

const SPECIALTIES = [
  'Diseño gráfico',
  'Video & Motion',
  'Fotografía',
  'Social Media',
  'Branding',
  'Desarrollo web',
  'Campaña 360°',
]

export default function PerfilPage() {
  const stored = getStoredUser()
  const [form, setForm] = useState({
    name:        stored?.name        || '',
    phone:       stored?.phone       || '',
    specialty:   stored?.specialty   || '',
    portfolio:   stored?.portfolio   || '',
    isAvailable: stored?.isAvailable ?? true,
  })
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess(false)
    try {
      const updated = await api.patch<User>('/api/users/me', form)
      // Actualizar sesión local con datos nuevos
      const token = getToken()
      if (token) saveSession(token, updated)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cobalt">Mi perfil</h1>
        <p className="text-sm text-gray-500 mt-1">Mantén tu información actualizada</p>
      </div>

      {/* Badge nivel */}
      {stored?.level && (
        <div className="bg-cobalt rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <div className="text-white/40 text-xs uppercase tracking-wider">Tu nivel SAPIENS</div>
            <div className="text-3xl font-black text-white mt-1">{stored.level} <span className="text-base font-normal text-white/50">/ 10</span></div>
          </div>
          <div className="text-right">
            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Especialidad</div>
            <div className="text-white text-sm font-medium">{stored.specialty || '—'}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Disponibilidad */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-cobalt text-sm">Disponible para proyectos</div>
              <div className="text-xs text-gray-400 mt-0.5">Los admins te asignarán según tu disponibilidad</div>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, isAvailable: !f.isAvailable }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${form.isAvailable ? 'bg-green-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isAvailable ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
            Nombre completo
          </label>
          <input
            type="text" required value={form.name} onChange={set('name')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-cobalt focus:outline-none focus:border-cobalt/40"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
            WhatsApp / Teléfono
          </label>
          <input
            type="tel" value={form.phone} onChange={set('phone')}
            placeholder="+57 300 000 0000"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-cobalt placeholder-gray-300 focus:outline-none focus:border-cobalt/40"
          />
        </div>

        {/* Especialidad */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
            Especialidad principal
          </label>
          <select
            value={form.specialty} onChange={set('specialty')}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-cobalt focus:outline-none focus:border-cobalt/40"
          >
            <option value="">Selecciona tu especialidad</option>
            {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Portafolio */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
            URL portafolio / Behance / LinkedIn
          </label>
          <input
            type="url" value={form.portfolio} onChange={set('portfolio')}
            placeholder="https://behance.net/tu-perfil"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-cobalt placeholder-gray-300 focus:outline-none focus:border-cobalt/40"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">{error}</div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium">
            ✓ Perfil actualizado correctamente
          </div>
        )}

        <button
          type="submit" disabled={saving}
          className="w-full bg-cobalt text-white font-semibold py-3 rounded-xl hover:bg-cobalt-mid transition-colors disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
