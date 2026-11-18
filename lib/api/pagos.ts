// Pagos en línea con pasarelas (change add-pasarelas-pago, fme-backend).
// El monto lo fija el backend desde el pedido; la landing solo elige la pasarela y redirige al proveedor.
// El resultado lo decide el backend consultando al proveedor: esta capa solo lo lee.
import { esModuloNoContratado, MENSAJE_TIENDA_NO_DISPONIBLE } from './modulos';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Forwarded-Host': typeof window !== 'undefined' ? window.location.host : 'localhost',
  };
}

async function leerError(response: Response, porDefecto: string): Promise<never> {
  let error: any = {};
  try { error = await response.json(); } catch { /* cuerpo vacío */ }
  if (esModuloNoContratado(response.status, error)) throw new Error(MENSAJE_TIENDA_NO_DISPONIBLE);
  throw new Error(typeof error.detail === 'string' ? error.detail : porDefecto);
}

export interface PasarelaDisponible {
  id: number;
  nombre_visible: string;
  proveedor: string;
  requiere_email: boolean;
  monto_minimo: number | null;
}

export interface RedireccionPago {
  id: string;
  url: string;
  metodo: 'GET' | 'POST';
  campos: Record<string, string>;
}

export type EstadoPagoOnline = 'INICIADO' | 'CONFIRMADO' | 'RECHAZADO' | 'EXPIRADO' | 'EN_REVISION';

export interface EstadoPago {
  id: string;
  estado: EstadoPagoOnline;
  monto: number;
  expira_en: string | null;
  pasarela: string | null;
  numero_pedido: string | null;
  id_transaccion: string | null;
  medio: string | null;
  motivo: string | null;
  en_revision: boolean;
  url_pago: string | null;
  simulada: boolean;
}

export async function obtenerPasarelas(): Promise<PasarelaDisponible[]> {
  const response = await fetch(`${API_URL}/api/pagos/opciones`, { headers: headers(), cache: 'no-store' });
  if (!response.ok) return [];
  const data = await response.json();
  return data.pasarelas || [];
}

export async function iniciarPago(datos: {
  pedido_id: number;
  token_seguimiento: string;
  pasarela_id: number;
  email?: string;
}): Promise<RedireccionPago> {
  const response = await fetch(`${API_URL}/api/pagos`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(datos),
  });
  if (!response.ok) return leerError(response, 'No se pudo iniciar el pago');
  return response.json();
}

export async function obtenerEstadoPago(id: string): Promise<EstadoPago> {
  const response = await fetch(`${API_URL}/api/pagos/${id}`, { headers: headers(), cache: 'no-store' });
  if (!response.ok) return leerError(response, 'No se pudo obtener el estado del pago');
  return response.json();
}

export async function consultarPago(id: string): Promise<EstadoPago> {
  const response = await fetch(`${API_URL}/api/pagos/${id}/consultar`, { method: 'POST', headers: headers() });
  if (!response.ok) return leerError(response, 'No se pudo consultar el pago');
  return response.json();
}

export async function confirmarPagoSimulado(id: string, aprobado: boolean): Promise<void> {
  const response = await fetch(`${API_URL}/api/pagos/${id}/simulada`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ aprobado }),
  });
  if (!response.ok) return leerError(response, 'No se pudo registrar el resultado');
}

/** Lleva al cliente al proveedor: GET directo o formulario POST oculto (p. ej. Webpay). */
export function redirigirAPasarela(r: RedireccionPago): void {
  if (r.metodo === 'POST') {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = r.url;
    Object.entries(r.campos || {}).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v;
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
    return;
  }
  window.location.href = r.url;
}
