'use client'

import { motion } from 'framer-motion'
import { PublicNavbar } from '@/components/public/PublicNavbar'

type ProjectCase = {
  name: string
  problem: string
  result: string
  tone: string
  span: string
}

const projectCases: ProjectCase[] = [
  {
    name: 'TechCo Reposition',
    problem:
      'Su marca vendia servicios complejos con mensajes fragmentados y bajo cierre comercial.',
    result:
      'Se consolido una narrativa unica, se rediseno el funnel y la conversion de propuestas subio 38% en 10 semanas.',
    tone: 'from-cyan-300/20 via-transparent to-transparent',
    span: 'lg:col-span-7 lg:row-span-2',
  },
  {
    name: 'Sabor Digital Sprint',
    problem:
      'El negocio publicaba contenido diario sin estrategia, sin ritmo de campanas y con retrabajo constante.',
    result:
      'Se instalo un sistema editorial mensual y la produccion bajo a la mitad del esfuerzo con mayor consistencia visual.',
    tone: 'from-amber-200/20 via-transparent to-transparent',
    span: 'lg:col-span-5',
  },
  {
    name: 'LegalFlow Launch',
    problem:
      'Tenian trafico pero pocas consultas calificadas por una propuesta visual sin jerarquia comercial.',
    result:
      'Nuevo recorrido de contenido y diseno de confianza: +64% en formularios de contacto y mejores reuniones de venta.',
    tone: 'from-violet-200/20 via-transparent to-transparent',
    span: 'lg:col-span-5',
  },
  {
    name: 'Nexa Product Story',
    problem:
      'El equipo interno trabajaba por urgencias, sin un marco claro para decidir que construir primero.',
    result:
      'Se definio arquitectura de mensajes y roadmap de piezas, reduciendo ciclos de aprobacion de 9 dias a 3 dias.',
    tone: 'from-emerald-200/20 via-transparent to-transparent',
    span: 'lg:col-span-7',
  },
]

const reveal = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

export default function ProyectosPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-slate-100">
      <PublicNavbar />

      <section className="relative mx-auto w-full max-w-7xl px-6 pb-10 pt-14 sm:px-10 lg:px-16 lg:pb-12 lg:pt-16">
        <motion.p
          initial="hidden"
          animate="show"
          custom={0.05}
          variants={reveal}
          className="inline-flex rounded-full border border-white/20 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-white/80"
        >
          Proyectos
        </motion.p>

        <motion.h1
          initial="hidden"
          animate="show"
          custom={0.12}
          variants={reveal}
          className="mt-6 max-w-5xl text-4xl font-semibold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-[5rem]"
        >
          Casos reales donde la ejecucion se convirtio en sistema.
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          custom={0.2}
          variants={reveal}
          className="mt-7 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg"
        >
          Cada proyecto parte de un problema de negocio concreto y termina en una operacion creativa mas clara, mas rapida y mas rentable.
        </motion.p>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-24 sm:px-10 lg:px-16 lg:pb-32">
        <div className="grid auto-rows-[minmax(210px,_auto)] gap-5 lg:grid-cols-12">
          {projectCases.map((item, index) => (
            <motion.article
              key={item.name}
              initial="hidden"
              whileInView="show"
              custom={0.05 * index}
              variants={reveal}
              viewport={{ once: true, amount: 0.3 }}
              className={[
                'group relative overflow-hidden rounded-3xl border border-white/10 bg-[#111B31]/80 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.2)] transition-all duration-500',
                'hover:-translate-y-1.5 hover:scale-[1.02] hover:border-white/30 hover:shadow-[0_24px_60px_rgba(2,8,23,0.55)]',
                item.span,
              ].join(' ')}
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.tone} opacity-80`} />
              <div className="relative z-10">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Caso real</p>
                <h2 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  {item.name}
                </h2>

                <div className="mt-8 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Problema</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">{item.problem}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Resultado</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">{item.result}</p>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  )
}
