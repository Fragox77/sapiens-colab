'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import type { Application } from '@/types'

const STATUS_META: Record<string, { label: string; color: string }> = {
  'recibida':      { label: 'Recibida',       color: 'bg-slate-500/20 text-slate-300 border border-slate-500/30' },
  'en-evaluacion': { label: 'En evaluacion',  color: 'bg-blue-500/15 text-blue-300 border border-blue-500/30' },
  'prueba-enviada':{ label: 'Prueba enviada', color: 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30' },
  'evaluada':      { label: 'Evaluada',       color: 'bg-violet-500/15 text-violet-300 border border-violet-500/30' },
  'aceptada':      { label: 'Aceptada',       color: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' },
  'rechazada':     { label: 'Rechazada',      color: 'bg-rose-500/15 text-rose-300 border border-rose-500/30' },
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
        <h1 className="text-3xl font-bold text-slate-100">Postulaciones</h1>
        <p className="mt-1 text-sm text-slate-400">{applications.length} postulantes en total</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTER_OPTIONS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'bg-[#4C58FF] text-white shadow-[0_8px_20px_rgba(76,88,255,0.35)]'
                : 'bg-[#131B31] border border-[#2F3A5C] text-slate-300 hover:bg-[#18233F]'
            }`}
          >
            {f === 'todas' ? 'Todas' : STATUS_META[f]?.label ?? f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Cargando postulaciones...</div>
      ) : visible.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">No hay postulaciones en este estado.</div>
      ) : (
        <div className="space-y-3">
          {visible.map(app => {
            const meta = STATUS_META[app.status] ?? { label: app.status, color: 'bg-slate-500/20 text-slate-300 border border-slate-500/30' }
            return (
              <div
                key={app._id}
                onClick={() => router.push(`/admin/postulaciones/${app._id}`)}
                className="cursor-pointer rounded-xl border border-[#2F3A5C] bg-[#121A2F] p-5 transition-all hover:border-[#4C58FF]/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#4C58FF]/20 text-sm font-bold text-[#A5B4FC]">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-100">{app.name}</div>
                      <div className="text-xs text-slate-400">{app.email}</div>
                      <div className="mt-0.5 text-xs capitalize text-slate-400">{app.role} · {app.experience} años exp.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {app.level ? (
                      <div className="text-center">
                        <div className="text-xl font-black text-slate-100">{app.level}</div>
                        <div className="text-xs text-slate-400">nivel</div>
                      </div>
                    ) : null}
                    {app.payRange ? (
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-slate-400">Rango</div>
                        <div className="text-sm font-semibold text-slate-100">{app.payRange}</div>
                      </div>
                    ) : null}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-500">
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
