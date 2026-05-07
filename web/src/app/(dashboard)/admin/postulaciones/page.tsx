'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import type { Application, ApplicationEstado, ApplicationEvaluacionPilar } from '@/types'

const ESTADO_META: Record<ApplicationEstado, { label: string; cls: string }> = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  en_prueba:  { label: 'En prueba',  cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  evaluado:   { label: 'Evaluado',   cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  aprobado:   { label: 'Aprobado',   cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  descartado: { label: 'Descartado', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
}

const PILARES: Array<{ key: keyof PilarState; label: string; peso: number }> = [
  { key: 'experiencia',            label: 'Experiencia',             peso: 20 },
  { key: 'portafolio',             label: 'Portafolio',              peso: 25 },
  { key: 'pruebaPractica',         label: 'Prueba práctica',         peso: 25 },
  { key: 'pensamientoEstrategico', label: 'Pensamiento estratégico', peso: 15 },
  { key: 'softSkills',             label: 'Soft skills',             peso: 15 },
]

type PilarState = {
  experiencia:            ApplicationEvaluacionPilar
  portafolio:             ApplicationEvaluacionPilar
  pruebaPractica:         ApplicationEvaluacionPilar
  pensamientoEstrategico: ApplicationEvaluacionPilar
  softSkills:             ApplicationEvaluacionPilar
}

const DEFAULT_PILARES: PilarState = {
  experiencia:            { puntaje: 5, nota: '' },
  portafolio:             { puntaje: 5, nota: '' },
  pruebaPractica:         { puntaje: 5, nota: '' },
  pensamientoEstrategico: { puntaje: 5, nota: '' },
  softSkills:             { puntaje: 5, nota: '' },
}

function nivelColor(n: number) {
  if (n <= 3) return 'text-red-400'
  if (n <= 5) return 'text-yellow-400'
  if (n <= 7) return 'text-blue-400'
  return 'text-emerald-400'
}

function getEstado(app: Application): ApplicationEstado {
  return app.estado ?? 'pendiente'
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-current opacity-10 ${className ?? ''}`} />
}

function KpiCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="theme-dashboard-surface rounded-xl border theme-dashboard-border p-4">
      {loading ? (
        <><Skeleton className="h-3 w-28 mb-2" /><Skeleton className="h-7 w-10" /></>
      ) : (
        <><p className="theme-dashboard-muted text-xs mb-1">{label}</p>
        <p className="theme-dashboard-text text-2xl font-bold">{value}</p></>
      )}
    </div>
  )
}

export default function PostulacionesPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'' | ApplicationEstado>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Application | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [panelTab, setPanelTab] = useState<'perfil' | 'evaluacion' | 'historial'>('perfil')

  // Panel actions
  const [briefForm, setBriefForm] = useState({ show: false, texto: '', fecha: '' })
  const [actionLoading, setActionLoading] = useState(false)
  const [pilares, setPilares] = useState<PilarState>(DEFAULT_PILARES)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    adminApi.applications()
      .then(data => setApps(data))
      .finally(() => setLoading(false))
  }, [])

  const kpis = useMemo(() => {
    const now = new Date()
    return {
      total:      apps.length,
      pendientes: apps.filter(a => getEstado(a) === 'pendiente').length,
      enPrueba:   apps.filter(a => getEstado(a) === 'en_prueba').length,
      aprobadosMes: apps.filter(a => {
        const d = new Date(a.createdAt)
        return getEstado(a) === 'aprobado'
          && d.getMonth() === now.getMonth()
          && d.getFullYear() === now.getFullYear()
      }).length,
    }
  }, [apps])

  const filtered = useMemo(() =>
    tab ? apps.filter(a => getEstado(a) === tab) : apps,
  [apps, tab])

  const handleSelect = useCallback(async (id: string) => {
    setSelectedId(id)
    setSelected(null)
    setDetailLoading(true)
    setPanelTab('perfil')
    setBriefForm({ show: false, texto: '', fecha: '' })
    try {
      const data = await adminApi.application(id)
      setSelected(data)
      if (data.evaluacion) {
        setPilares({
          experiencia:            data.evaluacion.experiencia            ?? { puntaje: 5, nota: '' },
          portafolio:             data.evaluacion.portafolio             ?? { puntaje: 5, nota: '' },
          pruebaPractica:         data.evaluacion.pruebaPractica         ?? { puntaje: 5, nota: '' },
          pensamientoEstrategico: data.evaluacion.pensamientoEstrategico ?? { puntaje: 5, nota: '' },
          softSkills:             data.evaluacion.softSkills             ?? { puntaje: 5, nota: '' },
        })
      } else {
        setPilares(DEFAULT_PILARES)
      }
    } catch { /* panel mostrará fallback */ } finally {
      setDetailLoading(false)
    }
  }, [])

  const closePanel = () => { setSelectedId(null); setSelected(null) }

  const updateApp = (updated: Application) => {
    setSelected(updated)
    setApps(prev => prev.map(a => a._id === updated._id ? updated : a))
  }

  async function handleCambiarEstado(estado: ApplicationEstado, extra?: { briefPrueba?: string; fechaLimitePrueba?: string }) {
    if (!selected) return
    setActionLoading(true)
    try {
      const res = await adminApi.cambiarEstadoPostulacion(selected._id, { estado, ...extra })
      updateApp(res.application)
      setBriefForm({ show: false, texto: '', fecha: '' })
    } catch { /* noop */ } finally { setActionLoading(false) }
  }

  async function handleEvaluar() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await adminApi.evaluarPostulacion(selected._id, pilares)
      updateApp(res.application)
      if (res.application.evaluacion) {
        setSelected(res.application)
      }
    } catch { /* noop */ } finally { setSaving(false) }
  }

  // Live puntaje
  const ponderado = useMemo(() => (
    pilares.experiencia.puntaje            * 0.20 +
    pilares.portafolio.puntaje             * 0.25 +
    pilares.pruebaPractica.puntaje         * 0.25 +
    pilares.pensamientoEstrategico.puntaje * 0.15 +
    pilares.softSkills.puntaje             * 0.15
  ), [pilares])

  const nivelPreview = Math.min(10, Math.max(1, Math.round(ponderado)))

  const PAY_RANGES: Record<number, string> = {
    1: '$40.000 - $60.000 / hora', 2: '$40.000 - $60.000 / hora',
    3: '$60.000 - $90.000 / hora', 4: '$60.000 - $90.000 / hora',
    5: '$90.000 - $130.000 / hora', 6: '$90.000 - $130.000 / hora',
    7: '$130.000 - $180.000 / hora', 8: '$130.000 - $180.000 / hora',
    9: '$180.000 - $250.000 / hora', 10: '$180.000 - $250.000 / hora',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="theme-dashboard-text text-2xl font-bold">Postulaciones</h1>
        <p className="theme-dashboard-muted text-sm mt-1">Gestión y evaluación de candidatos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total postulaciones" value={kpis.total} loading={loading} />
        <KpiCard label="Pendientes de revisión" value={kpis.pendientes} loading={loading} />
        <KpiCard label="En prueba práctica" value={kpis.enPrueba} loading={loading} />
        <KpiCard label="Aprobados este mes" value={kpis.aprobadosMes} loading={loading} />
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg overflow-hidden border theme-dashboard-border w-fit">
        {([['', 'Todos'], ['pendiente', 'Pendiente'], ['en_prueba', 'En prueba'],
           ['evaluado', 'Evaluado'], ['aprobado', 'Aprobado'], ['descartado', 'Descartado']] as const
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val as '' | ApplicationEstado)}
            className={`px-3 py-1.5 text-xs transition-colors ${
              tab === val
                ? 'bg-[#3B47F6]/30 theme-dashboard-text'
                : 'theme-dashboard-muted hover:text-[var(--dashboard-text)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="theme-dashboard-surface rounded-xl border theme-dashboard-border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="theme-dashboard-surface rounded-xl border theme-dashboard-border p-10 text-center">
          <p className="theme-dashboard-muted text-sm">No hay postulaciones en este estado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(app => {
            const est = getEstado(app)
            const meta = ESTADO_META[est]
            return (
              <div
                key={app._id}
                className="theme-dashboard-surface rounded-xl border theme-dashboard-border p-4 hover:border-[#4C58FF]/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#4C58FF]/20 flex items-center justify-center text-sm font-bold text-[#A5B4FC] shrink-0">
                      {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="theme-dashboard-text text-sm font-semibold truncate">{app.name}</p>
                      <p className="theme-dashboard-muted text-xs truncate">{app.role} · {app.city}</p>
                      <p className="theme-dashboard-muted text-xs">
                        {app.experienceYears != null ? `${app.experienceYears} años exp.` : app.experience}
                        {app.portfolio && (
                          <> · <a href={app.portfolio} target="_blank" rel="noreferrer" className="text-[#7280FF] hover:underline" onClick={e => e.stopPropagation()}>Portafolio ↗</a></>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {app.level != null && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">
                        Nivel {app.level}
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <button
                      onClick={() => handleSelect(app._id)}
                      className="text-xs text-[#7280FF] hover:text-[#9AA8FF] transition-colors ml-1"
                    >
                      Ver →
                    </button>
                  </div>
                </div>
                <p className="theme-dashboard-muted text-[10px] mt-2">
                  {new Date(app.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* Side panel */}
      {selectedId && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={closePanel} aria-hidden="true" />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col theme-dashboard-sidebar border-l theme-dashboard-border">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b theme-dashboard-border">
              <h2 className="theme-dashboard-text font-semibold text-sm">
                {selected ? selected.name : 'Cargando...'}
              </h2>
              <button onClick={closePanel} className="theme-dashboard-muted hover:text-[var(--dashboard-text)] text-lg leading-none">✕</button>
            </div>

            {/* Panel tabs */}
            <div className="shrink-0 flex border-b theme-dashboard-border">
              {(['perfil', 'evaluacion', 'historial'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setPanelTab(t)}
                  className={`flex-1 py-2.5 text-xs capitalize transition-colors ${
                    panelTab === t
                      ? 'theme-dashboard-text border-b-2 border-[#4C58FF]'
                      : 'theme-dashboard-muted hover:text-[var(--dashboard-text)]'
                  }`}
                >
                  {t === 'evaluacion' ? 'Evaluación' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {detailLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              ) : !selected ? (
                <p className="theme-dashboard-muted text-sm">No se pudo cargar el detalle.</p>
              ) : (
                <>
                  {/* ── Tab Perfil ── */}
                  {panelTab === 'perfil' && (
                    <div className="space-y-4">
                      {/* Estado badge + info básica */}
                      <div className="theme-dashboard-surface rounded-lg border theme-dashboard-border p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ESTADO_META[getEstado(selected)].cls}`}>
                            {ESTADO_META[getEstado(selected)].label}
                          </span>
                          {selected.level != null && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">
                              Nivel {selected.level} · {selected.payRange}
                            </span>
                          )}
                        </div>
                        <p className="theme-dashboard-muted text-xs">{selected.email} · {selected.phone}</p>
                        <p className="theme-dashboard-muted text-xs">{selected.city}</p>
                      </div>

                      {/* Datos del formulario */}
                      <Row label="Rol" value={selected.role} />
                      <Row label="Experiencia" value={selected.experienceYears != null ? `${selected.experienceYears} años` : selected.experience} />
                      <Row label="Disponibilidad" value={selected.availability} />
                      {selected.portfolio && (
                        <div>
                          <p className="theme-dashboard-muted text-[10px] uppercase tracking-wider mb-0.5">Portafolio</p>
                          <a href={selected.portfolio} target="_blank" rel="noreferrer" className="text-[#7280FF] text-xs hover:underline break-all">
                            {selected.portfolio} ↗
                          </a>
                        </div>
                      )}
                      {selected.tools && selected.tools.length > 0 && (
                        <div>
                          <p className="theme-dashboard-muted text-[10px] uppercase tracking-wider mb-1.5">Herramientas</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selected.tools.map(t => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[#3B47F6]/15 text-[#7280FF] border border-[#4C58FF]/20">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selected.workDescription && (
                        <Row label="Descripción del trabajo" value={selected.workDescription} multiline />
                      )}
                      <Row label="Motivación" value={selected.motivation} multiline />
                      {selected.source && <Row label="Cómo nos conoció" value={selected.source} />}

                      {/* Acciones de estado */}
                      <div className="pt-2 space-y-2 border-t theme-dashboard-border">
                        {getEstado(selected) === 'pendiente' && (
                          <>
                            {!briefForm.show ? (
                              <button
                                onClick={() => setBriefForm(f => ({ ...f, show: true }))}
                                className="w-full rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 text-sm py-2 transition-colors"
                              >
                                Pasar a prueba práctica
                              </button>
                            ) : (
                              <div className="space-y-2">
                                <textarea
                                  className="w-full rounded-lg bg-[#1A1F3A] border border-[#2A3050] text-white text-xs px-3 py-2 resize-none focus:outline-none focus:border-[#4C58FF]"
                                  rows={4}
                                  placeholder="Brief de la prueba práctica..."
                                  value={briefForm.texto}
                                  onChange={e => setBriefForm(f => ({ ...f, texto: e.target.value }))}
                                />
                                <input
                                  type="date"
                                  className="w-full rounded-lg bg-[#1A1F3A] border border-[#2A3050] text-white text-xs px-3 py-2 focus:outline-none focus:border-[#4C58FF]"
                                  value={briefForm.fecha}
                                  onChange={e => setBriefForm(f => ({ ...f, fecha: e.target.value }))}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setBriefForm({ show: false, texto: '', fecha: '' })}
                                    className="flex-1 rounded-lg border theme-dashboard-border theme-dashboard-muted text-xs py-1.5 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    disabled={actionLoading}
                                    onClick={() => handleCambiarEstado('en_prueba', { briefPrueba: briefForm.texto, fechaLimitePrueba: briefForm.fecha })}
                                    className="flex-1 rounded-lg bg-yellow-500/30 text-yellow-400 text-xs py-1.5 disabled:opacity-50 transition-colors"
                                  >
                                    {actionLoading ? 'Enviando...' : 'Confirmar'}
                                  </button>
                                </div>
                              </div>
                            )}
                            <button
                              disabled={actionLoading}
                              onClick={() => handleCambiarEstado('descartado')}
                              className="w-full rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm py-2 transition-colors disabled:opacity-50"
                            >
                              Descartar
                            </button>
                          </>
                        )}
                        {getEstado(selected) === 'evaluado' && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleCambiarEstado('aprobado')}
                            className="w-full rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 text-sm py-2 transition-colors disabled:opacity-50"
                          >
                            {actionLoading ? 'Procesando...' : 'Aprobar colaborador'}
                          </button>
                        )}
                        {(getEstado(selected) === 'en_prueba' || getEstado(selected) === 'evaluado') && (
                          <button
                            disabled={actionLoading}
                            onClick={() => handleCambiarEstado('descartado')}
                            className="w-full rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm py-2 transition-colors disabled:opacity-50"
                          >
                            Descartar
                          </button>
                        )}
                        {selected.briefPrueba && (
                          <div className="rounded-lg bg-[#1A1F3A]/60 border theme-dashboard-border p-3">
                            <p className="theme-dashboard-muted text-[10px] uppercase tracking-wider mb-1">Brief asignado</p>
                            <p className="theme-dashboard-text text-xs leading-relaxed">{selected.briefPrueba}</p>
                            {selected.fechaLimitePrueba && (
                              <p className="theme-dashboard-muted text-[10px] mt-1">
                                Límite: {new Date(selected.fechaLimitePrueba).toLocaleDateString('es-CO')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Tab Evaluación ── */}
                  {panelTab === 'evaluacion' && (
                    <div className="space-y-5">
                      {getEstado(selected) === 'pendiente' ? (
                        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center">
                          <p className="text-yellow-400 text-sm">Primero pasa al candidato a prueba práctica antes de evaluar.</p>
                        </div>
                      ) : (
                        <>
                          {/* 5 pilares */}
                          {PILARES.map(({ key, label, peso }) => (
                            <div key={key} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="theme-dashboard-text text-xs font-medium">{label}</p>
                                <div className="flex items-center gap-2">
                                  <span className="theme-dashboard-muted text-[10px]">{peso}%</span>
                                  <span className={`text-sm font-bold ${nivelColor(pilares[key].puntaje)}`}>
                                    {pilares[key].puntaje}
                                  </span>
                                </div>
                              </div>
                              <input
                                type="range" min={1} max={10}
                                value={pilares[key].puntaje}
                                onChange={e => setPilares(p => ({
                                  ...p,
                                  [key]: { ...p[key], puntaje: Number(e.target.value) },
                                }))}
                                className="w-full accent-[#4C58FF]"
                              />
                              <textarea
                                className="w-full rounded-lg bg-[#1A1F3A] border border-[#2A3050] text-white text-xs px-3 py-2 resize-none focus:outline-none focus:border-[#4C58FF] placeholder:text-zinc-600"
                                rows={2}
                                placeholder="Observación (opcional)..."
                                value={pilares[key].nota ?? ''}
                                onChange={e => setPilares(p => ({
                                  ...p,
                                  [key]: { ...p[key], nota: e.target.value },
                                }))}
                              />
                            </div>
                          ))}

                          {/* Preview en tiempo real */}
                          <div className="rounded-xl border theme-dashboard-border theme-dashboard-surface p-4 space-y-2">
                            <p className="theme-dashboard-muted text-xs uppercase tracking-wider">Resultado</p>
                            <div className="flex items-end gap-3">
                              <div>
                                <p className="theme-dashboard-muted text-[10px]">Nivel calculado</p>
                                <p className={`text-3xl font-black ${nivelColor(nivelPreview)}`}>{nivelPreview}</p>
                              </div>
                              <div>
                                <p className="theme-dashboard-muted text-[10px]">Puntaje ponderado</p>
                                <p className="theme-dashboard-text text-lg font-bold">{ponderado.toFixed(2)}</p>
                              </div>
                            </div>
                            <p className="theme-dashboard-muted text-xs">{PAY_RANGES[nivelPreview]}</p>
                          </div>

                          <button
                            disabled={saving}
                            onClick={handleEvaluar}
                            className="w-full rounded-lg bg-[#4C58FF] hover:bg-[#3B47F6] disabled:opacity-50 text-white text-sm font-medium py-2.5 transition-colors"
                          >
                            {saving ? 'Guardando...' : 'Guardar evaluación'}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Tab Historial ── */}
                  {panelTab === 'historial' && (
                    <div className="space-y-3">
                      {!selected.timeline || selected.timeline.length === 0 ? (
                        <p className="theme-dashboard-muted text-sm text-center py-8">Sin historial de cambios aún.</p>
                      ) : (
                        [...selected.timeline].reverse().map((ev, i) => {
                          const meta = ESTADO_META[ev.estado as ApplicationEstado]
                          return (
                            <div key={i} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-[#4C58FF] mt-1 shrink-0" />
                                {i < selected.timeline!.length - 1 && (
                                  <div className="w-px flex-1 bg-[var(--dashboard-border)] mt-1" />
                                )}
                              </div>
                              <div className="pb-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${meta?.cls ?? 'theme-dashboard-muted border-[var(--dashboard-border)]'}`}>
                                  {meta?.label ?? ev.estado}
                                </span>
                                <p className="theme-dashboard-muted text-[10px] mt-1">
                                  {new Date(ev.at).toLocaleString('es-CO')}
                                </p>
                                {ev.nota && <p className="theme-dashboard-muted text-xs mt-0.5">{ev.nota}</p>}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Row({ label, value, multiline }: { label: string; value?: string | null; multiline?: boolean }) {
  if (!value) return null
  return (
    <div>
      <p className="theme-dashboard-muted text-[10px] uppercase tracking-wider mb-0.5">{label}</p>
      {multiline
        ? <p className="theme-dashboard-text text-xs leading-relaxed whitespace-pre-wrap">{value}</p>
        : <p className="theme-dashboard-text text-sm">{value}</p>
      }
    </div>
  )
}
