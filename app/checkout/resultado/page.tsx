'use client';

// Resultado del pago en línea (change add-pasarelas-pago). El backend redirige aquí al volver de la pasarela.
// Mientras el pago siga en proceso: lee el estado cada 3 s y pide al backend consultar al proveedor cada 15 s,
// durante 5 minutos. El resultado lo decide siempre el backend.
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { consultarPago, EstadoPago, obtenerEstadoPago } from '@/lib/api/pagos';

const LECTURA_MS = 3000;
const CONSULTA_MS = 15000;
const DURACION_MS = 5 * 60 * 1000;

function pesos(n: number) {
  return `$${n.toLocaleString('es-CL')}`;
}

function Icono({ tipo }: { tipo: 'ok' | 'error' | 'espera' | 'revision' }) {
  const estilos = {
    ok: 'bg-green-500/20 text-green-500',
    error: 'bg-red-500/20 text-red-500',
    espera: 'bg-blue-500/20 text-blue-400',
    revision: 'bg-amber-500/20 text-amber-400',
  }[tipo];
  return (
    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${estilos}`}>
      {tipo === 'ok' && (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )}
      {tipo === 'error' && (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {tipo === 'espera' && <div className="w-12 h-12 border-4 border-current border-t-transparent rounded-full animate-spin" />}
      {tipo === 'revision' && <span className="text-5xl font-bold">!</span>}
    </div>
  );
}

function ResultadoContent() {
  const pagoId = useSearchParams().get('pago');
  const [pago, setPago] = useState<EstadoPago | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [agotado, setAgotado] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const inicio = useRef(Date.now());

  const consultar = useCallback(async () => {
    if (!pagoId) return;
    setConsultando(true);
    try {
      setPago(await consultarPago(pagoId));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setConsultando(false);
    }
  }, [pagoId]);

  useEffect(() => {
    if (!pagoId) return;
    let activo = true;
    let ultimaConsulta = Date.now();
    const leer = async () => {
      if (!activo) return;
      try {
        const p = await obtenerEstadoPago(pagoId);
        if (!activo) return;
        setPago(p);
        if (p.estado !== 'INICIADO') return;   // ya hay resultado
        const transcurrido = Date.now() - inicio.current;
        if (transcurrido > DURACION_MS) {
          setAgotado(true);
          return;
        }
        if (Date.now() - ultimaConsulta >= CONSULTA_MS) {
          ultimaConsulta = Date.now();
          const c = await consultarPago(pagoId).catch(() => null);
          if (c && activo) setPago(c);
          if (c && c.estado !== 'INICIADO') return;
        }
        setTimeout(leer, LECTURA_MS);
      } catch (e: any) {
        if (activo) setError(e.message);
      }
    };
    // Al volver del proveedor se consulta de inmediato (el aviso del proveedor puede no haber llegado).
    consultarPago(pagoId).then(p => activo && setPago(p)).catch(() => null).finally(leer);
    return () => { activo = false; };
  }, [pagoId]);

  if (!pagoId) {
    return (
      <Tarjeta tipo="error" titulo="No encontramos tu pago">
        <p className="text-gray-300">Si pagaste, revisa tu correo o contáctanos con tu número de pedido.</p>
      </Tarjeta>
    );
  }
  if (error && !pago) {
    return <Tarjeta tipo="error" titulo="No pudimos obtener el estado del pago"><p className="text-gray-300">{error}</p></Tarjeta>;
  }
  if (!pago) {
    return <Tarjeta tipo="espera" titulo="Verificando tu pago..." />;
  }

  const detalle = (
    <div className="bg-slate-700/50 p-4 rounded-lg mb-8 text-left space-y-1 text-sm">
      {pago.numero_pedido && <Fila k="Pedido" v={pago.numero_pedido} />}
      <Fila k="Monto" v={pesos(pago.monto)} />
      {pago.pasarela && <Fila k="Medio de pago" v={pago.medio ? `${pago.pasarela} · ${pago.medio}` : pago.pasarela} />}
      {pago.id_transaccion && <Fila k="N° de operación" v={pago.id_transaccion} mono />}
    </div>
  );

  switch (pago.estado) {
    case 'CONFIRMADO':
      return (
        <Tarjeta tipo="ok" titulo="¡Pago aprobado!">
          <p className="text-gray-300 mb-6">Tu pedido quedó pagado. Te enviaremos un correo con los detalles.</p>
          {detalle}
        </Tarjeta>
      );
    case 'EN_REVISION':
      return (
        <Tarjeta tipo="revision" titulo="Estamos revisando tu pago">
          <p className="text-gray-300 mb-6">Recibimos tu pago y lo estamos revisando. Te contactaremos a la brevedad.</p>
          {detalle}
        </Tarjeta>
      );
    case 'RECHAZADO':
      return (
        <Tarjeta tipo="error" titulo="El pago no se realizó">
          <p className="text-gray-300 mb-6">{pago.motivo || 'La transacción fue rechazada o cancelada.'}</p>
          {detalle}
          <p className="text-gray-400 text-sm mb-6">Tu pedido quedó registrado: te contactaremos para coordinar el pago.</p>
        </Tarjeta>
      );
    case 'EXPIRADO':
      return (
        <Tarjeta tipo="error" titulo="El tiempo para pagar expiró">
          <p className="text-gray-300 mb-6">
            No recibimos la confirmación del pago a tiempo. Si alcanzaste a pagar, lo registraremos igual y te avisaremos.
          </p>
          {detalle}
        </Tarjeta>
      );
    default:
      return (
        <Tarjeta tipo="espera" titulo={agotado ? 'Tu pago sigue en proceso' : 'Procesando tu pago...'}>
          <p className="text-gray-300 mb-6">
            {agotado
              ? 'Aún no tenemos la confirmación del medio de pago. Te avisaremos por correo apenas se confirme.'
              : 'Estamos confirmando el pago con el medio de pago. No cierres esta página.'}
          </p>
          {pago.motivo && (
            <p className="text-amber-300 text-sm mb-4">Tu último intento no se completó: {pago.motivo}</p>
          )}
          {detalle}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <button
              onClick={consultar}
              disabled={consultando}
              className="bg-slate-600 hover:bg-slate-500 text-white font-semibold px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {consultando ? 'Consultando...' : 'Consultar de nuevo'}
            </button>
            {pago.url_pago && (
              <a href={pago.url_pago} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg">
                Volver a intentar el pago
              </a>
            )}
          </div>
        </Tarjeta>
      );
  }
}

function Fila({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-400">{k}</span>
      <span className={`text-white text-right break-all ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  );
}

function Tarjeta({ tipo, titulo, children }: { tipo: 'ok' | 'error' | 'espera' | 'revision'; titulo: string; children?: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-2xl mx-auto text-center bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-700">
        <Icono tipo={tipo} />
        <h1 className="text-3xl font-bold text-white mb-4">{titulo}</h1>
        {children}
        <Link href="/" className="inline-block bg-primary hover:bg-primary-dark text-slate-900 font-bold px-8 py-3 rounded-lg transition-colors">
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}

export default function ResultadoPagoPage() {
  return (
    <main className="min-h-screen bg-slate-900">
      <Header />
      <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center text-white">Cargando...</div>}>
        <ResultadoContent />
      </Suspense>
      <Footer />
    </main>
  );
}
