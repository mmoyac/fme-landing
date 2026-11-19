import { esModuloNoContratado, MENSAJE_TIENDA_NO_DISPONIBLE } from './modulos';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ItemPedido {
  sku: string;
  cantidad: number;
}

export interface PedidoCreate {
  cliente_nombre: string;
  cliente_apellido?: string;
  cliente_email: string;
  cliente_telefono: string;
  // Entrega (add-delivery-por-comuna): el costo de delivery lo calcula el backend desde las tarifas
  modalidad_entrega: ModalidadEntrega;
  direccion_entrega?: string;
  comuna?: string;
  confirma_comuna?: boolean;  // con DESPACHO: el cliente confirma que su dirección está en la comuna
  notas?: string;
  email_token?: string;  // correo verificado con código
  items: ItemPedido[];
}

export interface PedidoConfirmacion {
  pedido_id: number;
  numero_pedido: string;
  monto_total: number;
  estado: string;
  mensaje: string;
  token_seguimiento?: string;  // credencial para iniciar el pago en línea
  modalidad_entrega?: ModalidadEntrega;
  comuna_entrega?: string | null;
  costo_delivery?: number | null;  // total a pagar = monto_total + costo_delivery
}

export type ModalidadEntrega = 'RETIRO' | 'DESPACHO';

export interface TarifaDelivery {
  comuna: string;
  costo: number;
}

export interface OpcionesEntrega {
  retiro: { direccion: string | null };
  tarifas: TarifaDelivery[];
  monto_minimo_gratis: number | null;
}

/** Opciones de entrega del checkout: dirección de retiro, comunas con delivery y monto para envío gratis. */
export async function obtenerOpcionesEntrega(): Promise<OpcionesEntrega> {
  const vacio: OpcionesEntrega = { retiro: { direccion: null }, tarifas: [], monto_minimo_gratis: null };
  try {
    const response = await fetch(`${API_URL}/api/tienda/entrega`, {
      headers: { 'X-Forwarded-Host': hostFrontend() },
      cache: 'no-store',
    });
    if (!response.ok) return vacio;
    return await response.json();
  } catch {
    return vacio;
  }
}

/** Costo de delivery que mostrará el checkout (el backend lo recalcula al crear el pedido). */
export function costoDeliveryEstimado(opciones: OpcionesEntrega, modalidad: ModalidadEntrega, comuna: string,
                                      montoProductos: number): number {
  if (modalidad !== 'DESPACHO') return 0;
  const tarifa = opciones.tarifas.find(t => t.comuna === comuna);
  if (!tarifa) return 0;
  if (opciones.monto_minimo_gratis && montoProductos >= opciones.monto_minimo_gratis) return 0;
  return tarifa.costo;
}

export interface ValidacionEmail {
  valido: boolean;
  email: string;
  error: string | null;
  sugerencia: string | null;
}

// Valida el correo en el backend: formato, dominio que recibe correo (DNS) y sugerencia de typo ("gmial.com").
// Si el backend no responde, no bloquea (la validación definitiva se repite al crear el pedido).
export async function validarEmail(email: string): Promise<ValidacionEmail | null> {
  try {
    const response = await fetch(`${API_URL}/api/pedidos/validar-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Forwarded-Host': hostFrontend() },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

// ---- Verificación del correo con código (el backend exige el token al crear el pedido) ----
const CLAVE_TOKENS = 'fme_email_verificado';

export function tokenGuardado(email: string): string | null {
  try {
    const mapa = JSON.parse(localStorage.getItem(CLAVE_TOKENS) || '{}');
    const t = mapa[email.trim().toLowerCase()];
    return t && t.exp > Date.now() ? t.token : null;
  } catch {
    return null;
  }
}

function guardarToken(email: string, token: string, dias: number) {
  try {
    const mapa = JSON.parse(localStorage.getItem(CLAVE_TOKENS) || '{}');
    mapa[email.trim().toLowerCase()] = { token, exp: Date.now() + dias * 86400000 };
    localStorage.setItem(CLAVE_TOKENS, JSON.stringify(mapa));
  } catch { /* navegador sin almacenamiento: se verifica en cada compra */ }
}

async function postJson(ruta: string, body: unknown) {
  const response = await fetch(`${API_URL}${ruta}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-Host': hostFrontend() },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (esModuloNoContratado(response.status, data)) throw new Error(MENSAJE_TIENDA_NO_DISPONIBLE);
    throw new Error(typeof data.detail === 'string' ? data.detail : 'No se pudo completar la operación');
  }
  return data;
}

export async function enviarCodigoEmail(email: string): Promise<{ minutos: number; reenviar_en: number }> {
  return postJson('/api/pedidos/verificacion-email/enviar', { email });
}

export async function confirmarCodigoEmail(email: string, codigo: string): Promise<string> {
  const r = await postJson('/api/pedidos/verificacion-email/confirmar', { email, codigo });
  guardarToken(email, r.token, r.dias || 30);
  return r.token;
}

// Hostname de la tienda: el backend lo usa para identificar el tenant.
function hostFrontend(): string {
  return typeof window !== 'undefined' ? window.location.host : 'localhost';
}

export async function crearPedido(data: PedidoCreate): Promise<PedidoConfirmacion> {
  // Obtener el hostname actual del frontend para detección de tenant
  const frontendHost = typeof window !== 'undefined' ? window.location.host : 'localhost';
  
  const response = await fetch(`${API_URL}/api/pedidos/`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Forwarded-Host': frontendHost  // Enviar hostname del frontend para detección de tenant
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    if (esModuloNoContratado(response.status, error)) throw new Error(MENSAJE_TIENDA_NO_DISPONIBLE);
    
    // Manejar errores de validación de Pydantic (422)
    if (Array.isArray(error.detail)) {
      const messages = error.detail.map((err: any) => {
        const field = err.loc[err.loc.length - 1]; // Último elemento del loc es el campo
        return `${field}: ${err.msg}`;
      }).join('\n');
      throw new Error(messages);
    }
    
    // Manejar otros errores (string simple)
    throw new Error(error.detail || 'Error al crear pedido');
  }

  return response.json();
}
