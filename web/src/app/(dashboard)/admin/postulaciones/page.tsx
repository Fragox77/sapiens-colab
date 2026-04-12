'use client'
import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api'
import type { Application } from '@/types'

const STATUS_COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  aprobado:  'bg-green-100 text-green-800',
  rechazado: 'bg-red-100 text-red-800',
  en_proceso:'bg-blue-100 text-blue-800',
}

const SCORE_FIELDS: { key: string; label: string; weight: string }[] = [
  { key: 'experiencia', label: 'Experiencia',  weight: '20%' },
  { key: 'portafolio',  label: 'Portafolio',   weight: '25%' },
  { key: 'prueba',      label: 'Prueba técnica',weight: '25%' },
  { key: 'estrategia',  label: 'Estrategia',   weight: '15%' },
  { key: 'softSkills',  label: 'Soft skills',  weight: '15%' },
]

const PAY_RANGES: Record<number, string> = {
  1: '$800k–$1.5M', 2: '$800k–$1.5M', 3: '$800k–$1.5M',
  4: '$1.5M–$3.5M', 5: '$1.5M–$3.5M', 6: '$1.5M–$3.5M',
  7: '$3.5M–$5M',   8: '$3.5M–$5M',
  9: '$5M+',        10: '$5M+',
}

export default function PostulacionesPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading]    = useState(true)
  const [selected, setSelected]  = useState<Application | null>(null)
  const [scores, setScores]      = useState<Record<string, number>>({})
  const [notes, setNotes]        = useState('')
  const [status, setStatus]      = useState('')
  const [saving, setSaving]      = useState(false)
  const [error, setError]        = useState('')

  async function load() {
    try {
      const apps = await adminApi.applications()
      setApplications(apps as Application[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openEval(app: Application) {
    setSelected(app)
    setScores({})
    setNotes('')
    setStatus(app.status)
    setError('')
  }

  // Nivel calculado en tiempo real para preview
  const previewLevel = (() => {
    const { experiencia = 0, portafolio = 0, prueba = 0, estrategia = 0, softSkills = 0 } = scores
    const w = (experiencia * 0.20) + (portafolio * 0.25) + (prueba * 0.25) + (estrategia * 0.15) + (softSkills * 0.15)
    return Math.max(1, Math.min(10, Math.round(w)))
  })()

  async function handleSave() {
    if (!selected) return
    setSaving(true); setError('')
    try {
      const updated = await adminApi.evaluate(selected._id, { scores, notes, status })
      setApplications(prev => prev.map(a => a._id === updated._id ? updated as Application : a))
      setSelected(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cobalt">Postulaciones</h1>
        <p className="text-sm text-gray-400 mt-1">{applications.length} postulantes</p>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Cargando postulaciones...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No hay postulaciones aún.</div>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app._id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cobalt/10 flex items-center justify-center text-cobalt font-bold text-sm">
                    {app.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-cobalt text-sm">{app.name}</div>
                    <div className="text-xs text-gray-400">{app.email}</div>
                    <div className="text-xs text-gray-400 capitalize mt-0.5">{app.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {app.level && (
                    <div className="text-center">
                      <div className="text-xl font-black text-cobalt">{app.level}</div>
                      <div className="text-xs text-gray-400">nivel</div>
                    </div>
                  )}
                  {app.payRange && (
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-gray-400">Rango</div>
                      <div className="text-sm font-semibold text-cobalt">{app.payRange}</div>
                    </div>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[app.status] || 'bg-gray-100 text-gray-600'}`}>
                    {app.status}
                  </span>
                  <button
                    onClick={() => openEval(app)}
                    className="text-xs font-medium text-cobalt border border-cobalt/20 px-3 py-1.5 rounded-lg hover:bg-cobalt/5 transition-colors"
                  >
                    Evaluar
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-300 mt-3">
                {new Date(app.createdAt).toLocaleDateString('es-CO')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Panel de evaluación */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-cobalt">{selected.name}</h2>
                <p className="text-xs text-gray-400">{selected.email}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 text-xl leading-none">×</button>
            </div>

            {/* Scores */}
            <div className="space-y-4 mb-5">
              {SCORE_FIELDS.map(f => (
                <div key={f.key}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>{f.label} <span className="text-gray-300">({f.weight})</span></span>
                    <span className="font-semibold text-cobalt">{scores[f.key] ?? '—'}</span>
                  </div>
                  <input
                    type="range" min={0} max={10} step={1}
                    value={scores[f.key] ?? 5}
                    onChange={e => setScores(s => ({ ...s, [f.key]: Number(e.target.value) }))}
                    className="w-full accent-coral"
                  />
                  <div className="flex justify-between text-xs text-gray-200 mt-0.5">
                    <span>0</span><span>5</span><span>10</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview nivel */}
            {Object.keys(scores).length > 0 && (
              <div className="bg-cobalt rounded-xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <div className="text-white/40 text-xs">Nivel calculado</div>
                  <div className="text-3xl font-black text-white">{previewLevel} <span className="text-sm font-normal text-white/40">/ 10</span></div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-xs mb-1">Rango de pago</div>
                  <div className="text-white text-sm font-semibold">{PAY_RANGES[previewLevel]}</div>
                </div>
              </div>
            )}

            {/* Notas */}
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas internas sobre el postulante..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-cobalt placeholder-gray-300 focus:outline-none focus:border-cobalt/30 resize-none mb-4"
            />

            {/* Estado */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">Estado de la postulación</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cobalt/30"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>

            {error && (
              <div className="mb-3 text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-cobalt text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-cobalt-mid transition-colors disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Guardar evaluación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
