interface TemplateCardProps {
  title: string
  value: string
  hint?: string
  delta?: string
}

export function TemplateCard({ title, value, hint, delta }: TemplateCardProps) {
  const positive = !!delta && !delta.startsWith('-')

  return (
    <article className="rounded-xl border border-[#2F3A5C] bg-[linear-gradient(180deg,#161E35_0%,#131A2E_100%)] p-4 shadow-[0_14px_40px_rgba(2,6,23,0.5)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{title}</p>
        <span className="h-8 w-8 rounded-full bg-[#4C58FF]/20 ring-1 ring-[#4C58FF]/40" />
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {delta && (
        <p className={`mt-2 text-xs font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {delta} desde el periodo anterior
        </p>
      )}
    </article>
  )
}
