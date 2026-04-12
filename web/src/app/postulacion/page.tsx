'use client'
import { useState } from 'react'
import { api } from '@/lib/api'

const ROLES = [
  { value: 'diseñador-grafico',  label: 'Diseñador gráfico' },
  { value: 'video-motion',       label: 'Video & Motion' },
  { value: 'fotografia',         label: 'Fotografía' },
  { value: 'social-media',       label: 'Social Media / Community' },
  { value: 'web',                label: 'Diseño web / UI' },
  { value: 'copywriting',        label: 'Copywriting / Redacción' },
]

const EXPERIENCE = [
  { value: '0-1',  label: 'Menos de 1 año' },
  { value: '1-2',  label: '1 a 2 años' },
  { value: '2-5',  label: '2 a 5 años' },
  { value: '5-10', label: '5 a 10 años' },
  { value: '10+',  label: 'Más de 10 años' },
]

const AVAILABILITY = [
  { value: 'tiempo-completo', label: 'Tiempo completo (40h/sem)' },
  { value: 'medio-tiempo',    label: 'Medio tiempo (20h/sem)' },
  { value: 'freelance',       label: 'Proyectos freelance' },
  { value: 'fines-semana',    label: 'Fines de semana' },
]

type FormData = {
  name: string; email: string; phone: string; city: string
  role: string; experience: string; availability: string
  portfolio: string; motivation: string
}

export default function PostulacionPage() {
  const [form, setForm] = useState<FormData>({
    name: '', email: '', phone: '', city: '',
    role: '', experience: '', availability: '',
    portfolio: '', motivation: '',
  })
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')

  const set = (k: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await api.post('/api/applications', form)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <div className="min-h-screen bg-cobalt flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-6">✓</div>
        <h1 className="text-3xl font-black text-white mb-3">¡Postulación enviada!</h1>
        <p className="text-white/60 mb-8">
          Recibimos tu información. Nuestro equipo la revisará y te contactará en máximo 3 días hábiles.
        </p>
        <a href="/" className="inline-block bg-coral text-white font-semibold px-6 py-3 rounded-xl hover:bg-coral-dark transition-colors">
          Volver al inicio
        </a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cobalt">
      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-white font-bold text-sm tracking-wide">
          SAPIENS <span className="text-coral">COLAB</span>
        </a>
        <a href="/login" className="text-white/40 text-sm hover:text-white transition-colors">
          Ya tengo cuenta
        </a>
      </header>

      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-coral text-xs font-semibold uppercase tracking-widest mb-3">Únete al equipo</p>
          <h1 className="text-4xl font-black text-white mb-4">Trabaja con nosotros</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            SAPIENS COLAB conecta talento creativo con empresas que necesitan resultados reales.
            Si eres bueno en lo que haces, aquí hay proyectos para ti.
          </p>
        </div>

        {/* Pilares de evaluación */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-8">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Así evaluamos a los candidatos</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              ['Experiencia', '20%'], ['Portafolio', '25%'],
              ['Prueba técnica', '25%'], ['Estrategia', '15%'], ['Soft skills', '15%'],
            ].map(([name, pct]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-white/60">{name}</span>
                <span className="text-coral font-semibold">{pct}</span>
              </div>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-3">El resultado determina tu nivel (1–10) y tu rango de pago.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Datos personales */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre completo" required>
              <input type="text" required value={form.name} onChange={set('name')}
                placeholder="Tu nombre" className={inputCls} />
            </Field>
            <Field label="Ciudad" required>
              <input type="text" required value={form.city} onChange={set('city')}
                placeholder="Bucaramanga" className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" required>
              <input type="email" required value={form.email} onChange={set('email')}
                placeholder="tu@email.com" className={inputCls} />
            </Field>
            <Field label="WhatsApp" required>
              <input type="tel" required value={form.phone} onChange={set('phone')}
                placeholder="+57 300 000 0000" className={inputCls} />
            </Field>
          </div>

          {/* Perfil */}
          <Field label="¿En qué te especializas?" required>
            <select required value={form.role} onChange={set('role')} className={selectCls}>
              <option value="">Selecciona tu especialidad</option>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Años de experiencia" required>
              <select required value={form.experience} onChange={set('experience')} className={selectCls}>
                <option value="">Selecciona</option>
                {EXPERIENCE.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </Field>
            <Field label="Disponibilidad" required>
              <select required value={form.availability} onChange={set('availability')} className={selectCls}>
                <option value="">Selecciona</option>
                {AVAILABILITY.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Portafolio / Behance / LinkedIn" required={false}>
            <input type="url" value={form.portfolio} onChange={set('portfolio')}
              placeholder="https://behance.net/tu-perfil" className={inputCls} />
          </Field>

          <Field label="¿Por qué quieres trabajar con SAPIENS COLAB?" required>
            <textarea rows={4} required value={form.motivation} onChange={set('motivation')}
              placeholder="Cuéntanos quién eres, qué tipo de proyectos te apasionan y qué te diferencia..."
              className={`${inputCls} resize-none`} />
          </Field>

          {error && (
            <div className="p-3 bg-coral/10 border border-coral/30 rounded-xl text-coral text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-coral text-white font-bold py-4 rounded-xl hover:bg-coral-dark transition-colors disabled:opacity-60 text-sm">
            {loading ? 'Enviando postulación...' : 'Enviar postulación →'}
          </button>

          <p className="text-white/20 text-xs text-center">
            Tu información es confidencial y solo es usada para el proceso de selección.
          </p>
        </form>
      </div>
    </div>
  )
}

const inputCls  = 'w-full bg-white/6 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-coral/50 text-sm'
const selectCls = 'w-full bg-white/6 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-coral/50 text-sm'

function Field({ label, required = true, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-2">
        {label}{!required && <span className="ml-1 text-white/20">(opcional)</span>}
      </label>
      {children}
    </div>
  )
}
