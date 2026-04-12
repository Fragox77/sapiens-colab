'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      delay,
    },
  }),
}

export default function MarketingHomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0F172A] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%)]" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-24 sm:px-10 lg:px-16 lg:py-32">
        <div className="grid w-full gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <motion.p
              initial="hidden"
              animate="show"
              custom={0.05}
              variants={reveal}
              className="mb-6 inline-flex rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/80"
            >
              SAPIENS COLAB · Sistema creativo de negocio
            </motion.p>

            <motion.h1
              initial="hidden"
              animate="show"
              custom={0.12}
              variants={reveal}
              className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-[5.2rem]"
            >
              Construimos estructura digital que convierte ideas en crecimiento real.
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="show"
              custom={0.2}
              variants={reveal}
              className="mt-8 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg"
            >
              Diseno, contenido y tecnologia conectados en un sistema de ejecucion.
              No entregamos piezas sueltas: construimos claridad estrategica, ritmo operativo y resultados medibles para marcas que quieren escalar con criterio.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="show"
              custom={0.28}
              variants={reveal}
              className="mt-10 flex flex-col gap-4 sm:flex-row"
            >
              <Link
                href="/postulacion"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Cotizar proyecto
              </Link>
              <Link
                href="#proyectos"
                className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10"
              >
                Ver proyectos
              </Link>
            </motion.div>
          </div>

          <motion.aside
            id="proyectos"
            initial="hidden"
            animate="show"
            custom={0.35}
            variants={reveal}
            className="rounded-3xl border border-white/15 bg-white/5 p-7 backdrop-blur-xl sm:p-8"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Enfoque</p>
            <p className="mt-4 text-2xl font-medium leading-tight text-white sm:text-3xl">
              Menos ruido visual.
              <br />
              Mas sistema, mas negocio.
            </p>
            <div className="mt-8 grid gap-4 border-t border-white/10 pt-6 text-sm text-slate-300 sm:grid-cols-3 sm:text-base">
              <div>
                <p className="text-2xl font-semibold text-white">3X</p>
                <p className="mt-1 text-slate-400">mas velocidad de ejecucion</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">+42</p>
                <p className="mt-1 text-slate-400">proyectos activos</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-white">100%</p>
                <p className="mt-1 text-slate-400">alineado a objetivos de negocio</p>
              </div>
            </div>
          </motion.aside>
        </div>
      </section>
    </main>
  )
}
