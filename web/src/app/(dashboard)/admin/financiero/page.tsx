'use client'
import { useEffect, useState } from 'react'
import { adminApi, billingApi } from '@/lib/api'
import type { FinancieroReport, FinancieroProject } from '@/types'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const STATUS_LABEL: Record<string, string> = {
  cotizado:   'Cotizado',
  activo:     'En producción',
  revision:   'En revisión',
  ajuste:     'Ajustes',
  aprobado:   'Aprobado',
  completado: 'Completado',
}

const fmt = (n: number) =>
  `$${Math.round(n).toLocaleString('es-CO')}`

type Tab = 'pagos' | 'liquidaciones' | 'ingresos'
type BillingPlan = 'basic' | 'pro' | 'enterprise'
type BillingOverview = {
  tenantId: string
  plan: string
  commissionRate: number
  seats: number
  maxActiveProjects: number
  monthlyFee: number
  model: string
}

const DEFAULT_PLANS: BillingPlan[] = ['basic', 'pro', 'enterprise']

export default function FinancieroAdminPage() {
  const [data, setData]         = useState<FinancieroReport | null>(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<Tab>('pagos')
  const [processing, setProcessing] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPago, setFilterPago]     = useState('todos')
  const [error, setError]       = useState('')
  const [previewPlan, setPreviewPlan] = useState<BillingPlan>('pro')
  const [activePlan, setActivePlan] = useState<BillingPlan | null>(null)
  const [planOptions, setPlanOptions] = useState<BillingPlan[]>(DEFAULT_PLANS)
  const [previewProjects, setPreviewProjects] = useState(12)
  const [previewTicket, setPreviewTicket] = useState(1800000)
  const [previewResult, setPreviewResult] = useState<{ commissionRevenue: number; projectedMRR: number; monthlyFee: number } | null>(null)
  const [overview, setOverview] = useState<BillingOverview | null>(null)
  const [savingPlan, setSavingPlan] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const isPlanSynced = Boolean(activePlan && activePlan === previewPlan)

  async function loadBillingOverview() {
    try {
      const data = await billingApi.overview()
      setOverview(data)
      if (DEFAULT_PLANS.includes(data.plan as BillingPlan)) {
        setActivePlan(data.plan as BillingPlan)
      }
    } catch {
      setOverview(null)
    }
  }

  async function load() {
    try {
      setData(await adminApi.financiero())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    async function loadOverviewPlan() {
      try {
        const overview = await billingApi.overview()
        if (DEFAULT_PLANS.includes(overview.plan as BillingPlan)) {
          const tenantPlan = overview.plan as BillingPlan
          setActivePlan(tenantPlan)
          setPreviewPlan(tenantPlan)
        }
      } catch {
        // Mantiene el valor por defecto si no hay overview disponible.
      }
    }

    async function loadPlans() {
      try {
        const { items } = await billingApi.plans()
        const options = items
          .map(item => item.plan)
          .filter((plan): plan is BillingPlan => DEFAULT_PLANS.includes(plan as BillingPlan))

        if (options.length > 0) {
          setPlanOptions(options)
          if (!options.includes(previewPlan)) {
            setPreviewPlan(options[0])
          }
        }
      } catch {
        setPlanOptions(DEFAULT_PLANS)
      }
    }

    loadOverviewPlan()
    loadBillingOverview()
    loadPlans()
  }, [])

  useEffect(() => {
    if (!saveMessage) return
    const timer = setTimeout(() => setSaveMessage(''), 4000)
    return () => clearTimeout(timer)
  }, [saveMessage])

  useEffect(() => {
    async function runPreview() {
      try {
        const result = await billingApi.preview({
          plan: previewPlan,
          monthlyProjects: previewProjects,
          avgTicket: previewTicket,
        })
        setPreviewResult(result)
      } catch {
        setPreviewResult(null)
      }
    }
    runPreview()
  }, [previewPlan, previewProjects, previewTicket])

  async function marcarAnticipo(projectId: string) {
    setProcessing(projectId)
    try {
      await adminApi.anticipo(projectId)
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setProcessing(null)
    }
  }

  async function cerrarProyecto(projectId: string) {
    if (!confirm('¿Cerrar proyecto y liquidar al diseñador?')) return
    setProcessing(projectId)
    try {
      await adminApi.complete(projectId)
      await load()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setProcessing(null)
    }
  }

  async function guardarPlan() {
    setSavingPlan(true)
    setSaveMessage('')

    try {
      await billingApi.changePlan(previewPlan)
      setActivePlan(previewPlan)
      await loadBillingOverview()
      await load()
      setSaveMessage('Plan guardado correctamente.')
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : 'No se pudo guardar el plan.')
    } finally {
      setSavingPlan(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-400 text-sm">Cargando datos financieros...</p>
    </div>
  )

  if (error || !data) return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-red-600 text-sm">{error}</div>
  )

  const { kpis, proyectos, deudaDisenadores, ingresosPorMes } = data

  // Proyectos filtrados para la tabla de pagos
  const proyectosFiltrados = proyectos.filter(p => {
    const statusOk  = filterStatus === 'todos' || p.status === filterStatus
    const pagoOk    = filterPago === 'todos' ||
      (filterPago === 'anticipo-pendiente' && !p.payments.anticipo.paid) ||
      (filterPago === 'balance-pendiente'  && !p.payments.balance.paid && ['aprobado','completado'].includes(p.status)) ||
      (filterPago === 'al-dia' && p.payments.anticipo.paid && p.payments.balance.paid)
    return statusOk && pagoOk
  })

  // Barra de progreso del gráfico de ingresos
  const maxIngreso = Math.max(...ingresosPorMes.map(m => m.ingresos), 1)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100">Finanzas</h1>
        <p className="mt-1 text-sm text-slate-400">Panel financiero completo de SAPIENS COLAB</p>
      </div>

      <div className="mb-6 rounded-xl border border-[#2F3A5C] bg-[#121A2F] p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs text-slate-400">Plan activo:</span>
          <span className="inline-flex items-center rounded-full bg-[#4C58FF]/20 px-2.5 py-1 text-xs font-semibold text-[#A5B4FC]">
            {(activePlan || previewPlan).charAt(0).toUpperCase() + (activePlan || previewPlan).slice(1)}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              isPlanSynced ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
            }`}
          >
            {isPlanSynced ? 'Sincronizado' : 'Desactualizado'}
          </span>
          {activePlan && activePlan !== previewPlan && (
            <span className="text-xs text-orange-300">Tienes cambios sin guardar</span>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-slate-400">
            Plan
            <select value={previewPlan} onChange={e => setPreviewPlan(e.target.value as BillingPlan)} className="ml-2 rounded-md border border-[#334167] bg-[#0F172A] px-2 py-1 text-sm text-slate-200">
              {planOptions.map(plan => (
                <option key={plan} value={plan}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400">
            Proyectos/mes
            <input type="number" min={0} value={previewProjects} onChange={e => setPreviewProjects(Number(e.target.value || 0))} className="ml-2 w-24 rounded-md border border-[#334167] bg-[#0F172A] px-2 py-1 text-sm text-slate-200" />
          </label>
          <label className="text-xs text-slate-400">
            Ticket promedio
            <input type="number" min={0} value={previewTicket} onChange={e => setPreviewTicket(Number(e.target.value || 0))} className="ml-2 w-32 rounded-md border border-[#334167] bg-[#0F172A] px-2 py-1 text-sm text-slate-200" />
          </label>
          <button
            onClick={guardarPlan}
            disabled={savingPlan}
            className="h-8 rounded-md bg-[#4C58FF] px-3 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {savingPlan ? 'Guardando...' : 'Guardar plan'}
          </button>
        </div>
        {saveMessage && (
          <p className={`mt-2 text-xs ${saveMessage.includes('correctamente') ? 'text-emerald-600' : 'text-red-500'}`}>
            {saveMessage}
          </p>
        )}
        {overview && (
          <div className="mt-3 rounded-lg border border-[#2F3A5C] bg-[#0F172A] p-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div><span className="block text-slate-400">Fee real</span><span className="font-semibold text-slate-100">{fmt(overview.monthlyFee)}</span></div>
              <div><span className="block text-slate-400">Comisión real</span><span className="font-semibold text-slate-100">{Math.round(overview.commissionRate * 100)}%</span></div>
              <div><span className="block text-slate-400">Usuarios</span><span className="font-semibold text-slate-100">{overview.seats}</span></div>
              <div><span className="block text-slate-400">Proyectos activos</span><span className="font-semibold text-slate-100">{overview.maxActiveProjects}</span></div>
              <div><span className="block text-slate-400">Modelo</span><span className="font-semibold text-slate-100">{overview.model}</span></div>
            </div>
          </div>
        )}
        {previewResult && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg bg-[#0F172A] p-3"><span className="text-xs text-slate-400">Tarifa mensual</span><div className="font-bold text-slate-100">{fmt(previewResult.monthlyFee)}</div></div>
            <div className="rounded-lg bg-[#0F172A] p-3"><span className="text-xs text-slate-400">Comisión estimada</span><div className="font-bold text-rose-300">{fmt(previewResult.commissionRevenue)}</div></div>
            <div className="rounded-lg bg-[#0F172A] p-3"><span className="text-xs text-slate-400">Ingresos mensuales proyectados</span><div className="font-bold text-slate-100">{fmt(previewResult.projectedMRR)}</div></div>
          </div>
        )}
      </div>

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi label="Total facturado"     value={fmt(kpis.totalFacturado)}     accent="cobalt" />
        <Kpi label="Comisión SAPIENS"    value={fmt(kpis.comisionSapiens)}    accent="coral" />
        <Kpi label="Anticipos pendientes" value={fmt(kpis.anticiposPendientes)} accent="yellow" />
        <Kpi label="Balances por cobrar"  value={fmt(kpis.balancesPendientes)} accent="purple" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi label="Valor en producción"   value={fmt(kpis.pipelineTotal)}      accent="blue"  sub={`${kpis.proyectosActivos} proyectos`} />
        <Kpi label="Pagado diseñadores" value={fmt(kpis.pagadoDisenadores)} accent="green" />
        <Kpi label="Proyectos totales" value={String(kpis.totalProyectos)}  accent="gray" />
        <Kpi label="Utilidad neta est." value={fmt(kpis.comisionSapiens)}   accent="gray"  sub="(sobre completados)" />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="mb-6 flex w-fit gap-1 rounded-xl bg-[#0F172A] p-1 border border-[#2F3A5C]">
        {([
          { key: 'pagos',         label: 'Control de pagos' },
          { key: 'liquidaciones', label: 'Liquidaciones diseñadores' },
          { key: 'ingresos',      label: 'Ingresos por mes' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[#4C58FF] text-white shadow-sm' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Control de pagos ─────────────────────────────── */}
      {tab === 'pagos' && (
        <div>
          {/* Filtros */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg border border-[#334167] bg-[#0F172A] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#4C58FF]"
            >
              <option value="todos">Todos los estados</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              value={filterPago}
              onChange={e => setFilterPago(e.target.value)}
              className="rounded-lg border border-[#334167] bg-[#0F172A] px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#4C58FF]"
            >
              <option value="todos">Todos los pagos</option>
              <option value="anticipo-pendiente">Anticipo pendiente</option>
              <option value="balance-pendiente">Balance pendiente</option>
              <option value="al-dia">Al día</option>
            </select>
            <span className="self-center text-xs text-slate-400">{proyectosFiltrados.length} proyecto(s)</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#2F3A5C] bg-[#121A2F]">
            <table className="w-full text-sm">
              <thead className="border-b border-[#2F3A5C] bg-[#0F172A]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Proyecto</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 md:table-cell">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Anticipo</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Balance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#273252]">
                {proyectosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-slate-500">No hay proyectos con este filtro</td>
                  </tr>
                ) : proyectosFiltrados.map(p => (
                  <PagoRow
                    key={p._id}
                    project={p}
                    processing={processing}
                    onAnticipo={marcarAnticipo}
                    onComplete={cerrarProyecto}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Liquidaciones ───────────────────────────────── */}
      {tab === 'liquidaciones' && (
        <div className="space-y-4">
          {deudaDisenadores.length === 0 ? (
            <div className="rounded-xl border border-[#2F3A5C] bg-[#121A2F] py-12 text-center text-sm text-slate-400">
              No hay liquidaciones pendientes. ✓
            </div>
          ) : deudaDisenadores.map((d, i) => {
            const designer = typeof d.designer === 'object' ? d.designer : null
            return (
              <div key={i} className="rounded-xl border border-[#2F3A5C] bg-[#121A2F] p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4C58FF]/20 font-bold text-[#A5B4FC]">
                      {designer?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-100">{designer?.name || '—'}</div>
                      <div className="text-xs text-slate-400">
                        Nivel {designer?.level} · {designer?.specialty}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Total a liquidar</div>
                    <div className="text-xl font-black text-rose-300">{fmt(d.totalDeuda)}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {d.proyectos.map((pr, j) => (
                    <div key={j} className="flex justify-between rounded-lg bg-[#0F172A] px-3 py-2 text-sm">
                      <span className="truncate text-slate-200">{pr.title}</span>
                      <span className="ml-4 flex-shrink-0 font-semibold text-slate-100">{fmt(pr.pay)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab: Ingresos por mes ────────────────────────────── */}
      {tab === 'ingresos' && (
        <div className="rounded-xl border border-[#2F3A5C] bg-[#121A2F] p-6">
          {ingresosPorMes.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Aún no hay proyectos completados para mostrar ingresos.
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3 mb-6" style={{ height: '160px' }}>
                {ingresosPorMes.map((m, i) => {
                  const pct = Math.round((m.ingresos / maxIngreso) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-xs font-semibold text-slate-100">{fmt(m.ingresos)}</div>
                      <div className="w-full relative" style={{ height: '100px' }}>
                        <div
                          className="absolute bottom-0 w-full rounded-t-lg bg-[#4C58FF] transition-all"
                          style={{ height: `${pct}%` }}
                        />
                        <div
                          className="absolute bottom-0 w-full rounded-t-lg bg-rose-400 transition-all opacity-70"
                          style={{ height: `${Math.round((m.utilidad / maxIngreso) * 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-400">{MESES[m._id.month - 1]}</div>
                    </div>
                  )
                })}
              </div>

              {/* Leyenda */}
              <div className="mb-6 flex gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-[#4C58FF]" /> Ingresos totales</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-rose-400 opacity-70" /> Comisión SAPIENS</span>
              </div>

              {/* Tabla detalle */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2F3A5C]">
                    <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Mes</th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Ingresos</th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Comisión</th>
                    <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Proyectos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#273252]">
                  {ingresosPorMes.map((m, i) => (
                    <tr key={i}>
                      <td className="py-2 text-slate-200">{MESES[m._id.month - 1]} {m._id.year}</td>
                      <td className="py-2 text-right font-semibold text-slate-100">{fmt(m.ingresos)}</td>
                      <td className="py-2 text-right text-rose-300">{fmt(m.utilidad)}</td>
                      <td className="py-2 text-right text-slate-400">{m.proyectos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Subcomponentes ───────────────────────────────────────────────────────

function Kpi({ label, value, accent, sub }: {
  label: string; value: string; accent: string; sub?: string
}) {
  const colors: Record<string, string> = {
    cobalt: 'text-slate-100',
    coral:  'text-rose-300',
    yellow: 'text-yellow-300',
    purple: 'text-violet-300',
    blue:   'text-blue-300',
    green:  'text-emerald-300',
    gray:   'text-slate-300',
  }
  return (
    <div className="rounded-xl border border-[#2F3A5C] bg-[#121A2F] p-4">
      <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`text-xl font-black ${colors[accent] || 'text-slate-100'}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

function PagoRow({ project: p, processing, onAnticipo, onComplete }: {
  project: FinancieroProject
  processing: string | null
  onAnticipo: (id: string) => void
  onComplete: (id: string) => void
}) {
  const client = typeof p.client === 'object' ? p.client : null
  const busy = processing === p._id

  return (
    <tr className="transition-colors hover:bg-[#0F172A]">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-slate-100">{p.title}</div>
        <div className="text-xs text-slate-400">{client?.name || client?.company || '—'}</div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-xs capitalize text-slate-300">{STATUS_LABEL[p.status] || p.status}</span>
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-100">
        {fmt(p.pricing.total)}
      </td>
      <td className="px-4 py-3 text-center">
        {p.payments.anticipo.paid ? (
          <span className="text-xs font-medium text-emerald-300">✓ {fmt(p.pricing.anticipo)}</span>
        ) : (
          <button
            onClick={() => onAnticipo(p._id)}
            disabled={busy}
            className="whitespace-nowrap rounded-lg border border-yellow-500/30 bg-yellow-500/15 px-2.5 py-1 text-xs text-yellow-300 transition-colors hover:bg-yellow-500/25 disabled:opacity-50"
          >
            {busy ? '...' : `Recibir ${fmt(p.pricing.anticipo)}`}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {p.payments.balance.paid ? (
          <span className="text-xs font-medium text-emerald-300">✓ {fmt(p.pricing.balance)}</span>
        ) : p.status === 'aprobado' ? (
          <button
            onClick={() => onComplete(p._id)}
            disabled={busy}
            className="whitespace-nowrap rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
          >
            {busy ? '...' : `Cerrar ${fmt(p.pricing.balance)}`}
          </button>
        ) : (
          <span className="text-xs text-slate-500">{fmt(p.pricing.balance)}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <a href={`/admin/proyectos/${p._id}`} className="text-xs text-slate-400 transition-colors hover:text-[#A5B4FC]">
          Ver →
        </a>
      </td>
    </tr>
  )
}
