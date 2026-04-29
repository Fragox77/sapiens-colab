'use client'

import { useEffect, useMemo, useState } from 'react'
import { adminApi, metricsApi, projectsApi } from '@/lib/api'
import { TemplateOverviewChart, TemplateRadialBreakdown } from '@/components/ui/template/Charts'
import { CollaboratorRanking } from '@/components/dashboard/CollaboratorRanking'
import { MetricsDashboard, type Periodo } from '@/components/dashboard/MetricsDashboard'
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

  const periodo: Periodo = preset === '7d' ? 'semana' : preset === '90d' ? 'trimestre' : 'mes'

  const pending = projects.filter(p => p.status === 'cotizado')
  const active = projects.filter(p => ['activo', 'revision', 'ajuste'].includes(p.status))
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
          <h1 className="theme-dashboard-text text-3xl font-extrabold">Panel de administración</h1>
          <p className="theme-dashboard-muted mt-1 text-sm">Centro operativo y analítico SAPIENS COLAB</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', '90d', 'custom'] as Preset[]).map((item) => (
            <button
              key={item}
              onClick={() => setPreset(item)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                preset === item
                  ? 'bg-[#4C58FF] text-white shadow-[0_8px_20px_rgba(76,88,255,0.35)]'
                  : 'theme-dashboard-surface theme-dashboard-muted border theme-dashboard-border hover:bg-[var(--dashboard-surface-2)]'
              }`}
            >
              {item === 'custom' ? 'Personalizado' : item.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {preset === 'custom' && (
        <div className="theme-dashboard-border theme-dashboard-surface mb-6 flex flex-wrap items-center gap-2 rounded-xl border p-3">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="theme-dashboard-input rounded-lg px-3 py-2 text-sm"
          />
          <span className="theme-dashboard-muted text-xs">a</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="theme-dashboard-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}

      {(loading || metricsLoading) ? (
        <div className="theme-dashboard-muted text-sm">Cargando métricas...</div>
      ) : (
        <>
          {metricsError && (
            <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-semantic-danger">
              {metricsError}
            </div>
          )}

          {dashboard && (
            <MetricsDashboard
              dashboard={dashboard}
              prevDashboard={prevDashboard}
              avgProjectDays={avgProjectDays}
              avgRevisions={avgRevisions}
              periodo={periodo}
            />
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
              <h2 className="theme-dashboard-text mb-3 flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                Por asignar ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map(p => (
                  <div key={p._id} className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="theme-dashboard-text font-semibold">{p.title}</div>
                        <div className="theme-dashboard-muted mt-1 text-sm">
                          {typeof p.client === 'object' ? p.client.name : '—'} · {p.serviceType} · Nivel mín. {p.minDesignerLevel}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="theme-dashboard-text font-bold">{fmt(p.pricing.total)}</div>
                        <div className="theme-dashboard-muted text-xs">Pago diseñador: {fmt(p.pricing.designerPay)}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <select
                        className="theme-dashboard-input flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C58FF]"
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
                        className="theme-dashboard-button rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-[#5A66FF] disabled:opacity-60"
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
              <h2 className="theme-dashboard-text mb-3 flex items-center gap-2 font-semibold">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                En producción ({active.length})
              </h2>
              <div className="space-y-2">
                {active.map(p => (
                  <a key={p._id} href={`/admin/proyectos/${p._id}`}
                    className="theme-dashboard-border theme-dashboard-surface flex items-center justify-between rounded-xl border p-4 transition-colors hover:border-[#4C58FF]/40">
                    <div>
                      <div className="theme-dashboard-text text-sm font-medium">{p.title}</div>
                      <div className="theme-dashboard-muted mt-0.5 text-xs">
                        {typeof p.designer === 'object' && p.designer ? p.designer.name : 'Sin asignar'} · Rev. {p.revisions.used}/{p.revisions.max}
                      </div>
                    </div>
                    <span className="theme-dashboard-muted text-xs font-medium capitalize">{p.status}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {prevDashboard && (
            <p className="theme-dashboard-muted mt-8 text-xs">
              Comparativos calculados contra un periodo anterior equivalente.
            </p>
          )}
        </>
      )}
    </div>
  )
}
