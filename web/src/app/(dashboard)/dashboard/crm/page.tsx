'use client'

import { useEffect, useMemo, useState } from 'react'
import { quotesApi } from '@/lib/api'
import type { CrmKpis, CrmTimeline, LeadStage, Quote } from '@/types'

const STAGES: Array<{ id: LeadStage; label: string; hint: string; accent: string }> = [
  { id: 'NUEVO', label: 'Nuevo', hint: 'Lead recien capturado', accent: 'from-cyan-500/25 to-cyan-400/5' },
  { id: 'CONTACTO_INICIAL', label: 'Contacto inicial', hint: 'Primera conversacion activa', accent: 'from-blue-500/25 to-blue-400/5' },
  { id: 'PROPUESTA_ENVIADA', label: 'Propuesta enviada', hint: 'Oferta economica entregada', accent: 'from-violet-500/25 to-violet-400/5' },
  { id: 'NEGOCIACION', label: 'Negociacion', hint: 'Ajuste de alcance y condiciones', accent: 'from-amber-500/25 to-amber-400/5' },
  { id: 'CERRADO_GANADO', label: 'Cerrado ganado', hint: 'Convertido a cliente', accent: 'from-emerald-500/25 to-emerald-400/5' },
  { id: 'CERRADO_PERDIDO', label: 'Cerrado perdido', hint: 'No avanza en este ciclo', accent: 'from-rose-500/25 to-rose-400/5' },
]

const EMPTY_KPIS: CrmKpis = {
  totalLeads: 0,
  wonLeads: 0,
  conversionRate: 0,
  pipelineValue: 0,
  leadsByStage: {
    NUEVO: 0,
    CONTACTO_INICIAL: 0,
    PROPUESTA_ENVIADA: 0,
    NEGOCIACION: 0,
    CERRADO_GANADO: 0,
    CERRADO_PERDIDO: 0,
  },
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
  const [toast, setToast] = useState('')

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

  const quotesByStage = useMemo(() => {
    const grouped: Record<LeadStage, Quote[]> = {
      NUEVO: [],
      CONTACTO_INICIAL: [],
      PROPUESTA_ENVIADA: [],
      NEGOCIACION: [],
      CERRADO_GANADO: [],
      CERRADO_PERDIDO: [],
    }

    for (const quote of quotes) {
      const stage = quote.stage || 'NUEVO'
      grouped[stage].push(quote)
    }

    return grouped
  }, [quotes])

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

    setSavingQuoteId(quoteId)
    try {
      const response = await quotesApi.addTask(quoteId, { title })
      applyTimelineToQuote(quoteId, response.data)
      setTaskDraftById((prev) => ({ ...prev, [quoteId]: '' }))
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
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/80">CRM Comercial</p>
          <h1 className="theme-dashboard-text text-2xl font-semibold">Pipeline de Leads</h1>
          <p className="theme-dashboard-muted mt-1 text-sm">Gestiona el avance comercial desde cotizacion hasta cierre.</p>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border theme-dashboard-border bg-white/5 p-4 backdrop-blur">
          <p className="theme-dashboard-muted text-xs uppercase tracking-wide">Tasa de conversion</p>
          <p className="theme-dashboard-text mt-2 text-3xl font-semibold">{kpis.conversionRate}%</p>
          <p className="theme-dashboard-muted mt-1 text-xs">{kpis.wonLeads} ganados de {kpis.totalLeads} leads</p>
        </article>
        <article className="rounded-xl border theme-dashboard-border bg-white/5 p-4 backdrop-blur">
          <p className="theme-dashboard-muted text-xs uppercase tracking-wide">Valor pipeline</p>
          <p className="theme-dashboard-text mt-2 text-3xl font-semibold">{money(kpis.pipelineValue)}</p>
          <p className="theme-dashboard-muted mt-1 text-xs">Excluye cerrados ganados y perdidos</p>
        </article>
        <article className="rounded-xl border theme-dashboard-border bg-white/5 p-4 backdrop-blur">
          <p className="theme-dashboard-muted text-xs uppercase tracking-wide">Leads activos</p>
          <p className="theme-dashboard-text mt-2 text-3xl font-semibold">{kpis.totalLeads}</p>
          <p className="theme-dashboard-muted mt-1 text-xs">Lectura en tiempo real del pipeline</p>
        </article>
      </section>

      <section className="overflow-x-auto pb-2">
        <div className="flex min-w-[1320px] gap-4">
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropStage(stage.id)}
              className="w-[330px] shrink-0 rounded-2xl border theme-dashboard-border bg-slate-950/50 p-3"
            >
              <div className={`rounded-xl border border-white/10 bg-gradient-to-br p-3 ${stage.accent}`}>
                <div className="flex items-center justify-between">
                  <h2 className="theme-dashboard-text text-sm font-semibold">{stage.label}</h2>
                  <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-slate-100">
                    {kpis.leadsByStage[stage.id] || 0}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300/90">{stage.hint}</p>
              </div>

              <div className="mt-3 space-y-3">
                {quotesByStage[stage.id].map((quote) => {
                  const hasProject = Boolean(quote.project?._id)
                  const notes = quote.crm?.notes || []
                  const latestNote = notes.length > 0 ? notes[notes.length - 1] : null
                  const activities = quote.crm?.activities || []
                  const tasks = quote.crm?.tasks || []
                  const openTasks = tasks.filter((task) => task.status === 'pendiente')

                  return (
                    <article
                      key={quote._id}
                      draggable={savingQuoteId !== quote._id}
                      onDragStart={() => onDragStart(quote._id)}
                      className="rounded-xl border border-white/10 bg-slate-900/75 p-3 shadow-lg transition hover:border-cyan-300/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="theme-dashboard-text text-sm font-semibold">{quote.client.name}</p>
                          <p className="theme-dashboard-muted text-xs">{quote.client.company || quote.client.email}</p>
                        </div>
                        <span className="rounded-md bg-cyan-400/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                          {quote.serviceType}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                          <p className="theme-dashboard-muted">Valor</p>
                          <p className="theme-dashboard-text font-semibold">{money(quote.pricing.total)}</p>
                        </div>
                        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5">
                          <p className="theme-dashboard-muted">Lead score</p>
                          <p className="theme-dashboard-text font-semibold">{quote.leadScore}/100</p>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-300/90">
                        Creado: {new Date(quote.createdAt).toLocaleDateString('es-CO')}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-300/80">
                        Actividad: {activities.length} eventos · Tareas abiertas: {openTasks.length}
                      </div>
                      {hasProject && (
                        <div className="mt-1 text-[11px] text-emerald-200">Proyecto vinculado: {quote.project?.title}</div>
                      )}

                      <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-2">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">Nota comercial</p>
                        {latestNote && (
                          <p className="mb-2 text-[11px] text-slate-200">
                            Ultima: {latestNote.message}
                          </p>
                        )}
                        <textarea
                          value={noteDraftById[quote._id] || ''}
                          onChange={(e) => setNoteDraftById((prev) => ({ ...prev, [quote._id]: e.target.value }))}
                          rows={2}
                          placeholder="Agregar contexto de la oportunidad..."
                          className="w-full resize-none rounded-md border border-white/15 bg-slate-900/60 px-2 py-1 text-xs text-slate-100 outline-none placeholder:text-slate-400 focus:border-cyan-300/60"
                        />
                        <button
                          type="button"
                          disabled={savingQuoteId === quote._id}
                          onClick={() => addNote(quote._id)}
                          className="mt-2 w-full rounded-md border border-cyan-300/30 bg-cyan-400/15 px-2 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Guardar nota
                        </button>
                      </div>

                      <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-2">
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-300">Tareas comerciales</p>
                        <div className="space-y-1">
                          {tasks.slice(-3).reverse().map((task) => (
                            <button
                              key={task._id}
                              type="button"
                              onClick={() => toggleTask(quote._id, task._id, task.status)}
                              className="flex w-full items-center justify-between rounded-md border border-white/10 px-2 py-1 text-left text-[11px] text-slate-200 hover:border-cyan-300/30"
                            >
                              <span className={task.status === 'completada' ? 'line-through opacity-60' : ''}>{task.title}</span>
                              <span className="text-[10px] uppercase tracking-wide text-slate-400">{task.status}</span>
                            </button>
                          ))}
                          {tasks.length === 0 && <p className="text-[11px] text-slate-400">Sin tareas aun.</p>}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <input
                            value={taskDraftById[quote._id] || ''}
                            onChange={(e) => setTaskDraftById((prev) => ({ ...prev, [quote._id]: e.target.value }))}
                            placeholder="Nueva tarea"
                            className="w-full rounded-md border border-white/15 bg-slate-900/60 px-2 py-1 text-xs text-slate-100 outline-none placeholder:text-slate-400 focus:border-cyan-300/60"
                          />
                          <button
                            type="button"
                            disabled={savingQuoteId === quote._id}
                            onClick={() => addTask(quote._id)}
                            className="rounded-md border border-cyan-300/30 bg-cyan-400/15 px-2 py-1 text-xs text-cyan-100 hover:bg-cyan-300/25 disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}

                {quotesByStage[stage.id].length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-6 text-center text-xs text-slate-400">
                    Arrastra leads aqui
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-lg border border-cyan-300/30 bg-slate-900/95 px-4 py-2 text-sm text-cyan-100 shadow-xl">
          {toast}
        </div>
      )}
    </div>
  )
}
