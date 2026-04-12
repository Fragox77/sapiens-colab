'use client'

import { motion } from 'framer-motion'

const metrics = [
  { value: '3x', label: 'mas velocidad de ejecucion' },
  { value: '+42', label: 'proyectos activos acompanados' },
  { value: '68%', label: 'mejora media en tiempos de salida' },
  { value: '92%', label: 'clientes que renuevan ciclo' },
]

export function ResultsSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-28 pt-24 sm:px-10 lg:px-16 lg:pb-32 lg:pt-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Resultados</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
          Cuando hay sistema, el crecimiento deja de depender del azar.
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Medimos avance por impacto operacional y comercial. Menos retrabajo, mas foco y mejor velocidad de salida al mercado.
        </p>
      </motion.div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.article
            key={metric.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <p className="text-4xl font-semibold tracking-tight text-white">{metric.value}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{metric.label}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
