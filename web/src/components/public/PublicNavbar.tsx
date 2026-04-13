'use client'

import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'

const links = [
  { href: '/', label: 'Inicio' },
  { href: '/#como-trabajamos', label: 'Como trabajamos' },
  { href: '/#diferenciador', label: 'Diferenciador' },
  { href: '/#resultados', label: 'Resultados' },
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/cotizar', label: 'Cotizar' },
]

export function PublicNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0F172A]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3 sm:px-10 lg:px-16">
        <Link href="/" className="text-sm font-semibold tracking-[0.12em] text-white/90">
          SAPIENS COLAB
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs uppercase tracking-[0.14em] text-slate-300 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/login"
          className="hidden items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:border-white/40 hover:bg-white/15 md:inline-flex"
        >
          Entrar a plataforma
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-slate-100 transition hover:border-white/40 md:hidden"
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={[
                'absolute left-0 top-0 h-0.5 w-5 bg-current transition-transform duration-300',
                open ? 'translate-y-[6px] rotate-45' : '',
              ].join(' ')}
            />
            <span
              className={[
                'absolute left-0 top-[6px] h-0.5 w-5 bg-current transition-opacity duration-300',
                open ? 'opacity-0' : 'opacity-100',
              ].join(' ')}
            />
            <span
              className={[
                'absolute left-0 top-3 h-0.5 w-5 bg-current transition-transform duration-300',
                open ? '-translate-y-[6px] -rotate-45' : '',
              ].join(' ')}
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 px-6 py-3 md:hidden sm:px-10"
          >
            <nav className="flex flex-col gap-2">
              {links.map((link) => (
                <Link
                  key={`mobile-${link.href}`}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-xs uppercase tracking-[0.14em] text-slate-200 transition hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-1 inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white"
              >
                Entrar a plataforma
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
