interface KpiCardProps {
  label: string
  value: string
  hint?: string
  deltaPct?: number | null
}

function fmtDelta(deltaPct?: number | null) {
  if (deltaPct === null || deltaPct === undefined || Number.isNaN(deltaPct)) return null
  const rounded = Math.round(deltaPct * 10) / 10
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded}% vs periodo anterior`
}

export function KpiCard({ label, value, hint, deltaPct }: KpiCardProps) {
  const deltaLabel = fmtDelta(deltaPct)
  const deltaClass = (deltaPct || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'

  return (
    <div className="rounded-xl border border-white/20 bg-white p-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-cobalt">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {deltaLabel && <p className={`mt-1 text-xs font-medium ${deltaClass}`}>{deltaLabel}</p>}
    </div>
  )
}