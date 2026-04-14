'use client'
import { useEffect, useState } from 'react'
import { billingApi } from '@/lib/api'

type Plan = 'basic' | 'pro' | 'enterprise'

interface PlanCard {
  plan: Plan
  monthlyFee: number
  commissionRate: number
  seats: number
  maxActiveProjects: number
}

interface Overview extends PlanCard {
  tenantId: string
  model: string
}

interface Preview {
  plan: Plan
  monthlyFee: number
  commissionRate: number
  commissionRevenue: number
  projectedMRR: number
}

const PLAN_META: Record<Plan, { label: string; color: string; highlight: string }> = {
  basic:      { label: 'Basic',      color: 'theme-dashboard-border', highlight: 'border-slate-400' },
  pro:        { label: 'Pro',        color: 'theme-dashboard-border', highlight: 'border-[#4C58FF]' },
  enterprise: { label: 'Enterprise', color: 'theme-dashboard-border', highlight: 'border-violet-400' },
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function PlanesPage() {
  const [overview, setOverview]     = useState<Overview | null>(null)
  const [plans, setPlans]           = useState<PlanCard[]>([])
  const [loading, setLoading]       = useState(true)
  const [changing, setChanging]     = useState<Plan | null>(null)
  const [changeError, setChangeError] = useState('')

  // Preview calculator
  const [previewPlan, setPreviewPlan]     = useState<Plan>('pro')
  const [monthlyProjects, setMonthlyProjects] = useState(20)
  const [avgTicket, setAvgTicket]         = useState(1500000)
  const [preview, setPreview]             = useState<Preview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    Promise.all([billingApi.overview(), billingApi.plans()])
      .then(([ov, pl]) => {
        setOverview(ov as Overview)
        setPlans((pl as { items: PlanCard[] }).items)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleChangePlan(plan: Plan) {
    if (!overview || plan === overview.plan) return
    const confirmed = window.confirm(
      `¿Cambiar al plan ${PLAN_META[plan].label}? Este cambio aplica de inmediato.`
    )
    if (!confirmed) return
    setChanging(plan)
    setChangeError('')
    try {
      const updated = await billingApi.changePlan(plan)
      setOverview(prev => prev ? { ...prev, ...(updated as Partial<Overview>) } : prev)
    } catch (err) {
      setChangeError(err instanceof Error ? err.message : 'Error al cambiar plan')
    } finally {
      setChanging(null)
    }
  }

  async function handlePreview() {
    setPreviewLoading(true)
    try {
      const result = await billingApi.preview({ plan: previewPlan, monthlyProjects, avgTicket })
      setPreview(result as Preview)
    } catch {
      // silently ignore
    } finally {
      setPreviewLoading(false)
    }
  }

  if (loading) return (
    <div className="text-slate-400 text-sm">Cargando planes...</div>
  )

  const currentPlan = (overview?.plan ?? 'basic') as Plan

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="theme-dashboard-text text-3xl font-bold">Planes</h1>
        <p className="theme-dashboard-muted mt-1 text-sm">
          Plan activo: <span className="theme-dashboard-text font-semibold capitalize">{currentPlan}</span>
          {overview && (
            <span className="theme-dashboard-muted ml-3">· Tenant: {overview.tenantId}</span>
          )}
        </p>
      </div>

      {changeError && (
        <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-2 text-sm text-semantic-danger">
          {changeError}
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        {plans.map(p => {
          const meta = PLAN_META[p.plan as Plan]
          const isCurrent = p.plan === currentPlan
          return (
            <div
              key={p.plan}
              className={`theme-dashboard-surface rounded-xl border-2 p-5 flex flex-col gap-4 transition-all ${
                isCurrent ? meta.highlight + ' shadow-[0_0_24px_rgba(76,88,255,0.15)]' : meta.color
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="theme-dashboard-muted text-xs font-bold uppercase tracking-wider">
                    {meta.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs font-semibold text-[#A5B4FC] bg-[#4C58FF]/20 px-2 py-0.5 rounded-full">
                      Activo
                    </span>
                  )}
                </div>
                <div className="theme-dashboard-text text-3xl font-black">
                  ${p.monthlyFee}
                  <span className="theme-dashboard-muted text-sm font-normal">/mes</span>
                </div>
              </div>

              <ul className="theme-dashboard-muted space-y-1.5 text-xs flex-1">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Comisión: <span className="theme-dashboard-text font-semibold">{Math.round(p.commissionRate * 100)}%</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Seats: <span className="theme-dashboard-text font-semibold">
                    {p.seats >= 999 ? 'Ilimitados' : p.seats}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  Proyectos activos: <span className="theme-dashboard-text font-semibold">
                    {p.maxActiveProjects >= 999 ? 'Ilimitados' : p.maxActiveProjects}
                  </span>
                </li>
              </ul>

              <button
                onClick={() => handleChangePlan(p.plan as Plan)}
                disabled={isCurrent || changing !== null}
                className={`w-full rounded-lg py-2 text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-[#4C58FF]/20 text-[#A5B4FC] cursor-default'
                    : 'theme-dashboard-surface-2 border theme-dashboard-border theme-dashboard-muted hover:bg-[var(--dashboard-surface-2)] disabled:opacity-50'
                }`}
              >
                {changing === p.plan ? 'Cambiando...' : isCurrent ? 'Plan actual' : 'Activar plan'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Resumen financiero del plan actual */}
      {overview && (
        <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-5 mb-8">
          <h2 className="theme-dashboard-muted text-xs font-semibold uppercase tracking-wider mb-4">
            Detalles del plan actual
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Cuota mensual',    value: fmt(overview.monthlyFee) },
              { label: 'Comisión',         value: `${Math.round(overview.commissionRate * 100)}%` },
              { label: 'Seats',            value: overview.seats >= 999 ? '∞' : String(overview.seats) },
              { label: 'Máx. proyectos',   value: overview.maxActiveProjects >= 999 ? '∞' : String(overview.maxActiveProjects) },
            ].map(item => (
              <div key={item.label} className="theme-dashboard-surface-2 rounded-lg p-3">
                <div className="theme-dashboard-muted text-xs mb-1">{item.label}</div>
                <div className="theme-dashboard-text text-lg font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculadora de MRR */}
      <div className="theme-dashboard-border theme-dashboard-surface rounded-xl border p-5">
        <h2 className="theme-dashboard-muted text-xs font-semibold uppercase tracking-wider mb-1">
          Calculadora de ingresos
        </h2>
        <p className="theme-dashboard-muted text-xs mb-4">Proyecta el MRR según tu volumen operativo.</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <div>
            <label className="theme-dashboard-muted text-xs mb-1 block">Plan a simular</label>
            <select
              value={previewPlan}
              onChange={e => setPreviewPlan(e.target.value as Plan)}
              className="theme-dashboard-input w-full rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-[#4C58FF]/50"
            >
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label className="theme-dashboard-muted text-xs mb-1 block">Proyectos/mes</label>
            <input
              type="number"
              min={1}
              value={monthlyProjects}
              onChange={e => setMonthlyProjects(Number(e.target.value))}
              className="theme-dashboard-input w-full rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-[#4C58FF]/50"
            />
          </div>
          <div>
            <label className="theme-dashboard-muted text-xs mb-1 block">Ticket promedio (COP)</label>
            <input
              type="number"
              min={0}
              step={100000}
              value={avgTicket}
              onChange={e => setAvgTicket(Number(e.target.value))}
              className="theme-dashboard-input w-full rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-[#4C58FF]/50"
            />
          </div>
        </div>

        <button
          onClick={handlePreview}
          disabled={previewLoading}
          className="bg-[#4C58FF] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 mb-4"
        >
          {previewLoading ? 'Calculando...' : 'Calcular proyección'}
        </button>

        {preview && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Cuota fija',      value: fmt(preview.monthlyFee),        sub: '/mes' },
              { label: 'Comisión',        value: `${Math.round(preview.commissionRate * 100)}%`, sub: 'por proyecto' },
              { label: 'Ingresos comisión', value: `$${preview.commissionRevenue.toLocaleString('es-CO')}`, sub: 'estimado' },
              { label: 'MRR proyectado',  value: `$${preview.projectedMRR.toLocaleString('es-CO')}`, sub: 'total mes', highlight: true },
            ].map(item => (
              <div
                key={item.label}
                className={`rounded-lg p-3 ${item.highlight ? 'bg-[#4C58FF]/15 border border-[#4C58FF]/30' : 'theme-dashboard-surface-2'}`}
              >
                <div className="theme-dashboard-muted text-xs mb-1">{item.label}</div>
                <div className={`text-lg font-bold ${item.highlight ? 'text-[#A5B4FC]' : 'theme-dashboard-text'}`}>
                  {item.value}
                </div>
                <div className="theme-dashboard-muted text-xs">{item.sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
