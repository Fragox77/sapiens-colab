'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { finanzasApi } from '@/lib/api'
import { getStoredUser } from '@/lib/auth'
import type {
  ColaboradorFinanzasResumen,
  ColaboradorLiquidacion,
  ColaboradorProyecto,
} from '@/types'

// ─── Utilidades ────────────────────────────────────────────────────────────────

const COP = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function exportCSV(proyectos: ColaboradorProyecto[]) {
  const headers = [
    'Proyecto', 'Cliente', 'Valor bruto', 'Comisión agencia',
    'Retefuente', 'Mi neto', 'Anticipo recibido', 'Saldo', 'Estado',
  ]
  const body = proyectos.map(p => [
    p.nombre, p.cliente, p.valorTotal, p.comisionAgencia,
    p.retefuente, p.neto, p.anticipoRecibido, p.saldoPendiente, p.estado,
  ])
  const csv = [headers, ...body].map(r => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `mis-finanzas-${toInputDate(new Date())}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function ColaboradorFinanzasPage() {
  const router = useRouter()
  const [data, setData]       = useState<ColaboradorFinanzasResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Verificar acceso y cargar datos
  useEffect(() => {
    const user = getStoredUser()
    if (!user) { router.replace('/login'); return }
    if (user.role === 'admin') { router.replace('/admin/finanzas'); return }
    if (user.role !== 'disenador') { router.replace('/'); return }

    finanzasApi
      .resumenColaborador()
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [router])

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="theme-dashboard-text text-2xl sm:text-3xl font-extrabold">
            Mis finanzas
          </h1>
          <p className="theme-dashboard-muted mt-1 text-sm">
            Tu desglose de ingresos y pagos
          </p>
        </div>

        <button
          onClick={() => data && exportCSV(data.proyectos)}
          disabled={!data || data.proyectos.length === 0}
          className="flex items-center gap-1.5 rounded-lg border theme-dashboard-border px-3 py-1.5 text-xs theme-dashboard-muted font-medium transition-colors hover:border-[#4C58FF]/50 hover:text-[#4C58FF] disabled:opacity-40"
        >
          <IconDownload />
          Exportar CSV
        </button>
      </div>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* ── KPI cards ─────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total ganado"
          value={data ? COP(data.kpis.totalGanado) : null}
          loading={loading}
          accent="emerald"
          icon={<IconCash />}
          hint="Neto de todos tus proyectos"
        />
        <KpiCard
          label="Por cobrar"
          value={data ? COP(data.kpis.porCobrar) : null}
          loading={loading}
          accent="amber"
          icon={<IconClock />}
          hint="Saldo pendiente de pago"
        />
        <KpiCard
          label="Anticipos recibidos"
          value={data ? COP(data.kpis.anticiposRecibidos) : null}
          loading={loading}
          accent="blue"
          icon={<IconCheck />}
          hint="Total pagado hasta hoy"
        />
        <KpiCard
          label="Proyectos completados"
          value={data ? String(data.kpis.proyectosCompletados) : null}
          loading={loading}
          accent="neutral"
          icon={<IconBriefcase />}
          hint="Proyectos finalizados"
        />
      </div>

      {/* ── Tabla de proyectos ────────────────────────────────── */}
      <div className="theme-dashboard-surface theme-dashboard-border rounded-xl border mb-6">
        <div className="px-5 py-4 border-b theme-dashboard-border">
          <h2 className="theme-dashboard-text font-semibold">Mis proyectos</h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton cols={9} />
          ) : !data || data.proyectos.length === 0 ? (
            <EmptyState message="Aún no tienes proyectos asignados" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b theme-dashboard-border">
                  {[
                    'Proyecto', 'Cliente', 'Valor bruto', 'Comisión agencia',
                    'Retefuente', 'Mi neto', 'Anticipo', 'Saldo', 'Estado',
                  ].map(h => (
                    <th
                      key={h}
                      className="theme-dashboard-muted px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide first:pl-5 last:pr-5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y theme-dashboard-border">
                {data.proyectos.map(p => (
                  <ProyectoRow key={String(p.id)} proyecto={p} />
                ))}
              </tbody>
              {/* Totales */}
              <tfoot>
                <tr className="border-t-2 theme-dashboard-border">
                  <td className="pl-5 py-3 theme-dashboard-muted text-xs font-semibold uppercase tracking-wide" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-3 theme-dashboard-text font-bold font-mono">
                    {COP(data.proyectos.reduce((s, p) => s + p.valorTotal, 0))}
                  </td>
                  <td className="px-4 py-3 text-indigo-400 font-bold font-mono">
                    {COP(data.proyectos.reduce((s, p) => s + p.comisionAgencia, 0))}
                  </td>
                  <td className="px-4 py-3 text-amber-400 font-bold font-mono">
                    {COP(data.proyectos.reduce((s, p) => s + p.retefuente, 0))}
                  </td>
                  <td className="px-4 py-3 theme-dashboard-text font-extrabold font-mono">
                    {COP(data.proyectos.reduce((s, p) => s + p.neto, 0))}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-bold font-mono">
                    {COP(data.proyectos.reduce((s, p) => s + p.anticipoRecibido, 0))}
                  </td>
                  <td className="px-4 py-3 theme-dashboard-text font-bold font-mono">
                    {COP(data.proyectos.reduce((s, p) => s + p.saldoPendiente, 0))}
                  </td>
                  <td className="pr-5" />
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* ── Historial de pagos ────────────────────────────────── */}
      <div className="theme-dashboard-surface theme-dashboard-border rounded-xl border">
        <div className="px-5 py-4 border-b theme-dashboard-border">
          <h2 className="theme-dashboard-text font-semibold">Historial de pagos</h2>
          <p className="theme-dashboard-muted text-xs mt-0.5">
            Liquidaciones registradas por Sapiens Colab
          </p>
        </div>

        {loading ? (
          <TableSkeleton cols={3} />
        ) : !data || data.liquidaciones.length === 0 ? (
          <EmptyState message="Aún no has recibido pagos" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b theme-dashboard-border">
                  {['Fecha', 'Monto', 'Comprobante'].map(h => (
                    <th
                      key={h}
                      className="theme-dashboard-muted px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide first:pl-5 last:pr-5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y theme-dashboard-border">
                {data.liquidaciones.map((liq, i) => (
                  <LiquidacionRow key={i} liq={liq} />
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 theme-dashboard-border">
                  <td className="pl-5 py-3 theme-dashboard-muted text-xs font-semibold uppercase tracking-wide">
                    Total recibido
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-extrabold font-mono">
                    {COP(data.liquidaciones.reduce((s, l) => s + l.monto, 0))}
                  </td>
                  <td className="pr-5" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Subcomponentes ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, loading, accent, icon, hint,
}: {
  label: string
  value: string | null
  loading: boolean
  accent: 'emerald' | 'amber' | 'blue' | 'neutral'
  icon: React.ReactNode
  hint: string
}) {
  const styles = {
    emerald: 'text-emerald-400 bg-emerald-400/10',
    amber:   'text-amber-400  bg-amber-400/10',
    blue:    'text-blue-400   bg-blue-400/10',
    neutral: 'theme-dashboard-muted bg-[var(--dashboard-surface-2)]',
  }[accent]

  return (
    <div className="theme-dashboard-surface theme-dashboard-border rounded-xl border p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles}`}>
          {icon}
        </span>
        <p className="theme-dashboard-muted text-xs font-medium">{label}</p>
      </div>
      {loading ? (
        <div className="h-7 w-3/4 animate-pulse rounded-md bg-current opacity-10" />
      ) : (
        <p className="theme-dashboard-text text-2xl font-extrabold tracking-tight">{value ?? '—'}</p>
      )}
      <p className="theme-dashboard-muted mt-1 text-[10px] opacity-70">{hint}</p>
    </div>
  )
}

const ESTADO_MAP = {
  activo:     { label: 'En curso',    cls: 'bg-blue-500/15 text-blue-400' },
  completado: { label: 'Completado',  cls: 'bg-amber-500/15 text-amber-400' },
  liquidado:  { label: 'Liquidado',   cls: 'bg-emerald-500/15 text-emerald-400' },
} as const

function ProyectoRow({ proyecto: p }: { proyecto: ColaboradorProyecto }) {
  const { label, cls } = ESTADO_MAP[p.estado] ?? ESTADO_MAP.activo

  return (
    <tr className="transition-colors hover:bg-[var(--dashboard-surface-2)]">
      <td className="py-3 pl-5 pr-4">
        <p className="theme-dashboard-text font-medium leading-tight">{p.nombre}</p>
        {p.fechaEntrega && (
          <p className="theme-dashboard-muted text-[10px] mt-0.5">
            {new Date(p.fechaEntrega).toLocaleDateString('es-CO')}
          </p>
        )}
      </td>
      <td className="px-4 py-3 theme-dashboard-muted text-sm">{p.cliente}</td>
      <td className="px-4 py-3 theme-dashboard-text font-mono">{COP(p.valorTotal)}</td>
      <td className="px-4 py-3 text-indigo-400 font-mono">({COP(p.comisionAgencia)})</td>
      <td className="px-4 py-3 text-amber-400 font-mono">({COP(p.retefuente)})</td>
      <td className="px-4 py-3 theme-dashboard-text font-semibold font-mono">{COP(p.neto)}</td>
      <td className="px-4 py-3 text-emerald-400 font-mono">{COP(p.anticipoRecibido)}</td>
      <td className="px-4 py-3 theme-dashboard-text font-mono">{COP(p.saldoPendiente)}</td>
      <td className="py-3 pr-5">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
          {label}
        </span>
      </td>
    </tr>
  )
}

function LiquidacionRow({ liq }: { liq: ColaboradorLiquidacion }) {
  return (
    <tr className="transition-colors hover:bg-[var(--dashboard-surface-2)]">
      <td className="py-3 pl-5 pr-4 theme-dashboard-muted text-sm">
        {new Date(liq.fecha).toLocaleDateString('es-CO', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </td>
      <td className="px-4 py-3 text-emerald-400 font-semibold font-mono">{COP(liq.monto)}</td>
      <td className="px-4 py-3 pr-5 theme-dashboard-muted text-sm">
        {liq.comprobante || <span className="opacity-40">—</span>}
      </td>
    </tr>
  )
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <div className="space-y-3 p-5">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: Math.min(cols, 5) }, (_, j) => (
            <div
              key={j}
              className={`h-5 animate-pulse rounded-md bg-current opacity-10 ${j === 0 ? 'w-32' : 'w-20'}`}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12">
      <span className="text-2xl opacity-30">💸</span>
      <p className="theme-dashboard-muted text-sm">{message}</p>
    </div>
  )
}

// ─── Íconos ────────────────────────────────────────────────────────────────────

const IconCash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)
const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconBriefcase = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
)
const IconDownload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
