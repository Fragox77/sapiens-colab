interface NavbarProps {
  title?: string
  subtitle?: string
}

export default function Navbar({ title = 'Dashboard', subtitle = 'Operacion en tiempo real' }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-[#2A3352] bg-[#0E1324]/90 backdrop-blur-xl">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-[#2F3A5C] bg-[#131B31] px-3 py-2 text-xs text-slate-300 sm:block">
            01 May - 31 May
          </div>
          <div className="rounded-full border border-[#36416A] bg-[#141D35] px-3 py-1 text-xs text-slate-200">
            Sistema integrado
          </div>
        </div>
      </div>
    </header>
  )
}
