'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { adminApi } from '@/lib/api'
import type { Application } from '@/types'

const SCORE_FIELDS = [
  { key: 'experiencia', label: 'Experiencia',    weight: '20%' },
  { key: 'portafolio',  label: 'Portafolio',     weight: '25%' },
  { key: 'prueba',      label: 'Prueba técnica', weight: '25%' },
  { key: 'estrategia',  label: 'Estrategia',     weight: '15%' },
  { key: 'softSkills',  label: 'Soft skills',    weight: '15%' },
] as const

const PAY_RANGES: Record<number, string> = {
  1: '$800k–$1.5M', 2: '$800k–$1.5M', 3: '$800k–$1.5M',
  4: '$1.5M–$3.5M', 5: '$1.5M–$3.5M', 6: '$1.5M–$3.5M',
  7: '$3.5M–$5M',   8: '$3.5M–$5M',
  9: '$5M+',        10: '$5M+',
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  'recibida':       { label: 'Recibida',       color: 'badge-slate border' },
  'en-evaluacion':  { label: 'En evaluacion',  color: 'badge-blue border' },
  'prueba-enviada': { label: 'Prueba enviada', color: 'badge-yellow border' },
  'evaluada':       { label: 'Evaluada',       color: 'badge-violet border' },
  'aceptada':       { label: 'Aceptada',       color: 'badge-emerald border' },
  'rechazada':      { label: 'Rechazada',      color: 'badge-rose border' },
}

function calcLevel(scores: Record<string, number>): number {
  const { experiencia = 0, portafolio = 0, prueba = 0, estrategia = 0, softSkills = 0 } = scores
  const w = (experiencia * 0.20) + (portafolio * 0.25) + (prueba * 0.25) + (estrategia * 0.15) + (softSkills * 0.15)
  return Math.max(1, Math.min(10, Math.round(w)))
}

export default function PostulacionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [app, setApp]               = useState<Application | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // Evaluación
  const [scores, setScores]         = useState<Record<string, number>>({})
  const [notes, setNotes]           = useState('')
  const [evalStatus, setEvalStatus] = useState('')
  const [savingEval, setSavingEval] = useState(false)
  const [evalError, setEvalError]   = useState('')

  // Brief
  const [briefText, setBriefText]   = useState('')
  const [savingBrief, setSavingBrief] = useState(false)
  const [briefError, setBriefError] = useState('')
  const [showBriefForm, setShowBriefForm] = useState(false)

  // Activar
  const [activating, setActivating] = useState(false)
  const [activateError, setActivateError] = useState('')
  const [activated, setActivated]   = useState<{ tempPassword: string; email: string } | null>(null)

  // Rechazar
  const [rejecting, setRejecting]   = useState(false)

  useEffect(() => {
    adminApi.application(params.id)
      .then(data => {
        setApp(data)
        setScores({
          experiencia: data.scores?.experiencia ?? 0,
          portafolio:  data.scores?.portafolio  ?? 0,
          prueba:      data.scores?.prueba      ?? 0,
          estrategia:  data.scores?.estrategia  ?? 0,
          softSkills:  data.scores?.softSkills  ?? 0,
        })
        setNotes(data.notes ?? '')
        setEvalStatus(data.status)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.id])

  const previewLevel = calcLevel(scores)
  const isClosed = app?.status === 'aceptada' || app?.status === 'rechazada'

  async function handleSaveEval() {
    if (!app) return
    setSavingEval(true); setEvalError('')
    try {
      const updated = await adminApi.evaluate(app._id, { scores, notes, status: evalStatus })
      setApp(updated)
    } catch (e) {
      setEvalError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSavingEval(false)
    }
  }

  async function handleBrief() {
    if (!app || !briefText.trim()) return
    setSavingBrief(true); setBriefError('')
    try {
      const updated = await adminApi.brief(app._id, briefText.trim())
      setApp(updated)
      setBriefText('')
      setShowBriefForm(false)
    } catch (e) {
      setBriefError(e instanceof Error ? e.message : 'Error al asignar brief')
    } finally {
      setSavingBrief(false)
    }
  }

  async function handleActivate() {
    if (!app) return
    setActivating(true); setActivateError('')
    try {
      const result = await adminApi.activate(app._id)
      setApp(result.application)
      setActivated({ tempPassword: result.tempPassword, email: result.user.email })
    } catch (e) {
      setActivateError(e instanceof Error ? e.message : 'Error al activar')
    } finally {
      setActivating(false)
    }
  }

  async function handleReject() {
    if (!app || !confirm('¿Confirmar rechazo de esta postulación?')) return
    setRejecting(true)
    try {
      const updated = await adminApi.reject(app._id, notes || undefined)
      setApp(updated)
    } catch (e) {
      setActivateError(e instanceof Error ? e.message : 'Error al rechazar')
    } finally {
      setRejecting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="theme-dashboard-muted text-sm">Cargando postulación...</div>
    </div>
  )

  if (error || !app) return (
    <div className="text-center py-16">
      <div className="text-red-500 text-sm mb-4">{error || 'No encontrada'}</div>
      <button onClick={() => router.back()} className="text-[#A5B4FC] text-sm underline">Volver</button>
    </div>
  )

  const statusMeta = STATUS_META[app.status] ?? { label: app.status, color: 'badge-slate border' }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="theme-dashboard-muted text-sm transition-colors hover:text-[#A5B4FC]">
            ← Postulaciones
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: info del postulante */}
        <div className="lg:col-span-1 space-y-4">
          {/* Tarjeta principal */}
          <div className="theme-dashboard-border theme-dashboard-surface rounded-2xl border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#4C58FF]/20 text-lg font-black text-[#A5B4FC]">
                {app.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="theme-dashboard-text font-bold">{app.name}</div>
                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.color}`}>
                  {statusMeta.label}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="theme-dashboard-muted">Email</span>
                <span className="theme-dashboard-text ml-2 truncate font-medium">{app.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-dashboard-muted">Teléfono</span>
                <span className="theme-dashboard-text font-medium">{app.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-dashboard-muted">Ciudad</span>
                <span className="theme-dashboard-text font-medium">{app.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-dashboard-muted">Rol</span>
                <span className="theme-dashboard-text font-medium capitalize">{app.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-dashboard-muted">Experiencia</span>
                <span className="theme-dashboard-text font-medium">{app.experience} años</span>
              </div>
              <div className="flex justify-between">
                <span className="theme-dashboard-muted">Disponibilidad</span>
                <span className="theme-dashboard-text font-medium capitalize">{app.availability}</span>
              </div>
              {app.portfolio && (
                <div className="pt-1">
                  <a
                    href={app.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-xs text-[#A5B4FC] underline"
                  >
                    Ver portafolio
                  </a>
                </div>
              )}
            </div>

            <div className="theme-dashboard-border mt-4 border-t pt-4">
              <div className="theme-dashboard-muted mb-1.5 text-xs">Motivación</div>
              <p className="theme-dashboard-muted text-xs leading-relaxed">{app.motivation}</p>
            </div>
          </div>

          {/* Nivel actual */}
          {app.level ? (
            <div className="theme-dashboard-panel theme-dashboard-border rounded-2xl border p-5">
              <div className="theme-dashboard-muted text-xs mb-1">Nivel asignado</div>
              <div className="theme-dashboard-text text-5xl font-black leading-none mb-1">{app.level}</div>
              <div className="theme-dashboard-muted text-xs">/ 10</div>
              <div className="theme-dashboard-border mt-3 pt-3 border-t">
                <div className="theme-dashboard-muted text-xs mb-0.5">Rango de pago</div>
                <div className="theme-dashboard-text font-semibold text-sm">{app.payRange}</div>
              </div>
            </div>
          ) : null}

          {/* Brief asignado */}
          {app.briefAssigned && (
            <div className="rounded-2xl border border-yellow-500/25 bg-yellow-500/10 p-5">
              <div className="mb-2 text-xs font-semibold text-semantic-warning">Brief asignado</div>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-yellow-200">{app.briefAssigned}</p>
            </div>
          )}

          {/* Usuario activado */}
          {activated && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <div className="text-sm font-bold text-green-800 mb-2">¡Diseñador activado!</div>
              <div className="text-xs text-green-700 space-y-1">
                <div>Email: <strong>{activated.email}</strong></div>
                <div>Contraseña temporal: <strong className="font-mono bg-green-100 px-1 rounded">{activated.tempPassword}</strong></div>
              </div>
              <p className="text-xs text-green-600 mt-2">Comparte estas credenciales con el diseñador para que acceda a la plataforma.</p>
            </div>
          )}
        </div>

        {/* Columna derecha: evaluación y acciones */}
        <div className="lg:col-span-2 space-y-5">
          {/* Panel de evaluación */}
          <div className="theme-dashboard-border theme-dashboard-surface rounded-2xl border p-6">
            <h2 className="theme-dashboard-text mb-4 font-bold">Evaluación por pilares</h2>

            <div className="space-y-5 mb-5">
              {SCORE_FIELDS.map(f => (
                <div key={f.key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="theme-dashboard-muted">{f.label} <span className="text-slate-500">({f.weight})</span></span>
                    <span className="theme-dashboard-text font-bold">{scores[f.key] ?? 0}</span>
                  </div>
                  <input
                    type="range" min={0} max={10} step={1}
                    value={scores[f.key] ?? 0}
                    disabled={isClosed}
                    onChange={e => setScores(s => ({ ...s, [f.key]: Number(e.target.value) }))}
                    className="w-full accent-coral disabled:opacity-50"
                  />
                  <div className="theme-dashboard-muted mt-0.5 flex justify-between text-xs">
                    <span>0</span><span>5</span><span>10</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Preview nivel */}
            <div className="theme-dashboard-border theme-dashboard-surface-2 mb-4 flex items-center justify-between rounded-xl border p-4">
              <div>
                <div className="theme-dashboard-muted text-xs">Nivel calculado</div>
                <div className="theme-dashboard-text text-3xl font-black">{previewLevel} <span className="text-sm font-normal theme-dashboard-muted">/ 10</span></div>
              </div>
              <div className="text-right">
                <div className="theme-dashboard-muted mb-0.5 text-xs">Rango de pago</div>
                <div className="theme-dashboard-text text-sm font-semibold">{PAY_RANGES[previewLevel]}</div>
              </div>
            </div>

            {/* Notas */}
            <textarea
              rows={3}
              value={notes}
              disabled={isClosed}
              onChange={e => setNotes(e.target.value)}
              placeholder="Notas internas sobre el postulante..."
              className="theme-dashboard-input mb-4 w-full resize-none rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#4C58FF] disabled:opacity-60"
            />

            {/* Estado */}
            <div className="mb-4">
              <label className="theme-dashboard-muted mb-1.5 block text-xs uppercase tracking-wide">Estado</label>
              <select
                value={evalStatus}
                disabled={isClosed}
                onChange={e => setEvalStatus(e.target.value)}
                className="theme-dashboard-input w-full rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#4C58FF] disabled:opacity-60"
              >
                <option value="recibida">Recibida</option>
                <option value="en-evaluacion">En evaluación</option>
                <option value="prueba-enviada">Prueba enviada</option>
                <option value="evaluada">Evaluada</option>
                <option value="aceptada">Aceptada</option>
                <option value="rechazada">Rechazada</option>
              </select>
            </div>

            {evalError && (
              <div className="mb-3 text-xs text-red-600 bg-red-50 rounded-lg p-2">{evalError}</div>
            )}

            {!isClosed && (
              <button
                onClick={handleSaveEval}
                disabled={savingEval}
                className="w-full rounded-xl bg-[#4C58FF] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {savingEval ? 'Guardando...' : 'Guardar evaluación'}
              </button>
            )}
          </div>

          {/* Asignar brief */}
          {!isClosed && (
            <div className="theme-dashboard-border theme-dashboard-surface rounded-2xl border p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="theme-dashboard-text font-bold">Brief de prueba técnica</h2>
                {!showBriefForm && (
                  <button
                    onClick={() => { setShowBriefForm(true); setBriefText(app.briefAssigned ?? '') }}
                    className="rounded-lg border border-[#4C58FF]/40 px-3 py-1.5 text-xs text-[#A5B4FC] transition-colors hover:bg-[#4C58FF]/15"
                  >
                    {app.briefAssigned ? 'Editar brief' : '+ Asignar brief'}
                  </button>
                )}
              </div>

              {!showBriefForm && !app.briefAssigned && (
                <p className="theme-dashboard-muted text-xs">
                  Asigna un brief de prueba técnica para evaluar las capacidades del postulante.
                  Esto cambiará el estado a &quot;Prueba enviada&quot;.
                </p>
              )}

              {showBriefForm && (
                <>
                  <textarea
                    rows={5}
                    value={briefText}
                    onChange={e => setBriefText(e.target.value)}
                    placeholder="Describe el brief de prueba técnica que debe resolver el postulante..."
                    className="theme-dashboard-input mb-3 w-full resize-none rounded-xl px-3 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#4C58FF]"
                    autoFocus
                  />
                  {briefError && (
                    <div className="mb-3 text-xs text-red-600 bg-red-50 rounded-lg p-2">{briefError}</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowBriefForm(false)}
                      className="theme-dashboard-border theme-dashboard-muted flex-1 rounded-xl border py-2 text-sm transition-colors hover:bg-[var(--dashboard-surface-2)]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleBrief}
                      disabled={savingBrief || !briefText.trim()}
                      className="flex-1 bg-yellow-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50"
                    >
                      {savingBrief ? 'Enviando...' : 'Enviar brief'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Acciones finales: Activar / Rechazar */}
          {!isClosed && app.level && (
            <div className="theme-dashboard-border theme-dashboard-surface rounded-2xl border p-6">
              <h2 className="theme-dashboard-text mb-1 font-bold">Decisión final</h2>
              <p className="theme-dashboard-muted mb-4 text-xs">
                El postulante tiene nivel {app.level}. Activa su cuenta o rechaza la postulación.
              </p>

              {activateError && (
                <div className="mb-3 text-xs text-red-600 bg-red-50 rounded-lg p-2">{activateError}</div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={rejecting}
                  className="flex-1 border border-red-200 text-red-500 py-2.5 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {rejecting ? 'Rechazando...' : 'Rechazar'}
                </button>
                <button
                  onClick={handleActivate}
                  disabled={activating}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {activating ? 'Activando...' : 'Activar diseñador'}
                </button>
              </div>
            </div>
          )}

          {/* Estado: aceptada */}
          {app.status === 'aceptada' && !activated && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <div className="font-semibold text-green-800 mb-1">Diseñador activo en la plataforma</div>
              <p className="text-xs text-green-600">Este postulante ya fue aceptado y tiene una cuenta de diseñador activa.</p>
            </div>
          )}

          {/* Estado: rechazada */}
          {app.status === 'rechazada' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <div className="font-semibold text-red-700 mb-1">Postulación rechazada</div>
              {app.notes && <p className="text-xs text-red-600 mt-1">{app.notes}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
