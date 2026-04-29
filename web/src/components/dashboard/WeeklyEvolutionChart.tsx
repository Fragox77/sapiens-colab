import type { WeeklyMetricPoint } from '@/types'

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export function WeeklyEvolutionChart({ data }: { data: WeeklyMetricPoint[] }) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)

  return (
    <div className="theme-dashboard-card rounded-xl border p-5">
      <h3 className="theme-dashboard-text text-sm font-semibold">Evolucion semanal</h3>
      <div className="mt-4 flex items-end gap-2 overflow-x-auto pb-2">
        {data.map((point) => (
          <div key={point.label} className="min-w-[56px] text-center">
            <div className="mx-auto flex h-32 w-8 items-end rounded-md bg-[var(--chart-bar-bg)]">
              <div
                className="w-full rounded-md bg-[var(--dashboard-accent)]"
                style={{ height: `${Math.max((point.revenue / maxRevenue) * 100, 4)}%` }}
                title={fmt(point.revenue)}
              />
            </div>
            <p className="theme-dashboard-muted mt-2 text-[10px]">{point.label}</p>
            <p className="theme-dashboard-text text-[10px] font-semibold">{point.completedProjects}</p>
          </div>
        ))}
      </div>
      <p className="theme-dashboard-muted mt-3 text-xs">Barra: revenue semanal. Numero inferior: proyectos completados.</p>
    </div>
  )
}