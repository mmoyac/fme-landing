'use client';
// Rebuild: 2026-02-23 - Fix Server Actions cache

import { useState, FormEvent } from 'react';
import { useCart } from '@/context/CartContext';
import { crearPedido } from '@/lib/api/pedidos'; // Import new function
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MercadoPagoBrick from '@/components/MercadoPagoBrick';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);
  const [numeroPedido, setNumeroPedido] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<'mercadopago' | 'coordinado'>('mercadopago');
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_apellido: '',
    cliente_email: '',
    cliente_telefono: '',
    direccion_entrega: '',
    comuna: '',
    notas: ''
  });

  const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Crear Pedido
      const pedidoData: any = {
        ...formData,
        items: cart.map(item => ({
          sku: item.sku,
          cantidad: item.cantidad
        }))
      };

      // Asignar medio de pago solo si eligió Mercado Pago
      if (metodoPago === 'mercadopago') {
        pedidoData.medio_pago_codigo = 'MERCADOPAGO';
      }
      // Si eligió coordinado, no enviar medio_pago_codigo (se asignará después)

      const confirmacion = await crearPedido(pedidoData);
      setConfirmedOrderId(confirmacion.pedido_id);
      setNumeroPedido(confirmacion.numero_pedido);

      // Si eligió pago coordinado (sin pasarela), redirigir directamente
      if (metodoPago === 'coordinado') {
        clearCart();
        router.push(`/checkout/pending?pedido=${confirmacion.numero_pedido}&tipo=coordinado`);
        return;
      }

      // Si eligió Mercado Pago, mostrar el brick
      setLoading(false);

    } catch (error: any) {
      alert(error.message || 'Error al procesar el pedido');
      console.error(error);
      setLoading(false);
    }
  }

  const handlePaymentComplete = (result: any) => {
    console.log("Pago completado (RAW):", result);
    console.log("Status:", result.status);
    console.log("Detail:", result.status_detail);
    if (result.status === 'approved') {
      clearCart();
      router.push('/checkout/success');
      // Opcional: pasar params del resultado
    } else {
      // Manejar otros estados (pending, rejected)
      if (result.status === 'in_process' || result.status === 'pending') {
        clearCart();
        router.push('/checkout/pending');
      } else {
        alert('El pago no fue aprobado. Por favor intente nuevamente.');
      }
    }
  };

  const handlePaymentError = (error: any) => {
    console.error("Error en pago:", error);
    alert("Hubo un error al procesar el pago. Por favor revise sus datos.");
  };

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-slate-900">
        <Header />
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Carrito Vacío</h1>
            <p className="text-gray-400 mb-8">No tienes productos en tu carrito</p>
            <a
              href="/#productos"
              className="inline-block bg-primary hover:bg-primary-dark text-slate-900 font-semibold px-8 py-3 rounded-lg"
            >
              Ver Productos
            </a>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900">
      <Header />

      <div className="container mx-auto px-4 py-20">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Finalizar Pedido</h1>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Datos de Contacto</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cliente_nombre}
                    onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={formData.cliente_apellido}
                    onChange={(e) => setFormData({ ...formData, cliente_apellido: e.target.value })}
                    className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.cliente_email}
                  onChange={(e) => setFormData({ ...formData, cliente_email: e.target.value })}
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.cliente_telefono}
                  onChange={(e) => setFormData({ ...formData, cliente_telefono: e.target.value })}
                  placeholder="+56 9 1234 5678"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Dirección de Entrega *
                </label>
                <input
                  type="text"
                  required
                  value={formData.direccion_entrega}
                  onChange={(e) => setFormData({ ...formData, direccion_entrega: e.target.value })}
                  placeholder="Calle, Número, Depto/Casa"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Comuna
                </label>
                <input
                  type="text"
                  value={formData.comuna}
                  onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                  placeholder="Ej: Santiago Centro"
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notas adicionales (opcional)
                </label>
                <textarea
                  rows={3}
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Instrucciones especiales, preferencia de horario, etc."
                  className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-primary focus:outline-none"
                />
              </div>

              {/* Selector de método de pago */}
              <div className="border-t border-slate-700 pt-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  ¿Cómo deseas realizar el pago?
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-4 border-2 border-slate-600 rounded-lg cursor-pointer hover:border-primary transition-colors bg-slate-700">
                    <input
                      type="radio"
                      name="metodoPago"
                      value="mercadopago"
                      checked={metodoPago === 'mercadopago'}
                      onChange={(e) => setMetodoPago(e.target.value as 'mercadopago')}
                      className="mt-1 mr-3 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white flex items-center gap-2">
                        💳 Pagar ahora con Mercado Pago
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Recomendado</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Paga de forma segura con tarjetas de crédito/débito. Tu pedido quedará confirmado y pagado.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start p-4 border-2 border-slate-600 rounded-lg cursor-pointer hover:border-primary transition-colors bg-slate-700">
                    <input
                      type="radio"
                      name="metodoPago"
                      value="coordinado"
                      checked={metodoPago === 'coordinado'}
                      onChange={(e) => setMetodoPago(e.target.value as 'coordinado')}
                      className="mt-1 mr-3 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        📞 Solicitar pedido sin pagar ahora
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Recibirás tu número de pedido y te contactaremos para coordinar pago y entrega.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Procesando...' : metodoPago === 'mercadopago' ? 'Confirmar y Pagar' : 'Enviar Pedido'}
              </button>
            </form>

            {confirmedOrderId && metodoPago === 'mercadopago' && (
              <div className="mt-8 pt-8 border-t border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">Realizar Pago</h3>
                <p className="text-gray-400 mb-4">
                  Pedido <span className="font-semibold text-primary">#{numeroPedido}</span> creado exitosamente.
                  Completa el pago para confirmar tu pedido.
                </p>
                <MercadoPagoBrick
                  amount={total}
                  externalReference={String(confirmedOrderId)}
                  onPaymentComplete={handlePaymentComplete}
                  onPaymentError={handlePaymentError}
                />
              </div>
            )}
          </div>

          {/* Resumen del pedido */}
          <div>
            <div className="bg-slate-800 rounded-lg p-6 sticky top-4">
              <h2 className="text-2xl font-bold text-white mb-6">Resumen del Pedido</h2>

              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.sku} className="flex justify-between items-center text-gray-300">
                    <div>
                      <p className="font-medium text-white">{item.nombre}</p>
                      <p className="text-sm">
                        {item.cantidad} × ${item.precio.toLocaleString('es-CL')}
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      ${(item.precio * item.cantidad).toLocaleString('es-CL')}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between items-center text-2xl font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-primary">${total.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                <p className="text-sm text-gray-300">
                  {metodoPago === 'mercadopago' 
                    ? '💳 Podrás pagar de forma segura con Mercado Pago después de confirmar tus datos.'
                    : '📞 Recibirás un número de pedido y te contactaremos para coordinar pago y entrega.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
