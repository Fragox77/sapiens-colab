'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projectsApi, adminApi } from '@/lib/api'
import type { Project, User } from '@/types'
import { useUpdateProject } from '@/hooks/useUpdateProject'

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
  cotizado:   'badge-yellow border',
  activo:     'badge-blue border',
  revision:   'badge-violet border',
  ajuste:     'badge-orange border',
  aprobado:   'badge-emerald border',
  completado: 'badge-slate border',
  cancelado:  'badge-rose border',
}

const STATUSES = ['cotizado', 'activo', 'revision', 'ajuste', 'aprobado', 'completado', 'cancelado']

const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`

export default function AdminProyectoPage() {
  const { id } = useParams<{ id: string }>()
  const router  = useRouter()
  const [project, setProject]   = useState<Project | null>(null)
  const [designers, setDesigners] = useState<User[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [selectedDesigner, setSelectedDesigner] = useState('')
  const [assigning, setAssigning]   = useState(false)
  const [completing, setCompleting] = useState(false)

  // Status panel
  const [showStatusPanel, setShowStatusPanel] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusMsg, setStatusMsg] = useState('')
  const { updateStatus, saving: savingStatus } = useUpdateProject(id)

  // Edit panel
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [editTitle, setEditTitle]         = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editFormat, setEditFormat]       = useState('')
  const [editServiceType, setEditServiceType] = useState('')
  const [editComplexity, setEditComplexity]   = useState('')
  const [editUrgency, setEditUrgency]         = useState('')
  const [editNewTotal, setEditNewTotal]       = useState('')
  const [savingEdit, setSavingEdit]           = useState(false)

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  function openEditPanel(p: Project) {
    setEditTitle(p.title)
    setEditDescription(p.description)
    setEditFormat(p.format || '')
    setEditServiceType(p.serviceType)
    setEditComplexity(p.complexity)
    setEditUrgency(p.urgency)
    setEditNewTotal('')
    setShowEditPanel(true)
  }

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

  async function handleStatusSave() {
    if (!newStatus) return
    try {
      await updateStatus(newStatus, statusMsg || undefined)
      setShowStatusPanel(false)
      setNewStatus('')
      setStatusMsg('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  async function handleEditSave() {
    setSavingEdit(true)
    try {
      const data: Parameters<typeof adminApi.updateProject>[1] = {}
      if (editTitle !== project!.title) data.title = editTitle
      if (editDescription !== project!.description) data.description = editDescription
      if (editFormat !== (project!.format || '')) data.format = editFormat
      if (editServiceType !== project!.serviceType) data.serviceType = editServiceType
      if (editComplexity !== project!.complexity) data.complexity = editComplexity
      if (editUrgency !== project!.urgency) data.urgency = editUrgency
      if (editNewTotal) data.newTotal = Number(editNewTotal)
      await adminApi.updateProject(id, data)
      setShowEditPanel(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await adminApi.deleteProject(id)
      router.push('/admin/proyectos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="theme-dashboard-muted text-sm">Cargando...</p>
    </div>
  )

  if (error || !project) return (
    <div className="border border-rose-500/30 bg-rose-500/10 rounded-xl p-6 text-semantic-danger text-sm">{error || 'No encontrado'}</div>
  )

  const p = project
  const designer = typeof p.designer === 'object' ? p.designer : null
  const client   = typeof p.client === 'object' ? p.client : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <a href="/admin/proyectos" className="theme-dashboard-muted mb-3 inline-block text-xs transition-colors hover:text-[#A5B4FC]">
          ← Todos los proyectos
        </a>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="theme-dashboard-text text-3xl font-bold">{p.title}</h1>
            <p className="theme-dashboard-muted mt-1 text-sm capitalize">{p.serviceType} · {p.complexity} · {p.urgency}</p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLOR[p.status] ?? 'badge-slate border'}`}>
            {STATUS_LABEL[p.status] ?? p.status}
          </span>
        </div>
      </div>

      {/* Admin control toolbar */}
      <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-4">
        <div className="theme-dashboard-muted mb-3 text-xs font-semibold uppercase tracking-wider">Control del proyecto</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setNewStatus(p.status); setShowStatusPanel(v => !v) }}
            className="btn-action-yellow rounded-lg px-4 py-2 text-xs font-semibold transition-all"
          >
            Cambiar estado
          </button>
          <button
            onClick={() => openEditPanel(p)}
            className="btn-action-emerald rounded-lg px-4 py-2 text-xs font-semibold transition-all"
          >
            Editar proyecto
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn-action-rose rounded-lg px-4 py-2 text-xs font-semibold transition-all"
          >
            Eliminar
          </button>
        </div>

        {/* Status panel */}
        {showStatusPanel && (
          <div className="mt-4 space-y-3 border-t theme-dashboard-border pt-4">
            <div className="flex gap-3 flex-wrap">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    newStatus === s
                      ? (STATUS_COLOR[s] ?? 'badge-slate border') + ' ring-2 ring-offset-1 ring-[#4C58FF]'
                      : (STATUS_COLOR[s] ?? 'badge-slate border') + ' opacity-60 hover:opacity-100'
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            <textarea
              value={statusMsg}
              onChange={e => setStatusMsg(e.target.value)}
              placeholder="Nota opcional (visible en historial)..."
              rows={2}
              className="theme-dashboard-input w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#4C58FF]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleStatusSave}
                disabled={!newStatus || savingStatus}
                className="rounded-lg bg-[#4C58FF] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-[#5A66FF] transition-colors"
              >
                {savingStatus ? 'Guardando...' : 'Guardar estado'}
              </button>
              <button
                onClick={() => setShowStatusPanel(false)}
                className="theme-dashboard-muted rounded-lg px-4 py-2 text-xs hover:theme-dashboard-text transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Edit panel */}
        {showEditPanel && (
          <div className="mt-4 space-y-3 border-t theme-dashboard-border pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="theme-dashboard-muted text-xs">Título</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="theme-dashboard-input mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C58FF]"
                />
              </div>
              <div className="col-span-2">
                <label className="theme-dashboard-muted text-xs">Descripción / Brief</label>
                <textarea
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  rows={3}
                  className="theme-dashboard-input mt-1 w-full rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#4C58FF]"
                />
              </div>
              <div>
                <label className="theme-dashboard-muted text-xs">Formatos</label>
                <input
                  value={editFormat}
                  onChange={e => setEditFormat(e.target.value)}
                  className="theme-dashboard-input mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C58FF]"
                />
              </div>
              <div>
                <label className="theme-dashboard-muted text-xs">Tipo de servicio</label>
                <select
                  value={editServiceType}
                  onChange={e => setEditServiceType(e.target.value)}
                  className="theme-dashboard-input mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C58FF]"
                >
                  {['branding','piezas','video-motion','fotografia','social-media','web','campana'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="theme-dashboard-muted text-xs">Complejidad</label>
                <select
                  value={editComplexity}
                  onChange={e => setEditComplexity(e.target.value)}
                  className="theme-dashboard-input mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C58FF]"
                >
                  {['basica','media','avanzada'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="theme-dashboard-muted text-xs">Urgencia</label>
                <select
                  value={editUrgency}
                  onChange={e => setEditUrgency(e.target.value)}
                  className="theme-dashboard-input mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C58FF]"
                >
                  {['normal','prioritario','express'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="theme-dashboard-muted text-xs">
                  Nuevo total (renegociación) — <span className="text-semantic-warning">deja vacío para no cambiar precios</span>
                </label>
                <input
                  type="number"
                  value={editNewTotal}
                  onChange={e => setEditNewTotal(e.target.value)}
                  placeholder={`Actual: ${fmt(p.pricing.total)}`}
                  className="theme-dashboard-input mt-1 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C58FF]"
                />
                {editNewTotal && (
                  <p className="text-xs theme-dashboard-muted mt-1">
                    Se recalcularán: subtotal, IVA, comisión, pago diseñador, anticipo y balance.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEditSave}
                disabled={savingEdit}
                className="rounded-lg bg-[#4C58FF] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50 hover:bg-[#5A66FF] transition-colors"
              >
                {savingEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                onClick={() => setShowEditPanel(false)}
                className="theme-dashboard-muted rounded-lg px-4 py-2 text-xs hover:theme-dashboard-text transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-5">
          <h2 className="text-sm font-semibold text-semantic-danger mb-1">¿Eliminar este proyecto?</h2>
          <p className="text-xs theme-dashboard-muted mb-4">
            Esta acción es irreversible. El proyecto y todo su historial serán eliminados permanentemente.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-rose-600 px-5 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
            >
              {deleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="theme-dashboard-muted rounded-lg px-4 py-2 text-xs hover:theme-dashboard-text transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Partes */}
      <div className="grid grid-cols-2 gap-4">
        <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-4">
          <div className="theme-dashboard-muted mb-2 text-xs uppercase tracking-wider">Cliente</div>
          {client ? (
            <>
              <div className="theme-dashboard-text text-sm font-semibold">{client.name}</div>
              <div className="theme-dashboard-muted text-xs">{client.company || client.email}</div>
            </>
          ) : <div className="theme-dashboard-muted text-sm">—</div>}
        </div>
        <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-4">
          <div className="theme-dashboard-muted mb-2 text-xs uppercase tracking-wider">Diseñador</div>
          {designer ? (
            <>
              <div className="theme-dashboard-text text-sm font-semibold">{designer.name}</div>
              <div className="theme-dashboard-muted text-xs">Nivel {designer.level} · {designer.specialty}</div>
            </>
          ) : <div className="theme-dashboard-muted text-sm">Sin asignar</div>}
        </div>
      </div>

      {/* Brief */}
      <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-5">
        <h2 className="theme-dashboard-muted mb-3 text-xs font-semibold uppercase tracking-wider">Brief</h2>
        <p className="theme-dashboard-text whitespace-pre-line text-sm">{p.description}</p>
        {p.format && (
          <p className="theme-dashboard-muted mt-3 text-xs"><span className="font-medium">Formatos:</span> {p.format}</p>
        )}
      </div>

      {/* Financiero completo */}
      <div className="theme-dashboard-panel theme-dashboard-border rounded-xl border p-5">
        <h2 className="theme-dashboard-muted text-xs font-semibold uppercase tracking-wider mb-4">Desglose financiero</h2>
        <div className="space-y-2">
          <Row label="Subtotal"         value={fmt(p.pricing.subtotal)} />
          <Row label="IVA (19%)"        value={fmt(p.pricing.iva)} />
          <div className="theme-dashboard-border border-t pt-2">
            <Row label="Total cliente"  value={fmt(p.pricing.total)} bold />
          </div>
          <div className="theme-dashboard-border border-t pt-2 space-y-1.5">
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
        <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-5">
          <h2 className="theme-dashboard-text mb-3 text-sm font-semibold">Asignar diseñador</h2>
          <div className="flex gap-3">
            <select
              value={selectedDesigner}
              onChange={e => setSelectedDesigner(e.target.value)}
              className="theme-dashboard-input flex-1 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#4C58FF]"
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
              className="rounded-lg bg-[#4C58FF] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5A66FF] disabled:opacity-50"
            >
              {assigning ? 'Asignando...' : 'Asignar'}
            </button>
          </div>
          {designers.filter(d => (d.level || 0) >= p.minDesignerLevel).length === 0 && (
            <p className="text-xs text-semantic-warning mt-2">
              No hay diseñadores disponibles con nivel ≥ {p.minDesignerLevel}
            </p>
          )}
        </div>
      )}

      {/* Cerrar proyecto */}
      {p.status === 'aprobado' && (
        <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-xl p-5">
          <h2 className="text-sm font-semibold theme-dashboard-text mb-1">El cliente aprobó el trabajo</h2>
          <p className="text-xs theme-dashboard-muted mb-4">
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
        <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-5">
          <h2 className="theme-dashboard-muted mb-3 text-xs font-semibold uppercase tracking-wider">
            Entregables ({p.deliverables.length})
          </h2>
          <div className="space-y-2">
            {p.deliverables.map((d, i) => (
              <a key={i} href={d.url} target="_blank" rel="noreferrer"
                className="theme-dashboard-border theme-dashboard-surface-2 flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-[#4C58FF]/40">
                <span>📎</span>
                <div className="flex-1 min-w-0">
                  <div className="theme-dashboard-text truncate text-sm font-medium">{d.name}</div>
                  <div className="theme-dashboard-muted text-xs">Ronda {d.round}</div>
                </div>
                <span className="text-xs font-medium text-[#A5B4FC]">Ver →</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Revisiones */}
      <div className="theme-dashboard-muted text-xs">
        Revisiones: {p.revisions.used}/{p.revisions.max}
        {p.revisions.extra > 0 && <span className="ml-2 text-semantic-danger">{p.revisions.extra} extra(s)</span>}
      </div>

      {/* Timeline */}
      {p.timeline.length > 0 && (
        <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-5">
          <h2 className="theme-dashboard-muted mb-4 text-xs font-semibold uppercase tracking-wider">Historial</h2>
          <div className="space-y-3">
            {[...p.timeline].reverse().map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#7280FF]" />
                <div>
                  <div className="theme-dashboard-text text-xs font-medium">{t.action.replace(/_/g, ' ')}</div>
                  {t.message && <div className="theme-dashboard-muted mt-0.5 text-xs">{t.message}</div>}
                  <div className="theme-dashboard-muted mt-0.5 text-xs">
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
      <span className="theme-dashboard-muted">{label}</span>
      <span className={`${bold ? 'font-bold text-coral text-base' : dim ? 'theme-dashboard-muted' : 'theme-dashboard-text'}`}>{value}</span>
    </div>
  )
}

function PayBlock({ label, amount, paid }: { label: string; amount: string; paid: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${paid ? 'border-green-500/30 bg-green-500/10' : 'theme-dashboard-border theme-dashboard-surface-2'}`}>
      <div className="theme-dashboard-muted text-xs mb-1">{label}</div>
      <div className="theme-dashboard-text font-bold text-sm">{amount}</div>
      <div className={`text-xs mt-1 ${paid ? 'text-semantic-success' : 'text-semantic-warning'}`}>
        {paid ? '✓ Pagado' : 'Pendiente'}
      </div>
    </div>
  )
}
