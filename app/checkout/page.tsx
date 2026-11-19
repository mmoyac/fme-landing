'use client';
// Rebuild: 2026-02-23 - Fix Server Actions cache

import { useEffect, useState, FormEvent } from 'react';
import { useCart } from '@/context/CartContext';
import {
  crearPedido, validarEmail, ValidacionEmail, tokenGuardado, enviarCodigoEmail, confirmarCodigoEmail,
  obtenerOpcionesEntrega, costoDeliveryEstimado, OpcionesEntrega, ModalidadEntrega,
} from '@/lib/api/pedidos';
import { obtenerPasarelas, iniciarPago, redirigirAPasarela, PasarelaDisponible } from '@/lib/api/pagos';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DireccionMapbox, { DireccionElegida } from '@/components/DireccionMapbox';

/** 'Ñuñoa ' y 'nunoa' son la misma comuna (misma regla que el backend). */
function normalizarComuna(nombre: string | null | undefined): string {
  return (nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
}

const ICONO_PROVEEDOR: Record<string, string> = { MERCADOPAGO: '💳', FLOW: '💳', KHIPU: '🏦', SIMULADA: '🧪' };
const DETALLE_PROVEEDOR: Record<string, string> = {
  MERCADOPAGO: 'Tarjetas de crédito, débito y saldo Mercado Pago.',
  FLOW: 'Webpay, tarjetas y otros medios a través de Flow.',
  KHIPU: 'Transferencia bancaria simplificada.',
  SIMULADA: 'Pasarela de prueba (solo desarrollo).',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasarelas, setPasarelas] = useState<PasarelaDisponible[]>([]);
  // id de la pasarela elegida, o 'coordinado' (pedido sin pago en línea)
  const [metodoPago, setMetodoPago] = useState<number | 'coordinado'>('coordinado');
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_apellido: '',
    cliente_email: '',
    cliente_telefono: '',
    direccion_entrega: '',
    comuna: '',
    notas: ''
  });
  // Entrega (add-delivery-por-comuna): retiro en casa central o delivery a una comuna con tarifa
  const [opcionesEntrega, setOpcionesEntrega] = useState<OpcionesEntrega>({
    retiro: { direccion: null }, tarifas: [], monto_minimo_gratis: null,
  });
  const [modalidad, setModalidad] = useState<ModalidadEntrega | null>(null);
  const [confirmaComuna, setConfirmaComuna] = useState(false);
  // Dirección elegida de las sugerencias de Mapbox y con comuna con tarifa: no requiere confirmación manual
  const [direccionVerificada, setDireccionVerificada] = useState(false);
  const [avisoDireccion, setAvisoDireccion] = useState<string | null>(null);

  function elegirDireccion(d: DireccionElegida) {
    const tarifa = opcionesEntrega.tarifas.find(t => normalizarComuna(t.comuna) === normalizarComuna(d.comuna));
    setFormData(f => ({ ...f, direccion_entrega: d.direccion, comuna: tarifa ? tarifa.comuna : '' }));
    setConfirmaComuna(false);
    setDireccionVerificada(!!tarifa);
    setAvisoDireccion(tarifa || !d.comuna ? null
      : `Esa dirección está en ${d.comuna} y no tenemos delivery ahí. Puedes elegir retiro en casa central.`);
  }

  // Validación del correo (formato, dominio que recibe correo y sugerencia de typo)
  const [chequeoEmail, setChequeoEmail] = useState<ValidacionEmail | null>(null);
  const [validandoEmail, setValidandoEmail] = useState(false);
  const [sugerenciaDescartada, setSugerenciaDescartada] = useState(false);

  // Verificación con código por correo (el backend exige el token para crear el pedido)
  const [emailToken, setEmailToken] = useState<string | null>(null);
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [verificandoCodigo, setVerificandoCodigo] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [reenviarEn, setReenviarEn] = useState(0);

  useEffect(() => {
    if (reenviarEn <= 0) return;
    const t = setTimeout(() => setReenviarEn(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [reenviarEn]);

  function reiniciarVerificacion(email: string) {
    setEmailToken(email ? tokenGuardado(email) : null);   // ya verificado antes en este navegador
    setCodigoEnviado(false);
    setCodigo('');
    setErrorCodigo(null);
  }

  async function pedirCodigo() {
    setErrorCodigo(null);
    setEnviandoCodigo(true);
    try {
      const r = await enviarCodigoEmail(formData.cliente_email);
      setCodigoEnviado(true);
      setReenviarEn(r.reenviar_en || 60);
    } catch (e: any) {
      setErrorCodigo(e.message);
    } finally {
      setEnviandoCodigo(false);
    }
  }

  async function verificarCodigo() {
    setErrorCodigo(null);
    setVerificandoCodigo(true);
    try {
      setEmailToken(await confirmarCodigoEmail(formData.cliente_email, codigo));
      setCodigoEnviado(false);
    } catch (e: any) {
      setErrorCodigo(e.message);
    } finally {
      setVerificandoCodigo(false);
    }
  }

  async function revisarEmail(email: string): Promise<ValidacionEmail | null> {
    if (!email.trim()) { setChequeoEmail(null); return null; }
    setValidandoEmail(true);
    const r = await validarEmail(email.trim());
    setValidandoEmail(false);
    setChequeoEmail(r);
    setSugerenciaDescartada(false);
    if (r?.valido && r.email !== formData.cliente_email) {
      setFormData(f => ({ ...f, cliente_email: r.email }));   // normalizado (dominio en minúsculas)
    }
    reiniciarVerificacion(r?.valido ? r.email : '');
    return r;
  }

  const total = cart.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  const pasarelaElegida = pasarelas.find(p => p.id === metodoPago);
  const hayDelivery = opcionesEntrega.tarifas.length > 0;
  // Interruptor por tenant: si está apagado, solo se puede pedir pagando en línea
  const permiteSinPago = opcionesEntrega.permite_pedido_sin_pago !== false;
  const sinMedioDePago = !permiteSinPago && pasarelas.length === 0;
  const costoDelivery = modalidad ? costoDeliveryEstimado(opcionesEntrega, modalidad, formData.comuna, total) : 0;
  const totalPagar = total + costoDelivery;
  const tarifaElegida = opcionesEntrega.tarifas.find(t => t.comuna === formData.comuna);
  const minimoGratis = opcionesEntrega.monto_minimo_gratis;
  const faltaParaGratis = modalidad === 'DESPACHO' && tarifaElegida && minimoGratis && total < minimoGratis
    ? minimoGratis - total : 0;

  useEffect(() => {
    obtenerOpcionesEntrega().then(op => {
      setOpcionesEntrega(op);
      if (op.tarifas.length === 0) setModalidad('RETIRO');
    });
  }, []);

  useEffect(() => {
    obtenerPasarelas().then(lista => {
      setPasarelas(lista);
      if (lista.length > 0) setMetodoPago(lista[0].id);
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    // El correo debe estar verificado; si hay una sugerencia de corrección sin responder, se pide responderla primero.
    const chequeo = chequeoEmail ?? await revisarEmail(formData.cliente_email);
    if (chequeo && !chequeo.valido) {
      setError(chequeo.error || 'Revisa tu correo electrónico');
      return;
    }
    if (chequeo?.sugerencia && !sugerenciaDescartada) {
      setError(`Revisa tu correo: ¿quisiste decir ${chequeo.sugerencia}? Corrígelo o confirma que está bien.`);
      return;
    }
    const token = emailToken || tokenGuardado(formData.cliente_email);
    if (!token) {
      setError('Verifica tu correo con el código que te enviamos antes de confirmar el pedido.');
      return;
    }
    if (!modalidad) {
      setError('Elige si retiras en la casa central o quieres delivery.');
      return;
    }
    if (modalidad === 'DESPACHO' && (!tarifaElegida || formData.direccion_entrega.trim().length < 5)) {
      setError('Para delivery ingresa tu dirección y elige tu comuna.');
      return;
    }
    if (modalidad === 'DESPACHO' && !direccionVerificada && !confirmaComuna) {
      setError(`Confirma que tu dirección está en ${formData.comuna}.`);
      return;
    }
    if (!pasarelaElegida && !permiteSinPago) {
      setError('El pago en línea no está disponible en este momento. Contáctanos para hacer tu pedido.');
      return;
    }
    if (pasarelaElegida?.monto_minimo && totalPagar < pasarelaElegida.monto_minimo) {
      setError(`El monto mínimo para pagar con ${pasarelaElegida.nombre_visible} es $${pasarelaElegida.monto_minimo.toLocaleString('es-CL')}`);
      return;
    }
    setLoading(true);

    let confirmacion;
    try {
      const esDelivery = modalidad === 'DESPACHO';
      confirmacion = await crearPedido({
        ...formData,
        modalidad_entrega: modalidad,
        direccion_entrega: esDelivery ? formData.direccion_entrega : undefined,
        comuna: esDelivery ? formData.comuna : undefined,
        confirma_comuna: esDelivery ? confirmaComuna : undefined,
        email_token: token,
        items: cart.map(item => ({ sku: item.sku, cantidad: item.cantidad })),
      });
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pedido');
      setLoading(false);
      return;
    }

    if (!pasarelaElegida || !confirmacion.token_seguimiento) {
      clearCart();
      router.push(`/checkout/pending?pedido=${confirmacion.numero_pedido}&tipo=coordinado`);
      return;
    }

    try {
      // El monto lo fija el backend desde el pedido; aquí solo se elige la pasarela.
      const redireccion = await iniciarPago({
        pedido_id: confirmacion.pedido_id,
        token_seguimiento: confirmacion.token_seguimiento,
        pasarela_id: pasarelaElegida.id,
        email: formData.cliente_email || undefined,
      });
      clearCart();
      redirigirAPasarela(redireccion);
    } catch (err: any) {
      // El pedido ya quedó creado: no se pierde, se coordina el pago.
      clearCart();
      alert(`Tu pedido ${confirmacion.numero_pedido} quedó registrado, pero no se pudo iniciar el pago: ${err.message}. Te contactaremos para coordinar el pago.`);
      router.push(`/checkout/pending?pedido=${confirmacion.numero_pedido}&tipo=coordinado`);
    }
  }

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
                  autoComplete="email"
                  value={formData.cliente_email}
                  onChange={(e) => {
                    setFormData({ ...formData, cliente_email: e.target.value });
                    setChequeoEmail(null);
                    setSugerenciaDescartada(false);
                    reiniciarVerificacion('');
                  }}
                  onBlur={() => revisarEmail(formData.cliente_email)}
                  className={`w-full bg-slate-700 text-white px-4 py-2 rounded-lg border focus:outline-none ${
                    chequeoEmail && !chequeoEmail.valido ? 'border-red-500 focus:border-red-400' : 'border-slate-600 focus:border-primary'
                  }`}
                />
                {validandoEmail && <p className="text-xs text-gray-400 mt-1">Verificando correo...</p>}
                {chequeoEmail && !chequeoEmail.valido && (
                  <p className="text-sm text-red-400 mt-1">{chequeoEmail.error}</p>
                )}
                {chequeoEmail?.sugerencia && !sugerenciaDescartada && (
                  <div className="mt-2 p-3 rounded-lg bg-amber-900/40 border border-amber-600 text-sm text-amber-100">
                    ¿Quisiste decir <strong>{chequeoEmail.sugerencia}</strong>?
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const s = chequeoEmail.sugerencia!;
                          setFormData(f => ({ ...f, cliente_email: s }));
                          revisarEmail(s);
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold px-3 py-1 rounded"
                      >
                        Sí, corregir
                      </button>
                      {chequeoEmail.valido && (
                        <button
                          type="button"
                          onClick={() => setSugerenciaDescartada(true)}
                          className="bg-slate-600 hover:bg-slate-500 text-white px-3 py-1 rounded"
                        >
                          No, mi correo está bien
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {/* Verificación con código: solo con un correo válido y sin sugerencia pendiente */}
                {chequeoEmail?.valido && (!chequeoEmail.sugerencia || sugerenciaDescartada) && (
                  emailToken ? (
                    <p className="text-sm text-green-400 mt-2">✓ Correo verificado</p>
                  ) : (
                    <div className="mt-3 p-4 rounded-lg bg-slate-700/60 border border-slate-600">
                      {!codigoEnviado ? (
                        <>
                          <p className="text-sm text-gray-300 mb-3">
                            Para asegurarnos de que recibas la confirmación y el seguimiento, te enviaremos un código a tu correo.
                          </p>
                          <button
                            type="button"
                            onClick={pedirCodigo}
                            disabled={enviandoCodigo}
                            className="bg-primary hover:bg-primary-dark text-slate-900 font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                          >
                            {enviandoCodigo ? 'Enviando...' : 'Enviar código de verificación'}
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-300 mb-3">
                            Ingresa el código de 6 dígitos que enviamos a <strong>{formData.cliente_email}</strong>.
                            Revisa también la carpeta de spam.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              maxLength={6}
                              value={codigo}
                              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              placeholder="000000"
                              className="w-32 bg-slate-800 text-white text-center tracking-[0.4em] text-lg px-3 py-2 rounded-lg border border-slate-500 focus:border-primary focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={verificarCodigo}
                              disabled={codigo.length !== 6 || verificandoCodigo}
                              className="bg-primary hover:bg-primary-dark text-slate-900 font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
                            >
                              {verificandoCodigo ? 'Verificando...' : 'Verificar'}
                            </button>
                            <button
                              type="button"
                              onClick={pedirCodigo}
                              disabled={reenviarEn > 0 || enviandoCodigo}
                              className="text-sm text-gray-300 hover:text-white underline disabled:no-underline disabled:opacity-50 px-2"
                            >
                              {reenviarEn > 0 ? `Reenviar en ${reenviarEn}s` : 'Reenviar código'}
                            </button>
                          </div>
                        </>
                      )}
                      {errorCodigo && <p className="text-sm text-red-400 mt-2">{errorCodigo}</p>}
                    </div>
                  )
                )}
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

              {/* Entrega (add-delivery-por-comuna) */}
              <div className="border-t border-slate-700 pt-6">
                <label className="block text-lg font-semibold text-white mb-4">
                  ¿Cómo quieres recibir tu pedido?
                </label>
                <div className="space-y-3">
                  <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors bg-slate-700 ${modalidad === 'RETIRO' ? 'border-primary' : 'border-slate-600 hover:border-primary'}`}>
                    <input
                      type="radio"
                      name="modalidad"
                      checked={modalidad === 'RETIRO'}
                      onChange={() => setModalidad('RETIRO')}
                      className="mt-1 mr-3 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white flex flex-wrap items-center gap-2">
                        🏪 Retiro en casa central
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Sin costo</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {opcionesEntrega.retiro.direccion
                          ? <>Retiras tu pedido en <strong className="text-gray-300">{opcionesEntrega.retiro.direccion}</strong>. Te avisaremos cuando esté listo.</>
                          : 'Retiras tu pedido en nuestra casa central. Te avisaremos cuando esté listo.'}
                      </p>
                    </div>
                  </label>

                  {hayDelivery && (
                    <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors bg-slate-700 ${modalidad === 'DESPACHO' ? 'border-primary' : 'border-slate-600 hover:border-primary'}`}>
                      <input
                        type="radio"
                        name="modalidad"
                        checked={modalidad === 'DESPACHO'}
                        onChange={() => setModalidad('DESPACHO')}
                        className="mt-1 mr-3 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-white">🚚 Delivery a domicilio</div>
                        <p className="text-sm text-gray-400 mt-1">
                          Te lo llevamos. El costo depende de tu comuna
                          {minimoGratis ? ` (gratis en compras desde $${minimoGratis.toLocaleString('es-CL')})` : ''}.
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {modalidad === 'DESPACHO' && (
                  <div className="mt-4 space-y-4">
                    <DireccionMapbox
                      valor={formData.direccion_entrega}
                      etiqueta={formData.comuna ? `Dirección en ${formData.comuna} *` : 'Dirección de entrega *'}
                      onEscribir={(texto) => {
                        setFormData(f => ({ ...f, direccion_entrega: texto }));
                        setDireccionVerificada(false);
                        setAvisoDireccion(null);
                      }}
                      onElegir={elegirDireccion}
                    />
                    {direccionVerificada && (
                      <p className="text-sm text-green-400">✓ Dirección encontrada en {formData.comuna}.</p>
                    )}
                    {avisoDireccion && <p className="text-sm text-amber-300">{avisoDireccion}</p>}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Comuna *
                      </label>
                      <select
                        required
                        value={formData.comuna}
                        onChange={(e) => {
                          setFormData({ ...formData, comuna: e.target.value });
                          setConfirmaComuna(false);
                          setDireccionVerificada(false);
                        }}
                        className="w-full bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:border-primary focus:outline-none"
                      >
                        <option value="">Elige tu comuna…</option>
                        {opcionesEntrega.tarifas.map(t => (
                          <option key={t.comuna} value={t.comuna}>
                            {t.comuna} — ${t.costo.toLocaleString('es-CL')}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">¿No está tu comuna? Elige retiro en casa central o escríbenos.</p>
                    </div>
                    {formData.comuna && !direccionVerificada && (
                      <label className="flex items-start gap-3 p-3 rounded-lg bg-amber-900/20 border border-amber-700/50 cursor-pointer">
                        <input
                          type="checkbox"
                          required
                          checked={confirmaComuna}
                          onChange={(e) => setConfirmaComuna(e.target.checked)}
                          className="mt-1 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-amber-100">
                          No encontramos tu dirección en el mapa. Confirmo que está en <strong>{formData.comuna}</strong>.
                          Si no corresponde, el pedido puede reprogramarse o cobrarse la diferencia del delivery.
                        </span>
                      </label>
                    )}
                  </div>
                )}
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
                  {pasarelas.map((p, i) => (
                    <label key={p.id} className="flex items-start p-4 border-2 border-slate-600 rounded-lg cursor-pointer hover:border-primary transition-colors bg-slate-700">
                      <input
                        type="radio"
                        name="metodoPago"
                        value={p.id}
                        checked={metodoPago === p.id}
                        onChange={() => setMetodoPago(p.id)}
                        className="mt-1 mr-3 text-primary focus:ring-primary"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-white flex items-center gap-2">
                          {ICONO_PROVEEDOR[p.proveedor] || '💳'} Pagar ahora con {p.nombre_visible}
                          {i === 0 && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Recomendado</span>}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {DETALLE_PROVEEDOR[p.proveedor] || 'Pago en línea seguro.'} Serás redirigido para completar el pago.
                        </p>
                        {p.monto_minimo && totalPagar < p.monto_minimo && (
                          <p className="text-xs text-amber-400 mt-1">Monto mínimo ${p.monto_minimo.toLocaleString('es-CL')}</p>
                        )}
                      </div>
                    </label>
                  ))}

                  {sinMedioDePago && (
                    <div className="p-4 rounded-lg bg-amber-900/30 border border-amber-700 text-amber-200 text-sm">
                      El pago en línea no está disponible en este momento. Contáctanos para hacer tu pedido.
                    </div>
                  )}

                  {permiteSinPago && (
                  <label className="flex items-start p-4 border-2 border-slate-600 rounded-lg cursor-pointer hover:border-primary transition-colors bg-slate-700">
                    <input
                      type="radio"
                      name="metodoPago"
                      value="coordinado"
                      checked={metodoPago === 'coordinado'}
                      onChange={() => setMetodoPago('coordinado')}
                      className="mt-1 mr-3 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        📞 Solicitar pedido sin pagar ahora
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Recibirás tu número de pedido y te contactaremos para coordinar el pago y la {modalidad === 'RETIRO' ? 'fecha de retiro' : 'entrega'}.
                      </p>
                    </div>
                  </label>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-900/40 border border-red-700 text-red-200 text-sm whitespace-pre-line">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || sinMedioDePago}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? 'Procesando...' : pasarelaElegida ? `Confirmar y pagar con ${pasarelaElegida.nombre_visible}` : 'Enviar Pedido'}
              </button>
            </form>
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

              <div className="border-t border-slate-700 pt-4 space-y-2">
                <div className="flex justify-between items-center text-gray-300">
                  <span>Productos</span>
                  <span>${total.toLocaleString('es-CL')}</span>
                </div>
                <div className="flex justify-between items-center text-gray-300">
                  <span>
                    {modalidad === 'RETIRO' ? 'Retiro en casa central'
                      : modalidad === 'DESPACHO' ? `Delivery${tarifaElegida ? ` a ${tarifaElegida.comuna}` : ''}`
                        : 'Entrega'}
                  </span>
                  <span>
                    {modalidad === 'RETIRO' ? 'Gratis'
                      : modalidad === 'DESPACHO' && tarifaElegida
                        ? (costoDelivery === 0 ? 'Gratis' : `$${costoDelivery.toLocaleString('es-CL')}`)
                        : '—'}
                  </span>
                </div>
                {faltaParaGratis > 0 && (
                  <p className="text-xs text-amber-300">
                    Agrega ${faltaParaGratis.toLocaleString('es-CL')} más y el delivery es gratis.
                  </p>
                )}
                <div className="flex justify-between items-center text-2xl font-bold pt-2">
                  <span className="text-white">Total</span>
                  <span className="text-primary">${totalPagar.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-700 rounded-lg">
                <p className="text-sm text-gray-300">
                  {pasarelaElegida
                    ? `💳 Al confirmar te llevaremos a ${pasarelaElegida.nombre_visible} para pagar de forma segura.`
                    : sinMedioDePago
                    ? '⚠️ El pago en línea no está disponible en este momento. Contáctanos para hacer tu pedido.'
                    : `📞 Recibirás un número de pedido y te contactaremos para coordinar el pago y la ${modalidad === 'RETIRO' ? 'fecha de retiro' : 'entrega'}.`}
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
