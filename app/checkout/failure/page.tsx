'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function FailurePage() {
    return (
        <main className="min-h-screen bg-slate-900">
            <Header />
            <div className="container mx-auto px-4 py-20">
                <div className="max-w-2xl mx-auto text-center bg-slate-800 p-8 rounded-2xl shadow-2xl border border-red-500/20">
                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-4">Error en el Pago</h1>
                    <p className="text-gray-300 mb-8">
                        Lo sentimos, hubo un problema al procesar tu pago. Por favor, intenta nuevamente o utiliza otro medio de pago.
                    </p>

                    <div className="flex gap-4 justify-center">
                        <Link
                            href="/checkout"
                            className="inline-block bg-primary hover:bg-primary-dark text-slate-900 font-bold px-8 py-3 rounded-lg transition-colors"
                        >
                            Intentar Nuevamente
                        </Link>
                        <Link
                            href="/"
                            className="inline-block bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-3 rounded-lg transition-colors"
                        >
                            Volver al Inicio
                        </Link>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
