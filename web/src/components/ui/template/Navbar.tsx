interface NavbarProps {
  title?: string
  subtitle?: string
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export default function Navbar({ title = 'Dashboard', subtitle = 'Operacion en tiempo real', theme, onToggleTheme }: NavbarProps) {
  return (
    <header className="theme-dashboard-header sticky top-0 z-20 border-b backdrop-blur-xl">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="theme-dashboard-text text-xl font-extrabold">{title}</h1>
          <p className="theme-dashboard-muted text-xs">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleTheme}
            className="theme-dashboard-input hidden rounded-xl px-3 py-2 text-xs font-semibold sm:block"
          >
            {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <div className="theme-dashboard-input hidden rounded-xl px-3 py-2 text-xs sm:block">
            01 May - 31 May
          </div>
          <div className="theme-dashboard-input rounded-full px-3 py-1 text-xs">
            Sistema integrado
          </div>
        </div>
      </div>
    </header>
  )
}
