'use client'

import { motion } from 'framer-motion'

const sectionStagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

const itemReveal = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
}

const steps = [
  {
    title: 'Diagnostico y claridad',
    text: 'Leemos el negocio, detectamos fricciones y definimos la direccion de crecimiento.',
  },
  {
    title: 'Sistema creativo',
    text: 'Unimos diseno, contenido y tecnologia en un flujo semanal con decisiones medibles.',
  },
  {
    title: 'Ejecucion con criterio',
    text: 'Entregamos activos que se conectan entre si y mueven objetivos de negocio reales.',
  },
]

export function HowWeWorkSection() {
  return (
    <section id="como-trabajamos" className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-10 lg:px-16 lg:py-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Como trabajamos</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Pasamos de tareas sueltas a un sistema de ejecucion continuo.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          No improvisamos entregables. Construimos una operacion creativa donde cada pieza responde a una meta, a un ritmo y a un resultado.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        variants={sectionStagger}
        className="mt-12 grid gap-5 md:grid-cols-3"
      >
        {steps.map((step, index) => (
          <motion.article
            key={step.title}
            variants={itemReveal}
            transition={{ delay: index * 0.03 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_8px_30px_rgba(2,8,23,0.2)] transition-shadow duration-300 hover:border-white/20 hover:shadow-[0_18px_45px_rgba(2,8,23,0.38)] sm:p-7"
          >
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">0{index + 1}</p>
            <h3 className="mt-4 text-2xl font-semibold leading-tight text-white">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">{step.text}</p>
          </motion.article>
        ))}
      </motion.div>
    </section>
  )
}
