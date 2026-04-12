'use client'
import { useEffect, useState } from 'react'
import { adminApi, projectsApi } from '@/lib/api'
import type { Project, User } from '@/types'

export default function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [designers, setDesigners] = useState<User[]>([])
  const [stats, setStats] = useState<{ projects: Record<string, number>; finanzas: Record<string, number> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [selectedDesigner, setSelectedDesigner] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([projectsApi.list(), adminApi.designers(), adminApi.dashboard()])
      .then(([p, d, s]) => {
        setProjects(p as Project[])
        setDesigners(d as User[])
        setStats(s as { projects: Record<string, number>; finanzas: Record<string, number> })
      })
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

  async function assign(projectId: string) {
    const designerId = selectedDesigner[projectId]
    if (!designerId) return alert('Selecciona un diseñador primero')
    setAssigning(projectId)
    try {
      await adminApi.assign(projectId, designerId)
      const updated = await projectsApi.list()
      setProjects(updated)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setAssigning(null)
    }
  }

  const pending = projects.filter(p => p.status === 'cotizado')
  const active  = projects.filter(p => ['activo', 'revision', 'ajuste'].includes(p.status))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cobalt">Panel de administración</h1>
        <p className="text-sm text-gray-500 mt-1">Vista global SAPIENS COLAB</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total proyectos', value: stats.projects.total },
            { label: 'En producción', value: stats.projects.activos },
            { label: 'Completados', value: stats.projects.completados },
            { label: 'Facturado', value: fmt(stats.finanzas.total || 0) },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-2xl font-bold text-cobalt">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? <div className="text-gray-400 text-sm">Cargando...</div> : (
        <>
          {/* Por asignar */}
          {pending.length > 0 && (
            <div className="mb-8">
              <h2 className="font-semibold text-cobalt mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                Por asignar ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map(p => (
                  <div key={p._id} className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="font-semibold text-cobalt">{p.title}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          {typeof p.client === 'object' ? p.client.name : '—'} · {p.serviceType} · Nivel mín. {p.minDesignerLevel}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-cobalt">{fmt(p.pricing.total)}</div>
                        <div className="text-xs text-gray-400">Pago diseñador: {fmt(p.pricing.designerPay)}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <select
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cobalt/40"
                        value={selectedDesigner[p._id] || ''}
                        onChange={e => setSelectedDesigner(prev => ({ ...prev, [p._id]: e.target.value }))}
                      >
                        <option value="">Selecciona diseñador...</option>
                        {designers
                          .filter(d => (d.level || 0) >= p.minDesignerLevel)
                          .map(d => (
                            <option key={d._id} value={d._id}>
                              {d.name} — Nivel {d.level} · {d.specialty}
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => assign(p._id)}
                        disabled={assigning === p._id}
                        className="bg-cobalt text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cobalt-mid transition-colors disabled:opacity-60"
                      >
                        {assigning === p._id ? 'Asignando...' : 'Asignar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* En producción */}
          {active.length > 0 && (
            <div>
              <h2 className="font-semibold text-cobalt mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                En producción ({active.length})
              </h2>
              <div className="space-y-2">
                {active.map(p => (
                  <a key={p._id} href={`/admin/proyectos/${p._id}`}
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-100 p-4 hover:border-cobalt/20 transition-colors">
                    <div>
                      <div className="font-medium text-cobalt text-sm">{p.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {typeof p.designer === 'object' && p.designer ? p.designer.name : 'Sin asignar'} · Rev. {p.revisions.used}/{p.revisions.max}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-cobalt/60 capitalize">{p.status}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
