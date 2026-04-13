import type { CollaboratorMetric } from '@/types'

export function CollaboratorRanking({ data }: { data: CollaboratorMetric[] }) {
  return (
    <div className="theme-dashboard-card rounded-xl border p-5">
      <h3 className="theme-dashboard-text text-sm font-bold">Ranking de colaboradores</h3>
      <div className="mt-4 space-y-3">
        {data.map((item, idx) => (
          <div key={item.designerId} className="theme-dashboard-border theme-dashboard-surface rounded-lg border p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="theme-dashboard-text text-sm font-semibold">#{idx + 1} {item.name}</p>
                <p className="theme-dashboard-muted text-xs">{item.specialty || 'Generalista'} · Nivel {item.level || '-'}</p>
              </div>
              <p className="rounded-full bg-[#4C58FF]/20 px-2 py-1 text-xs font-semibold text-[#A5B4FC]">
                Puntaje {item.performanceScore}
              </p>
            </div>
            <div className="theme-dashboard-muted mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
              <div>Asignados: <span className="theme-dashboard-text font-semibold">{item.assignedProjects}</span></div>
              <div>Completados: <span className="theme-dashboard-text font-semibold">{item.completedProjects}</span></div>
              <div>Tiempo medio: <span className="theme-dashboard-text font-semibold">{item.avgDeliveryDays} d</span></div>
              <div>Calificación: <span className="theme-dashboard-text font-semibold">{item.avgRating}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}