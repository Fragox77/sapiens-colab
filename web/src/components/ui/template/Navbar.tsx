interface NavbarProps {
  title?: string
  subtitle?: string
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onMenuToggle?: () => void
}

export default function Navbar({ title = 'Dashboard', subtitle = 'Operacion en tiempo real', theme, onToggleTheme, onMenuToggle }: NavbarProps) {
  return (
    <header className="theme-dashboard-header sticky top-0 z-20 border-b backdrop-blur-xl">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              aria-label="Abrir menú"
              className="md:hidden flex flex-col justify-center gap-[5px] p-1.5 rounded-lg theme-dashboard-muted hover:opacity-80 transition-opacity"
            >
              <span className="block w-5 h-[2px] bg-current rounded-full" />
              <span className="block w-5 h-[2px] bg-current rounded-full" />
              <span className="block w-5 h-[2px] bg-current rounded-full" />
            </button>
          )}
          <div>
            <h1 className="theme-dashboard-text text-xl font-extrabold">{title}</h1>
            <p className="theme-dashboard-muted text-xs">{subtitle}</p>
          </div>
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
