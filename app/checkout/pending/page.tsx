'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function PendingPage() {
    return (
        <main className="min-h-screen bg-slate-900">
            <Header />
            <div className="container mx-auto px-4 py-20">
                <div className="max-w-2xl mx-auto text-center bg-slate-800 p-8 rounded-2xl shadow-2xl border border-yellow-500/20">
                    <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-4">Pago Pendiente</h1>
                    <p className="text-gray-300 mb-8">
                        Tu pago está siendo procesado. Te notificaremos por correo electrónico una vez que se haya confirmado.
                    </p>

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
