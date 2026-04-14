interface TemplateCardProps {
  title: string
  value: string
  hint?: string
  delta?: string
}

export function TemplateCard({ title, value, hint, delta }: TemplateCardProps) {
  const positive = !!delta && !delta.startsWith('-')

  return (
    <article className="theme-dashboard-card rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <p className="theme-dashboard-muted text-[11px] uppercase tracking-wide">{title}</p>
        <span className="h-8 w-8 rounded-full bg-[var(--dashboard-accent)]/15 ring-1 ring-[var(--dashboard-accent)]/30" />
      </div>
      <p className="theme-dashboard-text mt-3 text-3xl font-extrabold">{value}</p>
      {hint && <p className="theme-dashboard-muted mt-1 text-xs">{hint}</p>}
      {delta && (
        <p className={`mt-2 text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
          {delta} desde el periodo anterior
        </p>
      )}
    </article>
  )
}
