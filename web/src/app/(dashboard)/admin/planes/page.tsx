'use client'
import { useMemo, useState } from 'react'

const cop = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

type Regimen = 'simple' | 'comun'
const COMISION_OPTS = [10, 15, 20, 25, 30] as const
type ComisionPct = typeof COMISION_OPTS[number]

interface ProyectoResult {
  totalFacturado: number
  retefuente: number
  reteICA: number
  comisionSapiens: number
  netoPagarColaborador: number
  utilidadNeta: number
}

function calcProyecto(
  ticket: number,
  costoOp: number,
  comisionPct: number,
  regimen: Regimen,
): ProyectoResult {
  const iva = regimen === 'comun' ? ticket * 0.19 : 0
  const totalFacturado = ticket + iva
  const retefuente = ticket * 0.10
  const reteICA = ticket * 0.015
  const comisionSapiens = ticket * (comisionPct / 100)
  const baseColaborador = ticket - comisionSapiens
  const retefuenteFreelancer = baseColaborador * 0.11
  const netoPagarColaborador = baseColaborador - retefuenteFreelancer
  const utilidadNeta = comisionSapiens - costoOp
  return { totalFacturado, retefuente, reteICA, comisionSapiens, netoPagarColaborador, utilidadNeta }
}

export default function PlanesPage() {
  const [nProyectos, setNProyectos] = useState(5)
  const [ticketPromedio, setTicketPromedio] = useState(2000000)
  const [costoOperativo, setCostoOperativo] = useState(0)
  const [regimen, setRegimen] = useState<Regimen>('simple')
  const [comisionPct, setComisionPct] = useState<ComisionPct>(20)

  const proyecto = useMemo(
    () => calcProyecto(ticketPromedio, costoOperativo, comisionPct, regimen),
    [ticketPromedio, costoOperativo, comisionPct, regimen],
  )

  const totales = useMemo(() => ({
    facturacionBruta: proyecto.totalFacturado * nProyectos,
    retenciones: (proyecto.retefuente + proyecto.reteICA) * nProyectos,
    comisionSapiens: proyecto.comisionSapiens * nProyectos,
    netoPagarColaboradores: proyecto.netoPagarColaborador * nProyectos,
    utilidadNeta: proyecto.utilidadNeta * nProyectos,
  }), [proyecto, nProyectos])

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="theme-dashboard-text text-3xl font-bold">Proyección mensual</h1>
        <p className="theme-dashboard-muted mt-1 text-sm">Simula ingresos y márgenes reales para el mes</p>
      </div>

      {/* Inputs */}
      <div className="theme-dashboard-surface theme-dashboard-border border rounded-xl p-5 mb-5">
        <h2 className="theme-dashboard-muted text-xs font-semibold uppercase tracking-wider mb-5">Parámetros</h2>

        <div className="space-y-5">
          <SliderField
            label="Proyectos en el mes"
            value={nProyectos}
            onChange={setNProyectos}
            min={1} max={30} step={1}
            format={v => `${v} proyecto${v !== 1 ? 's' : ''}`}
          />
          <SliderField
            label="Ticket promedio"
            value={ticketPromedio}
            onChange={setTicketPromedio}
            min={500000} max={15000000} step={100000}
            format={cop}
          />
          <SliderField
            label="Costo operativo por proyecto"
            value={costoOperativo}
            onChange={setCostoOperativo}
            min={0} max={1000000} step={50000}
            format={cop}
          />
        </div>

        <div className="mt-5 pt-5 border-t theme-dashboard-border flex flex-col sm:flex-row gap-5">
          <div>
            <div className="theme-dashboard-muted text-xs mb-2">Régimen tributario</div>
            <div className="flex gap-1 p-1 theme-dashboard-surface-2 rounded-lg w-fit border theme-dashboard-border">
              {(['simple', 'comun'] as Regimen[]).map(r => (
                <button
                  key={r}
                  onClick={() => setRegimen(r)}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    regimen === r ? 'bg-[#4C58FF] text-white' : 'theme-dashboard-muted hover:opacity-80'
                  }`}
                >
                  {r === 'simple' ? 'Régimen simple' : 'Régimen común (+IVA 19%)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="theme-dashboard-muted text-xs mb-2">Comisión Sapiens Colab</div>
            <div className="flex gap-1.5 flex-wrap">
              {COMISION_OPTS.map(pct => (
                <button
                  key={pct}
                  onClick={() => setComisionPct(pct)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                    comisionPct === pct
                      ? 'bg-[#4C58FF] border-[#4C58FF] text-white'
                      : 'theme-dashboard-surface-2 theme-dashboard-muted theme-dashboard-border hover:opacity-80'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Métricas mensuales */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        <MetricCard label="Facturación bruta" value={cop(totales.facturacionBruta)} color="blue" />
        <MetricCard
          label="Retenciones totales"
          value={cop(totales.retenciones)}
          color="rose"
          sub="Retefuente + ReteICA"
        />
        <MetricCard label="Comisión Sapiens" value={cop(totales.comisionSapiens)} color="blue" />
        <MetricCard label="Neto colaboradores" value={cop(totales.netoPagarColaboradores)} color="amber" />
        <MetricCard
          label="Utilidad neta"
          value={cop(totales.utilidadNeta)}
          color={totales.utilidadNeta >= 0 ? 'emerald' : 'rose'}
        />
      </div>

      {/* Tabla cascada por proyecto */}
      <div className="theme-dashboard-surface theme-dashboard-border border rounded-xl p-5">
        <h2 className="theme-dashboard-muted text-xs font-semibold uppercase tracking-wider mb-4">
          Cascada por proyecto — {nProyectos} proyecto{nProyectos !== 1 ? 's' : ''}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="theme-dashboard-border border-b">
                <th className="text-left theme-dashboard-muted font-medium py-2 pr-4 w-8">#</th>
                <th className="text-right theme-dashboard-muted font-medium py-2 px-3">Total facturado</th>
                <th className="text-right theme-dashboard-muted font-medium py-2 px-3">Retefuente 10%</th>
                <th className="text-right theme-dashboard-muted font-medium py-2 px-3">ReteICA 1.5%</th>
                <th className="text-right theme-dashboard-muted font-medium py-2 px-3">Comisión</th>
                <th className="text-right theme-dashboard-muted font-medium py-2 px-3">Neto colaborador</th>
                <th className="text-right theme-dashboard-muted font-medium py-2 pl-3">Utilidad</th>
              </tr>
            </thead>
            <tbody className={nProyectos > 10 ? 'block max-h-72 overflow-y-auto' : ''}>
              {Array.from({ length: nProyectos }, (_, i) => (
                <tr
                  key={i}
                  className={`theme-dashboard-border border-b last:border-0 ${nProyectos > 10 ? 'table' : ''}`}
                >
                  <td className="theme-dashboard-muted py-2 pr-4 tabular-nums">{i + 1}</td>
                  <td className="theme-dashboard-text font-mono text-right py-2 px-3">{cop(proyecto.totalFacturado)}</td>
                  <td className="text-rose-400 font-mono text-right py-2 px-3">({cop(proyecto.retefuente)})</td>
                  <td className="text-rose-400 font-mono text-right py-2 px-3">({cop(proyecto.reteICA)})</td>
                  <td className="text-[#A5B4FC] font-mono text-right py-2 px-3">{cop(proyecto.comisionSapiens)}</td>
                  <td className="text-amber-400 font-mono text-right py-2 px-3">{cop(proyecto.netoPagarColaborador)}</td>
                  <td className={`font-mono font-semibold text-right py-2 pl-3 ${
                    proyecto.utilidadNeta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {cop(proyecto.utilidadNeta)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 theme-dashboard-border">
                <td className="theme-dashboard-muted py-3 pr-4 text-xs font-semibold uppercase tracking-wider">Total</td>
                <td className="theme-dashboard-text font-mono font-bold text-right py-3 px-3">{cop(totales.facturacionBruta)}</td>
                <td className="text-rose-400 font-mono font-bold text-right py-3 px-3">({cop(proyecto.retefuente * nProyectos)})</td>
                <td className="text-rose-400 font-mono font-bold text-right py-3 px-3">({cop(proyecto.reteICA * nProyectos)})</td>
                <td className="text-[#A5B4FC] font-mono font-bold text-right py-3 px-3">{cop(totales.comisionSapiens)}</td>
                <td className="text-amber-400 font-mono font-bold text-right py-3 px-3">{cop(totales.netoPagarColaboradores)}</td>
                <td className={`font-mono font-bold text-right py-3 pl-3 ${
                  totales.utilidadNeta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {cop(totales.utilidadNeta)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Subcomponentes ─────────────────────────────────────────────────────────────

function SliderField({
  label, value, onChange, min, max, step, format,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="theme-dashboard-muted text-xs">{label}</label>
        <span className="theme-dashboard-text text-sm font-semibold font-mono">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[#4C58FF] cursor-pointer h-1.5"
      />
      <div className="flex justify-between theme-dashboard-muted text-xs mt-1 opacity-60">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

function MetricCard({
  label, value, color, sub,
}: {
  label: string
  value: string
  color: 'emerald' | 'amber' | 'rose' | 'blue'
  sub?: string
}) {
  const bg   = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30',
    amber:   'bg-amber-500/10 border-amber-500/30',
    rose:    'bg-rose-500/10 border-rose-500/30',
    blue:    'bg-[#4C58FF]/10 border-[#4C58FF]/30',
  }
  const text = {
    emerald: 'text-emerald-400',
    amber:   'text-semantic-warning',
    rose:    'text-semantic-danger',
    blue:    'text-[#A5B4FC]',
  }
  return (
    <div className={`rounded-xl border p-4 ${bg[color]}`}>
      <div className="theme-dashboard-muted text-xs mb-1 leading-tight">{label}</div>
      <div className={`text-base font-bold font-mono leading-tight ${text[color]}`}>{value}</div>
      {sub && <div className="theme-dashboard-muted text-xs mt-1 opacity-60">{sub}</div>}
    </div>
  )
}
