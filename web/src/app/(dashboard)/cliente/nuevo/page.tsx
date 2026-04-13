'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { quotesApi, projectsApi } from '@/lib/api'
import type { ServiceType, Complexity, Urgency, QuoteResult } from '@/types'

// ─── Datos de servicios fallback (si falla catalogo v1) ───────────────────
const SERVICES_FALLBACK: { id: ServiceType; name: string; tag: string; base: number; icon: string }[] = [
  { id: 'branding',     name: 'Identidad de marca',       tag: 'Branding',      base: 850000,  icon: '✦' },
  { id: 'piezas',       name: 'Piezas y materiales',      tag: 'Diseño gráfico', base: 320000,  icon: '◈' },
  { id: 'video-motion', name: 'Reels y animaciones',      tag: 'Video & Motion', base: 480000,  icon: '▶' },
  { id: 'fotografia',   name: 'Foto de producto y marca', tag: 'Fotografía',    base: 600000,  icon: '⊙' },
  { id: 'social-media', name: 'Community management',     tag: 'Social Media',  base: 750000,  icon: '◎' },
  { id: 'web',          name: 'Desarrollo web',           tag: 'Web',           base: 1400000, icon: '◻' },
  { id: 'campana',      name: 'Campaña publicitaria 360°',tag: 'Campaña',       base: 3000000, icon: '◉' },
]

const COMPLEXITY: { value: Complexity; label: string; desc: string }[] = [
  { value: 'basica',   label: 'Básica',   desc: 'Alcance simple, referencias claras' },
  { value: 'media',    label: 'Media',    desc: 'Proyecto estándar con iteraciones' },
  { value: 'avanzada', label: 'Avanzada', desc: 'Alta exigencia, múltiples versiones' },
]

const URGENCY: { value: Urgency; label: string; desc: string; mult: string }[] = [
  { value: 'normal',      label: 'Normal',      desc: 'Tiempos estándar del servicio', mult: '' },
  { value: 'prioritario', label: 'Prioritario', desc: 'Prioridad alta en la cola',     mult: '+25%' },
  { value: 'express',     label: 'Express',     desc: 'Máxima urgencia',               mult: '+50%' },
]

const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`

// ─── Steps ────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3

export default function NuevoPedidoPage() {
  const router = useRouter()

  const [step, setStep]             = useState<Step>(1)
  const [services, setServices]     = useState(SERVICES_FALLBACK)
  const [service, setService]       = useState<ServiceType | null>(null)
  const [complexity, setComplexity] = useState<Complexity>('media')
  const [urgency, setUrgency]       = useState<Urgency>('normal')
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [format, setFormat]         = useState('')
  const [quote, setQuote]           = useState<QuoteResult | null>(null)
  const [loadingQuote, setLoadingQuote] = useState(false)
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    async function loadCatalog() {
      try {
        const catalog = await quotesApi.catalogV1()
        const merged = catalog.services
          .map((item) => {
            const fallback = SERVICES_FALLBACK.find((f) => f.id === item.id)
            if (!fallback) return null
            return {
              ...fallback,
              name: item.name,
              tag: item.tag,
              base: item.base,
            }
          })
          .filter((item): item is typeof SERVICES_FALLBACK[number] => Boolean(item))

        if (merged.length > 0) {
          setServices(merged)
        }
      } finally {
        setLoadingCatalog(false)
      }
    }

    loadCatalog()
  }, [])

  // Recalcula cotización cuando cambia servicio, complejidad o urgencia
  const fetchQuote = useCallback(async () => {
    if (!service) return
    setLoadingQuote(true)
    try {
      const result = await quotesApi.calculateV1({ serviceType: service, complexity, urgency })
      setQuote(result)
    } catch {
      /* silencioso — la API ya valida */
    } finally {
      setLoadingQuote(false)
    }
  }, [service, complexity, urgency])

  useEffect(() => {
    if (step >= 2) fetchQuote()
  }, [step, fetchQuote])

  async function handleSubmit() {
    if (!service || !title.trim() || !description.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const project = await projectsApi.create({
        title: title.trim(),
        description: description.trim(),
        serviceType: service,
        complexity,
        urgency,
        format,
      })
      router.push(`/cliente/${project._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header + progreso */}
      <div className="mb-8">
        <Link href="/cliente" className="text-xs text-white/30 hover:text-coral transition-colors mb-4 inline-block">
          ← Mis proyectos
        </Link>
        <h1 className="text-2xl font-bold text-cobalt">Solicitar servicio</h1>
        <div className="flex gap-2 mt-4">
          {([1, 2, 3] as Step[]).map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-coral' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>Servicio</span>
          <span>Detalles</span>
          <span>Confirmar</span>
        </div>
      </div>

      {/* ── Step 1: Elegir servicio ─────────────────────────────────── */}
      {step === 1 && (
        <div>
          <p className="text-sm text-gray-500 mb-5">¿Qué necesitas?</p>
          {loadingCatalog && <p className="text-xs text-gray-400 mb-4">Actualizando catálogo...</p>}
          <div className="grid gap-3">
            {services.map(s => (
              <button
                key={s.id}
                onClick={() => setService(s.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  service === s.id
                    ? 'border-coral bg-coral/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-cobalt/20'
                }`}
              >
                <span className="text-2xl w-8 text-center text-cobalt/50">{s.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-cobalt text-sm">{s.name}</div>
                  <div className="text-xs text-gray-400">{s.tag}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-cobalt">desde {fmt(s.base)}</div>
                  <div className="text-xs text-gray-400">+ IVA</div>
                </div>
              </button>
            ))}
          </div>
          <button
            disabled={!service}
            onClick={() => setStep(2)}
            className="mt-6 w-full bg-coral text-white font-semibold py-3 rounded-xl hover:bg-coral-dark transition-colors disabled:opacity-40"
          >
            Continuar →
          </button>
        </div>
      )}

      {/* ── Step 2: Complejidad, urgencia y descripción ─────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Complejidad */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 block">
              Complejidad del proyecto
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COMPLEXITY.map(c => (
                <button
                  key={c.value}
                  onClick={() => setComplexity(c.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    complexity === c.value
                      ? 'border-cobalt bg-cobalt text-white'
                      : 'border-gray-200 bg-white hover:border-cobalt/30'
                  }`}
                >
                  <div className="font-semibold text-sm">{c.label}</div>
                  <div className={`text-xs mt-1 ${complexity === c.value ? 'text-white/60' : 'text-gray-400'}`}>
                    {c.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Urgencia */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 block">
              Urgencia
            </label>
            <div className="grid grid-cols-3 gap-2">
              {URGENCY.map(u => (
                <button
                  key={u.value}
                  onClick={() => setUrgency(u.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    urgency === u.value
                      ? 'border-coral bg-coral text-white'
                      : 'border-gray-200 bg-white hover:border-coral/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{u.label}</span>
                    {u.mult && (
                      <span className={`text-xs font-bold ${urgency === u.value ? 'text-white/80' : 'text-coral'}`}>
                        {u.mult}
                      </span>
                    )}
                  </div>
                  <div className={`text-xs mt-1 ${urgency === u.value ? 'text-white/60' : 'text-gray-400'}`}>
                    {u.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
              Título del proyecto
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="ej. Branding completo para empresa de tech"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-cobalt placeholder-gray-300 focus:outline-none focus:border-cobalt/40"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
              Brief del proyecto
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe qué necesitas, referentes de estilo, colores, público objetivo..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-cobalt placeholder-gray-300 focus:outline-none focus:border-cobalt/40 resize-none"
            />
          </div>

          {/* Formato / entregables (opcional) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 block">
              Formatos / entregables <span className="text-gray-300">(opcional)</span>
            </label>
            <input
              type="text"
              value={format}
              onChange={e => setFormat(e.target.value)}
              placeholder="ej. PDF editable, PNG transparente, MP4 1080p..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-cobalt placeholder-gray-300 focus:outline-none focus:border-cobalt/40"
            />
          </div>

          {/* Cotización en vivo */}
          <div className="bg-cobalt rounded-xl p-5">
            <div className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">
              Cotización estimada
            </div>
            {loadingQuote ? (
              <div className="text-white/30 text-sm">Calculando...</div>
            ) : quote ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white">{fmt(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">IVA (19%)</span>
                  <span className="text-white">{fmt(quote.iva)}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between">
                  <span className="font-bold text-white">Total</span>
                  <span className="font-bold text-coral text-lg">{fmt(quote.total)}</span>
                </div>
                <div className="flex justify-between text-xs text-white/40 pt-1">
                  <span>Anticipo al inicio (50%)</span>
                  <span>{fmt(quote.anticipo)}</span>
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>Balance al cierre (50%)</span>
                  <span>{fmt(quote.balance)}</span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-200 text-cobalt font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              ← Atrás
            </button>
            <button
              disabled={!title.trim() || !description.trim()}
              onClick={() => setStep(3)}
              className="flex-1 bg-coral text-white font-semibold py-3 rounded-xl hover:bg-coral-dark transition-colors disabled:opacity-40 text-sm"
            >
              Ver resumen →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Confirmar ────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">Revisa tu pedido antes de enviarlo.</p>

          {/* Resumen */}
          <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
            <div className="p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Servicio</div>
              <div className="font-semibold text-cobalt">
                {services.find(s => s.id === service)?.name}
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Complejidad</div>
                <div className="text-cobalt text-sm font-medium capitalize">{complexity}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Urgencia</div>
                <div className="text-cobalt text-sm font-medium capitalize">{urgency}</div>
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Título</div>
              <div className="text-cobalt text-sm">{title}</div>
            </div>
            <div className="p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Brief</div>
              <div className="text-cobalt text-sm whitespace-pre-line">{description}</div>
            </div>
            {format && (
              <div className="p-4">
                <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Formatos</div>
                <div className="text-cobalt text-sm">{format}</div>
              </div>
            )}
          </div>

          {/* Desglose financiero */}
          {quote && (
            <div className="bg-cobalt rounded-xl p-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">Subtotal</span>
                <span className="text-white">{fmt(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/50">IVA (19%)</span>
                <span className="text-white">{fmt(quote.iva)}</span>
              </div>
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="font-bold text-white">Total del proyecto</span>
                <span className="font-bold text-coral text-xl">{fmt(quote.total)}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-3 mt-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Anticipo al confirmar (50%)</span>
                  <span className="text-white font-semibold">{fmt(quote.anticipo)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">Balance al entregar (50%)</span>
                  <span className="text-white font-semibold">{fmt(quote.balance)}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 border border-gray-200 text-cobalt font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              ← Atrás
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-coral text-white font-semibold py-3 rounded-xl hover:bg-coral-dark transition-colors disabled:opacity-60 text-sm"
            >
              {submitting ? 'Enviando...' : 'Confirmar pedido ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
