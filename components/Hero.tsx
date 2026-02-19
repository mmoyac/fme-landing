'use client'

import { useTenantConfig } from '@/context/TenantConfigContext'

export default function Hero() {
  const { config, loading } = useTenantConfig()

  if (loading) {
    return (
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-pulse">
              <div className="h-12 bg-slate-700 rounded mb-6"></div>
              <div className="h-8 bg-slate-700 rounded mb-8"></div>
              <div className="h-12 bg-slate-700 rounded w-64 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!config) return null

  const { hero } = config

  return (
    <section 
      className="pt-32 pb-20 relative overflow-hidden"
      style={{
        background: `linear-gradient(to bottom right, var(--fondo-hero-inicio), var(--fondo-hero-fin))`
      }}
    >
      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Título Principal */}
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            {hero.titulo.split('\n')[0]}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">
              {hero.titulo.includes('a tu mesa') ? 'a tu mesa' : hero.titulo.split('\n')[1] || ''}
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            {hero.subtitulo.split('.')[0]}.
            {hero.subtitulo.split('.')[1] && (
              <span className="block mt-2 font-semibold text-primary">{hero.subtitulo.split('.')[1]}.</span>
            )}
          </p>

          {/* CTA Principal */}
          <a
            href={hero.cta_link}
            className="inline-block bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-primary text-white font-bold text-lg px-10 py-4 rounded-full shadow-lg shadow-primary/50 hover:shadow-xl hover:shadow-primary/70 transform hover:scale-105 transition-all duration-200"
          >
            {hero.cta_texto}
          </a>

          {/* Badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-300">
            {hero.badges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{badge.texto}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
