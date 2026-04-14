import Link from 'next/link'
import type { Role, User } from '@/types'

const navByRole: Record<Role, Array<{ href: string; label: string }>> = {
  cliente: [
    { href: '/cliente', label: 'Proyectos' },
    { href: '/cliente/nuevo', label: 'Nuevo pedido' },
  ],
  disenador: [
    { href: '/disenador', label: 'Produccion' },
    { href: '/disenador/financiero', label: 'Finanzas' },
    { href: '/disenador/perfil', label: 'Perfil' },
  ],
  admin: [
    { href: '/admin', label: 'Dashboard' },
    { href: '/dashboard/crm', label: 'CRM Leads' },
    { href: '/admin/proyectos', label: 'Proyectos' },
    { href: '/admin/financiero', label: 'Finanzas' },
    { href: '/admin/postulaciones', label: 'Postulaciones' },
    { href: '/admin/planes', label: 'Planes' },
  ],
}

interface SidebarProps {
  user: User
  pathname: string
  onSignOut: () => void
}

export default function Sidebar({ user, pathname, onSignOut }: SidebarProps) {
  const items = navByRole[user.role] || []

  return (
    <aside className="theme-dashboard-sidebar relative w-64 border-r backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_-20%_0%,rgba(79,70,229,0.18),transparent_45%)]" />
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="block">
          <p className="theme-dashboard-muted text-xs uppercase tracking-[0.25em]">Sapiens</p>
          <p className="theme-dashboard-text text-sm font-bold">Colab Platform</p>
        </Link>
      </div>

      <nav className="relative z-10 px-3 py-4 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-[#3B47F6]/20 theme-dashboard-text border border-[#4C58FF]/40'
                  : 'theme-dashboard-muted nav-hover hover:text-[var(--dashboard-text)] border border-transparent'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#7280FF]' : 'bg-slate-500'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="theme-dashboard-surface absolute bottom-0 w-64 border-t theme-dashboard-border px-4 py-4">
        <p className="theme-dashboard-text text-sm font-semibold truncate">{user.name}</p>
        <p className="theme-dashboard-muted text-xs capitalize mb-3">{user.role}</p>
        <button
          onClick={onSignOut}
          className="theme-dashboard-muted text-xs hover:text-[var(--dashboard-text)]"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
