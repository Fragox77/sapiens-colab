'use client'
import { useState } from 'react'

type Tab = 'mes' | 'proyecto'

const cop = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

interface Cascade {
  facturacionBruta: number
  ivaAmount: number
  totalFactura: number
  reteFuenteClienteAmt: number
  reteICAClienteAmt: number
  netoRecibido: number
  baseFreelancer: number
  reteFuenteFreelancerAmt: number
  pagoNetoFreelancer: number
  utilidadBruta: number
  utilidadNeta: number
  margenNeto: number
}

function calcCascade(
  base: number,
  comision: number,
  iva: number,
  costosFijos: number,
  reteF: boolean,
  reteICA: boolean,
  reteFFL: boolean,
): Cascade {
  const facturacionBruta       = base
  const ivaAmount              = base * (iva / 100)
  const totalFactura           = facturacionBruta + ivaAmount
  const reteFuenteClienteAmt   = reteF   ? base * 0.035   : 0
  const reteICAClienteAmt      = reteICA ? base * 0.00414 : 0
  const netoRecibido           = totalFactura - reteFuenteClienteAmt - reteICAClienteAmt
  const baseFreelancer         = base * (1 - comision / 100)
  const reteFuenteFreelancerAmt = reteFFL ? baseFreelancer * 0.10 : 0
  const pagoNetoFreelancer     = baseFreelancer - reteFuenteFreelancerAmt
  const utilidadBruta          = netoRecibido - pagoNetoFreelancer
  const utilidadNeta           = utilidadBruta - costosFijos
  const margenNeto             = base > 0 ? (utilidadNeta / base) * 100 : 0
  return {
    facturacionBruta, ivaAmount, totalFactura, reteFuenteClienteAmt, reteICAClienteAmt,
    netoRecibido, baseFreelancer, reteFuenteFreelancerAmt, pagoNetoFreelancer,
    utilidadBruta, utilidadNeta, margenNeto,
  }
}

export default function PlanesPage() {
  const [tab, setTab] = useState<Tab>('mes')

  // Toggles compartidos entre pestañas
  const [reteF,   setReteF]   = useState(false)
  const [reteICA, setReteICA] = useState(false)
  const [reteFFL, setReteFFL] = useState(false)

  // Pestaña "Por mes"
  const [proyectos,    setProyectos]    = useState(5)
  const [ticket,       setTicket]       = useState(2000000)
  const [comisionMes,  setComisionMes]  = useState(10)
  const [costosMes,    setCostosMes]    = useState(0)
  const [ivaMes,       setIvaMes]       = useState(0)

  // Pestaña "Por proyecto"
  const [baseProy,     setBaseProy]     = useState(2000000)
  const [comisionProy, setComisionProy] = useState(10)
  const [ivaProy,      setIvaProy]      = useState(0)
  const [costosProy,   setCostosProy]   = useState(0)

  const base       = tab === 'mes' ? proyectos * ticket : baseProy
  const comision   = tab === 'mes' ? comisionMes        : comisionProy
  const iva        = tab === 'mes' ? ivaMes             : ivaProy
  const costosFijos = tab === 'mes' ? costosMes         : costosProy

  const r = calcCascade(base, comision, iva, costosFijos, reteF, reteICA, reteFFL)

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="theme-dashboard-text text-3xl font-bold">Calculadora financiera</h1>
        <p className="theme-dashboard-muted mt-1 text-sm">Simula márgenes con retenciones colombianas</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 w-fit theme-dashboard-surface theme-dashboard-border border rounded-xl">
        {(['mes', 'proyecto'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t ? 'bg-[#4C58FF] text-white' : 'theme-dashboard-muted hover:opacity-80'
            }`}
          >
            {t === 'mes' ? 'Por mes' : 'Por proyecto'}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="theme-dashboard-surface theme-dashboard-border border rounded-xl p-5 mb-4">
        <h2 className="theme-dashboard-muted text-xs font-semibold uppercase tracking-wider mb-4">Parámetros</h2>

        {tab === 'mes' ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Proyectos cerrados"      value={proyectos}   onChange={setProyectos}   step={1} />
            <Field label="Ticket promedio (COP)"   value={ticket}      onChange={setTicket}      step={100000} />
            <Field label="Comisión Sapiens %"      value={comisionMes} onChange={setComisionMes} step={0.5} max={100} />
            <Field label="Costos fijos (COP)"      value={costosMes}   onChange={setCostosMes}   step={50000} />
            <Field label="IVA cobrado al cliente %" value={ivaMes}     onChange={setIvaMes}      step={1} max={100} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Valor base sin IVA (COP)"   value={baseProy}     onChange={setBaseProy}     step={100000} />
            <Field label="Comisión Sapiens %"         value={comisionProy} onChange={setComisionProy} step={0.5} max={100} />
            <Field label="IVA %"                      value={ivaProy}      onChange={setIvaProy}      step={1} max={100} />
            <Field label="Costos fijos proyecto (COP)" value={costosProy}  onChange={setCostosProy}   step={50000} />
          </div>
        )}

        <div className="mt-5 pt-4 border-t theme-dashboard-border flex flex-wrap gap-5">
          <Toggle label="Retefuente cliente 3.5%"    value={reteF}   onChange={setReteF} />
          <Toggle label="ReteICA cliente 0.414%"     value={reteICA} onChange={setReteICA} />
          <Toggle label="Retefuente freelancer 10%"  value={reteFFL} onChange={setReteFFL} />
        </div>
      </div>

      {/* Cascada */}
      <div className="theme-dashboard-surface theme-dashboard-border border rounded-xl p-5 mb-4">
        <h2 className="theme-dashboard-muted text-xs font-semibold uppercase tracking-wider mb-4">Cascada financiera</h2>
        <div className="space-y-0.5 text-sm">
          <Row label="Facturación bruta"            value={cop(r.facturacionBruta)} />
          {iva > 0 && <Row label="+ IVA cobrado"    value={cop(r.ivaAmount)} indent />}
          <Row label="= Total factura al cliente"   value={cop(r.totalFactura)} bold />
          {reteF   && <Row label="− Retefuente cliente (3.5%)"  value={cop(r.reteFuenteClienteAmt)}  indent neg />}
          {reteICA && <Row label="− ReteICA cliente (0.414%)"   value={cop(r.reteICAClienteAmt)}     indent neg />}
          <Row label="= Neto recibido del cliente"  value={cop(r.netoRecibido)} bold />
          <Row label="Base freelancer"              value={cop(r.baseFreelancer)} indent />
          {reteFFL && <Row label="− Retefuente freelancer (10%)" value={cop(r.reteFuenteFreelancerAmt)} indent neg />}
          <Row label="= Pago neto al freelancer"    value={`(${cop(r.pagoNetoFreelancer)})`} indent neg />
          <Row label="Utilidad bruta"               value={cop(r.utilidadBruta)} bold />
          {costosFijos > 0 && <Row label="− Costos fijos" value={cop(costosFijos)} indent neg />}
          <div className={`flex justify-between items-center rounded-lg px-3 py-2 mt-1 font-bold ${
            r.utilidadNeta >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-semantic-danger'
          }`}>
            <span>= Utilidad neta</span>
            <span className="font-mono">{cop(r.utilidadNeta)}</span>
          </div>
        </div>
      </div>

      {/* Alerta de margen */}
      {base > 0 && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
          r.margenNeto < 0
            ? 'bg-rose-500/10 border-rose-500/30 text-semantic-danger'
            : r.margenNeto < 15
            ? 'bg-amber-500/10 border-amber-500/30 text-semantic-warning'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {r.margenNeto < 0
            ? '⚠ Margen negativo — sube la comisión o el ticket'
            : r.margenNeto < 15
            ? '◎ Margen bajo — considera ajustar costos o comisión'
            : '✓ Margen saludable'}
        </div>
      )}

      {/* Métricas resumen */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label="Margen neto"
          value={`${r.margenNeto.toFixed(1)}%`}
          color={r.margenNeto >= 15 ? 'emerald' : r.margenNeto >= 0 ? 'amber' : 'rose'}
        />
        <MetricCard
          label="Utilidad neta"
          value={cop(r.utilidadNeta)}
          color={r.utilidadNeta >= 0 ? 'emerald' : 'rose'}
        />
        <MetricCard
          label="Comisión aplicada"
          value={`${comision}%`}
          color="blue"
        />
      </div>
    </div>
  )
}

// ── Subcomponentes ─────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, step = 1, max,
}: {
  label: string; value: number; onChange: (v: number) => void; step?: number; max?: number
}) {
  return (
    <div>
      <label className="theme-dashboard-muted text-xs mb-1 block">{label}</label>
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="theme-dashboard-input w-full rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-[#4C58FF]/50"
      />
    </div>
  )
}

function Toggle({
  label, value, onChange,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors ${value ? 'bg-[#4C58FF]' : 'theme-dashboard-surface-2 border theme-dashboard-border'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
      <span className="theme-dashboard-muted text-xs">{label}</span>
    </label>
  )
}

function Row({
  label, value, bold, indent, neg,
}: {
  label: string; value: string; bold?: boolean; indent?: boolean; neg?: boolean
}) {
  return (
    <div className={`flex justify-between items-center px-3 py-1.5 rounded ${bold ? 'theme-dashboard-surface-2' : ''}`}>
      <span className={`text-sm ${bold ? 'theme-dashboard-text font-semibold' : 'theme-dashboard-muted'} ${indent ? 'ml-4' : ''}`}>
        {label}
      </span>
      <span className={`text-sm font-mono ${bold ? 'theme-dashboard-text font-semibold' : neg ? 'text-rose-400' : 'theme-dashboard-text'}`}>
        {value}
      </span>
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: 'emerald' | 'amber' | 'rose' | 'blue' }) {
  const bg   = { emerald: 'bg-emerald-500/10 border-emerald-500/30', amber: 'bg-amber-500/10 border-amber-500/30', rose: 'bg-rose-500/10 border-rose-500/30', blue: 'bg-[#4C58FF]/10 border-[#4C58FF]/30' }
  const text = { emerald: 'text-emerald-400', amber: 'text-semantic-warning', rose: 'text-semantic-danger', blue: 'text-[#A5B4FC]' }
  return (
    <div className={`rounded-xl border p-4 ${bg[color]}`}>
      <div className="theme-dashboard-muted text-xs mb-1">{label}</div>
      <div className={`text-xl font-bold ${text[color]}`}>{value}</div>
    </div>
  )
}
