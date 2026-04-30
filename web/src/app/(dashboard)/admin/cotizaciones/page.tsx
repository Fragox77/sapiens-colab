'use client'
import { useEffect, useState } from 'react'
import { quotesApi } from '@/lib/api'
import type { Quote } from '@/types'

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''

const SERVICE_LABEL: Record<string, string> = {
  branding:      'Branding',
  piezas:        'Piezas gráficas',
  'video-motion':'Video / Motion',
  fotografia:    'Fotografía',
  'social-media':'Social Media',
  web:           'Web',
  campana:       'Campaña',
}

const COMPLEXITY_LABEL: Record<string, string> = {
  basica:   'Básica',
  media:    'Media',
  avanzada: 'Avanzada',
}

const URGENCY_LABEL: Record<string, string> = {
  normal:      'Normal',
  prioritario: 'Prioritario',
  express:     'Express',
}

const STAGE_COLOR: Record<string, string> = {
  NUEVO:             'badge-yellow border',
  CONTACTO_INICIAL:  'badge-blue border',
  PROPUESTA_ENVIADA: 'badge-violet border',
  NEGOCIACION:       'badge-orange border',
  CERRADO_GANADO:    'badge-emerald border',
  CERRADO_PERDIDO:   'badge-rose border',
}

const STAGE_LABEL: Record<string, string> = {
  NUEVO:             'Nuevo',
  CONTACTO_INICIAL:  'Contacto',
  PROPUESTA_ENVIADA: 'Propuesta',
  NEGOCIACION:       'Negociación',
  CERRADO_GANADO:    'Ganado',
  CERRADO_PERDIDO:   'Perdido',
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

function buildWhatsAppUrl(quote: Quote): string {
  const { client, serviceType, complexity, urgency, pricing, _id } = quote
  const lines = [
    `*Cotización SAPIENS COLAB*`,
    ``,
    `Hola ${client.name}, aquí el resumen de tu cotización:`,
    ``,
    `• Servicio: ${SERVICE_LABEL[serviceType] ?? serviceType}`,
    `• Complejidad: ${COMPLEXITY_LABEL[complexity] ?? complexity}`,
    `• Urgencia: ${URGENCY_LABEL[urgency] ?? urgency}`,
    ``,
    `• Subtotal: ${fmt(pricing.subtotal)}`,
    `• IVA (19%): ${fmt(pricing.iva)}`,
    `• *Total: ${fmt(pricing.total)}*`,
    `• Anticipo requerido (50%): ${fmt(pricing.anticipo)}`,
    `• Saldo al cierre: ${fmt(pricing.balance)}`,
    ``,
    `*Vigencia: 15 días*`,
    `Ref: ${_id}`,
  ]
  const text = encodeURIComponent(lines.join('\n'))
  return `https://wa.me/${WA_NUMBER}?text=${text}`
}

export default function AdminCotizacionesPage() {
  const [quotes, setQuotes]   = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')

  useEffect(() => {
    quotesApi.list()
      .then(res => setQuotes(res.data))
      .catch(err => setError(err.message || 'Error al cargar cotizaciones'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = quotes.filter(q => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      q.client.name.toLowerCase().includes(s) ||
      q.client.email.toLowerCase().includes(s) ||
      (q.client.company || '').toLowerCase().includes(s)
    )
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="theme-dashboard-text text-3xl font-bold">Cotizaciones</h1>
          <p className="theme-dashboard-muted mt-1 text-sm">{quotes.length} registradas</p>
        </div>
      </div>

      {!WA_NUMBER && (
        <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-semantic-warning">
          Configura <code className="font-mono text-xs">NEXT_PUBLIC_WHATSAPP_NUMBER</code> en <code className="font-mono text-xs">.env.local</code> para activar el botón de WhatsApp.
        </div>
      )}

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por nombre, email o empresa..."
        className="theme-dashboard-input mb-6 w-full rounded-xl px-4 py-3 text-sm placeholder:text-[color:var(--dashboard-muted)] focus:outline-none focus:border-[#4C58FF]"
      />

      {loading ? (
        <div className="theme-dashboard-muted text-sm">Cargando cotizaciones...</div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-semantic-danger">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="theme-dashboard-muted py-12 text-center text-sm">Sin resultados.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(q => {
            const stage = q.stage ?? 'NUEVO'
            const waUrl = buildWhatsAppUrl(q)
            return (
              <div
                key={q._id}
                className="theme-dashboard-surface theme-dashboard-border rounded-xl border p-4"
              >
                {/* Fila principal */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="theme-dashboard-text text-sm font-semibold truncate">
                      {q.client.name}
                      {q.client.company && (
                        <span className="theme-dashboard-muted ml-1.5 font-normal">· {q.client.company}</span>
                      )}
                    </p>
                    <p className="theme-dashboard-muted mt-0.5 text-xs truncate">{q.client.email}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_COLOR[stage] ?? 'theme-dashboard-card border theme-dashboard-border'}`}>
                      {STAGE_LABEL[stage] ?? stage}
                    </span>
                    <span className="theme-dashboard-muted text-xs font-mono">
                      Score {q.leadScore}
                    </span>
                  </div>
                </div>

                {/* Fila secundaria */}
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs theme-dashboard-muted">
                    <span>{SERVICE_LABEL[q.serviceType] ?? q.serviceType}</span>
                    <span>{COMPLEXITY_LABEL[q.complexity] ?? q.complexity}</span>
                    <span>{URGENCY_LABEL[q.urgency] ?? q.urgency}</span>
                    <span className="theme-dashboard-text font-semibold">{fmt(q.pricing.total)}</span>
                    <span>Anticipo {fmt(q.pricing.anticipo)}</span>
                    <span className="theme-dashboard-muted">
                      {new Date(q.createdAt).toLocaleDateString('es-CO')}
                    </span>
                  </div>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-disabled={!WA_NUMBER}
                    onClick={e => { if (!WA_NUMBER) e.preventDefault() }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      WA_NUMBER
                        ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border border-emerald-500/30'
                        : 'opacity-40 cursor-not-allowed bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Enviar por WhatsApp
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
