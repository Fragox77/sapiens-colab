'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
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

export default function FinancieroAdminPage() {
  const [data, setData]         = useState<FinancieroReport | null>(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<Tab>('pagos')
  const [processing, setProcessing] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPago, setFilterPago]     = useState('todos')
  const [error, setError]       = useState('')

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Cargando datos financieros...</p>
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
        <h1 className="text-2xl font-bold text-cobalt">Finanzas</h1>
        <p className="text-sm text-gray-400 mt-1">Panel financiero completo de SAPIENS COLAB</p>
      </div>

      {/* ── KPIs ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi label="Total facturado"     value={fmt(kpis.totalFacturado)}     accent="cobalt" />
        <Kpi label="Comisión SAPIENS"    value={fmt(kpis.comisionSapiens)}    accent="coral" />
        <Kpi label="Anticipos pendientes" value={fmt(kpis.anticiposPendientes)} accent="yellow" />
        <Kpi label="Balances por cobrar"  value={fmt(kpis.balancesPendientes)} accent="purple" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi label="Pipeline activo"   value={fmt(kpis.pipelineTotal)}      accent="blue"  sub={`${kpis.proyectosActivos} proyectos`} />
        <Kpi label="Pagado diseñadores" value={fmt(kpis.pagadoDisenadores)} accent="green" />
        <Kpi label="Proyectos totales" value={String(kpis.totalProyectos)}  accent="gray" />
        <Kpi label="Utilidad neta est." value={fmt(kpis.comisionSapiens)}   accent="gray"  sub="(sobre completados)" />
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {([
          { key: 'pagos',         label: 'Control de pagos' },
          { key: 'liquidaciones', label: 'Liquidaciones diseñadores' },
          { key: 'ingresos',      label: 'Ingresos por mes' },
        ] as { key: Tab; label: string }[]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-cobalt shadow-sm' : 'text-gray-500 hover:text-cobalt'
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
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cobalt/30"
            >
              <option value="todos">Todos los estados</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <select
              value={filterPago}
              onChange={e => setFilterPago(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cobalt/30"
            >
              <option value="todos">Todos los pagos</option>
              <option value="anticipo-pendiente">Anticipo pendiente</option>
              <option value="balance-pendiente">Balance pendiente</option>
              <option value="al-dia">Al día</option>
            </select>
            <span className="text-xs text-gray-400 self-center">{proyectosFiltrados.length} proyecto(s)</span>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Proyecto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden md:table-cell">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Anticipo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Balance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {proyectosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-300 text-sm">No hay proyectos con este filtro</td>
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
            <div className="text-center py-12 bg-white border border-gray-100 rounded-xl text-gray-400 text-sm">
              No hay liquidaciones pendientes. ✓
            </div>
          ) : deudaDisenadores.map((d, i) => {
            const designer = typeof d.designer === 'object' ? d.designer : null
            return (
              <div key={i} className="bg-white border border-orange-100 rounded-xl p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cobalt/10 flex items-center justify-center text-cobalt font-bold">
                      {designer?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-cobalt">{designer?.name || '—'}</div>
                      <div className="text-xs text-gray-400">
                        Nivel {designer?.level} · {designer?.specialty}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Total a liquidar</div>
                    <div className="text-xl font-black text-coral">{fmt(d.totalDeuda)}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {d.proyectos.map((pr, j) => (
                    <div key={j} className="flex justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-cobalt truncate">{pr.title}</span>
                      <span className="font-semibold text-cobalt ml-4 flex-shrink-0">{fmt(pr.pay)}</span>
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
        <div className="bg-white border border-gray-100 rounded-xl p-6">
          {ingresosPorMes.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Aún no hay proyectos completados para mostrar ingresos.
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3 mb-6" style={{ height: '160px' }}>
                {ingresosPorMes.map((m, i) => {
                  const pct = Math.round((m.ingresos / maxIngreso) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-xs text-cobalt font-semibold">{fmt(m.ingresos)}</div>
                      <div className="w-full relative" style={{ height: '100px' }}>
                        <div
                          className="absolute bottom-0 w-full bg-cobalt rounded-t-lg transition-all"
                          style={{ height: `${pct}%` }}
                        />
                        <div
                          className="absolute bottom-0 w-full bg-coral rounded-t-lg transition-all opacity-70"
                          style={{ height: `${Math.round((m.utilidad / maxIngreso) * 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400">{MESES[m._id.month - 1]}</div>
                    </div>
                  )
                })}
              </div>

              {/* Leyenda */}
              <div className="flex gap-4 text-xs text-gray-500 mb-6">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-cobalt inline-block" /> Ingresos totales</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-coral inline-block opacity-70" /> Comisión SAPIENS</span>
              </div>

              {/* Tabla detalle */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">Mes</th>
                    <th className="text-right pb-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">Ingresos</th>
                    <th className="text-right pb-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">Comisión</th>
                    <th className="text-right pb-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">Proyectos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {ingresosPorMes.map((m, i) => (
                    <tr key={i}>
                      <td className="py-2 text-cobalt">{MESES[m._id.month - 1]} {m._id.year}</td>
                      <td className="py-2 text-right font-semibold text-cobalt">{fmt(m.ingresos)}</td>
                      <td className="py-2 text-right text-coral">{fmt(m.utilidad)}</td>
                      <td className="py-2 text-right text-gray-400">{m.proyectos}</td>
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
    cobalt: 'text-cobalt',
    coral:  'text-coral',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
    blue:   'text-blue-600',
    green:  'text-green-600',
    gray:   'text-gray-600',
  }
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-xl font-black ${colors[accent] || 'text-cobalt'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-300 mt-0.5">{sub}</div>}
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
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium text-cobalt text-sm">{p.title}</div>
        <div className="text-xs text-gray-400">{client?.name || client?.company || '—'}</div>
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <span className="text-xs text-gray-500 capitalize">{STATUS_LABEL[p.status] || p.status}</span>
      </td>
      <td className="px-4 py-3 text-right font-semibold text-cobalt text-sm">
        {fmt(p.pricing.total)}
      </td>
      <td className="px-4 py-3 text-center">
        {p.payments.anticipo.paid ? (
          <span className="text-xs text-green-600 font-medium">✓ {fmt(p.pricing.anticipo)}</span>
        ) : (
          <button
            onClick={() => onAnticipo(p._id)}
            disabled={busy}
            className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-700 px-2.5 py-1 rounded-lg hover:bg-yellow-100 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {busy ? '...' : `Recibir ${fmt(p.pricing.anticipo)}`}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {p.payments.balance.paid ? (
          <span className="text-xs text-green-600 font-medium">✓ {fmt(p.pricing.balance)}</span>
        ) : p.status === 'aprobado' ? (
          <button
            onClick={() => onComplete(p._id)}
            disabled={busy}
            className="text-xs bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {busy ? '...' : `Cerrar ${fmt(p.pricing.balance)}`}
          </button>
        ) : (
          <span className="text-xs text-gray-300">{fmt(p.pricing.balance)}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <a href={`/admin/proyectos/${p._id}`} className="text-xs text-cobalt/40 hover:text-coral transition-colors">
          Ver →
        </a>
      </td>
    </tr>
  )
}
