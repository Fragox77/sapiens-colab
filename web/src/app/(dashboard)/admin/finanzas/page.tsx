'use client'

import { useEffect, useMemo, useState } from 'react'
import { finanzasApi } from '@/lib/api'
import type {
  ColaboradorFinanzas,
  FinanzasKpis,
  FinanzasResumen,
  ProyectoFinanzas,
} from '@/types'

// ─── Tipos auxiliares ──────────────────────────────────────────────────────────

type Preset = '7d' | '30d' | '90d' | 'custom'
type Range  = { from: Date; to: Date }

// ─── Utilidades ────────────────────────────────────────────────────────────────

function resolveRange(preset: Preset, customFrom: string, customTo: string): Range {
  const to = new Date()
  if (preset === 'custom' && customFrom && customTo) {
    return { from: new Date(customFrom), to: new Date(customTo) }
  }
  const days = preset === '7d' ? 7 : preset === '90d' ? 90 : 30
  return { from: new Date(to.getTime() - days * 24 * 60 * 60 * 1000), to }
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

const COP = (n: number) =>
  `$${Math.round(n).toLocaleString('es-CO')}`

function exportCSV(rows: ColaboradorFinanzas[]) {
  const headers = [
    'Colaborador', 'Proyectos activos', 'Bruto', 'Comisión',
    'Retefuente', 'Neto a pagar', 'Anticipo pagado', 'Saldo', 'Estado',
  ]
  const body = rows.map(c => [
    c.nombre,
    c.proyectosActivos,
    c.valorBruto,
    c.comisionAgencia,
    c.retefuente,
    c.netoPagar,
    c.anticiposPagados,
    c.saldoPendiente,
    c.estado,
  ])
  const csv = [headers, ...body].map(r => r.join(',')).join('\n')
  const blob = new Blob(['﻿' + csv, ''], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `finanzas-${toInputDate(new Date())}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function FinanzasPage() {
  const [data, setData]       = useState<FinanzasResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Estado de UI
  const [expandedRow, setExpandedRow]   = useState<string | null>(null)
  const [modalCollab, setModalCollab]   = useState<ColaboradorFinanzas | null>(null)
  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState('')

  // Formulario modal
  const [formMonto, setFormMonto]           = useState('')
  const [formComprobante, setFormComprobante] = useState('')
  const [formFecha, setFormFecha]           = useState(toInputDate(new Date()))

  // Filtro de período
  const [preset, setPreset]     = useState<Preset>('30d')
  const defaultTo   = useMemo(() => new Date(), [])
  const defaultFrom = useMemo(() => new Date(defaultTo.getTime() - 30 * 24 * 60 * 60 * 1000), [defaultTo])
  const [customFrom, setCustomFrom] = useState(toInputDate(defaultFrom))
  const [customTo, setCustomTo]     = useState(toInputDate(defaultTo))

  const currentRange = useMemo(
    () => resolveRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  )

  // Carga de datos
  useEffect(() => {
    setLoading(true)
    setError('')
    finanzasApi
      .resumen({ from: currentRange.from.toISOString(), to: currentRange.to.toISOString() })
      .then(setData)
      .catch(e => setError(e instanceof Error ? e.message : 'Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [currentRange])

  // Abrir modal
  function openModal(collab: ColaboradorFinanzas) {
    setModalCollab(collab)
    setFormMonto(String(collab.saldoPendiente))
    setFormComprobante('')
    setFormFecha(toInputDate(new Date()))
    setSubmitError('')
  }

  // Confirmar liquidación
  async function handleLiquidar() {
    if (!modalCollab) return
    const monto = Number(formMonto)
    if (!monto || monto <= 0) { setSubmitError('El monto debe ser mayor a 0'); return }

    setSubmitting(true)
    setSubmitError('')
    try {
      await finanzasApi.crearLiquidacion({
        colaboradorId: modalCollab.id,
        monto,
        comprobante: formComprobante,
        fecha: formFecha,
      })
      setModalCollab(null)
      // Recargar datos
      const fresh = await finanzasApi.resumen({
        from: currentRange.from.toISOString(),
        to: currentRange.to.toISOString(),
      })
      setData(fresh)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
  }

  // Proyectos del colaborador expandido
  const proyectosDeColaborador = (collabId: string): ProyectoFinanzas[] =>
    (data?.proyectos ?? []).filter(p => p.colaboradorId === collabId)

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="theme-dashboard-text text-3xl font-extrabold">Finanzas</h1>
          <p className="theme-dashboard-muted mt-1 text-sm">
            Comisiones, retenciones y liquidaciones de colaboradores
          </p>
        </div>

        {/* Presets período */}
        <div className="flex flex-wrap gap-2">
          {(['7d', '30d', '90d', 'custom'] as Preset[]).map(item => (
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

      {/* Rango personalizado */}
      {preset === 'custom' && (
        <div className="theme-dashboard-border theme-dashboard-surface mb-6 flex flex-wrap items-center gap-2 rounded-xl border p-3">
          <input
            type="date"
            value={customFrom}
            onChange={e => setCustomFrom(e.target.value)}
            className="theme-dashboard-input rounded-lg px-3 py-2 text-sm"
          />
          <span className="theme-dashboard-muted text-xs">a</span>
          <input
            type="date"
            value={customTo}
            onChange={e => setCustomTo(e.target.value)}
            className="theme-dashboard-input rounded-lg px-3 py-2 text-sm"
          />
        </div>
      )}

      {/* ── KPI cards ─────────────────────────────────────────── */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Facturación bruta"
          value={data ? COP(data.kpis.facturacionBruta) : null}
          loading={loading}
          accent="blue"
          icon={<IconCash />}
        />
        <KpiCard
          label="Comisión Sapiens"
          value={data ? COP(data.kpis.comisionSapiens) : null}
          loading={loading}
          accent="indigo"
          icon={<IconPercent />}
        />
        <KpiCard
          label="Retenciones totales"
          value={data ? COP(data.kpis.retencionesTotales) : null}
          loading={loading}
          accent="amber"
          icon={<IconTax />}
        />
        <KpiCard
          label="Utilidad neta"
          value={data ? COP(data.kpis.utilidadNeta) : null}
          loading={loading}
          accent="emerald"
          icon={<IconTrend />}
        />
      </div>

      {/* ── Error global ──────────────────────────────────────── */}
      {error && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* ── Tabla de colaboradores ────────────────────────────── */}
      <div className="theme-dashboard-surface theme-dashboard-border rounded-xl border">
        {/* Cabecera de tabla */}
        <div className="flex items-center justify-between border-b theme-dashboard-border px-5 py-4">
          <h2 className="theme-dashboard-text font-semibold">Colaboradores</h2>
          <button
            onClick={() => data && exportCSV(data.colaboradores)}
            disabled={!data || data.colaboradores.length === 0}
            className="flex items-center gap-1.5 rounded-lg border theme-dashboard-border px-3 py-1.5 text-xs theme-dashboard-muted font-medium transition-colors hover:border-[#4C58FF]/50 hover:text-[#4C58FF] disabled:opacity-40"
          >
            <IconDownload />
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton />
          ) : !data || data.colaboradores.length === 0 ? (
            <div className="theme-dashboard-muted px-5 py-10 text-center text-sm">
              Sin datos para el período seleccionado
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b theme-dashboard-border">
                  {[
                    'Colaborador', 'Proyectos', 'Bruto', 'Comisión',
                    'Retefuente', 'Neto a pagar', 'Anticipo pagado', 'Saldo', 'Estado', '',
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
                {data.colaboradores.map(collab => (
                  <>
                    {/* Fila principal */}
                    <tr
                      key={collab.id}
                      className="cursor-pointer transition-colors hover:bg-[var(--dashboard-surface-2)]"
                      onClick={() =>
                        setExpandedRow(prev => (prev === collab.id ? null : collab.id))
                      }
                    >
                      <td className="py-3 pl-5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4C58FF]/15 text-xs font-bold text-[#4C58FF]">
                            {collab.nombre.charAt(0).toUpperCase()}
                          </span>
                          <span className="theme-dashboard-text font-medium">{collab.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 theme-dashboard-muted">{collab.proyectosActivos}</td>
                      <td className="px-4 py-3 theme-dashboard-text font-medium">{COP(collab.valorBruto)}</td>
                      <td className="px-4 py-3 text-indigo-400">{COP(collab.comisionAgencia)}</td>
                      <td className="px-4 py-3 text-amber-400">{COP(collab.retefuente)}</td>
                      <td className="px-4 py-3 theme-dashboard-text font-semibold">{COP(collab.netoPagar)}</td>
                      <td className="px-4 py-3 text-emerald-400">{COP(collab.anticiposPagados)}</td>
                      <td className="px-4 py-3 theme-dashboard-text font-semibold">
                        {COP(collab.saldoPendiente)}
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={collab.estado} />
                      </td>
                      <td className="py-3 pl-4 pr-5">
                        <div className="flex items-center gap-2">
                          {collab.saldoPendiente > 0 && (
                            <button
                              onClick={e => { e.stopPropagation(); openModal(collab) }}
                              className="whitespace-nowrap rounded-lg bg-[#4C58FF] px-2.5 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            >
                              Registrar liquidación
                            </button>
                          )}
                          <span className="theme-dashboard-muted text-xs">
                            {expandedRow === collab.id ? '▲' : '▼'}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Fila expandible: proyectos del colaborador */}
                    {expandedRow === collab.id && (
                      <tr key={`${collab.id}-detail`}>
                        <td colSpan={10} className="bg-[var(--dashboard-surface-2)] px-5 py-4">
                          <ProyectosColaborador
                            proyectos={proyectosDeColaborador(collab.id)}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal de liquidación ───────────────────────────────── */}
      {modalCollab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="theme-dashboard-surface theme-dashboard-border w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="theme-dashboard-text text-lg font-bold">Registrar liquidación</h3>
                <p className="theme-dashboard-muted mt-0.5 text-sm">{modalCollab.nombre}</p>
              </div>
              <button
                onClick={() => setModalCollab(null)}
                className="theme-dashboard-muted hover:text-white text-lg leading-none"
              >
                ×
              </button>
            </div>

            {/* Resumen */}
            <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-[var(--dashboard-surface-2)] p-4">
              <div>
                <p className="theme-dashboard-muted text-[11px]">Neto a pagar</p>
                <p className="theme-dashboard-text font-bold">{COP(modalCollab.netoPagar)}</p>
              </div>
              <div>
                <p className="theme-dashboard-muted text-[11px]">Saldo pendiente</p>
                <p className="font-bold text-amber-400">{COP(modalCollab.saldoPendiente)}</p>
              </div>
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              <label className="block">
                <span className="theme-dashboard-muted mb-1 block text-xs font-medium">
                  Monto a pagar *
                </span>
                <input
                  type="number"
                  min="1"
                  value={formMonto}
                  onChange={e => setFormMonto(e.target.value)}
                  className="theme-dashboard-input w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="0"
                />
              </label>

              <label className="block">
                <span className="theme-dashboard-muted mb-1 block text-xs font-medium">
                  Comprobante
                </span>
                <input
                  type="text"
                  value={formComprobante}
                  onChange={e => setFormComprobante(e.target.value)}
                  className="theme-dashboard-input w-full rounded-lg px-3 py-2 text-sm"
                  placeholder="Nro. transferencia, recibo, etc."
                />
              </label>

              <label className="block">
                <span className="theme-dashboard-muted mb-1 block text-xs font-medium">
                  Fecha *
                </span>
                <input
                  type="date"
                  value={formFecha}
                  onChange={e => setFormFecha(e.target.value)}
                  className="theme-dashboard-input w-full rounded-lg px-3 py-2 text-sm"
                />
              </label>
            </div>

            {submitError && (
              <p className="mt-3 text-xs text-rose-400">{submitError}</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setModalCollab(null)}
                className="flex-1 rounded-lg border theme-dashboard-border py-2 text-sm theme-dashboard-muted transition-colors hover:border-[#4C58FF]/40"
              >
                Cancelar
              </button>
              <button
                onClick={handleLiquidar}
                disabled={submitting}
                className="flex-1 rounded-lg bg-[#4C58FF] py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(76,88,255,0.35)] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? 'Registrando...' : 'Confirmar liquidación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Subcomponentes ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, loading, accent, icon,
}: {
  label: string
  value: string | null
  loading: boolean
  accent: 'blue' | 'indigo' | 'amber' | 'emerald'
  icon: React.ReactNode
}) {
  const accentClass = {
    blue:    'text-blue-400   bg-blue-400/10',
    indigo:  'text-indigo-400 bg-indigo-400/10',
    amber:   'text-amber-400  bg-amber-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
  }[accent]

  return (
    <div className="theme-dashboard-surface theme-dashboard-border rounded-xl border p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accentClass}`}>
          {icon}
        </span>
        <p className="theme-dashboard-muted text-xs font-medium">{label}</p>
      </div>
      {loading ? (
        <div className="h-7 w-3/4 animate-pulse rounded-md bg-current opacity-10" />
      ) : (
        <p className="theme-dashboard-text text-2xl font-extrabold tracking-tight">{value ?? '—'}</p>
      )}
    </div>
  )
}

function EstadoBadge({ estado }: { estado: ColaboradorFinanzas['estado'] }) {
  const map = {
    al_dia:   { label: 'Al día',    cls: 'bg-emerald-500/15 text-emerald-400' },
    pendiente: { label: 'Pendiente', cls: 'bg-amber-500/15  text-amber-400' },
    liquidado: { label: 'Liquidado', cls: 'bg-zinc-500/20   text-zinc-400' },
  }
  const { label, cls } = map[estado]
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  )
}

function ProyectosColaborador({ proyectos }: { proyectos: ProyectoFinanzas[] }) {
  const estadoMap = {
    activo:     { label: 'Activo',     cls: 'text-blue-400' },
    completado: { label: 'Completado', cls: 'text-emerald-400' },
    liquidado:  { label: 'Liquidado',  cls: 'text-zinc-400' },
  }

  if (proyectos.length === 0) {
    return (
      <p className="theme-dashboard-muted text-xs">Sin proyectos en este período.</p>
    )
  }

  return (
    <div>
      <p className="theme-dashboard-muted mb-2 text-[11px] font-semibold uppercase tracking-wide">
        Proyectos en el período
      </p>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b theme-dashboard-border">
            {['Proyecto', 'Cliente', 'Valor total', 'Comisión', 'Neto a pagar', 'Anticipo cliente', 'Anticipo colaborador', 'Estado'].map(h => (
              <th key={h} className="theme-dashboard-muted py-2 pr-4 text-left text-[10px] font-semibold uppercase tracking-wide first:pl-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y theme-dashboard-border">
          {proyectos.map(p => (
            <tr key={String(p.id)}>
              <td className="py-2 pr-4 theme-dashboard-text font-medium">{p.nombre}</td>
              <td className="py-2 pr-4 theme-dashboard-muted">{p.cliente}</td>
              <td className="py-2 pr-4 theme-dashboard-text">{`$${Math.round(p.valorTotal).toLocaleString('es-CO')}`}</td>
              <td className="py-2 pr-4 text-indigo-400">{`$${Math.round(p.comision).toLocaleString('es-CO')}`}</td>
              <td className="py-2 pr-4 theme-dashboard-text font-semibold">{`$${Math.round(p.netoPagar).toLocaleString('es-CO')}`}</td>
              <td className="py-2 pr-4 theme-dashboard-muted">{`$${Math.round(p.anticipoCliente).toLocaleString('es-CO')}`}</td>
              <td className="py-2 pr-4 text-emerald-400">{`$${Math.round(p.anticipoColaborador).toLocaleString('es-CO')}`}</td>
              <td className="py-2">
                <span className={`font-semibold ${estadoMap[p.estado].cls}`}>
                  {estadoMap[p.estado].label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex gap-4">
          <div className="h-5 w-32 animate-pulse rounded-md bg-current opacity-10" />
          <div className="h-5 w-16 animate-pulse rounded-md bg-current opacity-10" />
          <div className="h-5 w-24 animate-pulse rounded-md bg-current opacity-10" />
          <div className="h-5 w-24 animate-pulse rounded-md bg-current opacity-10" />
          <div className="h-5 w-20 animate-pulse rounded-md bg-current opacity-10" />
        </div>
      ))}
    </div>
  )
}

// ─── Íconos ────────────────────────────────────────────────────────────────────

const IconCash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)

const IconPercent = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="6.5" cy="6.5" r="2.5"/>
    <circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
)

const IconTax = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
    <line x1="12" y1="12" x2="12" y2="18"/>
  </svg>
)

const IconTrend = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
)

const IconDownload = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
