'use client'

import { useTenantConfig } from '@/context/TenantConfigContext'

export default function TenantErrorScreen({ children }: { children: React.ReactNode }) {
  const { config, loading, error } = useTenantConfig()

  // Mostrar loading mientras carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-xl text-gray-300">Cargando...</p>
        </div>
      </div>
    )
  }

  // Mostrar error si hay problemas
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
        <div className="max-w-md w-full bg-red-900/20 border-2 border-red-600 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-red-400 mb-4">Acceso Suspendido</h1>
          <p className="text-gray-300 text-lg mb-6">
            {error}
          </p>
          <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 text-sm text-gray-400">
            <p className="font-semibold text-red-300 mb-2">¿Por qué veo este mensaje?</p>
            <p>Esta tienda está temporalmente desactivada. Por favor, contacta con el administrador para más información.</p>
          </div>
        </div>
      </div>
    )
  }

  // Si no hay config pero tampoco hay error, mostrar pantalla genérica
  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-300 mb-4">Configuración no disponible</h1>
          <p className="text-gray-500">No se pudo cargar la configuración de la tienda.</p>
        </div>
      </div>
    )
  }

  // Todo OK, renderizar children
  return <>{children}</>
}
