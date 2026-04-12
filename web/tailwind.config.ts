import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
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
