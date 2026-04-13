'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { projectsApi } from '@/lib/api'
import type { Project } from '@/types'

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

  const p = project
  const canReview = p.status === 'revision'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link href="/cliente" className="text-xs text-gray-400 hover:text-coral transition-colors mb-3 inline-block">
          ← Mis proyectos
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-cobalt">{p.title}</h1>
            <p className="text-sm text-gray-400 mt-1 capitalize">
              {p.serviceType} · {p.complexity} · {p.urgency}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${STATUS_COLOR[p.status]}`}>
            {STATUS_LABEL[p.status]}
          </span>
        </div>
      </div>

      {/* Brief */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Brief</h2>
        <p className="text-sm text-cobalt whitespace-pre-line">{p.description}</p>
        {p.format && (
          <p className="text-xs text-gray-400 mt-3">
            <span className="font-medium">Formatos:</span> {p.format}
          </p>
        )}
      </div>

      {/* Financiero */}
      <div className="bg-cobalt rounded-xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Financiero</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Subtotal</span>
            <span className="text-white">{fmt(p.pricing.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">IVA (19%)</span>
            <span className="text-white">{fmt(p.pricing.iva)}</span>
          </div>
          <div className="border-t border-white/10 pt-2 flex justify-between">
            <span className="font-bold text-white">Total</span>
            <span className="font-bold text-coral text-xl">{fmt(p.pricing.total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className={`rounded-lg p-3 border ${p.payments.anticipo.paid ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
            <div className="text-xs text-white/40 mb-1">Anticipo (50%)</div>
            <div className="font-bold text-white text-sm">{fmt(p.pricing.anticipo)}</div>
            <div className={`text-xs mt-1 ${p.payments.anticipo.paid ? 'text-green-400' : 'text-yellow-400'}`}>
              {p.payments.anticipo.paid ? '✓ Pagado' : 'Pendiente'}
            </div>
          </div>
          <div className={`rounded-lg p-3 border ${p.payments.balance.paid ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
            <div className="text-xs text-white/40 mb-1">Balance (50%)</div>
            <div className="font-bold text-white text-sm">{fmt(p.pricing.balance)}</div>
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
                  <div className="text-xs text-gray-300 mt-0.5">
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
