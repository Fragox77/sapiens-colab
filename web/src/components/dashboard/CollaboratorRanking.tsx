import type { CollaboratorMetric } from '@/types'

export function CollaboratorRanking({ data }: { data: CollaboratorMetric[] }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white p-5">
      <h3 className="text-sm font-semibold text-cobalt">Ranking de colaboradores</h3>
      <div className="mt-4 space-y-3">
        {data.map((item, idx) => (
          <div key={item.designerId} className="rounded-lg border border-slate-100 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cobalt">#{idx + 1} {item.name}</p>
                <p className="text-xs text-slate-500">{item.specialty || 'Generalista'} · Nivel {item.level || '-'}</p>
              </div>
              <p className="rounded-full bg-cobalt/10 px-2 py-1 text-xs font-semibold text-cobalt">
                Score {item.performanceScore}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-4">
              <div>Asignados: <span className="font-semibold text-cobalt">{item.assignedProjects}</span></div>
              <div>Completados: <span className="font-semibold text-cobalt">{item.completedProjects}</span></div>
              <div>Tiempo medio: <span className="font-semibold text-cobalt">{item.avgDeliveryDays} d</span></div>
              <div>Rating: <span className="font-semibold text-cobalt">{item.avgRating}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}