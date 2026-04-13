import type { WeeklyMetricPoint } from '@/types'

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export function WeeklyEvolutionChart({ data }: { data: WeeklyMetricPoint[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)

  return (
    <div className="rounded-xl border border-white/20 bg-white p-5">
      <h3 className="text-sm font-semibold text-cobalt">Evolucion semanal</h3>
      <div className="mt-4 flex items-end gap-2 overflow-x-auto pb-2">
        {data.map((point) => (
          <div key={point.label} className="min-w-[56px] text-center">
            <div className="mx-auto flex h-32 w-8 items-end rounded-md bg-slate-100">
              <div
                className="w-full rounded-md bg-cobalt"
                style={{ height: `${Math.max((point.revenue / maxRevenue) * 100, 4)}%` }}
                title={fmt(point.revenue)}
              />
            </div>
            <p className="mt-2 text-[10px] text-slate-500">{point.label}</p>
            <p className="text-[10px] font-semibold text-cobalt">{point.completedProjects}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">Barra: revenue semanal. Numero inferior: proyectos completados.</p>
    </div>
  )
}