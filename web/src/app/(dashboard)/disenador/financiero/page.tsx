'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

interface FinancieroProject {
  id: string
  title: string
  client: string
  status: string
  designerPay: number
  balancePaid: boolean
  completedAt?: string
}

interface FinancieroData {
  projects: FinancieroProject[]
  totalPendiente: number
  totalCobrado: number
}

const STATUS_LABEL: Record<string, string> = {
  activo:     'En producción',
  revision:   'En revisión',
  ajuste:     'Ajustes',
  aprobado:   'Aprobado',
  completado: 'Completado',
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`

export default function FinancieroPage() {
  const [data, setData]       = useState<FinancieroData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get<FinancieroData>('/api/users/me/financiero')
      .then(setData)
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Cargando datos financieros...</p>
    </div>
  )

  if (error) return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-5 text-red-600 text-sm">{error}</div>
  )

  const pendientes  = data?.projects.filter(p => !p.balancePaid) || []
  const cobrados    = data?.projects.filter(p => p.balancePaid)  || []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-cobalt">Mis finanzas</h1>
        <p className="text-sm text-gray-400 mt-1">Pagos pendientes y cobrados</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="theme-dashboard-panel theme-dashboard-border rounded-xl border p-5">
          <div className="theme-dashboard-muted text-xs uppercase tracking-wider mb-2">Por cobrar</div>
          <div className="theme-dashboard-text text-3xl font-black">{fmt(data?.totalPendiente || 0)}</div>
          <div className="theme-dashboard-muted text-xs mt-1">{pendientes.length} proyecto(s)</div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Ya cobrado</div>
          <div className="text-3xl font-black text-cobalt">{fmt(data?.totalCobrado || 0)}</div>
          <div className="text-gray-400 text-xs mt-1">{cobrados.length} proyecto(s)</div>
        </div>
      </div>

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Pagos pendientes
          </h2>
          <div className="space-y-2">
            {pendientes.map(p => (
              <div key={p.id} className="bg-white border border-yellow-100 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-cobalt text-sm">{p.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{p.client} · {STATUS_LABEL[p.status] || p.status}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-cobalt">{fmt(p.designerPay)}</div>
                  <div className="text-xs text-yellow-600 mt-0.5">Pendiente</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cobrados */}
      {cobrados.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Pagos recibidos
          </h2>
          <div className="space-y-2">
            {cobrados.map(p => (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-cobalt text-sm">{p.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {p.client}
                    {p.completedAt && ` · ${new Date(p.completedAt).toLocaleDateString('es-CO')}`}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-cobalt">{fmt(p.designerPay)}</div>
                  <div className="text-xs text-green-600 mt-0.5">✓ Cobrado</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data?.projects.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          Aún no tienes proyectos asignados.
        </div>
      )}
    </div>
  )
}
