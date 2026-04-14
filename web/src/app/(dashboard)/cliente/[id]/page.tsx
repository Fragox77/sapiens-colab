'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { projectsApi } from '@/lib/api'
import type { Project } from '@/types'

const STARS = [1, 2, 3, 4, 5]

const STATUS_LABEL: Record<string, string> = {
  cotizado:   'Esperando anticipo',
  activo:     'En producción',
  revision:   'En revisión',
  ajuste:     'Ajustes solicitados',
  aprobado:   'Aprobado — pago final pendiente',
  completado: 'Completado',
  cancelado:  'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  cotizado:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  activo:     'bg-blue-100 text-blue-800 border-blue-200',
  revision:   'bg-purple-100 text-purple-800 border-purple-200',
  ajuste:     'bg-orange-100 text-orange-800 border-orange-200',
  aprobado:   'bg-green-100 text-green-800 border-green-200',
  completado: 'bg-gray-100 text-gray-700 border-gray-200',
  cancelado:  'bg-red-100 text-red-800 border-red-200',
}

const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`

export default function ProyectoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState('')
  const [reviewing, setReviewing] = useState(false)
  const [reviewMsg, setReviewMsg] = useState('')

  // Feedback state
  const [fbRating, setFbRating]   = useState(0)
  const [fbHover, setFbHover]     = useState(0)
  const [fbNps, setFbNps]         = useState<number | ''>('')
  const [fbComment, setFbComment] = useState('')
  const [fbSending, setFbSending] = useState(false)
  const [fbDone, setFbDone]       = useState(false)
  const [fbError, setFbError]     = useState('')

  async function load() {
    try {
      const p = await projectsApi.get(id)
      setProject(p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleReview(action: 'approve' | 'request-revision') {
    if (!project) return
    setReviewing(true)
    try {
      const updated = await projectsApi.review(id, { action, message: reviewMsg })
      setProject(updated)
      setReviewMsg('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setReviewing(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Cargando proyecto...</p>
    </div>
  )

  if (error || !project) return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-600 text-sm">
      {error || 'Proyecto no encontrado'}
    </div>
  )

  async function handleFeedback() {
    if (!project || fbRating === 0) return
    setFbSending(true)
    setFbError('')
    try {
      await projectsApi.feedback(id, {
        rating: fbRating,
        nps: fbNps !== '' ? Number(fbNps) : undefined,
        comment: fbComment.trim() || undefined,
      })
      setFbDone(true)
    } catch (err) {
      setFbError(err instanceof Error ? err.message : 'Error al enviar calificación')
    } finally {
      setFbSending(false)
    }
  }

  const p = project
  const canReview   = p.status === 'revision'
  const canFeedback = (p.status === 'aprobado' || p.status === 'completado') && !fbDone

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/cliente" className="text-xs text-gray-400 hover:text-coral transition-colors mb-3 inline-block">
          ← Mis proyectos
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="theme-dashboard-text text-2xl font-bold">{p.title}</h1>
            <p className="theme-dashboard-muted text-sm mt-1 capitalize">
              {p.serviceType} · {p.complexity} · {p.urgency}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${STATUS_COLOR[p.status]}`}>
            {STATUS_LABEL[p.status]}
          </span>
        </div>
      </div>

      {/* Brief */}
      <div className="theme-dashboard-surface theme-dashboard-border rounded-xl border p-5">
        <h2 className="theme-dashboard-muted text-xs font-semibold uppercase tracking-wider mb-3">Brief</h2>
        <p className="theme-dashboard-text text-sm whitespace-pre-line">{p.description}</p>
        {p.format && (
          <p className="theme-dashboard-muted text-xs mt-3">
            <span className="font-medium">Formatos:</span> {p.format}
          </p>
        )}
      </div>

      {/* Financiero */}
      <div className="theme-dashboard-panel theme-dashboard-border rounded-xl border p-5">
        <h2 className="theme-dashboard-muted text-xs font-semibold uppercase tracking-wider mb-4">Financiero</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="theme-dashboard-muted">Subtotal</span>
            <span className="theme-dashboard-text">{fmt(p.pricing.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="theme-dashboard-muted">IVA (19%)</span>
            <span className="theme-dashboard-text">{fmt(p.pricing.iva)}</span>
          </div>
          <div className="theme-dashboard-border border-t pt-2 flex justify-between">
            <span className="theme-dashboard-text font-bold">Total</span>
            <span className="font-bold text-coral text-xl">{fmt(p.pricing.total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className={`rounded-lg p-3 border ${p.payments.anticipo.paid ? 'border-green-500/30 bg-green-500/10' : 'theme-dashboard-border theme-dashboard-surface-2'}`}>
            <div className="theme-dashboard-muted text-xs mb-1">Anticipo (50%)</div>
            <div className="theme-dashboard-text font-bold text-sm">{fmt(p.pricing.anticipo)}</div>
            <div className={`text-xs mt-1 ${p.payments.anticipo.paid ? 'text-green-400' : 'text-yellow-400'}`}>
              {p.payments.anticipo.paid ? '✓ Pagado' : 'Pendiente'}
            </div>
          </div>
          <div className={`rounded-lg p-3 border ${p.payments.balance.paid ? 'border-green-500/30 bg-green-500/10' : 'theme-dashboard-border theme-dashboard-surface-2'}`}>
            <div className="theme-dashboard-muted text-xs mb-1">Balance (50%)</div>
            <div className="theme-dashboard-text font-bold text-sm">{fmt(p.pricing.balance)}</div>
            <div className={`text-xs mt-1 ${p.payments.balance.paid ? 'text-green-400' : 'text-white/30'}`}>
              {p.payments.balance.paid ? '✓ Pagado' : 'Al cierre'}
            </div>
          </div>
        </div>
      </div>

      {/* Diseñador asignado */}
      {p.designer && typeof p.designer === 'object' && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Diseñador asignado</h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cobalt/10 flex items-center justify-center text-cobalt font-bold">
              {p.designer.name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-cobalt text-sm">{p.designer.name}</div>
              <div className="text-xs text-gray-400">
                {p.designer.specialty || 'Diseñador'}{p.designer.level ? ` · Nivel ${p.designer.level}` : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entregables */}
      {p.deliverables.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Entregables ({p.deliverables.length})
          </h2>
          <div className="space-y-2">
            {p.deliverables.map((d, i) => (
              <a
                key={i}
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-cobalt/20 transition-colors"
              >
                <span className="text-lg">📎</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-cobalt truncate">{d.name}</div>
                  <div className="text-xs text-gray-400">Ronda {d.round}</div>
                </div>
                <span className="text-xs text-coral font-medium">Ver →</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Acciones de revisión */}
      {canReview && (
        <div className="bg-white border border-purple-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-cobalt mb-1">Revisar entregable</h2>
          <p className="text-xs text-gray-400 mb-4">
            Tienes {p.revisions.max - p.revisions.used} revisión(es) restante(s) sin costo adicional.
          </p>
          <textarea
            rows={3}
            value={reviewMsg}
            onChange={e => setReviewMsg(e.target.value)}
            placeholder="Describe los cambios que necesitas (si solicitas revisión)..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-cobalt placeholder-gray-300 focus:outline-none focus:border-purple-300 resize-none mb-3"
          />
          {error && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => handleReview('request-revision')}
              disabled={reviewing}
              className="flex-1 border border-orange-200 text-orange-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-60"
            >
              Pedir revisión
            </button>
            <button
              onClick={() => handleReview('approve')}
              disabled={reviewing}
              className="flex-1 bg-green-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              ✓ Aprobar
            </button>
          </div>
        </div>
      )}

      {/* Calificación */}
      {fbDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <div className="text-2xl mb-1">🎉</div>
          <p className="text-sm font-semibold text-green-700">¡Gracias por tu calificación!</p>
          <p className="text-xs text-green-600 mt-1">Tu opinión nos ayuda a mejorar.</p>
        </div>
      )}

      {canFeedback && (
        <div className="bg-white border border-yellow-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-cobalt mb-0.5">Califica este proyecto</h2>
          <p className="text-xs text-gray-400 mb-4">Tu opinión ayuda a mejorar nuestra agencia.</p>

          {/* Estrellas */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2">Calificación general</div>
            <div className="flex gap-1">
              {STARS.map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFbRating(star)}
                  onMouseEnter={() => setFbHover(star)}
                  onMouseLeave={() => setFbHover(0)}
                  className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                >
                  {star <= (fbHover || fbRating) ? '★' : '☆'}
                </button>
              ))}
              {fbRating > 0 && (
                <span className="ml-2 text-xs text-gray-400 self-center">
                  {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][fbRating]}
                </span>
              )}
            </div>
          </div>

          {/* NPS */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2">
              ¿Con qué probabilidad nos recomendarías? (0–10)
            </div>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 11 }, (_, i) => i).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setFbNps(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${
                    fbNps === n
                      ? 'bg-cobalt text-white border-cobalt'
                      : 'border-gray-200 text-gray-500 hover:border-cobalt/40'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Comentario */}
          <div className="mb-4">
            <div className="text-xs text-gray-400 mb-2">Comentario (opcional)</div>
            <textarea
              rows={3}
              value={fbComment}
              onChange={e => setFbComment(e.target.value)}
              placeholder="¿Qué te pareció el trabajo? ¿Qué podríamos mejorar?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-cobalt placeholder-gray-300 focus:outline-none focus:border-cobalt/30 resize-none"
            />
          </div>

          {fbError && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 rounded-lg p-2">{fbError}</div>
          )}

          <button
            onClick={handleFeedback}
            disabled={fbRating === 0 || fbSending}
            className="w-full bg-cobalt text-white text-sm font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {fbSending ? 'Enviando...' : 'Enviar calificación'}
          </button>
        </div>
      )}

      {/* Revisiones */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>Revisiones: {p.revisions.used} / {p.revisions.max}</span>
        {p.revisions.extra > 0 && <span className="text-coral">· {p.revisions.extra} extra(s)</span>}
      </div>

      {/* Timeline */}
      {p.timeline.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Historial</h2>
          <div className="space-y-3">
            {[...p.timeline].reverse().map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cobalt/30 mt-2 flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-cobalt">{t.action.replace(/_/g, ' ')}</div>
                  {t.message && <div className="text-xs text-gray-400 mt-0.5">{t.message}</div>}
                  <div className="theme-dashboard-muted text-xs mt-0.5">
                    {new Date(t.createdAt).toLocaleString('es-CO')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
