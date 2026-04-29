import type { StatusMetricPoint } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  cotizado: 'Cotizado',
  activo: 'Activo',
  revision: 'Revision',
  ajuste: 'Ajuste',
  aprobado: 'Aprobado',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  cotizado: 'bg-amber-400',
  activo: 'bg-sky-500',
  revision: 'bg-violet-500',
  ajuste: 'bg-orange-500',
  aprobado: 'bg-emerald-500',
  completado: 'bg-slate-600',
  cancelado: 'bg-rose-500',
}

export function StatusChart({ data }: { data: StatusMetricPoint[] }) {
  const total = data.reduce((sum, row) => sum + row.count, 0) || 1

  return (
    <div className="theme-dashboard-card rounded-xl border p-5">
      <h3 className="theme-dashboard-text text-sm font-semibold">Proyectos por estado</h3>
      <div className="mt-4 space-y-3">
        {data.map((row) => {
          const pct = (row.count / total) * 100
          return (
            <div key={row.status}>
              <div className="theme-dashboard-muted mb-1 flex items-center justify-between text-xs">
                <span>{STATUS_LABEL[row.status] || row.status}</span>
                <span>{row.count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--chart-bar-bg)]">
                <div
                  className={`h-2 rounded-full ${STATUS_COLOR[row.status] || 'bg-[var(--dashboard-muted)]'}`}
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}