'use client'
import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'

const ROLES = [
  'Diseñador gráfico',
  'Motion designer',
  'Community manager',
  'Filmmaker / Fotógrafo',
  'Desarrollador web',
  'Otro',
]

const TOOLS = [
  'Figma', 'Illustrator', 'Photoshop',
  'Premiere', 'After Effects', 'Canva',
  'Webflow', 'VS Code', 'Otro',
]

const SOURCES = [
  'Redes sociales',
  'Referido de un amigo',
  'LinkedIn',
  'Búsqueda en Google',
  'WhatsApp',
  'Otro',
]

type FormData = {
  name: string; email: string; phone: string; role: string; city: string
  experienceYears: number; portfolio: string; workDescription: string; tools: string[]
  motivation: string; availability: boolean; source: string
}

const INIT: FormData = {
  name: '', email: '', phone: '', role: '', city: '',
  experienceYears: 0, portfolio: '', workDescription: '', tools: [],
  motivation: '', availability: true, source: '',
}

const inputCls = 'w-full rounded-lg bg-[#1A1F3A] border border-[#2A3050] text-white text-sm px-3 py-2.5 placeholder:text-zinc-600 focus:outline-none focus:border-[#4C58FF] transition-colors'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default function PostulacionPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [form, setForm] = useState<FormData>(INIT)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const toggleTool = (t: string) =>
    set('tools', form.tools.includes(t) ? form.tools.filter(x => x !== t) : [...form.tools, t])

  function validateStep(s: number): boolean {
    const e: typeof errors = {}
    if (s === 1) {
      if (!form.name.trim())  e.name  = 'Requerido'
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido'
      if (!form.phone.trim()) e.phone = 'Requerido'
      if (!form.role)         e.role  = 'Selecciona un rol'
      if (!form.city.trim())  e.city  = 'Requerido'
    }
    if (s === 3 && form.motivation.trim().length < 30)
      e.motivation = 'Mínimo 30 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function next() {
    if (validateStep(step)) setStep(s => (Math.min(3, s + 1)) as 1 | 2 | 3)
  }

  async function submit() {
    if (!validateStep(3)) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await api.post('/api/applications', {
        name: form.name, email: form.email, phone: form.phone,
        role: form.role, city: form.city,
        experienceYears: form.experienceYears,
        portfolio: form.portfolio || null,
        workDescription: form.workDescription || null,
        tools: form.tools,
        motivation: form.motivation,
        availability: form.availability ? 'si' : 'no',
        source: form.source || null,
      })
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-2xl mx-auto mb-5">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">¡Postulación enviada!</h2>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Tu postulación fue recibida. Te contactaremos en máximo 3 días hábiles al
            WhatsApp o email que registraste.
          </p>
          <Link href="/" className="text-[#7280FF] text-sm hover:text-[#9AA8FF] transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  const STEPS = ['Información personal', 'Experiencia', 'Motivación']

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="text-center mb-8">
          <p className="text-xs text-zinc-500 uppercase tracking-[0.3em] mb-1">Sapiens</p>
          <h1 className="text-white text-2xl font-bold">Colab Platform</h1>
          <p className="text-zinc-400 text-sm mt-1">Únete a nuestra red de colaboradores creativos</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  s < step  ? 'bg-[#4C58FF] text-white' :
                  s === step ? 'bg-[#4C58FF]/30 text-[#7280FF] border border-[#4C58FF]/60' :
                               'bg-[#1A1F3A] text-zinc-600 border border-[#2A3050]'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 3 && <div className={`w-10 h-px ${s < step ? 'bg-[#4C58FF]' : 'bg-[#2A3050]'}`} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-[#111525] rounded-2xl border border-[#1E2540] p-6 space-y-5">
          <h2 className="text-white font-semibold">{STEPS[step - 1]}</h2>

          {/* Step 1 */}
          {step === 1 && (
            <>
              <Field label="Nombre completo" error={errors.name}>
                <input
                  className={inputCls}
                  placeholder="Tu nombre completo"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                />
              </Field>
              <Field label="Email" error={errors.email}>
                <input
                  className={inputCls}
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </Field>
              <Field label="Teléfono WhatsApp" error={errors.phone}>
                <input
                  className={inputCls}
                  placeholder="+57 300 000 0000"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                />
              </Field>
              <Field label="Rol al que te postulas" error={errors.role}>
                <select
                  className={inputCls}
                  value={form.role}
                  onChange={e => set('role', e.target.value)}
                >
                  <option value="">Selecciona un rol</option>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Ciudad" error={errors.city}>
                <input
                  className={inputCls}
                  placeholder="Tu ciudad"
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                />
              </Field>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <Field label={`Años de experiencia — ${form.experienceYears} año${form.experienceYears !== 1 ? 's' : ''}`}>
                <input
                  type="range" min={0} max={15}
                  value={form.experienceYears}
                  onChange={e => set('experienceYears', Number(e.target.value))}
                  className="w-full accent-[#4C58FF] mt-1"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                  <span>0</span><span>5</span><span>10</span><span>15</span>
                </div>
              </Field>
              <Field label="Link de portafolio (Behance, Dribbble, web…)">
                <input
                  className={inputCls}
                  placeholder="https://behance.net/tu-perfil"
                  value={form.portfolio}
                  onChange={e => set('portfolio', e.target.value)}
                />
              </Field>
              <Field label={`Descripción breve de tu trabajo (${form.workDescription.length}/300)`}>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  maxLength={300}
                  placeholder="Cuéntanos brevemente en qué tipo de proyectos trabajas..."
                  value={form.workDescription}
                  onChange={e => set('workDescription', e.target.value)}
                />
              </Field>
              <Field label="Herramientas principales">
                <div className="flex flex-wrap gap-2 mt-1">
                  {TOOLS.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTool(t)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        form.tools.includes(t)
                          ? 'bg-[#4C58FF]/30 text-[#7280FF] border-[#4C58FF]/50'
                          : 'bg-[#1A1F3A] text-zinc-500 border-[#2A3050] hover:border-[#4C58FF]/40'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <Field
                label={`¿Por qué quieres unirte a Sapiens Colab? (${form.motivation.length}/500)`}
                error={errors.motivation}
              >
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={5}
                  maxLength={500}
                  placeholder="Cuéntanos sobre ti, tu estilo de trabajo y qué te motiva..."
                  value={form.motivation}
                  onChange={e => set('motivation', e.target.value)}
                />
              </Field>
              <Field label="¿Tienes disponibilidad mínima de 10h/semana?">
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => set('availability', !form.availability)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      form.availability ? 'bg-[#4C58FF]' : 'bg-[#2A3050]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                        form.availability ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-zinc-400 text-sm">
                    {form.availability ? 'Sí, tengo disponibilidad' : 'No por ahora'}
                  </span>
                </div>
              </Field>
              <Field label="¿Cómo nos conociste?">
                <select
                  className={inputCls}
                  value={form.source}
                  onChange={e => set('source', e.target.value)}
                >
                  <option value="">Selecciona una opción</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              {submitError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-red-400 text-sm">
                  {submitError}
                </div>
              )}
            </>
          )}

          {/* Nav buttons */}
          <div className="flex gap-3 pt-1">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
                className="flex-1 rounded-lg border border-[#2A3050] text-zinc-400 hover:text-white text-sm py-2.5 transition-colors"
              >
                ← Atrás
              </button>
            )}
            <button
              type="button"
              onClick={step === 3 ? submit : next}
              disabled={submitting}
              className="flex-1 rounded-lg bg-[#4C58FF] hover:bg-[#3B47F6] disabled:opacity-50 text-white text-sm font-medium py-2.5 transition-colors"
            >
              {step === 3 ? (submitting ? 'Enviando...' : 'Enviar postulación') : 'Siguiente →'}
            </button>
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-5">
          Paso {step} de 3 · Sapiens Colab © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
