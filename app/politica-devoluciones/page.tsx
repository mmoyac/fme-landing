import type { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Política de Devoluciones — Masas Estación',
  description: 'Conoce nuestra política de devoluciones, cambios y reembolsos.',
}

export default function PoliticaDevoluciones() {
  return (
    <main className="min-h-screen bg-slate-900">
      <Header />

      <section className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <nav className="mb-8 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-primary transition">Inicio</Link>
            <span>/</span>
            <span className="text-white">Política de Devoluciones</span>
          </nav>

          <h1 className="text-4xl font-bold text-white mb-8">Política de Devoluciones</h1>

          <div className="prose prose-invert max-w-none space-y-8 text-gray-300">

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">1. Plazo para devoluciones</h2>
              <p>
                Aceptamos devoluciones dentro de las <strong className="text-white">24 horas</strong> siguientes
                a la recepción del pedido, siempre que el producto presente alguno de los problemas descritos
                en esta política. Dado que comercializamos productos alimenticios frescos, este plazo es
                estricto para garantizar la inocuidad de los alimentos.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">2. Motivos válidos para devolución</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Producto en mal estado o deteriorado al momento de la entrega.</li>
                <li>Producto incorrecto (no corresponde a lo pedido).</li>
                <li>Producto con daño visible en el embalaje que afecte su calidad.</li>
                <li>Cantidad incorrecta en el pedido.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">3. Proceso de devolución</h2>
              <p>Para iniciar una devolución, debes:</p>
              <ol className="list-decimal pl-6 space-y-2 mt-2">
                <li>Contactarnos dentro del plazo indicado por WhatsApp o correo electrónico.</li>
                <li>Indicar el número de pedido o comprobante de compra.</li>
                <li>Describir el problema y, si es posible, adjuntar fotografías del producto.</li>
                <li>Nuestro equipo evaluará tu caso y te responderá dentro de las 24 horas hábiles.</li>
              </ol>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">4. Opciones de resolución</h2>
              <p>Una vez aprobada la devolución, ofrecemos las siguientes alternativas:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong className="text-white">Reembolso total</strong> al medio de pago original, procesado dentro de 3 a 5 días hábiles.</li>
                <li><strong className="text-white">Reposición del producto</strong> en el siguiente despacho disponible.</li>
                <li><strong className="text-white">Crédito a favor</strong> para futuras compras.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">5. Productos no sujetos a devolución</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Productos que han sido abiertos o manipulados sin presentar defecto.</li>
                <li>Productos solicitados fuera del plazo de 24 horas.</li>
                <li>Cambios de opinión sin motivo válido relacionado con la calidad del producto.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-3">6. Contacto</h2>
              <p>
                Para iniciar una devolución o ante cualquier consulta, contáctanos a través de
                los canales disponibles en nuestra página principal.
              </p>
            </div>

            <p className="text-sm text-gray-500 pt-4 border-t border-slate-700">
              Última actualización: abril 2026
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
