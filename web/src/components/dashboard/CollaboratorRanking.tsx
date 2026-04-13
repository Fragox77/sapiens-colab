import type { CollaboratorMetric } from '@/types'

export function CollaboratorRanking({ data }: { data: CollaboratorMetric[] }) {
  return (
    <div className="rounded-xl border border-[#2F3A5C] bg-[linear-gradient(180deg,#151D34_0%,#10182A_100%)] p-5">
      <h3 className="text-sm font-semibold text-white">Ranking de colaboradores</h3>
      <div className="mt-4 space-y-3">
        {data.map((item, idx) => (
          <div key={item.designerId} className="rounded-lg border border-[#2D3656] bg-[#10182A] p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">#{idx + 1} {item.name}</p>
                <p className="text-xs text-slate-400">{item.specialty || 'Generalista'} · Nivel {item.level || '-'}</p>
              </div>
              <p className="rounded-full bg-[#4C58FF]/20 px-2 py-1 text-xs font-semibold text-[#A5B4FC]">
                Puntaje {item.performanceScore}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 md:grid-cols-4">
              <div>Asignados: <span className="font-semibold text-slate-200">{item.assignedProjects}</span></div>
              <div>Completados: <span className="font-semibold text-slate-200">{item.completedProjects}</span></div>
              <div>Tiempo medio: <span className="font-semibold text-slate-200">{item.avgDeliveryDays} d</span></div>
              <div>Calificación: <span className="font-semibold text-slate-200">{item.avgRating}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}