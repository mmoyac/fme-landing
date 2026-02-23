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
  direccion_entrega: string;
  comuna?: string;
  notas?: string;
  items: ItemPedido[];
}

export interface PedidoConfirmacion {
  pedido_id: number;
  numero_pedido: string;
  monto_total: number;
  estado: string;
  mensaje: string;
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

export interface PaymentPreference {
  preference_id: string;
  init_point: string;
}

export async function createPaymentPreference(pedidoId: number): Promise<PaymentPreference> {
  const response = await fetch(`${API_URL}/api/payments/create_preference/${pedidoId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al iniciar pago');
  }

  return response.json();
}


export async function processPayment(paymentData: any): Promise<any> {
  const response = await fetch(`${API_URL}/api/payments/process_payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Error al procesar pago');
  }

  return response.json();
}
