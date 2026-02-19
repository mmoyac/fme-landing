'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PendingContent() {
    const searchParams = useSearchParams();
    const numeroPedido = searchParams.get('pedido');
    const tipo = searchParams.get('tipo'); // 'coordinado' o null (pago procesándose)

    const esCoordinado = tipo === 'coordinado';

    return (
        <main className="min-h-screen bg-slate-900">
            <Header />
            <div className="container mx-auto px-4 py-20">
                <div className={`max-w-2xl mx-auto text-center bg-slate-800 p-8 rounded-2xl shadow-2xl border ${esCoordinado ? 'border-green-500/20' : 'border-yellow-500/20'}`}>
                    <div className={`w-24 h-24 ${esCoordinado ? 'bg-green-500/20' : 'bg-yellow-500/20'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                        {esCoordinado ? (
                            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    {esCoordinado ? (
                        <>
                            <h1 className="text-3xl font-bold text-white mb-4">¡Pedido Recibido!</h1>
                            {numeroPedido && (
                                <div className="bg-slate-700 px-6 py-4 rounded-lg mb-6">
                                    <p className="text-gray-400 text-sm mb-1">Número de Pedido</p>
                                    <p className="text-2xl font-bold text-primary">#{numeroPedido}</p>
                                </div>
                            )}
                            <p className="text-gray-300 mb-4">
                                Tu pedido ha sido registrado exitosamente y está <span className="font-semibold text-green-400">PENDIENTE</span> de confirmación.
                            </p>
                            <p className="text-gray-300 mb-8">
                                📞 Nuestro equipo te contactará pronto para coordinar el pago y la entrega. Revisa tu correo electrónico y mantén tu teléfono disponible.
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-white mb-4">Pago en Proceso</h1>
                            {numeroPedido && (
                                <div className="bg-slate-700 px-6 py-4 rounded-lg mb-6">
                                    <p className="text-gray-400 text-sm mb-1">Número de Pedido</p>
                                    <p className="text-2xl font-bold text-primary">#{numeroPedido}</p>
                                </div>
                            )}
                            <p className="text-gray-300 mb-4">
                                Tu pago está siendo procesado por Mercado Pago.
                            </p>
                            <p className="text-gray-300 mb-8">
                                ⏳ Te notificaremos por correo electrónico una vez que se haya confirmado el pago. Tu pedido quedará <span className="font-semibold text-yellow-400">PENDIENTE</span> hasta entonces.
                            </p>
                        </>
                    )}

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

export default function PendingPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="text-white">Cargando...</div>
            </main>
        }>
            <PendingContent />
        </Suspense>
    );
}
