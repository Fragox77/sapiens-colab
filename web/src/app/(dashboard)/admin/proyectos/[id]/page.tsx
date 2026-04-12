'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { projectsApi, adminApi } from '@/lib/api'
import type { Project, User } from '@/types'

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
  cotizado:   'bg-yellow-100 text-yellow-800',
  activo:     'bg-blue-100 text-blue-800',
  revision:   'bg-purple-100 text-purple-800',
  ajuste:     'bg-orange-100 text-orange-800',
  aprobado:   'bg-green-100 text-green-800',
  completado: 'bg-gray-100 text-gray-700',
  cancelado:  'bg-red-100 text-red-800',
}

const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`

export default function AdminProyectoPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject]   = useState<Project | null>(null)
  const [designers, setDesigners] = useState<User[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [selectedDesigner, setSelectedDesigner] = useState('')
  const [assigning, setAssigning]   = useState(false)
  const [completing, setCompleting] = useState(false)

  async function load() {
    try {
      const [p, d] = await Promise.all([projectsApi.get(id), adminApi.designers()])
      setProject(p as Project)
      setDesigners(d as User[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleAssign() {
    if (!selectedDesigner) return
    setAssigning(true)
    try {
      await adminApi.assign(id, selectedDesigner)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar')
    } finally {
      setAssigning(false)
    }
  }

  async function handleComplete() {
    if (!confirm('¿Cerrar proyecto y liquidar al diseñador?')) return
    setCompleting(true)
    try {
      await adminApi.complete(id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Cargando...</p>
    </div>
  )

  if (error || !project) return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-600 text-sm">{error || 'No encontrado'}</div>
  )

  const p = project
  const designer = typeof p.designer === 'object' ? p.designer : null
  const client   = typeof p.client === 'object' ? p.client : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <a href="/admin/proyectos" className="text-xs text-gray-400 hover:text-coral transition-colors mb-3 inline-block">
          ← Todos los proyectos
        </a>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-cobalt">{p.title}</h1>
            <p className="text-sm text-gray-400 mt-1 capitalize">{p.serviceType} · {p.complexity} · {p.urgency}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLOR[p.status]}`}>
            {STATUS_LABEL[p.status]}
          </span>
        </div>
      </div>

      {/* Partes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Cliente</div>
          {client ? (
            <>
              <div className="font-semibold text-cobalt text-sm">{client.name}</div>
              <div className="text-xs text-gray-400">{client.company || client.email}</div>
            </>
          ) : <div className="text-sm text-gray-300">—</div>}
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Diseñador</div>
          {designer ? (
            <>
              <div className="font-semibold text-cobalt text-sm">{designer.name}</div>
              <div className="text-xs text-gray-400">Nivel {designer.level} · {designer.specialty}</div>
            </>
          ) : <div className="text-sm text-gray-300">Sin asignar</div>}
        </div>
      </div>

      {/* Brief */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Brief</h2>
        <p className="text-sm text-cobalt whitespace-pre-line">{p.description}</p>
        {p.format && (
          <p className="text-xs text-gray-400 mt-3"><span className="font-medium">Formatos:</span> {p.format}</p>
        )}
      </div>

      {/* Financiero completo */}
      <div className="bg-cobalt rounded-xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">Desglose financiero</h2>
        <div className="space-y-2">
          <Row label="Subtotal"         value={fmt(p.pricing.subtotal)} />
          <Row label="IVA (19%)"        value={fmt(p.pricing.iva)} />
          <div className="border-t border-white/10 pt-2">
            <Row label="Total cliente"  value={fmt(p.pricing.total)} bold />
          </div>
          <div className="border-t border-white/10 pt-2 space-y-1.5">
            <Row label="Comisión SAPIENS (25%)" value={fmt(p.pricing.commission)} dim />
            <Row label="Pago diseñador (neto)"  value={fmt(p.pricing.designerPay)} dim />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <PayBlock label="Anticipo (50%)" amount={fmt(p.pricing.anticipo)} paid={p.payments.anticipo.paid} />
          <PayBlock label="Balance (50%)"  amount={fmt(p.pricing.balance)}  paid={p.payments.balance.paid} />
        </div>
      </div>

      {/* Asignar diseñador */}
      {p.status === 'cotizado' && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-cobalt mb-3">Asignar diseñador</h2>
          <div className="flex gap-3">
            <select
              value={selectedDesigner}
              onChange={e => setSelectedDesigner(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-cobalt/40"
            >
              <option value="">Selecciona diseñador...</option>
              {designers
                .filter(d => (d.level || 0) >= p.minDesignerLevel)
                .map(d => (
                  <option key={d._id} value={d._id}>
                    {d.name} — Nivel {d.level} · {d.specialty}
                    {d.isAvailable === false ? ' (no disponible)' : ''}
                  </option>
                ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={!selectedDesigner || assigning}
              className="bg-cobalt text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-cobalt-mid transition-colors disabled:opacity-50"
            >
              {assigning ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
          {designers.filter(d => (d.level || 0) >= p.minDesignerLevel).length === 0 && (
            <p className="text-xs text-orange-500 mt-2">
              No hay diseñadores disponibles con nivel ≥ {p.minDesignerLevel}
            </p>
          )}
        </div>
      )}

      {/* Cerrar proyecto */}
      {p.status === 'aprobado' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-green-800 mb-1">El cliente aprobó el trabajo</h2>
          <p className="text-xs text-green-600 mb-4">
            Al cerrar el proyecto se registra el pago final y se liquida al diseñador por {fmt(p.pricing.designerPay)}.
          </p>
          <button
            onClick={handleComplete}
            disabled={completing}
            className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            {completing ? 'Cerrando...' : '✓ Cerrar y liquidar'}
          </button>
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
              <a key={i} href={d.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-cobalt/20 transition-colors">
                <span>📎</span>
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

      {/* Revisiones */}
      <div className="text-xs text-gray-400">
        Revisiones: {p.revisions.used}/{p.revisions.max}
        {p.revisions.extra > 0 && <span className="ml-2 text-coral">{p.revisions.extra} extra(s)</span>}
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

function Row({ label, value, bold, dim }: { label: string; value: string; bold?: boolean; dim?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={dim ? 'text-white/30' : 'text-white/50'}>{label}</span>
      <span className={`${bold ? 'font-bold text-coral text-base' : dim ? 'text-white/40' : 'text-white'}`}>{value}</span>
    </div>
  )
}

function PayBlock({ label, amount, paid }: { label: string; amount: string; paid: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${paid ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
      <div className="text-xs text-white/40 mb-1">{label}</div>
      <div className="font-bold text-white text-sm">{amount}</div>
      <div className={`text-xs mt-1 ${paid ? 'text-green-400' : 'text-yellow-400'}`}>
        {paid ? '✓ Pagado' : 'Pendiente'}
      </div>
    </div>
  )
}
