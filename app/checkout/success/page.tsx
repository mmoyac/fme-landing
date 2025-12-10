'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const paymentId = searchParams.get('payment_id');
    const collectionStatus = searchParams.get('collection_status');

    return (
        <main className="min-h-screen bg-slate-900">
            <Header />
            <div className="container mx-auto px-4 py-20">
                <div className="max-w-2xl mx-auto text-center bg-slate-800 p-8 rounded-2xl shadow-2xl border border-green-500/20">
                    <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-4">¡Pago Exitoso!</h1>
                    <p className="text-gray-300 mb-6">
                        Tu pedido ha sido procesado correctamente. Hemos enviado un correo con los detalles.
                    </p>

                    <div className="bg-slate-700/50 p-4 rounded-lg mb-8 text-left">
                        <p className="text-sm text-gray-400">ID de Pago Mercado Pago:</p>
                        <p className="text-white font-mono">{paymentId}</p>
                        <p className="text-sm text-gray-400 mt-2">Estado:</p>
                        <p className="text-green-400 uppercase font-bold">{collectionStatus}</p>
                    </div>

                    <Link
                        href="/"
                        className="inline-block bg-primary hover:bg-primary-dark text-slate-900 font-bold px-8 py-3 rounded-lg transition-colors"
                    >
                        Volver al Inicio
                    </Link>
                </div>
            </div>
            <Footer />
        </main>
    );
}
