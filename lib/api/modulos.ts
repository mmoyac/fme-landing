/**
 * El backend responde 403 con detail.code = 'modulo_no_contratado' cuando el tenant no tiene
 * contratado el módulo "Tienda online" (change add-modulos-tenant en fme-backend).
 */
export const MENSAJE_TIENDA_NO_DISPONIBLE =
  'La tienda online no está disponible en este momento. Contáctanos directamente para hacer tu pedido.'

export function esModuloNoContratado(status: number, body: unknown): boolean {
  const detail = (body as { detail?: { code?: string } } | null)?.detail
  return status === 403 && !!detail && typeof detail === 'object' && detail.code === 'modulo_no_contratado'
}
