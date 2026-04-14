'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { projectsApi } from '@/lib/api'
import type { Project } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  activo:   'En producción',
  revision: 'Esperando revisión del cliente',
  ajuste:   'Cliente solicitó ajustes',
  aprobado: 'Aprobado por el cliente',
}

const fmt = (n: number) => `$${n.toLocaleString('es-CO')}`

export default function DisenadorProyectoPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  // Subir entregable
  const [fileUrl, setFileUrl]   = useState('')
  const [fileName, setFileName] = useState('')
  const [delivering, setDelivering] = useState(false)
  const [deliverError, setDeliverError] = useState('')

  async function load() {
    try {
      setProject(await projectsApi.get(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  async function handleDeliver(e: React.FormEvent) {
    e.preventDefault()
    if (!fileUrl.trim() || !fileName.trim()) return
    setDelivering(true)
    setDeliverError('')
    try {
      const updated = await projectsApi.deliver(id, { fileUrl: fileUrl.trim(), fileName: fileName.trim() })
      setProject(updated)
      setFileUrl('')
      setFileName('')
    } catch (err) {
      setDeliverError(err instanceof Error ? err.message : 'Error al entregar')
    } finally {
      setDelivering(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-gray-400 text-sm">Cargando proyecto...</p>
    </div>
  )

  if (error || !project) return (
    <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-red-600 text-sm">{error || 'No encontrado'}</div>
  )

  const p = project
  const canDeliver = ['activo', 'ajuste'].includes(p.status)
  const lastRevision = p.timeline.filter(t => t.action === 'REVISION_SOLICITADA').slice(-1)[0]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <a href="/disenador" className="text-xs text-gray-400 hover:text-coral transition-colors mb-3 inline-block">
          ← Cola de trabajo
        </a>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-cobalt">{p.title}</h1>
            <p className="text-sm text-gray-400 mt-1 capitalize">{p.serviceType} · {p.complexity} · {p.urgency}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-cobalt">{fmt(p.pricing.designerPay)}</div>
            <div className="text-xs text-gray-400">Tu pago neto</div>
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-cobalt/70">
          <span className={`w-2 h-2 rounded-full ${
            p.status === 'ajuste' ? 'bg-orange-400' :
            p.status === 'revision' ? 'bg-purple-400' :
            p.status === 'aprobado' ? 'bg-green-400' : 'bg-blue-400'
          }`} />
          {STATUS_LABEL[p.status] || p.status}
        </div>
      </div>

      {/* Aviso de ajuste */}
      {p.status === 'ajuste' && lastRevision && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-orange-800 mb-1">El cliente solicitó ajustes</div>
          <p className="text-sm text-orange-700">{lastRevision.message || 'Sin mensaje adicional.'}</p>
          <div className="text-xs text-orange-400 mt-2">
            Revisión {p.revisions.used} de {p.revisions.max} usada
          </div>
        </div>
      )}

      {/* Brief */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Brief del cliente</h2>
        <p className="text-sm text-cobalt whitespace-pre-line">{p.description}</p>
        {p.format && (
          <p className="text-xs text-gray-400 mt-3">
            <span className="font-medium">Formatos requeridos:</span> {p.format}
          </p>
        )}
      </div>

      {/* Cliente */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Cliente</h2>
        {typeof p.client === 'object' ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-cobalt/10 flex items-center justify-center text-cobalt font-bold text-sm">
              {p.client.name.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-cobalt text-sm">{p.client.name}</div>
              {p.client.company && <div className="text-xs text-gray-400">{p.client.company}</div>}
            </div>
          </div>
        ) : <span className="text-sm text-gray-400">—</span>}
      </div>

      {/* Entregables anteriores */}
      {p.deliverables.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Entregas anteriores ({p.deliverables.length})
          </h2>
          <div className="space-y-2">
            {p.deliverables.map((d, i) => (
              <a key={i} href={d.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-cobalt/20 transition-colors">
                <span className="text-lg">📎</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-cobalt truncate">{d.name}</div>
                  <div className="text-xs text-gray-400">Ronda {d.round}</div>
                </div>
                <span className="text-xs text-coral font-medium">Ver →</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Subir entregable */}
      {canDeliver && (
        <div className="bg-white border border-cobalt/15 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-cobalt mb-1">
            {p.status === 'ajuste' ? 'Subir versión corregida' : 'Subir entregable'}
          </h2>
          <p className="text-xs text-gray-400 mb-4">
            Sube el archivo a Google Drive, Dropbox o cualquier servicio en la nube y pega el enlace aquí.
          </p>
          <form onSubmit={handleDeliver} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
                Nombre del archivo
              </label>
              <input
                type="text"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                placeholder="ej. Branding_v2_final.pdf"
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-cobalt placeholder-gray-300 focus:outline-none focus:border-cobalt/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5 block">
                Enlace al archivo
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={e => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-cobalt placeholder-gray-300 focus:outline-none focus:border-cobalt/40"
              />
            </div>
            {deliverError && (
              <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{deliverError}</div>
            )}
            <button
              type="submit"
              disabled={delivering}
              className="w-full bg-cobalt text-white font-semibold py-3 rounded-lg hover:bg-cobalt-mid transition-colors disabled:opacity-60 text-sm"
            >
              {delivering ? 'Enviando...' : '↑ Enviar al cliente'}
            </button>
          </form>
        </div>
      )}

      {/* Estado aprobado */}
      {p.status === 'aprobado' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
          <div className="text-2xl mb-2">✓</div>
          <div className="font-semibold text-green-800">El cliente aprobó tu trabajo</div>
          <div className="text-sm text-green-600 mt-1">
            Pago pendiente: <span className="font-bold">{fmt(p.pricing.designerPay)}</span>
          </div>
          <div className="text-xs text-green-500 mt-1">El admin procesará el pago al cerrar el proyecto</div>
        </div>
      )}

      {/* Revisiones */}
      <div className="text-xs text-gray-400 flex items-center gap-3">
        <span>Revisiones: {p.revisions.used}/{p.revisions.max}</span>
        {p.revisions.extra > 0 && <span className="text-coral">· {p.revisions.extra} extra(s)</span>}
      </div>

      {/* Timeline */}
      {p.timeline.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Historial</h2>
          <div className="space-y-3">
            {[...p.timeline].reverse().map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cobalt/30 mt-2 flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-cobalt">{t.action.replace(/_/g, ' ')}</div>
                  {t.message && <div className="text-xs text-gray-400 mt-0.5">{t.message}</div>}
                  <div className="theme-dashboard-muted text-xs mt-0.5">
                    {new Date(t.createdAt).toLocaleString('es-CO')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
