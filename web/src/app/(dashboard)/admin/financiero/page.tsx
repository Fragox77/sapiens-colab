'use client'
import { useEffect, useState } from 'react'
import { adminApi, billingApi, finanzasApi } from '@/lib/api'
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

type Tab = 'pagos' | 'liquidaciones' | 'ingresos' | 'calculadora'
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
  // Liquidaciones
  const [liqOpen, setLiqOpen]   = useState<string | null>(null) // designerId del form abierto
  const [liqMonto, setLiqMonto] = useState('')
  const [liqComprobante, setLiqComprobante] = useState('')
  const [liqFecha, setLiqFecha] = useState(new Date().toISOString().slice(0, 10))
  const [liqSaving, setLiqSaving] = useState(false)
  const [liqMsg, setLiqMsg]     = useState('')
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

  // ── Calculadora financiera ────────────────────────────────────────────────
  const [calcBase,     setCalcBase]     = useState(10_000_000)
  const [calcComision, setCalcComision] = useState(25)
  const [calcIva,      setCalcIva]      = useState(19)
  const [calcRfc,      setCalcRfc]      = useState(10)
  const [calcRica,     setCalcRica]     = useState(1.5)
  const [calcRff,      setCalcRff]      = useState(11)
  const [calcFijos,    setCalcFijos]    = useState(200_000)

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

  async function registrarLiquidacion(colaboradorId: string) {
    if (!liqMonto || Number(liqMonto) <= 0) return
    setLiqSaving(true)
    setLiqMsg('')
    try {
      await finanzasApi.crearLiquidacion({
        colaboradorId,
        monto: Number(liqMonto),
        comprobante: liqComprobante.trim(),
        fecha: liqFecha,
      })
      setLiqMsg('Liquidación registrada.')
      setLiqMonto('')
      setLiqComprobante('')
      setLiqOpen(null)
      await load()
    } catch (err) {
      setLiqMsg(err instanceof Error ? err.message : 'Error al registrar')
    } finally {
      setLiqSaving(false)
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

  // ── Valores derivados de la calculadora (recalculados en cada render) ────
  const calcIvaAmt       = Math.round(calcBase * calcIva / 100)
  const calcTotalFactura = calcBase + calcIvaAmt
  const calcRetefCliente = Math.round(calcBase * calcRfc / 100)
  const calcReteICA      = Math.round(calcBase * calcRica / 100)
  const calcNetoCliente  = calcTotalFactura - calcRetefCliente - calcReteICA
  const calcComisionAmt  = Math.round(calcBase * calcComision / 100)
  const calcUtilidadNeta = calcComisionAmt - calcFijos
  const calcBaseFL       = calcBase - calcComisionAmt
  const calcRetefFL      = Math.round(calcBaseFL * calcRff / 100)
  const calcPagoFL       = calcBaseFL - calcRetefFL

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="theme-dashboard-muted text-sm">Cargando datos financieros...</p>
    </div>
  )

  if (error || !data) return (
    <div className="border border-rose-500/30 bg-rose-500/10 rounded-xl p-5 text-semantic-danger text-sm">{error}</div>
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
        <h1 className="theme-dashboard-text text-3xl font-bold">Finanzas</h1>
        <p className="theme-dashboard-muted mt-1 text-sm">Panel financiero completo de SAPIENS COLAB</p>
      </div>

      <div className="theme-dashboard-border theme-dashboard-surface mb-6 rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="theme-dashboard-muted text-xs">Plan activo:</span>
          <span className="inline-flex items-center rounded-full bg-[#4C58FF]/20 px-2.5 py-1 text-xs font-semibold text-[#A5B4FC]">
            {(activePlan || previewPlan).charAt(0).toUpperCase() + (activePlan || previewPlan).slice(1)}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              isPlanSynced ? 'bg-emerald-500/15 text-emerald-500' : 'bg-orange-500/15 text-orange-500'
            }`}
          >
            {isPlanSynced ? 'Sincronizado' : 'Desactualizado'}
          </span>
          {activePlan && activePlan !== previewPlan && (
            <span className="text-xs text-semantic-warning">Tienes cambios sin guardar</span>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="theme-dashboard-muted text-xs">
            Plan
            <select value={previewPlan} onChange={e => setPreviewPlan(e.target.value as BillingPlan)} className="theme-dashboard-input ml-2 rounded-md px-2 py-1 text-sm">
              {planOptions.map(plan => (
                <option key={plan} value={plan}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</option>
              ))}
            </select>
          </label>
          <label className="theme-dashboard-muted text-xs">
            Proyectos/mes
            <input type="number" min={0} value={previewProjects} onChange={e => setPreviewProjects(Number(e.target.value || 0))} className="theme-dashboard-input ml-2 w-24 rounded-md px-2 py-1 text-sm" />
          </label>
          <label className="theme-dashboard-muted text-xs">
            Ticket promedio
            <input type="number" min={0} value={previewTicket} onChange={e => setPreviewTicket(Number(e.target.value || 0))} className="theme-dashboard-input ml-2 w-32 rounded-md px-2 py-1 text-sm" />
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
          <p className={`mt-2 text-xs ${saveMessage.includes('correctamente') ? 'text-semantic-success' : 'text-semantic-danger'}`}>
            {saveMessage}
          </p>
        )}
        {overview && (
          <div className="theme-dashboard-border theme-dashboard-surface-2 mt-3 rounded-lg border p-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div><span className="theme-dashboard-muted block">Fee real</span><span className="theme-dashboard-text font-semibold">{fmt(overview.monthlyFee)}</span></div>
              <div><span className="theme-dashboard-muted block">Comisión real</span><span className="theme-dashboard-text font-semibold">{Math.round(overview.commissionRate * 100)}%</span></div>
              <div><span className="theme-dashboard-muted block">Usuarios</span><span className="theme-dashboard-text font-semibold">{overview.seats}</span></div>
              <div><span className="theme-dashboard-muted block">Proyectos activos</span><span className="theme-dashboard-text font-semibold">{overview.maxActiveProjects}</span></div>
              <div><span className="theme-dashboard-muted block">Modelo</span><span className="theme-dashboard-text font-semibold">{overview.model}</span></div>
            </div>
          </div>
        )}
        {previewResult && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="theme-dashboard-surface-2 rounded-lg p-3"><span className="theme-dashboard-muted text-xs">Tarifa mensual</span><div className="theme-dashboard-text font-bold">{fmt(previewResult.monthlyFee)}</div></div>
            <div className="theme-dashboard-surface-2 rounded-lg p-3"><span className="theme-dashboard-muted text-xs">Comisión estimada</span><div className="font-bold text-semantic-danger">{fmt(previewResult.commissionRevenue)}</div></div>
            <div className="theme-dashboard-surface-2 rounded-lg p-3"><span className="theme-dashboard-muted text-xs">Ingresos mensuales proyectados</span><div className="theme-dashboard-text font-bold">{fmt(previewResult.projectedMRR)}</div></div>
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
      <div className="theme-dashboard-border theme-dashboard-surface mb-6 flex w-fit gap-1 rounded-xl border p-1">
        {([
          { key: 'pagos',         label: 'Control de pagos' },
          { key: 'liquidaciones', label: 'Liquidaciones diseñadores' },
          { key: 'ingresos',      label: 'Ingresos por mes' },
          { key: 'calculadora',   label: 'Calculadora' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[#4C58FF] text-white shadow-sm' : 'theme-dashboard-muted hover:text-[var(--dashboard-text)]'
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
              className="theme-dashboard-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C58FF]"
            >
              <option value="todos">Todos los estados</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              value={filterPago}
              onChange={e => setFilterPago(e.target.value)}
              className="theme-dashboard-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#4C58FF]"
            >
              <option value="todos">Todos los pagos</option>
              <option value="anticipo-pendiente">Anticipo pendiente</option>
              <option value="balance-pendiente">Balance pendiente</option>
              <option value="al-dia">Al día</option>
            </select>
            <span className="theme-dashboard-muted self-center text-xs">{proyectosFiltrados.length} proyecto(s)</span>
          </div>

          <div className="theme-dashboard-border theme-dashboard-surface overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="theme-dashboard-border theme-dashboard-surface-2 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide theme-dashboard-muted">Proyecto</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide theme-dashboard-muted md:table-cell">Estado</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide theme-dashboard-muted">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide theme-dashboard-muted">Anticipo</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide theme-dashboard-muted">Balance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="theme-dashboard-border divide-y">
                {proyectosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm theme-dashboard-muted">No hay proyectos con este filtro</td>
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
          {liqMsg && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${liqMsg.includes('registrada') ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-semantic-danger'}`}>
              {liqMsg}
            </div>
          )}
          {deudaDisenadores.length === 0 ? (
            <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border py-12 text-center text-sm theme-dashboard-muted">
              No hay liquidaciones pendientes. ✓
            </div>
          ) : deudaDisenadores.map((d, i) => {
            const designer = typeof d.designer === 'object' ? d.designer : null
            const designerId = designer?._id ? String(designer._id) : String(i)
            const isOpen = liqOpen === designerId
            return (
              <div key={i} className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4C58FF]/20 font-bold text-[#A5B4FC]">
                      {designer?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="theme-dashboard-text font-semibold">{designer?.name || '—'}</div>
                      <div className="theme-dashboard-muted text-xs">
                        Nivel {designer?.level} · {designer?.specialty}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="theme-dashboard-muted text-xs">Total a liquidar</div>
                      <div className="text-xl font-black text-semantic-danger">{fmt(d.totalDeuda)}</div>
                    </div>
                    <button
                      onClick={() => {
                        setLiqOpen(isOpen ? null : designerId)
                        setLiqMsg('')
                        if (!isOpen) {
                          setLiqMonto(String(d.totalDeuda))
                          setLiqFecha(new Date().toISOString().slice(0, 10))
                          setLiqComprobante('')
                        }
                      }}
                      className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                        isOpen
                          ? 'border theme-dashboard-border theme-dashboard-muted'
                          : 'bg-[#4C58FF] text-white hover:bg-[#5A66FF]'
                      }`}
                    >
                      {isOpen ? 'Cancelar' : 'Registrar pago'}
                    </button>
                  </div>
                </div>

                {/* Proyectos adeudados */}
                <div className="space-y-2 mb-4">
                  {d.proyectos.map((pr, j) => (
                    <div key={j} className="theme-dashboard-surface-2 flex justify-between rounded-lg px-3 py-2 text-sm">
                      <span className="theme-dashboard-text truncate">{pr.title}</span>
                      <span className="theme-dashboard-text ml-4 flex-shrink-0 font-semibold">{fmt(pr.pay)}</span>
                    </div>
                  ))}
                </div>

                {/* Formulario de pago */}
                {isOpen && (
                  <div className="theme-dashboard-border theme-dashboard-surface-2 rounded-xl border p-4 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wide theme-dashboard-muted mb-2">Registrar liquidación</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="theme-dashboard-muted text-xs block mb-1">Monto a pagar (COP)</label>
                        <input
                          type="number"
                          min={1}
                          value={liqMonto}
                          onChange={e => setLiqMonto(e.target.value)}
                          className="theme-dashboard-input w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                          placeholder="ej. 1500000"
                        />
                      </div>
                      <div>
                        <label className="theme-dashboard-muted text-xs block mb-1">Fecha de pago</label>
                        <input
                          type="date"
                          value={liqFecha}
                          onChange={e => setLiqFecha(e.target.value)}
                          className="theme-dashboard-input w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="theme-dashboard-muted text-xs block mb-1">Comprobante / referencia (opcional)</label>
                      <input
                        type="text"
                        value={liqComprobante}
                        onChange={e => setLiqComprobante(e.target.value)}
                        className="theme-dashboard-input w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                        placeholder="ej. TXN-2024-00123 o enlace al comprobante"
                      />
                    </div>
                    <button
                      onClick={() => registrarLiquidacion(designerId)}
                      disabled={liqSaving || !liqMonto || Number(liqMonto) <= 0}
                      className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {liqSaving ? 'Registrando...' : `Confirmar pago de ${liqMonto ? fmt(Number(liqMonto)) : '—'}`}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab: Ingresos por mes ────────────────────────────── */}
      {tab === 'ingresos' && (
        <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-6">
          {ingresosPorMes.length === 0 ? (
            <div className="theme-dashboard-muted py-12 text-center text-sm">
              Aún no hay proyectos completados para mostrar ingresos.
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3 mb-6" style={{ height: '160px' }}>
                {ingresosPorMes.map((m, i) => {
                  const pct = Math.round((m.ingresos / maxIngreso) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="theme-dashboard-text text-xs font-semibold">{fmt(m.ingresos)}</div>
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
                      <div className="theme-dashboard-muted text-xs">{MESES[m._id.month - 1]}</div>
                    </div>
                  )
                })}
              </div>

              {/* Leyenda */}
              <div className="theme-dashboard-muted mb-6 flex gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-[#4C58FF]" /> Ingresos totales</span>
                <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-sm bg-rose-400 opacity-70" /> Comisión SAPIENS</span>
              </div>

              {/* Tabla detalle */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="theme-dashboard-border border-b">
                    <th className="theme-dashboard-muted pb-2 text-left text-xs font-semibold uppercase tracking-wide">Mes</th>
                    <th className="theme-dashboard-muted pb-2 text-right text-xs font-semibold uppercase tracking-wide">Ingresos</th>
                    <th className="theme-dashboard-muted pb-2 text-right text-xs font-semibold uppercase tracking-wide">Comisión</th>
                    <th className="theme-dashboard-muted pb-2 text-right text-xs font-semibold uppercase tracking-wide">Proyectos</th>
                  </tr>
                </thead>
                <tbody className="theme-dashboard-border divide-y">
                  {ingresosPorMes.map((m, i) => (
                    <tr key={i}>
                      <td className="theme-dashboard-text py-2">{MESES[m._id.month - 1]} {m._id.year}</td>
                      <td className="theme-dashboard-text py-2 text-right font-semibold">{fmt(m.ingresos)}</td>
                      <td className="py-2 text-right text-semantic-danger">{fmt(m.utilidad)}</td>
                      <td className="theme-dashboard-muted py-2 text-right">{m.proyectos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
      {/* ── Tab: Calculadora financiera ─────────────────────────────── */}
      {tab === 'calculadora' && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">

          {/* ── Columna izquierda: Inputs ── */}
          <div className="space-y-4">
            <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-semantic-danger mb-4">Parámetros del proyecto</div>

              <div className="space-y-4">
                <div>
                  <label className="theme-dashboard-muted text-xs block mb-1">Base del proyecto (sin IVA)</label>
                  <div className="flex items-center theme-dashboard-input rounded-lg overflow-hidden">
                    <span className="px-3 py-2 text-xs theme-dashboard-muted select-none">$</span>
                    <input
                      type="number" min={0} step={100000} value={calcBase}
                      onChange={e => setCalcBase(Number(e.target.value) || 0)}
                      className="flex-1 bg-transparent text-sm font-semibold theme-dashboard-text py-2 pr-3 outline-none"
                    />
                  </div>
                </div>

                <div className="border-t theme-dashboard-border" />

                {([
                  { label: 'Comisión Sapiens',    val: calcComision, setter: setCalcComision, min: 5,  max: 40, step: 0.5 },
                  { label: 'IVA',                 val: calcIva,      setter: setCalcIva,      min: 0,  max: 25, step: 0.5 },
                ] as const).map(({ label, val, setter, min, max, step }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <label className="theme-dashboard-muted text-xs">{label}</label>
                      <span className="text-xs font-bold theme-dashboard-text">{val}%</span>
                    </div>
                    <input
                      type="range" min={min} max={max} step={step} value={val}
                      onChange={e => setter(Number(e.target.value) as never)}
                      className="w-full h-1 rounded-full accent-[#4C58FF] cursor-pointer"
                    />
                  </div>
                ))}

                <div className="border-t theme-dashboard-border" />

                {([
                  { label: 'Retefuente cliente',    val: calcRfc,  setter: setCalcRfc,  min: 0, max: 15, step: 0.5 },
                  { label: 'ReteICA cliente',        val: calcRica, setter: setCalcRica, min: 0, max: 5,  step: 0.1 },
                  { label: 'Retefuente freelancer',  val: calcRff,  setter: setCalcRff,  min: 0, max: 15, step: 0.5 },
                ] as const).map(({ label, val, setter, min, max, step }) => (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <label className="theme-dashboard-muted text-xs">{label}</label>
                      <span className="text-xs font-bold theme-dashboard-text">{val}%</span>
                    </div>
                    <input
                      type="range" min={min} max={max} step={step} value={val}
                      onChange={e => setter(Number(e.target.value) as never)}
                      className="w-full h-1 rounded-full accent-[#4C58FF] cursor-pointer"
                    />
                  </div>
                ))}

                <div className="border-t theme-dashboard-border" />

                <div>
                  <label className="theme-dashboard-muted text-xs block mb-1">Costos fijos del proyecto</label>
                  <div className="flex items-center theme-dashboard-input rounded-lg overflow-hidden">
                    <span className="px-3 py-2 text-xs theme-dashboard-muted select-none">$</span>
                    <input
                      type="number" min={0} step={10000} value={calcFijos}
                      onChange={e => setCalcFijos(Number(e.target.value) || 0)}
                      className="flex-1 bg-transparent text-sm font-semibold theme-dashboard-text py-2 pr-3 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Distribución visual */}
            <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-semantic-danger mb-3">Distribución de la base</div>
              {calcBase > 0 && ([
                { label: 'Pago neto freelancer',  val: calcPagoFL / calcBase,                        color: 'bg-amber-400' },
                { label: 'Utilidad neta Sapiens', val: Math.max(0, calcUtilidadNeta / calcBase),     color: 'bg-emerald-400' },
                { label: 'Costos fijos',           val: calcFijos / calcBase,                         color: 'bg-indigo-400' },
                { label: 'Retef. freelancer',      val: calcRetefFL / calcBase,                       color: 'bg-slate-500' },
              ]).map(({ label, val, color }) => (
                <div key={label} className="flex items-center gap-2 mb-2.5">
                  <span className="theme-dashboard-muted text-xs w-36 flex-shrink-0 truncate">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full theme-dashboard-surface-2 overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all duration-300`} style={{ width: `${Math.min(100, val * 100).toFixed(1)}%` }} />
                  </div>
                  <span className="text-xs font-semibold theme-dashboard-muted w-10 text-right">{(val * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Columna derecha: Resultados ── */}
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-3">
                <div className="theme-dashboard-muted text-xs uppercase tracking-wide mb-1">Total factura</div>
                <div className="theme-dashboard-text text-lg font-black">{fmt(calcTotalFactura)}</div>
                <div className="theme-dashboard-muted text-xs">Base + IVA</div>
              </div>
              <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-3">
                <div className="theme-dashboard-muted text-xs uppercase tracking-wide mb-1">Comisión Sapiens</div>
                <div className="text-lg font-black text-semantic-danger">{fmt(calcComisionAmt)}</div>
                <div className="theme-dashboard-muted text-xs">Antes de costos fijos</div>
              </div>
              <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-3">
                <div className="theme-dashboard-muted text-xs uppercase tracking-wide mb-1">Utilidad neta</div>
                <div className="text-lg font-black text-semantic-success">{fmt(calcUtilidadNeta)}</div>
                <div className="theme-dashboard-muted text-xs">{calcBase > 0 ? (calcUtilidadNeta / calcBase * 100).toFixed(1) : 0}% sobre base</div>
              </div>
              <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-3">
                <div className="theme-dashboard-muted text-xs uppercase tracking-wide mb-1">Pago freelancer</div>
                <div className="text-lg font-black text-semantic-warning">{fmt(calcPagoFL)}</div>
                <div className="theme-dashboard-muted text-xs">Después de retefuente</div>
              </div>
            </div>

            {/* Cards de detalle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] theme-dashboard-muted mb-3">Factura al cliente</div>
                <CalcRow label="Base del proyecto"  value={fmt(calcBase)} />
                <CalcRow label="IVA cobrado"         value={fmt(calcIvaAmt)} muted />
                <CalcRow label="Total factura"       value={fmt(calcTotalFactura)} accent="danger" />
              </div>

              <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] theme-dashboard-muted mb-3">Retenciones del cliente</div>
                <CalcRow label="Retefuente retenida"           value={fmt(calcRetefCliente)} muted />
                <CalcRow label="ReteICA retenida"              value={fmt(calcReteICA)} muted />
                <CalcRow label="Neto transferido a Sapiens"    value={fmt(calcNetoCliente)} />
                <p className="theme-dashboard-muted text-xs mt-2 leading-relaxed">Las retenciones las paga el cliente al fisco en nombre de Sapiens. Se recuperan como crédito tributario.</p>
              </div>

              <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] theme-dashboard-muted mb-3">Ingresos Sapiens Colab</div>
                <CalcRow label="Comisión bruta"    value={fmt(calcComisionAmt)} accent="danger" />
                <CalcRow label="Costos fijos"       value={`(${fmt(calcFijos)})`} muted />
                <CalcRow label="Utilidad neta"      value={fmt(calcUtilidadNeta)} accent="success" />
                <CalcRow label="Margen sobre base"  value={`${calcBase > 0 ? (calcUtilidadNeta / calcBase * 100).toFixed(1) : 0}%`} accent="success" />
              </div>

              <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] theme-dashboard-muted mb-3">Pago al freelancer</div>
                <CalcRow label="Base freelancer"            value={fmt(calcBaseFL)} />
                <CalcRow label="Retefuente retenida"        value={`(${fmt(calcRetefFL)})`} muted />
                <CalcRow label="Pago neto al freelancer"    value={fmt(calcPagoFL)} accent="warning" />
                <CalcRow label="% del total recibido"       value={`${calcBase > 0 ? (calcPagoFL / calcBase * 100).toFixed(1) : 0}%`} muted />
              </div>
            </div>

            {/* Flujo completo */}
            <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border overflow-hidden">
              <div className="theme-dashboard-border theme-dashboard-surface-2 border-b px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] theme-dashboard-muted">
                Flujo completo del proyecto
              </div>
              <div className="grid grid-cols-3 divide-x theme-dashboard-border">
                <div className="p-4">
                  <div className="text-xs font-bold uppercase tracking-wide theme-dashboard-muted mb-3">Cliente paga</div>
                  <CalcRow label="Total factura"     value={fmt(calcTotalFactura)} />
                  <CalcRow label="→ Transfiere"      value={fmt(calcNetoCliente)} accent="success" />
                  <CalcRow label="→ Al fisco"        value={fmt(calcRetefCliente + calcReteICA)} muted />
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-semantic-danger mb-3">Sapiens recibe</div>
                  <CalcRow label="En cuenta bancaria" value={fmt(calcNetoCliente)} />
                  <CalcRow label="Comisión neta"      value={fmt(calcComisionAmt)} accent="danger" />
                  <CalcRow label="Utilidad real"      value={fmt(calcUtilidadNeta)} accent="success" />
                </div>
                <div className="p-4">
                  <div className="text-xs font-bold uppercase tracking-wide text-semantic-warning mb-3">Freelancer recibe</div>
                  <CalcRow label="Base asignada"       value={fmt(calcBaseFL)} />
                  <CalcRow label="Retef. descontada"   value={`(${fmt(calcRetefFL)})`} muted />
                  <CalcRow label="Pago neto"           value={fmt(calcPagoFL)} accent="warning" />
                </div>
              </div>
              <div className={`border-t theme-dashboard-border px-4 py-3 text-xs flex items-center gap-2 ${
                calcComision >= 30 ? 'text-rose-400 bg-rose-500/5'
                : calcComision >= 20 ? 'text-amber-400 bg-amber-500/5'
                : 'text-emerald-400 bg-emerald-500/5'
              }`}>
                <span>●</span>
                <span>
                  {calcComision >= 30
                    ? `Comisión alta (${calcComision}%) — considera si el freelancer percibe un pago justo vs. el valor que aporta la plataforma.`
                    : calcComision >= 20
                    ? `Comisión equilibrada (${calcComision}%) — margen sostenible para Sapiens y atractivo para el freelancer.`
                    : `Comisión baja (${calcComision}%) — muy competitiva para atraer freelancers. Revisa que cubra los costos operativos.`
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── Subcomponentes ───────────────────────────────────────────────────────

function CalcRow({ label, value, muted, accent }: {
  label: string
  value: string
  muted?: boolean
  accent?: 'danger' | 'success' | 'warning'
}) {
  const valueClass =
    accent === 'danger'  ? 'text-semantic-danger'  :
    accent === 'success' ? 'text-semantic-success'  :
    accent === 'warning' ? 'text-semantic-warning'  :
    'theme-dashboard-text'
  return (
    <div className="theme-dashboard-border flex items-center justify-between border-b py-2 last:border-0">
      <span className="theme-dashboard-muted text-xs">{label}</span>
      <span className={`text-xs font-bold ${muted ? 'theme-dashboard-muted font-normal' : valueClass}`}>{value}</span>
    </div>
  )
}

function Kpi({ label, value, accent, sub }: {
  label: string; value: string; accent: string; sub?: string
}) {
  const colors: Record<string, string> = {
    cobalt: 'theme-dashboard-text',
    coral:  'text-semantic-danger',
    yellow: 'text-semantic-warning',
    purple: 'text-semantic-violet',
    blue:   'text-semantic-blue',
    green:  'text-semantic-success',
    gray:   'theme-dashboard-muted',
  }
  return (
    <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-4">
      <div className="theme-dashboard-muted mb-1 text-xs uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-black ${colors[accent] || 'theme-dashboard-text'}`}>{value}</div>
      {sub && <div className="theme-dashboard-muted mt-0.5 text-xs">{sub}</div>}
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
    <tr className="transition-colors hover:bg-[var(--dashboard-surface-2)]">
      <td className="px-4 py-3">
        <div className="theme-dashboard-text text-sm font-medium">{p.title}</div>
        <div className="theme-dashboard-muted text-xs">{client?.name || client?.company || '—'}</div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="theme-dashboard-muted text-xs capitalize">{STATUS_LABEL[p.status] || p.status}</span>
      </td>
      <td className="theme-dashboard-text px-4 py-3 text-right text-sm font-semibold">
        {fmt(p.pricing.total)}
      </td>
      <td className="px-4 py-3 text-center">
        {p.payments.anticipo.paid ? (
          <span className="text-xs font-medium text-semantic-success">✓ {fmt(p.pricing.anticipo)}</span>
        ) : (
          <button
            onClick={() => onAnticipo(p._id)}
            disabled={busy}
            className="btn-action-yellow whitespace-nowrap rounded-lg px-2.5 py-1 text-xs transition-colors disabled:opacity-50"
          >
            {busy ? '...' : `Recibir ${fmt(p.pricing.anticipo)}`}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {p.payments.balance.paid ? (
          <span className="text-xs font-medium text-semantic-success">✓ {fmt(p.pricing.balance)}</span>
        ) : p.status === 'aprobado' ? (
          <button
            onClick={() => onComplete(p._id)}
            disabled={busy}
            className="btn-action-emerald whitespace-nowrap rounded-lg px-2.5 py-1 text-xs transition-colors disabled:opacity-50"
          >
            {busy ? '...' : `Cerrar ${fmt(p.pricing.balance)}`}
          </button>
        ) : (
          <span className="theme-dashboard-muted text-xs">{fmt(p.pricing.balance)}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <a href={`/admin/proyectos/${p._id}`} className="theme-dashboard-muted text-xs transition-colors hover:text-[#A5B4FC]">
          Ver →
        </a>
      </td>
    </tr>
  )
}
