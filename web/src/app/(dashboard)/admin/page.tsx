'use client'

import { useEffect, useMemo, useState } from 'react'
import { adminApi, metricsApi, projectsApi } from '@/lib/api'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { StatusChart } from '@/components/dashboard/StatusChart'
import { WeeklyEvolutionChart } from '@/components/dashboard/WeeklyEvolutionChart'
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
    const prevRange = previousRange(range)

    try {
      const [m, mPrev] = await Promise.all([
        metricsApi.dashboard({ from: range.from.toISOString(), to: range.to.toISOString() }),
        metricsApi.dashboard({ from: prevRange.from.toISOString(), to: prevRange.to.toISOString() }),
      ])

      setDashboard(m)
      setPrevDashboard(mPrev)
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cobalt">Panel de administración</h1>
          <p className="text-sm text-gray-500 mt-1">Centro operativo y analítico SAPIENS COLAB</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', '90d', 'custom'] as Preset[]).map((item) => (
            <button
              key={item}
              onClick={() => setPreset(item)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                preset === item ? 'bg-cobalt text-white' : 'bg-white text-cobalt border border-gray-200'
              }`}
            >
              {item === 'custom' ? 'Personalizado' : item.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {preset === 'custom' && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-3">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <span className="text-xs text-gray-400">a</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      )}

      {(loading || metricsLoading) ? (
        <div className="text-gray-400 text-sm">Cargando métricas...</div>
      ) : (
        <>
          {dashboard && (
            <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
              <KpiCard
                label="Revenue total"
                value={fmt(dashboard.business.revenueTotal)}
                hint="Negocio"
                deltaPct={calcDelta(dashboard.business.revenueTotal, prevDashboard?.business.revenueTotal || 0)}
              />
              <KpiCard
                label="Ticket promedio"
                value={fmt(dashboard.business.averageTicket)}
                hint="Negocio"
                deltaPct={calcDelta(dashboard.business.averageTicket, prevDashboard?.business.averageTicket || 0)}
              />
              <KpiCard
                label="Margen"
                value={`${dashboard.business.marginPct}%`}
                hint="Negocio"
                deltaPct={calcDelta(dashboard.business.marginPct, prevDashboard?.business.marginPct || 0)}
              />
              <KpiCard
                label="Proyectos activos"
                value={String(dashboard.operation.activeProjects)}
                hint="Operación"
                deltaPct={calcDelta(dashboard.operation.activeProjects, prevDashboard?.operation.activeProjects || 0)}
              />
              <KpiCard
                label="Tasa finalización"
                value={`${dashboard.operation.completionRatePct}%`}
                hint="Operación"
                deltaPct={calcDelta(dashboard.operation.completionRatePct, prevDashboard?.operation.completionRatePct || 0)}
              />
              <KpiCard
                label="Entrega promedio"
                value={`${dashboard.operation.avgDeliveryDays} días`}
                hint="Eficiencia"
                deltaPct={calcDelta(prevDashboard?.operation.avgDeliveryDays || 0, dashboard.operation.avgDeliveryDays)}
              />
              <KpiCard
                label="Satisfacción"
                value={`${dashboard.client.satisfactionAvg}/5`}
                hint="Cliente"
                deltaPct={calcDelta(dashboard.client.satisfactionAvg, prevDashboard?.client.satisfactionAvg || 0)}
              />
              <KpiCard
                label="Recompra"
                value={`${dashboard.client.repurchaseRatePct}%`}
                hint="Cliente"
                deltaPct={calcDelta(dashboard.client.repurchaseRatePct, prevDashboard?.client.repurchaseRatePct || 0)}
              />
            </div>
          )}

          {dashboard && (
            <div className="grid gap-4 mb-8 lg:grid-cols-2">
              <StatusChart data={dashboard.charts.statusDistribution} />
              <WeeklyEvolutionChart data={dashboard.charts.weeklyEvolution} />
            </div>
          )}

          {dashboard && (
            <div className="mb-8">
              <CollaboratorRanking data={dashboard.talent.topPerformers.slice(0, 6)} />
            </div>
          )}

          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="font-semibold text-cobalt mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                Por asignar ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map(p => (
                  <div key={p._id} className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="font-semibold text-cobalt">{p.title}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          {typeof p.client === 'object' ? p.client.name : '—'} · {p.serviceType} · Nivel mín. {p.minDesignerLevel}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-cobalt">{fmt(p.pricing.total)}</div>
                        <div className="text-xs text-gray-400">Pago diseñador: {fmt(p.pricing.designerPay)}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <select
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cobalt/40"
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
                        className="bg-cobalt text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cobalt-mid transition-colors disabled:opacity-60"
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
              <h2 className="font-semibold text-cobalt mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                En producción ({active.length})
              </h2>
              <div className="space-y-2">
                {active.map(p => (
                  <a key={p._id} href={`/admin/proyectos/${p._id}`}
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 hover:border-cobalt/20 transition-colors">
                    <div>
                      <div className="font-medium text-cobalt text-sm">{p.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {typeof p.designer === 'object' && p.designer ? p.designer.name : 'Sin asignar'} · Rev. {p.revisions.used}/{p.revisions.max}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-cobalt/60 capitalize">{p.status}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {prevDashboard && (
            <p className="mt-8 text-xs text-gray-500">
              Comparativos calculados contra un periodo anterior equivalente.
            </p>
          )}
        </>
      )}
    </div>
  )
}
