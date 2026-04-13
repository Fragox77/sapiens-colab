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
    { href: '/admin/proyectos', label: 'Proyectos' },
    { href: '/admin/financiero', label: 'Finanzas' },
    { href: '/admin/postulaciones', label: 'Postulaciones' },
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
    <aside className="relative w-64 border-r border-[#2A3352] bg-[linear-gradient(180deg,#0E1324_0%,#090D18_100%)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_-20%_0%,rgba(79,70,229,0.18),transparent_45%)]" />
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/" className="block">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/90">Sapiens</p>
          <p className="text-sm font-semibold text-white">Colab Platform</p>
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
                  ? 'bg-[#3B47F6]/25 text-white border border-[#4C58FF]/40'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white border border-transparent'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[#7280FF]' : 'bg-slate-500'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 w-64 border-t border-white/10 bg-slate-950/65 px-4 py-4">
        <p className="text-sm font-medium text-white truncate">{user.name}</p>
        <p className="text-xs text-slate-400 capitalize mb-3">{user.role}</p>
        <button
          onClick={onSignOut}
          className="text-xs text-slate-300 hover:text-white"
        >
          Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
