'use client'
import { useEffect, useState } from 'react'
import { projectsApi } from '@/lib/api'
import type { Project, ProjectStatus } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  cotizado:   'Cotizado',
  activo:     'En producción',
  revision:   'En revisión',
  ajuste:     'Ajustes',
  aprobado:   'Aprobado',
  completado: 'Completado',
  cancelado:  'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  cotizado:   'bg-yellow-500/15 text-yellow-300 border border-yellow-500/30',
  activo:     'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  revision:   'bg-violet-500/15 text-violet-300 border border-violet-500/30',
  ajuste:     'bg-orange-500/15 text-orange-300 border border-orange-500/30',
  aprobado:   'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  completado: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  cancelado:  'bg-rose-500/15 text-rose-300 border border-rose-500/30',
}

const FILTERS: { value: string; label: string }[] = [
  { value: 'todos',      label: 'Todos' },
  { value: 'cotizado',   label: 'Por asignar' },
  { value: 'activo',     label: 'En producción' },
  { value: 'revision',   label: 'En revisión' },
  { value: 'ajuste',     label: 'Ajustes' },
  { value: 'aprobado',   label: 'Por cerrar' },
  { value: 'completado', label: 'Completados' },
]

const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`

export default function AdminProyectosPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filter, setFilter]     = useState('todos')
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    projectsApi.list().then(p => setProjects(p as Project[])).finally(() => setLoading(false))
  }, [])

  const filtered = projects
    .filter(p => filter === 'todos' || p.status === filter)
    .filter(p => {
      if (!search) return true
      const q = search.toLowerCase()
      const client = typeof p.client === 'object' ? p.client.name : ''
      const designer = typeof p.designer === 'object' && p.designer ? p.designer.name : ''
      return p.title.toLowerCase().includes(q) || client.toLowerCase().includes(q) || designer.toLowerCase().includes(q)
    })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Proyectos</h1>
          <p className="mt-1 text-sm text-slate-400">{projects.length} en total</p>
        </div>
      </div>

      {/* Buscador */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por título, cliente o diseñador..."
        className="mb-4 w-full rounded-xl border border-[#334167] bg-[#0F172A] px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#4C58FF]"
      />

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-[#4C58FF] text-white shadow-[0_8px_20px_rgba(76,88,255,0.35)]'
                : 'bg-[#131B31] border border-[#2F3A5C] text-slate-300 hover:bg-[#18233F]'
            }`}
          >
            {f.label}
            {f.value !== 'todos' && (
              <span className="ml-1.5 opacity-60">
                {projects.filter(p => p.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-400 text-sm">Cargando proyectos...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          No hay proyectos con este filtro.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const client   = typeof p.client === 'object' ? p.client : null
            const designer = typeof p.designer === 'object' && p.designer ? p.designer : null
            return (
              <a
                key={p._id}
                href={`/admin/proyectos/${p._id}`}
                className="flex items-center gap-4 rounded-xl border border-[#2F3A5C] bg-[#121A2F] p-4 transition-colors hover:border-[#4C58FF]/40"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-slate-100 truncate">{p.title}</div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {client?.name || '—'}
                    {designer && <span> → {designer.name}</span>}
                    <span className="ml-2">· {new Date(p.createdAt).toLocaleDateString('es-CO')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-100">{fmt(p.pricing.total)}</div>
                    <div className="text-xs text-slate-400">Rev. {p.revisions.used}/{p.revisions.max}</div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
