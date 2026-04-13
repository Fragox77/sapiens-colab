'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { StatusMetricPoint, WeeklyMetricPoint } from '@/types'

const STATUS_LABEL: Record<string, string> = {
  cotizado: 'Cotizado',
  activo: 'Activo',
  revision: 'Revision',
  ajuste: 'Ajuste',
  aprobado: 'Aprobado',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

function buildSmoothPath(points: Array<{ x: number; y: number }>, tension = 0.28) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2

    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }

  return path
}

export function TemplateOverviewChart({
  data,
  previousData = [],
}: {
  data: WeeklyMetricPoint[]
  previousData?: WeeklyMetricPoint[]
}) {
  const [vista, setVista] = useState<'completo' | 'ultimos8' | 'ultimos4'>('completo')
  const [comparar, setComparar] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [cursorX, setCursorX] = useState<number>(0)
  const [animateIn, setAnimateIn] = useState(false)
  const [showSeries, setShowSeries] = useState({
    barrasIngresos: true,
    lineaIngresos: true,
    lineaCostos: true,
  })
  const chartRef = useRef<HTMLDivElement | null>(null)

  const visibleData = useMemo(() => {
    if (vista === 'ultimos4') return data.slice(-4)
    if (vista === 'ultimos8') return data.slice(-8)
    return data
  }, [data, vista])

  const visiblePreviousData = useMemo(() => {
    if (vista === 'ultimos4') return previousData.slice(-4)
    if (vista === 'ultimos8') return previousData.slice(-8)
    return previousData
  }, [previousData, vista])

  const maxValue = useMemo(
    () => {
      const currentMax = Math.max(...visibleData.map((point) => Math.max(point.revenue, point.cost)), 1)
      if (!comparar || visiblePreviousData.length === 0) return currentMax
      const prevMax = Math.max(...visiblePreviousData.map((point) => Math.max(point.revenue, point.cost)), 1)
      return Math.max(currentMax, prevMax, 1)
    },
    [visibleData, visiblePreviousData, comparar]
  )

  const dataSignature = useMemo(
    () => `${vista}:${comparar}:${visibleData.map((d) => `${d.label}-${d.revenue}-${d.cost}-${d.completedProjects}`).join('|')}:${visiblePreviousData.map((d) => `${d.label}-${d.revenue}-${d.cost}-${d.completedProjects}`).join('|')}`,
    [visibleData, visiblePreviousData, vista, comparar]
  )

  const points = useMemo(() => {
    const len = visibleData.length
    return visibleData.map((point, idx) => {
      const x = len > 1 ? (idx / (len - 1)) * 100 : 50
      const revNorm = point.revenue / maxValue
      const costNorm = point.cost / maxValue
      return {
        ...point,
        x,
        revNorm,
        costNorm,
        revY: 100 - revNorm * 100,
        costY: 100 - costNorm * 100,
      }
    })
  }, [visibleData, maxValue])

  const prevPoints = useMemo(() => {
    const len = visiblePreviousData.length
    return visiblePreviousData.map((point, idx) => {
      const x = len > 1 ? (idx / (len - 1)) * 100 : 50
      const revNorm = point.revenue / maxValue
      const costNorm = point.cost / maxValue
      return {
        ...point,
        x,
        revNorm,
        costNorm,
        revY: 100 - revNorm * 100,
        costY: 100 - costNorm * 100,
      }
    })
  }, [visiblePreviousData, maxValue])

  const revenuePath = useMemo(
    () => buildSmoothPath(points.map((p) => ({ x: p.x, y: p.revY })), 0.26),
    [points]
  )

  const costPath = useMemo(
    () => buildSmoothPath(points.map((p) => ({ x: p.x, y: p.costY })), 0.3),
    [points]
  )

  const prevRevenuePath = useMemo(
    () => buildSmoothPath(prevPoints.map((p) => ({ x: p.x, y: p.revY })), 0.26),
    [prevPoints]
  )

  const prevCostPath = useMemo(
    () => buildSmoothPath(prevPoints.map((p) => ({ x: p.x, y: p.costY })), 0.3),
    [prevPoints]
  )

  const hoveredPoint = activeIndex !== null ? points[activeIndex] : null
  const hoveredPrevPoint = activeIndex !== null ? prevPoints[activeIndex] : null
  const prevPoint = activeIndex !== null && activeIndex > 0 ? points[activeIndex - 1] : null

  const calcPct = (current: number, prev: number | null) => {
    if (!prev || prev <= 0) return null
    return ((current - prev) / prev) * 100
  }

  const revenueDelta = hoveredPoint ? calcPct(hoveredPoint.revenue, prevPoint?.revenue ?? null) : null
  const costDelta = hoveredPoint ? calcPct(hoveredPoint.cost, prevPoint?.cost ?? null) : null

  useEffect(() => {
    setAnimateIn(false)
    const id = window.setTimeout(() => setAnimateIn(true), 40)
    return () => window.clearTimeout(id)
  }, [dataSignature])

  const toggleSeries = (key: 'barrasIngresos' | 'lineaIngresos' | 'lineaCostos') => {
    setShowSeries((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleComparar = () => {
    setComparar((prev) => {
      const next = !prev
      if (next) {
        setVista('completo')
      }
      return next
    })
  }

  const onChartMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const element = chartRef.current
    if (!element || points.length === 0) return

    const rect = element.getBoundingClientRect()
    const raw = event.clientX - rect.left
    const x = Math.max(0, Math.min(raw, rect.width))
    setCursorX(x)

    const ratio = rect.width > 0 ? x / rect.width : 0
    const nearest = Math.round(ratio * (points.length - 1))
    setActiveIndex(Math.max(0, Math.min(nearest, points.length - 1)))
  }

  return (
    <section className="theme-dashboard-card rounded-xl border p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="theme-dashboard-text text-sm font-bold">Resumen</h3>
          <div className="theme-dashboard-muted text-[11px]">Ingresos vs costos</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleComparar}
            className={`rounded-md border px-2 py-1 text-[10px] transition-colors ${comparar ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-200' : 'theme-dashboard-border theme-dashboard-surface text-[color:var(--dashboard-muted)]'}`}
          >
            Comparar
          </button>
          <div className="theme-dashboard-border theme-dashboard-surface inline-flex rounded-md border p-0.5 text-[10px]">
            <button onClick={() => setVista('completo')} className={`rounded px-2 py-1 ${vista === 'completo' ? 'bg-[#4C58FF] text-white' : 'text-slate-400'}`}>Todo</button>
              <span className="group relative inline-flex">
                <button
                  onClick={() => setVista('ultimos8')}
                  disabled={comparar}
                  className={`rounded px-2 py-1 ${vista === 'ultimos8' ? 'bg-[#4C58FF] text-white' : 'text-slate-400'} ${comparar ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  8
                </button>
                {comparar && (
                  <span className="theme-dashboard-border theme-dashboard-surface pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] theme-dashboard-text shadow-lg group-hover:block">
                    Desactivado durante comparación
                  </span>
                )}
              </span>
              <span className="group relative inline-flex">
                <button
                  onClick={() => setVista('ultimos4')}
                  disabled={comparar}
                  className={`rounded px-2 py-1 ${vista === 'ultimos4' ? 'bg-[#4C58FF] text-white' : 'text-slate-400'} ${comparar ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  4
                </button>
                {comparar && (
                  <span className="theme-dashboard-border theme-dashboard-surface pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-[10px] theme-dashboard-text shadow-lg group-hover:block">
                    Desactivado durante comparación
                  </span>
                )}
              </span>
          </div>
        </div>
      </div>

      {visibleData.length === 0 ? (
        <div className="theme-dashboard-border theme-dashboard-surface rounded-lg border border-dashed p-4 text-xs theme-dashboard-muted">
          Sin actividad semanal para este periodo.
        </div>
      ) : (
        <>
          <div
            ref={chartRef}
            className="theme-dashboard-border theme-dashboard-surface-2 relative h-64 overflow-hidden rounded-lg border p-4"
            onMouseMove={onChartMove}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] [background-size:12.5%_25%]" />

            <div className="relative z-10 flex h-full items-end gap-2">
              {points.map((point, idx) => {
                const h = Math.max(point.revNorm * 100, 4)
                return (
                  <div
                    key={point.label}
                    className="group relative flex-1"
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <div className="relative mx-auto h-40 w-full max-w-[22px] rounded-md bg-[#27324E]">
                      {showSeries.barrasIngresos && (
                        <div
                          className="absolute bottom-0 w-full rounded-md bg-gradient-to-t from-[#3B47F6] to-[#7C8BFF] transition-all duration-700"
                          style={{
                            height: `${h}%`,
                            opacity: animateIn ? 1 : 0.15,
                            transform: animateIn ? 'scaleY(1)' : 'scaleY(0.15)',
                            transformOrigin: 'bottom',
                            transitionDelay: `${idx * 45}ms`,
                          }}
                        />
                      )}
                    </div>
                    <p className="theme-dashboard-muted mt-2 text-center text-[10px]">{point.label}</p>
                  </div>
                )
              })}
            </div>

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]">
              <defs>
                <filter id="lineaGlowIngresos" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="lineaGlowCostos" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.1" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {showSeries.lineaIngresos && (
                <path
                  d={revenuePath}
                  fill="none"
                  stroke="#22D3EE"
                  strokeWidth="1.3"
                  filter="url(#lineaGlowIngresos)"
                  pathLength={1}
                  style={{ strokeDasharray: 1, strokeDashoffset: animateIn ? 0 : 1, transition: 'stroke-dashoffset 900ms ease' }}
                />
              )}
              {showSeries.lineaCostos && (
                <path
                  d={costPath}
                  fill="none"
                  stroke="#F472B6"
                  strokeWidth="1.1"
                  strokeDasharray="3 3"
                  filter="url(#lineaGlowCostos)"
                  pathLength={1}
                  style={{ strokeDashoffset: animateIn ? 0 : 1, transition: 'stroke-dashoffset 1000ms ease' }}
                />
              )}

              {comparar && prevPoints.length > 0 && (
                <>
                  {showSeries.lineaIngresos && (
                    <path d={prevRevenuePath} fill="none" stroke="#7DD3FC" strokeWidth="1" strokeDasharray="2.5 2" opacity="0.7" />
                  )}
                  {showSeries.lineaCostos && (
                    <path d={prevCostPath} fill="none" stroke="#C4B5FD" strokeWidth="0.95" strokeDasharray="2.5 2" opacity="0.7" />
                  )}
                </>
              )}

              {hoveredPoint && (
                <>
                  <line x1={hoveredPoint.x} y1="0" x2={hoveredPoint.x} y2="100" stroke="#64748B" strokeWidth="0.35" strokeDasharray="1.5 1.5" />
                  {showSeries.lineaIngresos && (
                    <>
                      <circle cx={hoveredPoint.x} cy={hoveredPoint.revY} r="2.1" fill="#22D3EE" opacity="0.28">
                        <animate attributeName="r" values="1.5;2.7;1.5" dur="1.1s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={hoveredPoint.x} cy={hoveredPoint.revY} r="1.2" fill="#22D3EE" />
                    </>
                  )}
                  {showSeries.lineaCostos && (
                    <>
                      <circle cx={hoveredPoint.x} cy={hoveredPoint.costY} r="2" fill="#F472B6" opacity="0.24">
                        <animate attributeName="r" values="1.4;2.5;1.4" dur="1.1s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={hoveredPoint.x} cy={hoveredPoint.costY} r="1.1" fill="#F472B6" />
                    </>
                  )}
                </>
              )}
            </svg>

            {hoveredPoint && (
              <div
                className="theme-dashboard-border theme-dashboard-surface pointer-events-none absolute top-3 z-20 rounded-lg border px-3 py-2 text-[11px] theme-dashboard-text shadow-lg"
                style={{ left: `clamp(8px, calc(${cursorX}px - 72px), calc(100% - 170px))` }}
              >
                <p className="font-semibold">{hoveredPoint.label}</p>
                <p>Ingresos: ${Math.round(hoveredPoint.revenue).toLocaleString('es-CO')}</p>
                <p>Costos: ${Math.round(hoveredPoint.cost).toLocaleString('es-CO')}</p>
                <p>Completados: {hoveredPoint.completedProjects}</p>
                {comparar && hoveredPrevPoint && (
                  <>
                    <p className="text-cyan-200">Ingresos periodo anterior: ${Math.round(hoveredPrevPoint.revenue).toLocaleString('es-CO')}</p>
                    <p className="text-violet-200">Costos periodo anterior: ${Math.round(hoveredPrevPoint.cost).toLocaleString('es-CO')}</p>
                  </>
                )}
                {revenueDelta !== null && (
                  <p className={revenueDelta >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                    Ingresos vs anterior: {revenueDelta >= 0 ? '+' : ''}{Math.round(revenueDelta * 10) / 10}%
                  </p>
                )}
                {costDelta !== null && (
                  <p className={costDelta <= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                    Costos vs anterior: {costDelta >= 0 ? '+' : ''}{Math.round(costDelta * 10) / 10}%
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="theme-dashboard-muted mt-3 flex flex-wrap gap-2 text-[11px]">
            <button
              onClick={() => toggleSeries('barrasIngresos')}
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors ${showSeries.barrasIngresos ? 'border-[#4F5DFF]/50 bg-[#4F5DFF]/15 theme-dashboard-text' : 'theme-dashboard-border theme-dashboard-muted'}`}
            >
              <span className="inline-block h-2.5 w-2.5 rounded bg-[#4F5DFF]" /> Ingresos
            </button>
            <button
              onClick={() => toggleSeries('lineaIngresos')}
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors ${showSeries.lineaIngresos ? 'border-[#22D3EE]/50 bg-[#22D3EE]/10 theme-dashboard-text' : 'theme-dashboard-border theme-dashboard-muted'}`}
            >
              <span className="inline-block h-2.5 w-2.5 rounded bg-[#22D3EE]" /> Línea de ingresos
            </button>
            <button
              onClick={() => toggleSeries('lineaCostos')}
              className={`flex items-center gap-1.5 rounded-md border px-2 py-1 transition-colors ${showSeries.lineaCostos ? 'border-[#F472B6]/50 bg-[#F472B6]/10 theme-dashboard-text' : 'theme-dashboard-border theme-dashboard-muted'}`}
            >
              <span className="inline-block h-2.5 w-2.5 rounded bg-[#F472B6]" /> Línea de costos
            </button>
            {comparar && (
              <span className="flex items-center gap-1.5 rounded-md border border-cyan-300/25 px-2 py-1 text-cyan-200">
                <span className="inline-block h-2.5 w-2.5 rounded bg-cyan-300" /> Periodo anterior superpuesto
              </span>
            )}
          </div>
        </>
      )}
    </section>
  )
}

export function TemplateRadialBreakdown({ data }: { data: StatusMetricPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0)
  const palette = ['#4F5DFF', '#66D36E', '#7C4DFF', '#FF7849', '#22D3EE']

  return (
    <section className="theme-dashboard-card rounded-xl border p-5">
      <h3 className="theme-dashboard-text text-sm font-bold">Distribución operativa</h3>

      {data.length === 0 || total === 0 ? (
        <div className="theme-dashboard-border theme-dashboard-surface rounded-lg border border-dashed p-4 text-xs theme-dashboard-muted">
          Aún no hay datos para visualizar.
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-center">
            <svg width="220" height="220" viewBox="0 0 220 220">
              {data.slice(0, 5).map((item, idx) => {
                const radius = 82 - idx * 14
                const circumference = 2 * Math.PI * radius
                const pct = item.count / total
                const dash = circumference * pct
                return (
                  <g key={item.status} transform="rotate(-90 110 110)">
                    <circle cx="110" cy="110" r={radius} fill="none" stroke="#334155" strokeWidth="8" opacity="0.65" />
                    <circle
                      cx="110"
                      cy="110"
                      r={radius}
                      fill="none"
                      stroke={palette[idx % palette.length]}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${dash} ${circumference}`}
                    />
                  </g>
                )
              })}
            </svg>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {data.slice(0, 6).map((item, idx) => (
              <div key={item.status} className="theme-dashboard-surface flex items-center justify-between rounded-md px-2 py-1.5 theme-dashboard-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette[idx % palette.length] }} />
                  {STATUS_LABEL[item.status] || item.status}
                </span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export function TemplateStatusChart({ data }: { data: StatusMetricPoint[] }) {
  const total = data.reduce((sum, row) => sum + row.count, 0) || 1

  return (
    <section className="theme-dashboard-card rounded-xl border p-5">
      <h3 className="theme-dashboard-text text-sm font-bold">Proyectos por estado</h3>
      {data.length === 0 ? (
        <div className="theme-dashboard-border theme-dashboard-surface mt-5 rounded-lg border border-dashed p-4 text-xs theme-dashboard-muted">
          Aún no hay proyectos en el rango seleccionado.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {data.map((item) => {
            const width = Math.max((item.count / total) * 100, 4)
            return (
              <div key={item.status}>
                <div className="theme-dashboard-muted mb-1 flex justify-between text-xs">
                  <span>{STATUS_LABEL[item.status] || item.status}</span>
                  <span>{item.count}</span>
                </div>
                <div className="theme-dashboard-border h-2 rounded-full border">
                  <div className="h-2 rounded-full bg-gradient-to-r from-[#4C58FF] to-[#22D3EE]" style={{ width: `${width}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function TemplateWeeklyChart({ data }: { data: WeeklyMetricPoint[] }) {
  const maxRevenue = Math.max(...data.map((point) => point.revenue), 1)

  return (
    <section className="theme-dashboard-card rounded-xl border p-5">
      <h3 className="theme-dashboard-text text-sm font-bold">Evolución semanal</h3>
      {data.length === 0 ? (
        <div className="theme-dashboard-border theme-dashboard-surface mt-5 rounded-lg border border-dashed p-4 text-xs theme-dashboard-muted">
          Sin actividad semanal para este periodo.
        </div>
      ) : (
        <div className="mt-4 flex items-end gap-2 overflow-x-auto pb-2">
          {data.map((item) => {
            const h = Math.max((item.revenue / maxRevenue) * 100, 8)
            return (
              <div key={item.label} className="min-w-[56px] text-center">
                <div className="mx-auto h-28 w-7 rounded-md bg-[#27324E] flex items-end">
                  <div className="w-full rounded-md bg-gradient-to-t from-[#4C58FF] to-[#7DD3FC]" style={{ height: `${h}%` }} />
                </div>
                <p className="theme-dashboard-muted mt-2 text-[10px]">{item.label}</p>
                <p className="theme-dashboard-text text-[10px] font-semibold">{item.completedProjects}</p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
