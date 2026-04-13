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
    <div className="rounded-xl border border-white/20 bg-white p-5">
      <h3 className="text-sm font-semibold text-cobalt">Proyectos por estado</h3>
      <div className="mt-4 space-y-3">
        {data.map((row) => {
          const pct = (row.count / total) * 100
          return (
            <div key={row.status}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                <span>{STATUS_LABEL[row.status] || row.status}</span>
                <span>{row.count}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${STATUS_COLOR[row.status] || 'bg-slate-500'}`}
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