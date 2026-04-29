'use client'

import { FormEvent, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { quotesApi } from '@/lib/api'
import type {
  Complexity,
  QuoteCreationResponse,
  ServiceType,
  Urgency,
} from '@/types'
import { PublicNavbar } from '@/components/public/PublicNavbar'

const services: Array<{ value: ServiceType; label: string }> = [
  { value: 'branding', label: 'Identidad de marca' },
  { value: 'piezas', label: 'Piezas y materiales' },
  { value: 'video-motion', label: 'Video y motion' },
  { value: 'fotografia', label: 'Fotografia de producto' },
  { value: 'social-media', label: 'Social media' },
  { value: 'web', label: 'Desarrollo web' },
  { value: 'campana', label: 'Campana 360' },
]

const complexities: Array<{ value: Complexity; label: string }> = [
  { value: 'basica', label: 'Basica' },
  { value: 'media', label: 'Media' },
  { value: 'avanzada', label: 'Avanzada' },
]

const urgencies: Array<{ value: Urgency; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'prioritario', label: 'Prioritario' },
  { value: 'express', label: 'Express' },
]

// ── PDF ─────────────────────────────────────────────────────────────────────
// Reemplaza con la URL pública del logo en Cloudinary
const SAPIENS_LOGO_URL =
  'https://res.cloudinary.com/sapiens-colab/image/upload/v1/brand/logo-sapiens-colab.png'

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function CotizarPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [serviceType, setServiceType] = useState<ServiceType>('branding')
  const [complexity, setComplexity] = useState<Complexity>('media')
  const [urgency, setUrgency] = useState<Urgency>('normal')
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [quote, setQuote] = useState<QuoteCreationResponse['data'] | null>(null)

  const selectedLabel = useMemo(
    () => services.find((s) => s.value === serviceType)?.label ?? 'Servicio',
    [serviceType]
  )

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const result = await quotesApi.create({
        client: {
          name,
          email,
          company,
        },
        serviceType,
        complexity,
        urgency,
      })
      setQuote(result.data)
      setSuccessMessage(result.message)
    } catch (err) {
      setQuote(null)
      setError(err instanceof Error ? err.message : 'No fue posible generar la cotizacion')
    } finally {
      setLoading(false)
    }
  }

  async function downloadPdf() {
    if (!quote) return
    setPdfLoading(true)
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const W = doc.internal.pageSize.getWidth()
      const M = 20 // margen horizontal

      // ── Header oscuro ────────────────────────────────────────────────────
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, W, 38, 'F')

      // Logo — intenta cargar desde Cloudinary; si falla, muestra texto
      let logoLoaded = false
      try {
        const resp = await fetch(SAPIENS_LOGO_URL)
        if (resp.ok) {
          const blob = await resp.blob()
          const b64 = await new Promise<string>((res) => {
            const reader = new FileReader()
            reader.onload = () => res(reader.result as string)
            reader.readAsDataURL(blob)
          })
          doc.addImage(b64, 'PNG', M, 9, 38, 18)
          logoLoaded = true
        }
      } catch { /* continúa sin logo */ }

      if (!logoLoaded) {
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(13)
        doc.setFont('helvetica', 'bold')
        doc.text('SAPIENS COLAB', M, 23)
      }

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('COTIZACIÓN', W - M, 23, { align: 'right' })

      // ── Fila de meta (ref + fechas) ──────────────────────────────────────
      let y = 50
      const issueDate = new Date()
      const expiryDate = new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000)
      const fmtDate = (d: Date) =>
        d.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })

      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      doc.text(`Ref: ${quote.quoteId}`, M, y)
      doc.text(`Emitida: ${fmtDate(issueDate)}`, W / 2, y, { align: 'center' })
      doc.text(`Válida hasta: ${fmtDate(expiryDate)}`, W - M, y, { align: 'right' })

      y += 6
      doc.setDrawColor(6, 182, 212)
      doc.setLineWidth(0.4)
      doc.line(M, y, W - M, y)

      // ── Bloque cliente ───────────────────────────────────────────────────
      y += 10
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text('CLIENTE', M, y)

      y += 5
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text(name, M, y)

      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(100, 116, 139)
      if (company) { doc.text(company, M, y); y += 4 }
      doc.text(email, M, y)

      // ── Tabla servicio ───────────────────────────────────────────────────
      y += 12
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text('DETALLE DEL SERVICIO', M, y)
      y += 4

      const complexityLabel = complexities.find((c) => c.value === complexity)?.label ?? complexity
      const urgencyLabel = urgencies.find((u) => u.value === urgency)?.label ?? urgency

      autoTable(doc, {
        startY: y,
        head: [['Servicio', 'Complejidad', 'Urgencia']],
        body: [[selectedLabel, complexityLabel, urgencyLabel]],
        margin: { left: M, right: M },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
        theme: 'grid',
      })

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

      // ── Tabla precios ────────────────────────────────────────────────────
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text('RESUMEN ECONÓMICO', M, y)
      y += 4

      autoTable(doc, {
        startY: y,
        head: [['Concepto', 'Valor (COP)']],
        body: [
          ['Subtotal (sin IVA)', formatMoney(quote.pricing.subtotal)],
          ['IVA (19%)', formatMoney(quote.pricing.iva)],
          ['Total', formatMoney(quote.pricing.total)],
          ['Anticipo requerido (50%)', formatMoney(quote.pricing.anticipo)],
          ['Saldo al cierre', formatMoney(quote.pricing.balance)],
        ],
        margin: { left: M, right: M },
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        didParseCell: (data) => {
          if (data.row.index === 2) {
            data.cell.styles.fillColor = [236, 254, 255]
            data.cell.styles.textColor = [8, 145, 178]
          }
        },
        theme: 'grid',
      })

      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 14

      // ── Pie de página ────────────────────────────────────────────────────
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text(
        'Esta cotización es válida por 15 días desde la fecha de emisión. Precios en COP con IVA incluido.',
        W / 2, y, { align: 'center' }
      )
      y += 4.5
      doc.text('sapiens-colab.com · hola@sapiens-colab.com', W / 2, y, { align: 'center' })

      doc.save(`cotizacion-sapiens-${quote.quoteId}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-100">
      <PublicNavbar />

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-14 sm:px-10 lg:grid-cols-[1fr_1fr] lg:px-16 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Cotizador</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            Cotiza tu proyecto
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Captura tus datos y selecciona servicio, complejidad y urgencia. Tu lead quedara registrado en el CRM para gestion comercial.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-400">Nombre</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Tu nombre"
                  className="w-full rounded-xl border border-white/15 bg-[#111B31] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-400">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nombre@empresa.com"
                  className="w-full rounded-xl border border-white/15 bg-[#111B31] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-400">Empresa</span>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nombre de empresa"
                  className="w-full rounded-xl border border-white/15 bg-[#111B31] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-400">Servicio</span>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="w-full rounded-xl border border-white/15 bg-[#111B31] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
              >
                {services.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-400">Complejidad</span>
                <select
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value as Complexity)}
                  className="w-full rounded-xl border border-white/15 bg-[#111B31] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
                >
                  {complexities.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-slate-400">Urgencia</span>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as Urgency)}
                  className="w-full rounded-xl border border-white/15 bg-[#111B31] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60"
                >
                  {urgencies.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Generando cotizacion...' : 'Enviar al pipeline CRM'}
            </button>

            {error && (
              <p className="rounded-xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            )}

            {successMessage && (
              <p className="rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </p>
            )}
          </form>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0 p-6 sm:p-8"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Resultado</p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">Estimado para {selectedLabel}</h2>

          {!quote && !loading && !error && (
            <p className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-relaxed text-slate-300">
              Completa el formulario y haz clic en calcular para ver total, IVA y utilidad estimada.
            </p>
          )}

          {loading && (
            <div className="mt-6 space-y-3">
              <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
              <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
              <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
            </div>
          )}

          {quote && !loading && (
            <div className="mt-6 grid gap-3">
              <ResultRow label="Total" value={formatMoney(quote.pricing.total)} highlight />
              <ResultRow label="IVA" value={formatMoney(quote.pricing.iva)} />
              <ResultRow label="Utilidad" value={formatMoney(quote.pricing.commission)} />
              <ResultRow label="Lead score" value={`${quote.leadScore}/100`} />
              <ResultRow label="Etapa CRM" value={quote.stage || 'NUEVO'} />
              <ResultRow label="Estado" value={quote.project ? quote.project.status : 'Sin proyecto'} />
              <ResultRow label="Referencia" value={quote.project ? quote.project.title : `Lead ${quote.quoteId}`} />

              <button
                type="button"
                onClick={downloadPdf}
                disabled={pdfLoading}
                className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-5 py-3.5 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pdfLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-cyan-300/40 border-t-cyan-300" />
                    Generando PDF...
                  </>
                ) : (
                  'Descargar cotización PDF'
                )}
              </button>
            </div>
          )}
        </motion.aside>
      </section>
    </main>
  )
}

function ResultRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={[
        'rounded-2xl border px-5 py-4',
        highlight
          ? 'border-cyan-200/40 bg-cyan-300/10'
          : 'border-white/10 bg-white/5',
      ].join(' ')}
    >
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  )
}
