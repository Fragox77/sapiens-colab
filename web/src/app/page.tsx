// Página principal pública — sapienscolab.com
// Por ahora sirve el HTML estático hasta migrar a componentes React

import { redirect } from 'next/navigation'

// Temporal: mientras se migran secciones a componentes
// En producción esto renderizará Hero, Servicios, Cotizador, Portafolio, Postulación
export default function Home() {
  // TODO: Reemplazar con componentes React en Semanas 3-4
  return (
    <main>
      <p style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
        🚧 Sitio público en construcción. 
        Abre <code>sapiens-colab-sitio-publico.html</code> para ver el prototipo.
      </p>
    </main>
  )
}
