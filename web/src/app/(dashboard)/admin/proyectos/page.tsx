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
  cotizado:   'bg-yellow-100 text-yellow-800',
  activo:     'bg-blue-100 text-blue-800',
  revision:   'bg-purple-100 text-purple-800',
  ajuste:     'bg-orange-100 text-orange-800',
  aprobado:   'bg-green-100 text-green-800',
  completado: 'bg-gray-100 text-gray-600',
  cancelado:  'bg-red-100 text-red-800',
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
          <h1 className="text-2xl font-bold text-cobalt">Proyectos</h1>
          <p className="text-sm text-gray-400 mt-1">{projects.length} en total</p>
        </div>
      </div>

      {/* Buscador */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por título, cliente o diseñador..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-cobalt placeholder-gray-300 focus:outline-none focus:border-cobalt/30 mb-4"
      />

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f.value
                ? 'bg-cobalt text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-cobalt/30'
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
        <div className="text-gray-400 text-sm">Cargando proyectos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
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
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-cobalt/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-cobalt text-sm truncate">{p.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {client?.name || '—'}
                    {designer && <span> → {designer.name}</span>}
                    <span className="ml-2">· {new Date(p.createdAt).toLocaleDateString('es-CO')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-cobalt">{fmt(p.pricing.total)}</div>
                    <div className="text-xs text-gray-400">Rev. {p.revisions.used}/{p.revisions.max}</div>
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
