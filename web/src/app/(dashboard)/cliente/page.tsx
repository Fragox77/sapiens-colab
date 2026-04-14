'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { projectsApi, quotesApi } from '@/lib/api'
import type { Project, Quote } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  cotizado: 'Esperando anticipo',
  activo: 'En producción',
  revision: 'En revisión',
  ajuste: 'Ajustes',
  aprobado: 'Aprobado',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  cotizado: 'bg-yellow-100 text-yellow-800',
  activo: 'bg-blue-100 text-blue-800',
  revision: 'bg-purple-100 text-purple-800',
  ajuste: 'bg-orange-100 text-orange-800',
  aprobado: 'bg-green-100 text-green-800',
  completado: 'bg-gray-100 text-gray-700',
  cancelado: 'bg-red-100 text-red-800',
}

export default function ClienteDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [quotesLoading, setQuotesLoading] = useState(true)
  const [error, setError] = useState('')
  const [quotesError, setQuotesError] = useState('')

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await projectsApi.list()
        setProjects(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los proyectos')
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  useEffect(() => {
    async function loadQuotes() {
      try {
        const response = await quotesApi.list()
        setQuotes(response.data)
      } catch (err) {
        setQuotesError(err instanceof Error ? err.message : 'No se pudieron cargar las cotizaciones')
      } finally {
        setQuotesLoading(false)
      }
    }

    loadQuotes()
  }, [])

  const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-cobalt">Mis proyectos</h1>
          <p className="text-sm text-gray-500 mt-1">Seguimiento en tiempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/cotizar" className="border border-cobalt/20 text-cobalt px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-cobalt/5 transition-colors">
            Cotizar servicio
          </Link>
          <Link href="/cliente/nuevo" className="bg-coral text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-coral-dark transition-colors">
            + Nuevo pedido
          </Link>
        </div>
      </div>

      <section className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-cobalt">Mis cotizaciones</h2>
          <span className="text-xs text-gray-400">Ultimas 50</span>
        </div>

        {quotesLoading ? (
          <div className="text-gray-400 text-sm">Cargando cotizaciones...</div>
        ) : quotesError ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm">
            {quotesError}
          </div>
        ) : quotes.length === 0 ? (
          <p className="text-sm text-gray-500">Aun no tienes cotizaciones registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-4 font-medium">Fecha</th>
                  <th className="py-2 pr-4 font-medium">Servicio</th>
                  <th className="py-2 pr-4 font-medium">Total</th>
                  <th className="py-2 pr-4 font-medium">Lead score</th>
                  <th className="py-2 pr-4 font-medium">Proyecto</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q._id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 text-gray-600">{new Date(q.createdAt).toLocaleDateString('es-CO')}</td>
                    <td className="py-3 pr-4 text-gray-700">{q.serviceType}</td>
                    <td className="py-3 pr-4 font-semibold text-cobalt">{fmt(q.pricing.total)}</td>
                    <td className="py-3 pr-4 text-gray-700">{q.leadScore}/100</td>
                    <td className="py-3 pr-4 text-gray-700">
                      {q.project?._id ? (
                        <Link href={`/cliente/${q.project._id}`} className="text-cobalt hover:underline">
                          {q.project.title || 'Ver proyecto'}
                        </Link>
                      ) : 'Sin proyecto'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {loading ? (
        <div className="text-gray-400 text-sm">Cargando proyectos...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-600 text-sm">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 mb-4">Aún no tienes proyectos</p>
          <Link href="/cliente/nuevo" className="text-coral text-sm font-medium hover:underline">
            Solicita tu primer servicio →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <Link key={p._id} href={`/cliente/${p._id}`} className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-cobalt/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-cobalt mb-1">{p.title}</div>
                  <div className="text-sm text-gray-400">{p.serviceType} · {new Date(p.createdAt).toLocaleDateString('es-CO')}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                  <div className="text-right">
                    <div className="font-bold text-cobalt text-sm">{fmt(p.pricing.total)}</div>
                    <div className="text-xs text-gray-400">Anticipo: {fmt(p.pricing.anticipo)}</div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-400">
                <span>Revisiones: {p.revisions.used}/{p.revisions.max}</span>
                {p.designer && <span>Diseñador: {typeof p.designer === 'object' ? p.designer.name : '—'}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
