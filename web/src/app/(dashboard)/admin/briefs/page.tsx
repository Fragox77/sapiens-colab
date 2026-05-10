'use client'
import { useState, useCallback } from 'react'
import { useBriefs, useBriefStats } from '@/hooks/useBriefs'
import type { Brief, BriefStatus, Urgency } from '@/lib/briefs-api'

type TabEstado = '' | 'borrador' | 'aprobado' | 'convertido'
type FiltroUrgencia = '' | 'alta' | 'media' | 'baja'

const STATUS_COLOR: Record<BriefStatus, string> = {
  DRAFT:     'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  PENDING:   'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  APPROVED:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CONVERTED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  REJECTED:  'bg-red-500/20 text-red-400 border-red-500/30',
}

const STATUS_LABEL: Record<BriefStatus, string> = {
  DRAFT: 'borrador', PENDING: 'borrador',
  APPROVED: 'aprobado', CONVERTED: 'convertido', REJECTED: 'rechazado',
}

const URGENCY_COLOR: Record<Urgency, string> = {
  ALTA:  'bg-red-500/20 text-red-400 border-red-500/30',
  MEDIA: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  BAJA:  'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
}

const TAB_TO_STATUS: Record<TabEstado, BriefStatus | undefined> = {
  '': undefined, borrador: 'PENDING', aprobado: 'APPROVED', convertido: 'CONVERTED',
}

const URGENCIA_TO_API: Record<FiltroUrgencia, Urgency | undefined> = {
  '': undefined, alta: 'ALTA', media: 'MEDIA', baja: 'BAJA',
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-current opacity-10 ${className ?? ''}`} />
}

function KpiCard({
  label, value, loading, accent,
}: {
  label: string; value: number; loading: boolean; accent?: string
}) {
  return (
    <div className="theme-dashboard-surface rounded-xl border theme-dashboard-border p-4">
      {loading ? (
        <>
          <Skeleton className="h-3 w-28 mb-2" />
          <Skeleton className="h-7 w-10" />
        </>
      ) : (
        <>
          <p className="theme-dashboard-muted text-xs mb-1">{label}</p>
          <p className={`text-2xl font-bold ${accent ?? 'theme-dashboard-text'}`}>{value}</p>
        </>
      )}
    </div>
  )
}

function CollapsibleSection({
  title, children, defaultOpen = true,
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b theme-dashboard-border pb-3">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-1.5 theme-dashboard-muted text-[10px] font-semibold uppercase tracking-wider hover:text-[var(--dashboard-text)] transition-colors"
      >
        {title}
        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

function BriefCard({ brief, onSelect }: { brief: Brief; onSelect: (id: string) => void }) {
  const MAX_CHIPS = 3
  const visible = brief.deliverables.slice(0, MAX_CHIPS)
  const extra = brief.deliverables.length - MAX_CHIPS

  return (
    <div className="theme-dashboard-surface rounded-xl border theme-dashboard-border p-4 flex flex-col gap-3 hover:border-[#4C58FF]/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="theme-dashboard-text text-sm font-semibold truncate">{brief.client.name ?? '—'}</p>
          <p className="theme-dashboard-muted text-xs">{brief.client.waId}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${URGENCY_COLOR[brief.urgency]}`}>
            {brief.urgency.toLowerCase()}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOR[brief.status]}`}>
            {STATUS_LABEL[brief.status]}
          </span>
        </div>
      </div>

      <p className="theme-dashboard-muted text-xs leading-relaxed line-clamp-2">{brief.objective}</p>

      {brief.deliverables.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visible.map((e, i) => (
            <span
              key={i}
              className="text-[10px] px-2 py-0.5 rounded-full bg-[#3B47F6]/15 text-[#7280FF] border border-[#4C58FF]/20"
            >
              {e}
            </span>
          ))}
          {extra > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full theme-dashboard-muted border theme-dashboard-border">
              +{extra} más
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1">
        {brief.deadline ? (
          <p className="theme-dashboard-muted text-[10px]">
            {new Date(brief.deadline).toLocaleDateString('es-CO')}
          </p>
        ) : <span />}
        <button
          onClick={() => onSelect(brief.id)}
          className="text-xs text-[#7280FF] hover:text-[#9AA8FF] transition-colors"
        >
          Ver detalle →
        </button>
      </div>
    </div>
  )
}

export default function BriefsPage() {
  const [tabEstado, setTabEstado] = useState<TabEstado>('')
  const [filtroUrgencia, setFiltroUrgencia] = useState<FiltroUrgencia>('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<Brief | null>(null)
  const [approving, setApproving] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const { briefs, loading, error, setStatus, reload } = useBriefs({
    status: TAB_TO_STATUS[tabEstado],
    urgency: URGENCIA_TO_API[filtroUrgencia],
  })
  const { stats, loading: statsLoading } = useBriefStats(60_000)

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    setDetalle(briefs.find(b => b.id === id) ?? null)
  }, [briefs])

  const closePanel = () => { setSelectedId(null); setDetalle(null) }

  const handleAprobar = async () => {
    if (!detalle) return
    setApproving(true)
    try {
      await setStatus(detalle.id, 'APPROVED')
      setDetalle(prev => prev ? { ...prev, status: 'APPROVED' } : prev)
    } catch { /* noop */ } finally { setApproving(false) }
  }

  const handleRegenerar = async () => {
    if (!detalle) return
    setRegenerating(true)
    try {
      await reload()
      setDetalle(prev => {
        if (!prev) return prev
        const refreshed = briefs.find(b => b.id === prev.id)
        return refreshed ?? prev
      })
    } catch { /* noop */ } finally { setRegenerating(false) }
  }

  const handleConvertir = async () => {
    if (!detalle) return
    try {
      await setStatus(detalle.id, 'CONVERTED')
      setDetalle(prev => prev ? { ...prev, status: 'CONVERTED' } : prev)
    } catch { /* noop */ }
  }

  const handleCopy = () => {
    if (!detalle?.suggestedReply) return
    navigator.clipboard.writeText(detalle.suggestedReply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="theme-dashboard-text text-2xl font-bold">WhatsApp Briefs</h1>
        <p className="theme-dashboard-muted text-sm mt-1">
          Briefs generados automáticamente desde conversaciones de WhatsApp
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Recibidos hoy" value={stats?.receivedToday ?? 0} loading={statsLoading} />
        <KpiCard label="Pendientes de revisión" value={stats?.pendingReview ?? 0} loading={statsLoading} />
        <KpiCard label="Aprobados este mes" value={stats?.approvedThisMonth ?? 0} loading={statsLoading} accent="text-blue-400" />
        <KpiCard
          label="Urgente sin aprobar"
          value={stats?.urgentUnapproved ?? 0}
          loading={statsLoading}
          accent={(stats?.urgentUnapproved ?? 0) > 0 ? 'text-red-400' : undefined}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tabs estado */}
        <div className="flex rounded-lg overflow-hidden border theme-dashboard-border">
          {(['', 'borrador', 'aprobado', 'convertido'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTabEstado(tab)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                tabEstado === tab
                  ? 'bg-[#3B47F6]/30 theme-dashboard-text'
                  : 'theme-dashboard-muted hover:text-[var(--dashboard-text)]'
              }`}
            >
              {tab === '' ? 'Todos' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Urgencia */}
        <div className="flex gap-2">
          {(['', 'alta', 'media', 'baja'] as const).map(u => {
            const active = filtroUrgencia === u
            const activeClass =
              u === 'alta'  ? 'bg-red-500/20 text-red-400 border-red-500/40' :
              u === 'media' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
              u === 'baja'  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                              'bg-[#3B47F6]/30 theme-dashboard-text border-[#4C58FF]/40'
            return (
              <button
                key={u}
                onClick={() => setFiltroUrgencia(u)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  active
                    ? activeClass
                    : 'border-[var(--dashboard-border)] theme-dashboard-muted hover:text-[var(--dashboard-text)]'
                }`}
              >
                {u === '' ? 'Todas' : u.charAt(0).toUpperCase() + u.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Error al conectar con el servicio de WhatsApp: {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="theme-dashboard-surface rounded-xl border theme-dashboard-border p-4 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : briefs.length === 0 ? (
        <div className="rounded-xl border theme-dashboard-border theme-dashboard-surface p-10 text-center">
          <p className="text-3xl mb-3">💬</p>
          <p className="theme-dashboard-text font-medium">
            {tabEstado || filtroUrgencia ? 'No hay briefs con estos filtros' : 'No hay briefs aún'}
          </p>
          {!tabEstado && !filtroUrgencia && (
            <p className="theme-dashboard-muted text-sm mt-2 max-w-sm mx-auto">
              Aún no hay briefs generados. Los mensajes de WhatsApp aparecerán aquí
              automáticamente cuando el servicio esté activo.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {briefs.map(brief => (
            <BriefCard key={brief.id} brief={brief} onSelect={handleSelect} />
          ))}
        </div>
      )}

      {/* Side panel */}
      {selectedId && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={closePanel}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm md:max-w-md flex flex-col theme-dashboard-sidebar border-l theme-dashboard-border">
            {/* Panel header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b theme-dashboard-border">
              <h2 className="theme-dashboard-text font-semibold text-sm">Detalle del Brief</h2>
              <button
                onClick={closePanel}
                className="theme-dashboard-muted hover:text-[var(--dashboard-text)] text-lg leading-none transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {regenerating ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : detalle ? (
                <>
                  {/* Client info */}
                  <div className="theme-dashboard-surface rounded-lg border theme-dashboard-border p-3">
                    <p className="theme-dashboard-text text-sm font-semibold">{detalle.client.name ?? '—'}</p>
                    <p className="theme-dashboard-muted text-xs">{detalle.client.waId}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${URGENCY_COLOR[detalle.urgency]}`}>
                        {detalle.urgency.toLowerCase()}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOR[detalle.status]}`}>
                        {STATUS_LABEL[detalle.status]}
                      </span>
                    </div>
                  </div>

                  <CollapsibleSection title="Objetivo">
                    <p className="theme-dashboard-text text-sm leading-relaxed">{detalle.objective}</p>
                  </CollapsibleSection>

                  <CollapsibleSection title="Entregables">
                    <ul className="space-y-1.5">
                      {detalle.deliverables.map((e, i) => (
                        <li key={i} className="theme-dashboard-muted text-sm flex items-start gap-2">
                          <span className="text-[#7280FF] mt-0.5 shrink-0">•</span>{e}
                        </li>
                      ))}
                    </ul>
                  </CollapsibleSection>

                  {detalle.references.length > 0 && (
                    <CollapsibleSection title="Referencias" defaultOpen={false}>
                      <ul className="space-y-1.5">
                        {detalle.references.map((r, i) => (
                          <li key={i} className="theme-dashboard-muted text-sm flex items-start gap-2">
                            <span className="text-[#7280FF] mt-0.5 shrink-0">•</span>{r}
                          </li>
                        ))}
                      </ul>
                    </CollapsibleSection>
                  )}

                  <CollapsibleSection title="Tono de marca" defaultOpen={false}>
                    <p className="theme-dashboard-text text-sm">{detalle.tone}</p>
                  </CollapsibleSection>

                  {detalle.pendingQuestions.length > 0 && (
                    <CollapsibleSection title="Pendientes del cliente">
                      <div className="space-y-2">
                        {detalle.pendingQuestions.map((p, i) => (
                          <div key={i} className="rounded-md bg-yellow-500/10 border border-yellow-500/20 px-3 py-2">
                            <p className="text-yellow-400 text-xs leading-relaxed">{p}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}

                  {detalle.suggestedReply && (
                    <CollapsibleSection title="Respuesta sugerida">
                      <div className="relative">
                        <div className="rounded-lg bg-[#1A1F3A]/60 border theme-dashboard-border p-3 pr-16">
                          <p className="theme-dashboard-muted text-xs leading-relaxed whitespace-pre-wrap">
                            {detalle.suggestedReply}
                          </p>
                        </div>
                        <button
                          onClick={handleCopy}
                          className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded border theme-dashboard-border theme-dashboard-muted hover:text-[var(--dashboard-text)] transition-colors"
                        >
                          {copied ? 'Copiado ✓' : 'Copiar'}
                        </button>
                      </div>
                    </CollapsibleSection>
                  )}

                  {detalle.deadline && (
                    <div className="flex items-center gap-2 theme-dashboard-muted text-xs pt-1">
                      <span>Fecha límite:</span>
                      <span className="theme-dashboard-text font-medium">
                        {new Date(detalle.deadline).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <p className="theme-dashboard-muted text-sm">No se pudo cargar el detalle.</p>
              )}
            </div>

            {/* Action buttons */}
            {detalle && (
              <div className="shrink-0 px-5 py-4 border-t theme-dashboard-border space-y-2">
                {(detalle.status === 'DRAFT' || detalle.status === 'PENDING') && (
                  <button
                    onClick={handleAprobar}
                    disabled={approving}
                    className="w-full rounded-lg bg-blue-600/80 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium py-2 transition-colors"
                  >
                    {approving ? 'Aprobando...' : 'Aprobar brief'}
                  </button>
                )}
                <button
                  onClick={handleRegenerar}
                  disabled={regenerating}
                  className="w-full rounded-lg border theme-dashboard-border theme-dashboard-muted hover:text-[var(--dashboard-text)] text-sm py-2 transition-colors disabled:opacity-50"
                >
                  {regenerating ? 'Regenerando...' : 'Regenerar'}
                </button>
                {detalle.status !== 'CONVERTED' && (
                  <button
                    onClick={handleConvertir}
                    className="w-full rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-sm py-2 transition-colors"
                  >
                    Convertir a proyecto
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
