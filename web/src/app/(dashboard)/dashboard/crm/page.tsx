'use client'

import { useEffect, useMemo, useState } from 'react'
import { quotesApi } from '@/lib/api'
import type { CrmKpis, CrmTimeline, LeadStage, Quote } from '@/types'

const STAGES: Array<{ id: LeadStage; label: string; hint: string; accent: string }> = [
  { id: 'NUEVO', label: 'Nuevo', hint: 'Lead recien capturado', accent: 'from-cyan-500/20 to-cyan-400/5' },
  { id: 'CONTACTO_INICIAL', label: 'Contacto inicial', hint: 'Primera conversacion activa', accent: 'from-blue-500/20 to-blue-400/5' },
  { id: 'PROPUESTA_ENVIADA', label: 'Propuesta enviada', hint: 'Oferta economica entregada', accent: 'from-violet-500/20 to-violet-400/5' },
  { id: 'NEGOCIACION', label: 'Negociacion', hint: 'Ajuste de alcance y condiciones', accent: 'from-amber-500/20 to-amber-400/5' },
  { id: 'CERRADO_GANADO', label: 'Cerrado ganado', hint: 'Convertido a cliente', accent: 'from-emerald-500/20 to-emerald-400/5' },
  { id: 'CERRADO_PERDIDO', label: 'Cerrado perdido', hint: 'No avanza en este ciclo', accent: 'from-rose-500/20 to-rose-400/5' },
]

const EMPTY_KPIS: CrmKpis = {
  totalLeads: 0,
  wonLeads: 0,
  conversionRate: 0,
  pipelineValue: 0,
  pendingTasks: 0,
  overdueTasks: 0,
  stalledLeads: 0,
  slaComplianceRate: 100,
  leadsByStage: {
    NUEVO: 0,
    CONTACTO_INICIAL: 0,
    PROPUESTA_ENVIADA: 0,
    NEGOCIACION: 0,
    CERRADO_GANADO: 0,
    CERRADO_PERDIDO: 0,
  },
  agingByStage: {
    NUEVO: { count: 0, avgDays: 0, maxDays: 0 },
    CONTACTO_INICIAL: { count: 0, avgDays: 0, maxDays: 0 },
    PROPUESTA_ENVIADA: { count: 0, avgDays: 0, maxDays: 0 },
    NEGOCIACION: { count: 0, avgDays: 0, maxDays: 0 },
    CERRADO_GANADO: { count: 0, avgDays: 0, maxDays: 0 },
    CERRADO_PERDIDO: { count: 0, avgDays: 0, maxDays: 0 },
  },
  alerts: [],
}

export default function CrmPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [kpis, setKpis] = useState<CrmKpis>(EMPTY_KPIS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draggingQuoteId, setDraggingQuoteId] = useState<string | null>(null)
  const [savingQuoteId, setSavingQuoteId] = useState<string | null>(null)
  const [noteDraftById, setNoteDraftById] = useState<Record<string, string>>({})
  const [taskDraftById, setTaskDraftById] = useState<Record<string, string>>({})
  const [taskDueDateById, setTaskDueDateById] = useState<Record<string, string>>({})
  const [toast, setToast] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterService, setFilterService] = useState('')
  const [filterScore, setFilterScore] = useState<'all' | 'high' | 'medium'>('all')

  const money = (value: number) => `$${value.toLocaleString('es-CO')}`

  async function loadCrm() {
    setLoading(true)
    setError('')
    try {
      const [quoteRes, kpiRes] = await Promise.all([quotesApi.list(), quotesApi.crmKpis()])
      setQuotes(quoteRes.data)
      setKpis(kpiRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el CRM')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCrm()
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 1800)
    return () => clearTimeout(timer)
  }, [toast])

  const serviceTypes = useMemo(() =>
    [...new Set(quotes.map((q) => q.serviceType).filter(Boolean))].sort()
  , [quotes])

  const filteredQuotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return quotes.filter((quote) => {
      if (q) {
        const name = (quote.client.name || '').toLowerCase()
        const company = (quote.client.company || '').toLowerCase()
        const email = (quote.client.email || '').toLowerCase()
        if (!name.includes(q) && !company.includes(q) && !email.includes(q)) return false
      }
      if (filterService && quote.serviceType !== filterService) return false
      if (filterScore === 'high' && (quote.leadScore ?? 0) < 70) return false
      if (filterScore === 'medium' && ((quote.leadScore ?? 0) < 40 || (quote.leadScore ?? 0) >= 70)) return false
      return true
    })
  }, [quotes, searchQuery, filterService, filterScore])

  const hasFilters = searchQuery !== '' || filterService !== '' || filterScore !== 'all'

  const quotesByStage = useMemo(() => {
    const grouped: Record<LeadStage, Quote[]> = {
      NUEVO: [],
      CONTACTO_INICIAL: [],
      PROPUESTA_ENVIADA: [],
      NEGOCIACION: [],
      CERRADO_GANADO: [],
      CERRADO_PERDIDO: [],
    }

    for (const quote of filteredQuotes) {
      const stage = quote.stage || 'NUEVO'
      grouped[stage].push(quote)
    }

    return grouped
  }, [filteredQuotes])

  // Contadores derivados del estado local — siempre en sync con las tarjetas
  const leadsByStage = useMemo(() => {
    const counts: Record<LeadStage, number> = {
      NUEVO: 0, CONTACTO_INICIAL: 0, PROPUESTA_ENVIADA: 0,
      NEGOCIACION: 0, CERRADO_GANADO: 0, CERRADO_PERDIDO: 0,
    }
    for (const quote of filteredQuotes) counts[quote.stage || 'NUEVO']++
    return counts
  }, [filteredQuotes])

  function onDragStart(quoteId: string) {
    setDraggingQuoteId(quoteId)
  }

  async function onDropStage(nextStage: LeadStage) {
    if (!draggingQuoteId) return

    const current = quotes.find((q) => q._id === draggingQuoteId)
    if (!current || (current.stage || 'NUEVO') === nextStage) {
      setDraggingQuoteId(null)
      return
    }

    const snapshot = quotes
    setQuotes((prev) => prev.map((q) => (q._id === draggingQuoteId ? { ...q, stage: nextStage } : q)))
    setSavingQuoteId(draggingQuoteId)

    try {
      const response = await quotesApi.updateStage(draggingQuoteId, nextStage)
      setQuotes((prev) => prev.map((q) => (q._id === draggingQuoteId ? response.data : q)))
      const refreshed = await quotesApi.crmKpis()
      setKpis(refreshed.data)
      setToast('Etapa actualizada')
    } catch (err) {
      setQuotes(snapshot)
      setToast(err instanceof Error ? err.message : 'No se pudo mover el lead')
    } finally {
      setSavingQuoteId(null)
      setDraggingQuoteId(null)
    }
  }

  async function addNote(quoteId: string) {
    const message = (noteDraftById[quoteId] || '').trim()
    if (!message) return

    setSavingQuoteId(quoteId)
    try {
      const response = await quotesApi.addNote(quoteId, message)
      setQuotes((prev) => prev.map((q) => (q._id === quoteId ? response.data : q)))
      setNoteDraftById((prev) => ({ ...prev, [quoteId]: '' }))
      setToast('Nota guardada')
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'No se pudo guardar la nota')
    } finally {
      setSavingQuoteId(null)
    }
  }

  function applyTimelineToQuote(quoteId: string, timeline: Pick<CrmTimeline, 'tasks' | 'activities' | 'notes'>) {
    setQuotes((prev) => prev.map((q) => (
      q._id === quoteId
        ? {
            ...q,
            crm: {
              ...(q.crm || {}),
              tasks: timeline.tasks || [],
              activities: timeline.activities || [],
              notes: timeline.notes || [],
            },
          }
        : q
    )))
  }

  async function addTask(quoteId: string) {
    const title = (taskDraftById[quoteId] || '').trim()
    if (!title) return

    const dueAt = taskDueDateById[quoteId] || undefined

    setSavingQuoteId(quoteId)
    try {
      const response = await quotesApi.addTask(quoteId, { title, dueAt })
      applyTimelineToQuote(quoteId, response.data)
      setTaskDraftById((prev) => ({ ...prev, [quoteId]: '' }))
      setTaskDueDateById((prev) => ({ ...prev, [quoteId]: '' }))
      setToast('Tarea creada')
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'No se pudo crear la tarea')
    } finally {
      setSavingQuoteId(null)
    }
  }

  async function toggleTask(quoteId: string, taskId: string, status: 'pendiente' | 'completada') {
    setSavingQuoteId(quoteId)
    try {
      const nextStatus = status === 'completada' ? 'pendiente' : 'completada'
      const response = await quotesApi.updateTask(quoteId, taskId, nextStatus)
      applyTimelineToQuote(quoteId, response.data)
      setToast(nextStatus === 'completada' ? 'Tarea completada' : 'Tarea reabierta')
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'No se pudo actualizar la tarea')
    } finally {
      setSavingQuoteId(null)
    }
  }

  if (loading) {
    return <div className="theme-dashboard-muted text-sm">Cargando CRM...</div>
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-600">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="theme-dashboard-muted text-xs uppercase tracking-[0.2em]">CRM Comercial</p>
            <h1 className="theme-dashboard-text text-2xl font-semibold">Pipeline de Leads</h1>
            <p className="theme-dashboard-muted mt-1 text-sm">Gestiona el avance comercial desde cotizacion hasta cierre.</p>
          </div>
        </div>

        {/* Barra de filtros */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            placeholder="Buscar por nombre, empresa o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="theme-dashboard-input min-w-[220px] flex-1 rounded-lg px-3 py-2 text-sm outline-none focus:border-[color:var(--dashboard-accent)]"
          />
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="theme-dashboard-input rounded-lg px-3 py-2 text-sm outline-none focus:border-[color:var(--dashboard-accent)]"
          >
            <option value="">Todos los servicios</option>
            {serviceTypes.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value as 'all' | 'high' | 'medium')}
            className="theme-dashboard-input rounded-lg px-3 py-2 text-sm outline-none focus:border-[color:var(--dashboard-accent)]"
          >
            <option value="all">Todos los scores</option>
            <option value="high">Score alto (≥70)</option>
            <option value="medium">Score medio (40-69)</option>
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearchQuery(''); setFilterService(''); setFilterScore('all') }}
              className="rounded-lg border theme-dashboard-border theme-dashboard-muted px-3 py-2 text-sm hover:theme-dashboard-text transition-colors"
            >
              Limpiar filtros
            </button>
          )}
          {hasFilters && (
            <span className="theme-dashboard-muted text-xs">
              {filteredQuotes.length} de {quotes.length} leads
            </span>
          )}
        </div>
      </header>

      {/* KPI row */}
      <section className="grid gap-3 md:grid-cols-5">
        <article className="theme-dashboard-card rounded-xl border p-4">
          <p className="theme-dashboard-muted text-xs uppercase tracking-wide">Tasa de conversion</p>
          <p className="theme-dashboard-text mt-2 text-3xl font-semibold">{kpis.conversionRate}%</p>
          <p className="theme-dashboard-muted mt-1 text-xs">{kpis.wonLeads} ganados de {kpis.totalLeads} leads</p>
        </article>
        <article className="theme-dashboard-card rounded-xl border p-4">
          <p className="theme-dashboard-muted text-xs uppercase tracking-wide">Valor pipeline</p>
          <p className="theme-dashboard-text mt-2 text-3xl font-semibold">{money(kpis.pipelineValue)}</p>
          <p className="theme-dashboard-muted mt-1 text-xs">Excluye cerrados ganados y perdidos</p>
        </article>
        <article className="theme-dashboard-card rounded-xl border p-4">
          <p className="theme-dashboard-muted text-xs uppercase tracking-wide">Leads activos</p>
          <p className="theme-dashboard-text mt-2 text-3xl font-semibold">{kpis.totalLeads}</p>
          <p className="theme-dashboard-muted mt-1 text-xs">Lectura en tiempo real del pipeline</p>
        </article>
        <article className="theme-dashboard-card rounded-xl border p-4">
          <p className="theme-dashboard-muted text-xs uppercase tracking-wide">Tareas vencidas</p>
          <p className="mt-2 text-3xl font-semibold text-rose-500">{kpis.overdueTasks}</p>
          <p className="theme-dashboard-muted mt-1 text-xs">Pendientes: {kpis.pendingTasks}</p>
        </article>
        <article className="theme-dashboard-card rounded-xl border p-4">
          <p className="theme-dashboard-muted text-xs uppercase tracking-wide">SLA comercial</p>
          <p className="theme-dashboard-text mt-2 text-3xl font-semibold">{kpis.slaComplianceRate}%</p>
          <p className="theme-dashboard-muted mt-1 text-xs">Leads estancados: {kpis.stalledLeads}</p>
        </article>
      </section>

      {/* Alerts + Aging */}
      <section className="grid gap-3 lg:grid-cols-2">
        <article className="theme-dashboard-card rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="theme-dashboard-text text-sm font-semibold">Alertas comerciales</p>
            <span className="theme-dashboard-muted text-xs">Top {kpis.alerts.length}</span>
          </div>
          <div className="space-y-2">
            {kpis.alerts.length === 0 && <p className="theme-dashboard-muted text-xs">Sin alertas criticas por ahora.</p>}
            {kpis.alerts.map((alert) => (
              <div key={alert.quoteId} className="theme-dashboard-surface-2 rounded-lg border theme-dashboard-border px-3 py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="theme-dashboard-text font-medium">{alert.leadName}</span>
                  <span className={[
                    'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide',
                    alert.severity === 'high' ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-500/15 text-amber-600',
                  ].join(' ')}>
                    {alert.severity}
                  </span>
                </div>
                <p className="theme-dashboard-muted mt-1">{alert.stage} · {alert.ageHours}h · {alert.overdueTasks} tareas vencidas</p>
              </div>
            ))}
          </div>
        </article>

        <article className="theme-dashboard-card rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="theme-dashboard-text text-sm font-semibold">Aging por etapa</p>
            <span className="theme-dashboard-muted text-xs">Promedio en dias</span>
          </div>
          <div className="space-y-2">
            {STAGES.map((stage) => (
              <div key={stage.id} className="theme-dashboard-surface-2 rounded-lg border theme-dashboard-border px-3 py-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="theme-dashboard-text">{stage.label}</span>
                  <span className="theme-dashboard-muted">{kpis.agingByStage[stage.id]?.avgDays || 0} d</span>
                </div>
                <p className="theme-dashboard-muted mt-1">{kpis.agingByStage[stage.id]?.count || 0} leads · max {kpis.agingByStage[stage.id]?.maxDays || 0} d</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* Kanban board */}
      <section className="overflow-x-auto pb-2">
        <div className="flex min-w-[1320px] gap-4">
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropStage(stage.id)}
              className="w-[330px] shrink-0 rounded-2xl border theme-dashboard-border bg-[var(--dashboard-bg)] p-3"
            >
              {/* Stage header */}
              <div className={`rounded-xl border theme-dashboard-border bg-gradient-to-br p-3 ${stage.accent}`}>
                <div className="flex items-center justify-between">
                  <h2 className="theme-dashboard-text text-sm font-semibold">{stage.label}</h2>
                  <span className="rounded-full border theme-dashboard-border theme-dashboard-muted px-2 py-0.5 text-xs">
                    {leadsByStage[stage.id]}
                  </span>
                </div>
                <p className="theme-dashboard-muted mt-1 text-xs">{stage.hint}</p>
              </div>

              {/* Lead cards */}
              <div className="mt-3 space-y-3">
                {quotesByStage[stage.id].map((quote) => {
                  const hasProject = Boolean(quote.project?._id)
                  const notes = quote.crm?.notes || []
                  const latestNote = notes.length > 0 ? notes[notes.length - 1] : null
                  const activities = quote.crm?.activities || []
                  const tasks = quote.crm?.tasks || []
                  const openTasks = tasks.filter((task) => task.status === 'pendiente')
                  const overdueTasks = openTasks.filter((task) => task.dueAt && new Date(task.dueAt).getTime() < Date.now())

                  return (
                    <article
                      key={quote._id}
                      draggable={savingQuoteId !== quote._id}
                      onDragStart={() => onDragStart(quote._id)}
                      className="theme-dashboard-card rounded-xl border p-3 shadow-sm transition hover:border-[color:var(--dashboard-accent)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="theme-dashboard-text text-sm font-semibold">{quote.client.name}</p>
                          <p className="theme-dashboard-muted text-xs">{quote.client.company || quote.client.email}</p>
                        </div>
                        <span className="rounded-md bg-[var(--dashboard-accent)]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--dashboard-accent)]">
                          {quote.serviceType}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="theme-dashboard-surface-2 rounded-lg border theme-dashboard-border px-2 py-1.5">
                          <p className="theme-dashboard-muted">Valor</p>
                          <p className="theme-dashboard-text font-semibold">{money(quote.pricing.total)}</p>
                        </div>
                        <div className="theme-dashboard-surface-2 rounded-lg border theme-dashboard-border px-2 py-1.5">
                          <p className="theme-dashboard-muted">Lead score</p>
                          <p className="theme-dashboard-text font-semibold">{quote.leadScore}/100</p>
                        </div>
                      </div>

                      <div className="theme-dashboard-muted mt-2 text-[11px]">
                        Creado: {new Date(quote.createdAt).toLocaleDateString('es-CO')}
                      </div>
                      <div className="theme-dashboard-muted mt-1 text-[11px]">
                        Actividad: {activities.length} eventos · Tareas abiertas: {openTasks.length} · Vencidas: {overdueTasks.length}
                      </div>
                      {hasProject && (
                        <div className="mt-1 text-[11px] text-emerald-600">Proyecto vinculado: {quote.project?.title}</div>
                      )}

                      {/* Nota comercial */}
                      <div className="mt-3 theme-dashboard-surface-2 rounded-lg border theme-dashboard-border p-2">
                        <p className="theme-dashboard-muted mb-1 text-[11px] font-semibold uppercase tracking-wide">Nota comercial</p>
                        {latestNote && (
                          <p className="theme-dashboard-muted mb-2 text-[11px]">
                            Ultima: {latestNote.message}
                          </p>
                        )}
                        <textarea
                          value={noteDraftById[quote._id] || ''}
                          onChange={(e) => setNoteDraftById((prev) => ({ ...prev, [quote._id]: e.target.value }))}
                          rows={2}
                          placeholder="Agregar contexto de la oportunidad..."
                          className="theme-dashboard-input w-full resize-none rounded-md px-2 py-1 text-xs outline-none focus:border-[color:var(--dashboard-accent)]"
                        />
                        <button
                          type="button"
                          disabled={savingQuoteId === quote._id}
                          onClick={() => addNote(quote._id)}
                          className="theme-dashboard-button mt-2 w-full rounded-md px-2 py-1.5 text-xs font-medium transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Guardar nota
                        </button>
                      </div>

                      {/* Tareas */}
                      <div className="mt-3 theme-dashboard-surface-2 rounded-lg border theme-dashboard-border p-2">
                        <p className="theme-dashboard-muted mb-1 text-[11px] font-semibold uppercase tracking-wide">Tareas comerciales</p>
                        <div className="space-y-1">
                          {tasks.slice(-3).reverse().map((task) => {
                            const isOverdue = task.status === 'pendiente' && task.dueAt && new Date(task.dueAt) < new Date()
                            return (
                              <button
                                key={task._id}
                                type="button"
                                onClick={() => toggleTask(quote._id, task._id, task.status)}
                                className="theme-dashboard-surface flex w-full flex-col rounded-md border theme-dashboard-border px-2 py-1 text-left text-[11px] theme-dashboard-text hover:border-[color:var(--dashboard-accent)]"
                              >
                                <div className="flex w-full items-center justify-between">
                                  <span className={task.status === 'completada' ? 'line-through opacity-60' : ''}>{task.title}</span>
                                  <span className="theme-dashboard-muted text-[10px] uppercase tracking-wide">{task.status}</span>
                                </div>
                                {task.dueAt && (
                                  <span className={`mt-0.5 text-[10px] ${isOverdue ? 'text-rose-500' : 'theme-dashboard-muted'}`}>
                                    {isOverdue ? '⚠ ' : ''}Vence: {new Date(task.dueAt).toLocaleDateString('es-CO')}
                                  </span>
                                )}
                              </button>
                            )
                          })}
                          {tasks.length === 0 && <p className="theme-dashboard-muted text-[11px]">Sin tareas aun.</p>}
                        </div>
                        <div className="mt-2 space-y-1.5">
                          <input
                            value={taskDraftById[quote._id] || ''}
                            onChange={(e) => setTaskDraftById((prev) => ({ ...prev, [quote._id]: e.target.value }))}
                            placeholder="Nueva tarea"
                            className="theme-dashboard-input w-full rounded-md px-2 py-1 text-xs outline-none focus:border-[color:var(--dashboard-accent)]"
                          />
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={taskDueDateById[quote._id] || ''}
                              onChange={(e) => setTaskDueDateById((prev) => ({ ...prev, [quote._id]: e.target.value }))}
                              className="theme-dashboard-input w-full rounded-md px-2 py-1 text-xs outline-none focus:border-[color:var(--dashboard-accent)]"
                            />
                            <button
                              type="button"
                              disabled={savingQuoteId === quote._id}
                              onClick={() => addTask(quote._id)}
                              className="theme-dashboard-button rounded-md px-2 py-1 text-xs hover:opacity-90 disabled:opacity-50"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}

                {quotesByStage[stage.id].length === 0 && (
                  <div className="rounded-xl border border-dashed theme-dashboard-border theme-dashboard-muted px-3 py-6 text-center text-xs">
                    Arrastra leads aqui
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {toast && (
        <div className="theme-dashboard-card fixed bottom-6 right-6 rounded-lg border px-4 py-2 text-sm theme-dashboard-text shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
