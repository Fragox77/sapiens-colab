'use client'

import type { DashboardMetrics, CollaboratorMetric } from '@/types'

// ─── Props ────────────────────────────────────────────────────────────────────

export type Periodo = 'semana' | 'mes' | 'trimestre'

interface MetricsDashboardProps {
  dashboard: DashboardMetrics
  prevDashboard: DashboardMetrics | null
  avgProjectDays: number
  avgRevisions: number
  periodo: Periodo
}

const PERIODO_LABEL: Record<Periodo, string> = {
  semana:    'Últimos 7 días',
  mes:       'Últimos 30 días',
  trimestre: 'Últimos 90 días',
}

type StatusLevel = 'green' | 'red' | 'neutral'

interface MetricCardProps {
  category: keyof typeof CATEGORY_LABEL
  label: string
  value: string
  subtext?: string
  status: StatusLevel
  /** 0–100 rendered as a progress bar */
  progressPct?: number
  /** Dims the value when the metric has no real data */
  emptyState?: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABEL = {
  negocio:    'NEGOCIO',
  operacion:  'OPERACIÓN',
  cliente:    'CLIENTE',
  eficiencia: 'EFICIENCIA',
} as const

// Tailwind classes per status — must be complete strings for the JIT scanner
const STATUS_WRAPPER: Record<StatusLevel, string> = {
  green:   'bg-emerald-500/10 border border-emerald-500/25',
  red:     'bg-rose-500/10 border border-rose-500/25',
  neutral: 'theme-dashboard-card border theme-dashboard-border',
}

const STATUS_PILL: Record<StatusLevel, string> = {
  green:   'bg-emerald-500/15 text-emerald-500',
  red:     'bg-rose-500/15 text-rose-500',
  neutral: 'bg-[var(--dashboard-surface-2)] theme-dashboard-muted',
}

const STATUS_BAR: Record<StatusLevel, string> = {
  green:   'bg-emerald-500',
  red:     'bg-rose-500',
  neutral: 'bg-[var(--dashboard-accent)]',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCsvContent(
  dashboard: DashboardMetrics,
  avgProjectDays: number,
  avgRevisions: number,
): string {
  const { business, operation, client, talent } = dashboard
  const fecha = new Date().toISOString().slice(0, 10)

  const rows: [string, string][] = [
    ['Ingresos totales',              fmtCOP(business.revenueTotal)],
    ['Ticket promedio',               fmtCOP(business.averageTicket)],
    ['Margen neto',                   `${business.marginPct}%`],
    ['Proyectos activos',             String(operation.activeProjects)],
    ['Tasa de finalización',          `${operation.completionRatePct}%`],
    ['Entrega promedio',              `${operation.avgDeliveryDays} días`],
    ['Satisfacción promedio',         client.satisfactionAvg === 0 ? '— / 5' : `${client.satisfactionAvg} / 5`],
    ['Tasa de recompra',              `${client.repurchaseRatePct}%`],
    ['Revisiones por proyecto',       String(avgRevisions)],
    ['Tiempo promedio por proyecto',  avgProjectDays === 0 ? '—' : `${avgProjectDays} días`],
    ['Proyectos por diseñador (avg)', String(talent.projectsPerDesignerAvg)],
  ]

  const header = 'fecha,metrica,valor'
  const lines = rows.map(([metrica, valor]) => `${fecha},"${metrica}","${valor}"`)
  return [header, ...lines].join('\n')
}

function calcDelta(current: number, prev: number): number | null {
  if (!Number.isFinite(prev) || prev === 0) return null
  return ((current - prev) / prev) * 100
}

function fmtDelta(delta: number | null): string | null {
  if (delta === null) return null
  const r = Math.round(delta * 10) / 10
  return `${r > 0 ? '+' : ''}${r}% vs periodo anterior`
}

function fmtCOP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CO')}`
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

function MetricCard({
  category,
  label,
  value,
  subtext,
  status,
  progressPct,
  emptyState = false,
}: MetricCardProps) {
  return (
    <article className={`rounded-xl p-4 transition-colors ${STATUS_WRAPPER[status]}`}>
      {/* Category pill */}
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-widest ${STATUS_PILL[status]}`}
      >
        {CATEGORY_LABEL[category]}
      </span>

      {/* Primary value */}
      <p
        className={`mt-3 text-2xl font-extrabold theme-dashboard-text ${
          emptyState ? 'opacity-40' : ''
        }`}
      >
        {value}
      </p>

      {/* Subtext / contextual hint */}
      {subtext && (
        <p
          className={`mt-1 text-xs ${
            status === 'red' ? 'text-semantic-danger font-medium' : 'theme-dashboard-muted'
          }`}
        >
          {subtext}
        </p>
      )}

      {/* Progress bar */}
      {progressPct !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--dashboard-border)]">
            <div
              className={`h-full rounded-full transition-all duration-700 ${STATUS_BAR[status]}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
            />
          </div>
          <p className="mt-0.5 text-right text-[10px] theme-dashboard-muted">
            {Math.round(progressPct)}%
          </p>
        </div>
      )}

      {/* Label at bottom */}
      <p className="mt-2 text-[11px] uppercase tracking-wide theme-dashboard-muted">{label}</p>
    </article>
  )
}

// ─── SpotlightCard ────────────────────────────────────────────────────────────

function SpotlightCard({ performer }: { performer: CollaboratorMetric }) {
  const initials = performer.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <article className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4 transition-colors">
      {/* Category pill */}
      <span className="inline-block rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-semantic-violet">
        EFICIENCIA
      </span>

      {/* Identity row */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-bold text-white shadow-md">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold theme-dashboard-text">{performer.name}</p>
          <p className="truncate text-xs theme-dashboard-muted">
            {performer.specialty} · Nivel {performer.level}
          </p>
        </div>
        <div className="ml-auto shrink-0 text-right">
          <p className="text-xl font-extrabold text-semantic-success">
            {performer.performanceScore}
          </p>
          <p className="text-[10px] theme-dashboard-muted">score</p>
        </div>
      </div>

      {/* Stats mini-grid */}
      <div className="mt-3 grid grid-cols-3 divide-x divide-violet-500/20 text-center">
        <div className="pr-2">
          <p className="text-sm font-bold theme-dashboard-text">{performer.completedProjects}</p>
          <p className="text-[10px] theme-dashboard-muted">completados</p>
        </div>
        <div className="px-2">
          <p className="text-sm font-bold theme-dashboard-text">{performer.avgDeliveryDays}d</p>
          <p className="text-[10px] theme-dashboard-muted">entrega avg</p>
        </div>
        <div className="pl-2">
          <p className="text-sm font-bold theme-dashboard-text">{performer.completionRatePct}%</p>
          <p className="text-[10px] theme-dashboard-muted">finalización</p>
        </div>
      </div>

      <p className="mt-2 text-[11px] uppercase tracking-wide theme-dashboard-muted">
        Top colaborador · Periodo activo
      </p>
    </article>
  )
}

// ─── SpotlightEmpty ───────────────────────────────────────────────────────────

function SpotlightEmpty() {
  return (
    <article className="rounded-xl border theme-dashboard-card border-dashed p-4">
      <span className="inline-block rounded-full bg-[var(--dashboard-surface-2)] px-2 py-0.5 text-[10px] font-semibold tracking-widest theme-dashboard-muted">
        EFICIENCIA
      </span>
      <p className="mt-3 text-sm theme-dashboard-muted">
        Sin colaboradores con actividad en el periodo.
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-wide theme-dashboard-muted">
        Top colaborador
      </p>
    </article>
  )
}

// ─── MetricsDashboard ─────────────────────────────────────────────────────────

export function MetricsDashboard({
  dashboard,
  prevDashboard,
  avgProjectDays,
  avgRevisions,
  periodo,
}: MetricsDashboardProps) {
  const { business, operation, client, talent } = dashboard
  const prev = prevDashboard
  const topPerformer = talent.topPerformers?.[0] ?? null

  function handleExportCsv() {
    const csv  = buildCsvContent(dashboard, avgProjectDays, avgRevisions)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `metricas-sapiens-${periodo}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Negocio ─────────────────────────────────────────────────────────────────
  const revDelta    = calcDelta(business.revenueTotal, prev?.business.revenueTotal ?? 0)
  const ticketDelta = calcDelta(business.averageTicket, prev?.business.averageTicket ?? 0)
  const marginDelta = calcDelta(business.marginPct,    prev?.business.marginPct ?? 0)

  const revenueStatus: StatusLevel =
    revDelta !== null ? (revDelta > 0 ? 'green' : 'red') : 'neutral'
  const ticketStatus: StatusLevel =
    ticketDelta !== null ? (ticketDelta > 0 ? 'green' : 'red') : 'neutral'
  const marginStatus: StatusLevel =
    business.marginPct >= 40 ? 'green' : business.marginPct < 20 ? 'red' : 'neutral'

  // ── Operación ────────────────────────────────────────────────────────────────
  const completionDelta = calcDelta(operation.completionRatePct, prev?.operation.completionRatePct ?? 0)
  // Delivery: lower is better → invert delta direction for status
  const deliveryDelta = calcDelta(prev?.operation.avgDeliveryDays ?? 0, operation.avgDeliveryDays)

  const completionStatus: StatusLevel =
    operation.completionRatePct <= 25 ? 'red' : operation.completionRatePct >= 70 ? 'green' : 'neutral'
  const activeStatus: StatusLevel =
    operation.delayedProjects > 0 ? 'red' : 'neutral'
  const deliveryStatus: StatusLevel =
    deliveryDelta !== null ? (deliveryDelta < 0 ? 'green' : deliveryDelta > 0 ? 'red' : 'neutral') : 'neutral'

  // ── Cliente ──────────────────────────────────────────────────────────────────
  const satDelta       = calcDelta(client.satisfactionAvg,   prev?.client.satisfactionAvg ?? 0)
  const repurchaseDelta = calcDelta(client.repurchaseRatePct, prev?.client.repurchaseRatePct ?? 0)

  const satEmpty        = client.satisfactionAvg === 0
  const repurchaseEmpty = client.repurchaseRatePct === 0

  const satStatus: StatusLevel =
    satEmpty ? 'neutral' : client.satisfactionAvg >= 4 ? 'green' : client.satisfactionAvg < 3 ? 'red' : 'neutral'
  const repurchaseStatus: StatusLevel =
    repurchaseEmpty ? 'red' : client.repurchaseRatePct >= 30 ? 'green' : 'neutral'

  // ── Eficiencia ───────────────────────────────────────────────────────────────
  const timeStatus: StatusLevel =
    avgProjectDays === 0 ? 'neutral' : avgProjectDays <= 3 ? 'green' : avgProjectDays >= 10 ? 'red' : 'neutral'
  const revisionsStatus: StatusLevel = avgRevisions > 3 ? 'red' : 'neutral'

  return (
    <div className="mb-6 space-y-6">
      {/* ── PERIODO HEADER ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--dashboard-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--dashboard-accent)] ring-1 ring-[var(--dashboard-accent)]/20">
          {PERIODO_LABEL[periodo]}
        </span>
        {prevDashboard && (
          <span className="theme-dashboard-muted text-xs">
            · comparado con el periodo anterior equivalente
          </span>
        )}
        <button
          onClick={handleExportCsv}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border theme-dashboard-border bg-[var(--dashboard-surface-2)] px-3 py-1 text-xs font-medium theme-dashboard-text hover:bg-[var(--dashboard-surface)] transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      {/* ── NEGOCIO ─────────────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest theme-dashboard-muted">
          Negocio
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            category="negocio"
            label="Ingresos totales"
            value={fmtCOP(business.revenueTotal)}
            subtext={fmtDelta(revDelta) ?? 'Sin comparativo previo'}
            status={revenueStatus}
          />
          <MetricCard
            category="negocio"
            label="Ticket promedio"
            value={fmtCOP(business.averageTicket)}
            subtext={fmtDelta(ticketDelta) ?? 'Sin comparativo previo'}
            status={ticketStatus}
          />
          <MetricCard
            category="negocio"
            label="Margen neto"
            value={`${business.marginPct}%`}
            subtext={
              business.marginPct >= 40
                ? 'Margen saludable (>40%)'
                : `${fmtDelta(marginDelta) ?? 'Sin comparativo previo'}`
            }
            status={marginStatus}
            progressPct={business.marginPct}
          />
        </div>
      </section>

      {/* ── OPERACIÓN ───────────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest theme-dashboard-muted">
          Operación
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            category="operacion"
            label="Proyectos activos"
            value={String(operation.activeProjects)}
            subtext={
              operation.delayedProjects > 0
                ? `${operation.delayedProjects} proyecto${operation.delayedProjects > 1 ? 's' : ''} con retraso`
                : 'Sin retrasos detectados'
            }
            status={activeStatus}
          />
          <MetricCard
            category="operacion"
            label="Tasa de finalización"
            value={`${operation.completionRatePct}%`}
            subtext={
              operation.completionRatePct <= 25
                ? 'Atención: tasa muy baja — revisar cuellos de botella'
                : fmtDelta(completionDelta) ?? 'Sin comparativo previo'
            }
            status={completionStatus}
            progressPct={operation.completionRatePct}
          />
          <MetricCard
            category="operacion"
            label="Entrega promedio"
            value={`${operation.avgDeliveryDays} días`}
            subtext={
              deliveryDelta !== null
                ? `${fmtDelta(deliveryDelta)} (menor = mejor)`
                : 'Sin comparativo previo'
            }
            status={deliveryStatus}
          />
        </div>
      </section>

      {/* ── CLIENTE ─────────────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest theme-dashboard-muted">
          Cliente
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            category="cliente"
            label="Satisfacción promedio"
            value={satEmpty ? '— / 5' : `${client.satisfactionAvg} / 5`}
            subtext={
              satEmpty
                ? 'Sin valoraciones registradas aún'
                : fmtDelta(satDelta) ?? undefined
            }
            status={satStatus}
            progressPct={satEmpty ? undefined : (client.satisfactionAvg / 5) * 100}
            emptyState={satEmpty}
          />
          <MetricCard
            category="cliente"
            label="Tasa de recompra"
            value={`${client.repurchaseRatePct}%`}
            subtext={
              repurchaseEmpty
                ? 'Sin clientes recurrentes aún'
                : fmtDelta(repurchaseDelta) ?? undefined
            }
            status={repurchaseStatus}
            progressPct={client.repurchaseRatePct}
            emptyState={repurchaseEmpty}
          />
          <MetricCard
            category="cliente"
            label="Revisiones por proyecto"
            value={`${avgRevisions}`}
            subtext={
              avgRevisions > 3
                ? 'Alto: puede indicar briefings poco claros'
                : 'Promedio de cambios solicitados'
            }
            status={revisionsStatus}
          />
        </div>
      </section>

      {/* ── EFICIENCIA DEL EQUIPO ────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest theme-dashboard-muted">
          Eficiencia del equipo
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topPerformer ? (
            <SpotlightCard performer={topPerformer} />
          ) : (
            <SpotlightEmpty />
          )}
          <MetricCard
            category="eficiencia"
            label="Tiempo promedio por proyecto"
            value={avgProjectDays === 0 ? '— días' : `${avgProjectDays} días`}
            subtext="Proyectos completados en el periodo"
            status={timeStatus}
            emptyState={avgProjectDays === 0}
          />
          <MetricCard
            category="eficiencia"
            label="Proyectos por diseñador (avg)"
            value={`${dashboard.talent.projectsPerDesignerAvg}`}
            subtext="Carga de trabajo distribuida"
            status="neutral"
          />
        </div>
      </section>
    </div>
  )
}
