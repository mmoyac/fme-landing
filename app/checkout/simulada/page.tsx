'use client';

// Pasarela simulada (solo desarrollo; el backend la rechaza en producción). Change add-pasarelas-pago.
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { confirmarPagoSimulado, EstadoPago, obtenerEstadoPago } from '@/lib/api/pagos';

function SimuladaContent() {
  const router = useRouter();
  const pagoId = useSearchParams().get('pago');
  const [pago, setPago] = useState<EstadoPago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (pagoId) obtenerEstadoPago(pagoId).then(setPago).catch(e => setError(e.message));
  }, [pagoId]);

  async function responder(aprobado: boolean) {
    if (!pagoId) return;
    setEnviando(true);
    try {
      await confirmarPagoSimulado(pagoId, aprobado);
      router.push(`/checkout/resultado?pago=${pagoId}`);
    } catch (e: any) {
      setError(e.message);
      setEnviando(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-md mx-auto bg-slate-800 p-8 rounded-2xl border border-amber-500/40 text-center">
        <p className="text-xs uppercase tracking-wide text-amber-400 mb-2">Pasarela de prueba · solo desarrollo</p>
        <h1 className="text-2xl font-bold text-white mb-4">Simular pago</h1>
        {pago && (
          <p className="text-gray-300 mb-6">
            Pedido <span className="text-white font-semibold">{pago.numero_pedido}</span> por{' '}
            <span className="text-white font-semibold">${pago.monto.toLocaleString('es-CL')}</span>
          </p>
        )}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        <div className="flex gap-3 justify-center">
          <button disabled={enviando || !pago} onClick={() => responder(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg disabled:opacity-50">
            Aprobar
          </button>
          <button disabled={enviando || !pago} onClick={() => responder(false)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg disabled:opacity-50">
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SimuladaPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <Header />
      <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center text-white">Cargando...</div>}>
        <SimuladaContent />
      </Suspense>
      <Footer />
    </main>
  );
}
