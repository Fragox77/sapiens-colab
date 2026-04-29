'use client'
import { useEffect, useState } from 'react'
import { projectsApi } from '@/lib/api'
import type { Project } from '@/types'
import { SLABadge } from '@/components/dashboard/SLABadge'

export default function DisenadorDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsApi.list().then(setProjects).finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`
  const active = projects.filter(p => ['activo', 'ajuste'].includes(p.status))
  const inReview = projects.filter(p => p.status === 'revision')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cobalt">Cola de trabajo</h1>
        <p className="text-sm text-gray-500 mt-1">Proyectos asignados a ti</p>
      </div>

      {loading ? <div className="text-gray-400 text-sm">Cargando...</div> : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="font-semibold text-cobalt text-sm uppercase tracking-wide mb-3">En producción</h2>
              {active.map(p => (
                <a key={p._id} href={`/disenador/${p._id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-5 mb-3 hover:border-cobalt/20 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-cobalt">{p.title}</div>
                      <div className="text-sm text-gray-400 mt-1">{p.serviceType} · {p.complexity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-cobalt">{fmt(p.pricing.designerPay)}</div>
                      <div className="text-xs text-gray-400">Tu pago neto</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <span>Revisiones usadas: {p.revisions.used}/{p.revisions.max}</span>
                    {p.status === 'ajuste' && <span className="text-orange-500 font-medium">⚠ Ajuste solicitado</span>}
                    <SLABadge deadlineAt={p.deadlineAt} status={p.status} />
                  </div>
                </a>
              ))}
            </div>
          )}
          {inReview.length > 0 && (
            <div>
              <h2 className="font-semibold text-cobalt text-sm uppercase tracking-wide mb-3">Esperando revisión</h2>
              {inReview.map(p => (
                <div key={p._id} className="bg-white rounded-xl border border-purple-100 p-5 mb-3">
                  <div className="font-semibold text-cobalt">{p.title}</div>
                  <div className="text-sm text-purple-500 mt-1">El cliente está revisando tu entrega</div>
                </div>
              ))}
            </div>
          )}
          {projects.length === 0 && (
            <div className="text-gray-400 text-sm">No tienes proyectos asignados aún.</div>
          )}
        </div>
      )}
    </div>
  )
}
