'use client'

import { useEffect, useMemo, useState } from 'react'
import { adminApi, metricsApi, projectsApi } from '@/lib/api'
import { TemplateCard } from '@/components/ui/template/Cards'
import { TemplateOverviewChart, TemplateRadialBreakdown } from '@/components/ui/template/Charts'
import { CollaboratorRanking } from '@/components/dashboard/CollaboratorRanking'
import type { DashboardMetrics, Project, User } from '@/types'

type Preset = '7d' | '30d' | '90d' | 'custom'
type Range = { from: Date; to: Date }

function resolveRange(preset: Preset, customFrom: string, customTo: string): Range {
  const to = new Date()
  if (preset === 'custom' && customFrom && customTo) {
    return { from: new Date(customFrom), to: new Date(customTo) }
  }

  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30
  return { from: new Date(to.getTime() - days * 24 * 60 * 60 * 1000), to }
}

function previousRange(current: Range): Range {
  const duration = current.to.getTime() - current.from.getTime()
  const prevTo = new Date(current.from.getTime() - 1)
  const prevFrom = new Date(prevTo.getTime() - duration)
  return { from: prevFrom, to: prevTo }
}

function calcDelta(current: number, prev: number) {
  if (!Number.isFinite(prev) || prev === 0) return null
  return ((current - prev) / prev) * 100
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

export default function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [designers, setDesigners] = useState<User[]>([])
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null)

  const [prevDashboard, setPrevDashboard] = useState<DashboardMetrics | null>(null)

  const [loading, setLoading] = useState(true)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [metricsError, setMetricsError] = useState('')
  const [assigning, setAssigning] = useState<string | null>(null)
  const [selectedDesigner, setSelectedDesigner] = useState<Record<string, string>>({})

  const [preset, setPreset] = useState<Preset>('30d')
  const defaultTo = useMemo(() => new Date(), [])
  const defaultFrom = useMemo(() => new Date(defaultTo.getTime() - 30 * 24 * 60 * 60 * 1000), [defaultTo])
  const [customFrom, setCustomFrom] = useState(toInputDate(defaultFrom))
  const [customTo, setCustomTo] = useState(toInputDate(defaultTo))

  const currentRange = useMemo(
    () => resolveRange(preset, customFrom, customTo),
    [preset, customFrom, customTo]
  )

  const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

  async function loadMetrics(range: Range) {
    setMetricsLoading(true)
    setMetricsError('')
    const prevRange = previousRange(range)

    try {
      const [mResult, mPrevResult] = await Promise.allSettled([
        metricsApi.dashboard({ from: range.from.toISOString(), to: range.to.toISOString() }),
        metricsApi.dashboard({ from: prevRange.from.toISOString(), to: prevRange.to.toISOString() }),
      ])

      if (mResult.status === 'fulfilled') {
        setDashboard(mResult.value)
      } else {
        setMetricsError(mResult.reason instanceof Error ? mResult.reason.message : 'No se pudieron cargar las metricas.')
      }

      if (mPrevResult.status === 'fulfilled') {
        setPrevDashboard(mPrevResult.value)
      }
    } finally {
      setMetricsLoading(false)
    }
  }

  useEffect(() => {
    Promise.all([projectsApi.list(), adminApi.designers()])
      .then(([p, d]) => {
        setProjects(p as Project[])
        setDesigners(d as User[])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadMetrics(currentRange)
  }, [currentRange])

  async function assign(projectId: string) {
    const designerId = selectedDesigner[projectId]
    if (!designerId) return alert('Selecciona un diseñador primero')
    setAssigning(projectId)
    try {
      await adminApi.assign(projectId, designerId)
      const updatedProjects = await projectsApi.list()
      setProjects(updatedProjects)
      await loadMetrics(currentRange)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setAssigning(null)
    }
  }

  const pending = projects.filter(p => p.status === 'cotizado')
  const active = projects.filter(p => ['activo', 'revision', 'ajuste'].includes(p.status))
  const topPerformer = dashboard?.talent.topPerformers?.[0]
  const avgRevisions = projects.length > 0
    ? Math.round((projects.reduce((sum, p) => sum + (p.revisions?.used || 0), 0) / projects.length) * 10) / 10
    : 0
  const completedDurations = projects
    .filter((p) => Boolean(p.completedAt))
    .map((p) => {
      const start = new Date(p.createdAt).getTime()
      const end = new Date(p.completedAt as string).getTime()
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null
      return (end - start) / (1000 * 60 * 60 * 24)
    })
    .filter((days): days is number => days !== null)
  const avgProjectDays = completedDurations.length > 0
    ? Math.round((completedDurations.reduce((sum, d) => sum + d, 0) / completedDurations.length) * 10) / 10
    : 0

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Panel de administración</h1>
          <p className="mt-1 text-sm text-slate-400">Centro operativo y analítico SAPIENS COLAB</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', '90d', 'custom'] as Preset[]).map((item) => (
            <button
              key={item}
              onClick={() => setPreset(item)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                preset === item
                  ? 'bg-[#4C58FF] text-white shadow-[0_8px_20px_rgba(76,88,255,0.35)]'
                  : 'bg-[#131B31] text-slate-300 border border-[#2F3A5C] hover:bg-[#18233F]'
              }`}
            >
              {item === 'custom' ? 'Personalizado' : item.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {preset === 'custom' && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-[#2F3A5C] bg-[#121A2F] p-3">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border border-[#334167] bg-[#0F172A] px-3 py-2 text-sm text-slate-200"
          />
          <span className="text-xs text-slate-500">a</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border border-[#334167] bg-[#0F172A] px-3 py-2 text-sm text-slate-200"
          />
        </div>
      )}

      {(loading || metricsLoading) ? (
        <div className="text-slate-400 text-sm">Cargando métricas...</div>
      ) : (
        <>
          {metricsError && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {metricsError}
            </div>
          )}

          {dashboard && (
            <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
              <TemplateCard
                title="Ingresos totales"
                value={fmt(dashboard.business.revenueTotal)}
                hint="Negocio"
                delta={
                  calcDelta(dashboard.business.revenueTotal, prevDashboard?.business.revenueTotal || 0) !== null
                    ? `${(calcDelta(dashboard.business.revenueTotal, prevDashboard?.business.revenueTotal || 0) || 0) > 0 ? '+' : ''}${Math.round((calcDelta(dashboard.business.revenueTotal, prevDashboard?.business.revenueTotal || 0) || 0) * 10) / 10}%`
                    : undefined
                }
              />
              <TemplateCard
                title="Valor promedio"
                value={fmt(dashboard.business.averageTicket)}
                hint="Negocio"
                delta={
                  calcDelta(dashboard.business.averageTicket, prevDashboard?.business.averageTicket || 0) !== null
                    ? `${(calcDelta(dashboard.business.averageTicket, prevDashboard?.business.averageTicket || 0) || 0) > 0 ? '+' : ''}${Math.round((calcDelta(dashboard.business.averageTicket, prevDashboard?.business.averageTicket || 0) || 0) * 10) / 10}%`
                    : undefined
                }
              />
              <TemplateCard
                title="Margen"
                value={`${dashboard.business.marginPct}%`}
                hint="Negocio"
                delta={
                  calcDelta(dashboard.business.marginPct, prevDashboard?.business.marginPct || 0) !== null
                    ? `${(calcDelta(dashboard.business.marginPct, prevDashboard?.business.marginPct || 0) || 0) > 0 ? '+' : ''}${Math.round((calcDelta(dashboard.business.marginPct, prevDashboard?.business.marginPct || 0) || 0) * 10) / 10}%`
                    : undefined
                }
              />
              <TemplateCard
                title="Proyectos activos"
                value={String(dashboard.operation.activeProjects)}
                hint="Operación"
                delta={
                  calcDelta(dashboard.operation.activeProjects, prevDashboard?.operation.activeProjects || 0) !== null
                    ? `${(calcDelta(dashboard.operation.activeProjects, prevDashboard?.operation.activeProjects || 0) || 0) > 0 ? '+' : ''}${Math.round((calcDelta(dashboard.operation.activeProjects, prevDashboard?.operation.activeProjects || 0) || 0) * 10) / 10}%`
                    : undefined
                }
              />
              <TemplateCard
                title="Tasa finalización"
                value={`${dashboard.operation.completionRatePct}%`}
                hint="Operación"
                delta={
                  calcDelta(dashboard.operation.completionRatePct, prevDashboard?.operation.completionRatePct || 0) !== null
                    ? `${(calcDelta(dashboard.operation.completionRatePct, prevDashboard?.operation.completionRatePct || 0) || 0) > 0 ? '+' : ''}${Math.round((calcDelta(dashboard.operation.completionRatePct, prevDashboard?.operation.completionRatePct || 0) || 0) * 10) / 10}%`
                    : undefined
                }
              />
              <TemplateCard
                title="Entrega promedio"
                value={`${dashboard.operation.avgDeliveryDays} días`}
                hint="Eficiencia"
                delta={
                  calcDelta(prevDashboard?.operation.avgDeliveryDays || 0, dashboard.operation.avgDeliveryDays) !== null
                    ? `${(calcDelta(prevDashboard?.operation.avgDeliveryDays || 0, dashboard.operation.avgDeliveryDays) || 0) > 0 ? '+' : ''}${Math.round((calcDelta(prevDashboard?.operation.avgDeliveryDays || 0, dashboard.operation.avgDeliveryDays) || 0) * 10) / 10}%`
                    : undefined
                }
              />
              <TemplateCard
                title="Satisfacción"
                value={`${dashboard.client.satisfactionAvg}/5`}
                hint="Cliente"
                delta={
                  calcDelta(dashboard.client.satisfactionAvg, prevDashboard?.client.satisfactionAvg || 0) !== null
                    ? `${(calcDelta(dashboard.client.satisfactionAvg, prevDashboard?.client.satisfactionAvg || 0) || 0) > 0 ? '+' : ''}${Math.round((calcDelta(dashboard.client.satisfactionAvg, prevDashboard?.client.satisfactionAvg || 0) || 0) * 10) / 10}%`
                    : undefined
                }
              />
              <TemplateCard
                title="Recompra"
                value={`${dashboard.client.repurchaseRatePct}%`}
                hint="Cliente"
                delta={
                  calcDelta(dashboard.client.repurchaseRatePct, prevDashboard?.client.repurchaseRatePct || 0) !== null
                    ? `${(calcDelta(dashboard.client.repurchaseRatePct, prevDashboard?.client.repurchaseRatePct || 0) || 0) > 0 ? '+' : ''}${Math.round((calcDelta(dashboard.client.repurchaseRatePct, prevDashboard?.client.repurchaseRatePct || 0) || 0) * 10) / 10}%`
                    : undefined
                }
              />
            </div>
          )}

          {dashboard && (
            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
              <TemplateCard
                title="Colaborador más productivo"
                value={topPerformer ? `${topPerformer.performanceScore}` : '0'}
                hint={topPerformer ? `${topPerformer.name} · ${topPerformer.completedProjects} completados` : 'Sin datos aun'}
              />
              <TemplateCard
                title="Tiempo promedio por proyecto"
                value={`${avgProjectDays} días`}
                hint="Promedio real de proyectos completados"
              />
              <TemplateCard
                title="Promedio de revisiones"
                value={`${avgRevisions}`}
                hint="Cambios solicitados por proyecto"
              />
            </div>
          )}

          {dashboard && (
            <div className="grid gap-4 mb-8 lg:grid-cols-2">
              <TemplateOverviewChart
                data={dashboard.charts.weeklyEvolution}
                previousData={prevDashboard?.charts.weeklyEvolution || []}
              />
              <TemplateRadialBreakdown data={dashboard.charts.statusDistribution} />
            </div>
          )}

          {dashboard && (
            <div className="mb-8">
              <CollaboratorRanking data={dashboard.talent.topPerformers.slice(0, 6)} />
            </div>
          )}

          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-100">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                Por asignar ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map(p => (
                  <div key={p._id} className="rounded-xl border border-[#2F3A5C] bg-[#121A2F] p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="font-semibold text-slate-100">{p.title}</div>
                        <div className="mt-1 text-sm text-slate-400">
                          {typeof p.client === 'object' ? p.client.name : '—'} · {p.serviceType} · Nivel mín. {p.minDesignerLevel}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-100">{fmt(p.pricing.total)}</div>
                        <div className="text-xs text-slate-400">Pago diseñador: {fmt(p.pricing.designerPay)}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <select
                        className="flex-1 rounded-lg border border-[#334167] bg-[#0F172A] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#4C58FF]"
                        value={selectedDesigner[p._id] || ''}
                        onChange={e => setSelectedDesigner(prev => ({ ...prev, [p._id]: e.target.value }))}
                      >
                        <option value="">Selecciona diseñador...</option>
                        {designers
                          .filter(d => (d.level || 0) >= p.minDesignerLevel)
                          .map(d => (
                            <option key={d._id} value={d._id}>
                              {d.name} — Nivel {d.level} · {d.specialty}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => assign(p._id)}
                        disabled={assigning === p._id}
                        className="rounded-lg bg-[#4C58FF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5A66FF] disabled:opacity-60"
                      >
                        {assigning === p._id ? 'Asignando...' : 'Asignar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-slate-100">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                En producción ({active.length})
              </h2>
              <div className="space-y-2">
                {active.map(p => (
                  <a key={p._id} href={`/admin/proyectos/${p._id}`}
                    className="flex items-center justify-between rounded-xl border border-[#2F3A5C] bg-[#121A2F] p-4 transition-colors hover:border-[#4C58FF]/40">
                    <div>
                      <div className="text-sm font-medium text-slate-100">{p.title}</div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {typeof p.designer === 'object' && p.designer ? p.designer.name : 'Sin asignar'} · Rev. {p.revisions.used}/{p.revisions.max}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-300 capitalize">{p.status}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {prevDashboard && (
            <p className="mt-8 text-xs text-slate-500">
              Comparativos calculados contra un periodo anterior equivalente.
            </p>
          )}
        </>
      )}
    </div>
  )
}
