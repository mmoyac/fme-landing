'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const numeroPedido = searchParams.get('numero');
  const total = searchParams.get('total');

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto bg-slate-800 rounded-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-4xl font-bold text-white mb-4">
          ¡Pedido Recibido!
        </h1>

        <p className="text-xl text-gray-300 mb-8">
          Tu pedido ha sido registrado exitosamente
        </p>

        <div className="bg-slate-700 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div>
              <p className="text-sm text-gray-400 mb-1">Número de Pedido</p>
              <p className="text-2xl font-bold text-primary">{numeroPedido}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Total</p>
              <p className="text-2xl font-bold text-white">
                ${Number(total).toLocaleString('es-CL')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-bold text-white mb-4">📋 Próximos Pasos:</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">1.</span>
              <span>Nos pondremos en contacto contigo vía email o teléfono en las próximas horas</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">2.</span>
              <span>Coordinaremos el método de pago (transferencia o efectivo contra entrega)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary font-bold">3.</span>
              <span>Acordaremos la fecha y hora de entrega que mejor te acomode</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-primary text-white font-bold px-8 py-3 rounded-lg shadow-lg transition-all"
          >
            Volver al Inicio
          </Link>
          <Link
            href="/#productos"
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-3 rounded-lg transition-all"
          >
            Ver Más Productos
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-400">
          ¿Tienes dudas? Contáctanos al <span className="text-primary font-semibold">+56 9 1234 5678</span>
        </p>
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <Header />
      <Suspense fallback={
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto bg-slate-800 rounded-lg p-8 text-center">
            <div className="animate-pulse">
              <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-6"></div>
              <div className="h-10 bg-slate-700 rounded mb-4"></div>
              <div className="h-6 bg-slate-700 rounded mb-8"></div>
            </div>
          </div>
        </div>
      }>
        <ConfirmacionContent />
      </Suspense>
      <Footer />
    </main>
  );
}
