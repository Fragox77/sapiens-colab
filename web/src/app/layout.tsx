import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SAPIENS COLAB — Agencia creativa colaborativa',
  description: 'Conectamos empresas locales con talento freelance especializado en Bucaramanga.',
  openGraph: {
    title: 'SAPIENS COLAB',
    description: 'Diseño que piensa, colabora y entrega.',
    url: 'https://sapienscolab.com',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
