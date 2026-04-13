'use client'

import { motion } from 'framer-motion'

const cardsStagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
}

const cardReveal = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
}

const pillars = [
  {
    title: 'Direccion estrategica',
    text: 'Antes de disenar, alineamos mensaje, mercado y propuesta de valor.',
  },
  {
    title: 'Operacion visible',
    text: 'Tablero de avance, prioridades claras y trazabilidad de decisiones.',
  },
  {
    title: 'Equipo expandible',
    text: 'Talento senior por especialidad sin inflar estructura fija.',
  },
  {
    title: 'Pensamiento de negocio',
    text: 'Cada entregable se conecta con conversion, posicionamiento o retencion.',
  },
]

export function DifferentiatorSection() {
  return (
    <section id="diferenciador" className="mx-auto w-full max-w-7xl px-6 py-24 sm:px-10 lg:px-16 lg:py-28">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="grid gap-10 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/8 to-white/0 p-8 backdrop-blur-xl lg:grid-cols-[0.95fr_1.05fr] lg:p-12"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Diferenciador</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            No vendemos diseno.
            <br />
            Construimos ventaja competitiva.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Donde otros entregan piezas bonitas, nosotros integramos una arquitectura creativa que acelera decisiones y mejora resultados.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.35 }}
          variants={cardsStagger}
          className="grid gap-4 sm:grid-cols-2"
        >
          {pillars.map((pillar, index) => (
            <motion.article
              key={pillar.title}
              variants={cardReveal}
              transition={{ delay: index * 0.02 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="rounded-2xl border border-white/10 bg-[#0C1326]/70 p-5 shadow-[0_8px_24px_rgba(2,8,23,0.2)] transition-shadow duration-300 hover:border-white/20 hover:shadow-[0_16px_40px_rgba(2,8,23,0.35)]"
            >
              <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{pillar.text}</p>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
