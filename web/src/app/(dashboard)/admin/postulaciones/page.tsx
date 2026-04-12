'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import type { Application } from '@/types'

const STATUS_META: Record<string, { label: string; color: string }> = {
  'recibida':      { label: 'Recibida',       color: 'bg-gray-100 text-gray-600' },
  'en-evaluacion': { label: 'En evaluación',  color: 'bg-blue-100 text-blue-700' },
  'prueba-enviada':{ label: 'Prueba enviada', color: 'bg-yellow-100 text-yellow-700' },
  'evaluada':      { label: 'Evaluada',       color: 'bg-purple-100 text-purple-700' },
  'aceptada':      { label: 'Aceptada',       color: 'bg-green-100 text-green-700' },
  'rechazada':     { label: 'Rechazada',      color: 'bg-red-100 text-red-700' },
}

const FILTER_OPTIONS = ['todas', 'recibida', 'en-evaluacion', 'prueba-enviada', 'evaluada', 'aceptada', 'rechazada']

export default function PostulacionesPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading]  = useState(true)
  const [filter, setFilter]    = useState('todas')

  useEffect(() => {
    adminApi.applications()
      .then(apps => setApplications(apps))
      .finally(() => setLoading(false))
  }, [])

  const visible = filter === 'todas'
    ? applications
    : applications.filter(a => a.status === filter)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cobalt">Postulaciones</h1>
        <p className="text-sm text-gray-400 mt-1">{applications.length} postulantes en total</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-cobalt text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-cobalt/30'
            }`}
          >
            {f === 'todas' ? 'Todas' : STATUS_META[f]?.label ?? f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Cargando postulaciones...</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No hay postulaciones en este estado.</div>
      ) : (
        <div className="space-y-3">
          {visible.map(app => {
            const meta = STATUS_META[app.status] ?? { label: app.status, color: 'bg-gray-100 text-gray-600' }
            return (
              <div
                key={app._id}
                onClick={() => router.push(`/admin/postulaciones/${app._id}`)}
                className="bg-white rounded-xl border border-gray-100 p-5 cursor-pointer hover:border-cobalt/20 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cobalt/10 flex items-center justify-center text-cobalt font-bold text-sm flex-shrink-0">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-cobalt text-sm">{app.name}</div>
                      <div className="text-xs text-gray-400">{app.email}</div>
                      <div className="text-xs text-gray-400 mt-0.5 capitalize">{app.role} · {app.experience} años exp.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {app.level ? (
                      <div className="text-center">
                        <div className="text-xl font-black text-cobalt">{app.level}</div>
                        <div className="text-xs text-gray-400">nivel</div>
                      </div>
                    ) : null}
                    {app.payRange ? (
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-gray-400">Rango</div>
                        <div className="text-sm font-semibold text-cobalt">{app.payRange}</div>
                      </div>
                    ) : null}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-300 mt-3">
                  {new Date(app.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
