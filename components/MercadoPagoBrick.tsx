import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { useEffect } from 'react';
import { processPayment } from '@/lib/api/pedidos'; // Importar helper

// Inicializar MP con la llave pública
const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '';

if (PUBLIC_KEY) {
    initMercadoPago(PUBLIC_KEY, { locale: 'es-CL' });
}

interface RequestOptions {
    timeout?: number;
    formData?: any;
    headers?: any;
}

interface MercadoPagoBrickProps {
    amount: number;
    externalReference: string;
    onPaymentComplete: (result: any) => void;
    onPaymentError: (error: any) => void;
}

export default function MercadoPagoBrick({ amount, externalReference, onPaymentComplete, onPaymentError }: MercadoPagoBrickProps) {

    const initialization = {
        amount: amount,
    };

    const customization = {
        paymentMethods: {
            creditCard: "all" as const,
            debitCard: "all" as const,
            mercadoPago: "all" as const,
        },
    };

    const onSubmit = async (
        { selectedPaymentMethod, formData }: any
    ) => {
        // Callback llamado al hacer clic en el botón de pagar en el Brick
        return new Promise((resolve, reject) => {
            processPayment({ ...formData, external_reference: externalReference })
                .then((response) => {
                    // recibir el resultado del pago
                    resolve(void 0); // Brick espera void
                    onPaymentComplete(response);
                })
                .catch((error) => {
                    // manejar error
                    console.error("Payment Error", error);
                    reject();
                    onPaymentError(error);
                });
        });
    };

    const onError = async (error: any) => {
        // callback llamado para todos los casos de error de Brick
        console.error(error);
        onPaymentError(error);
    };

    const onReady = async () => {
        /*
          Callback llamado cuando el Brick está listo.
          Aquí puedes ocultar cargadores de tu sitio.
        */
    };

    if (!PUBLIC_KEY) {
        return <div className="text-red-500">Error: Mercado Pago Public Key no configurada.</div>;
    }

    return (
        <div className="payment-brick-container bg-white p-4 rounded-lg">
            <Payment
                initialization={initialization}
                customization={customization}
                onSubmit={onSubmit}
                onReady={onReady}
                onError={onError}
            />
        </div>
    );
}
