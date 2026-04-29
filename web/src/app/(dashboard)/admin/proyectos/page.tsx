'use client'
import { useEffect, useState } from 'react'
import { projectsApi } from '@/lib/api'
import type { Project, ProjectStatus } from '@/types'
import { SLABadge } from '@/components/dashboard/SLABadge'

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
  cotizado:   'badge-yellow border',
  activo:     'badge-blue border',
  revision:   'badge-violet border',
  ajuste:     'badge-orange border',
  aprobado:   'badge-emerald border',
  completado: 'badge-slate border',
  cancelado:  'badge-rose border',
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
          <h1 className="theme-dashboard-text text-3xl font-bold">Proyectos</h1>
          <p className="theme-dashboard-muted mt-1 text-sm">{projects.length} en total</p>
        </div>
      </div>

      {/* Buscador */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por título, cliente o diseñador..."
        className="theme-dashboard-input mb-4 w-full rounded-xl px-4 py-3 text-sm placeholder:text-[color:var(--dashboard-muted)] focus:outline-none focus:border-[#4C58FF]"
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
                : 'theme-dashboard-surface theme-dashboard-border border theme-dashboard-muted hover:bg-[var(--dashboard-surface-2)]'
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
        <div className="theme-dashboard-muted text-sm">Cargando proyectos...</div>
      ) : filtered.length === 0 ? (
        <div className="theme-dashboard-muted py-12 text-center text-sm">
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
                className="theme-dashboard-border theme-dashboard-surface flex items-center gap-4 rounded-xl border p-4 transition-colors hover:border-[#4C58FF]/40"
              >
                <div className="flex-1 min-w-0">
                  <div className="theme-dashboard-text text-sm font-semibold truncate">{p.title}</div>
                  <div className="theme-dashboard-muted mt-0.5 text-xs">
                    {client?.name || '—'}
                    {designer && <span> → {designer.name}</span>}
                    <span className="ml-2">· {new Date(p.createdAt).toLocaleDateString('es-CO')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="theme-dashboard-text text-sm font-bold">{fmt(p.pricing.total)}</div>
                    <div className="theme-dashboard-muted text-xs">Rev. {p.revisions.used}/{p.revisions.max}</div>
                  </div>
                  <SLABadge deadlineAt={p.deadlineAt} status={p.status} />
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
