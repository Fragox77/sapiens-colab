import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // CRM Kanban column accent gradients — used via ${accent} interpolation
    'from-cyan-500/20',    'to-cyan-400/5',
    'from-blue-500/20',    'to-blue-400/5',
    'from-violet-500/20',  'to-violet-400/5',
    'from-amber-500/20',   'to-amber-400/5',
    'from-emerald-500/20', 'to-emerald-400/5',
    'from-rose-500/20',    'to-rose-400/5',
  ],
  theme: {
    extend: {
      colors: {
        cobalt: {
          DEFAULT: '#1E1B4B',
          deep:    '#13112e',
          mid:     '#2d2870',
        },
        coral: {
          DEFAULT: '#FF4D6D',
          light:   '#ff7a94',
          dark:    '#e63355',
        },
        platinum: '#F5F7FA',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
