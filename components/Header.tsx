'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/context/CartContext'
import { useTenantConfig } from '@/context/TenantConfigContext'
import CartSidebar from './CartSidebar'

export default function Header() {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { getTotalItems } = useCart()
  const { config, loading, error } = useTenantConfig()

  // Valores por defecto mientras carga
  const logoUrl = config?.branding.logo_url || '/logo.png'
  const nombreComercial = config?.branding.nombre_comercial || (error ? 'Error cargando' : loading ? 'Cargando...' : 'Sin nombre')
  
  // Construir URL completa si es una ruta relativa del backend
  const fullLogoUrl = logoUrl.startsWith('/static/') 
    ? `${process.env.NEXT_PUBLIC_API_URL}${logoUrl}`
    : logoUrl
  
  // Debug en consola
  if (error) console.error('❌ Error en Header:', error)

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur-sm shadow-lg shadow-primary/10 fixed top-0 left-0 right-0 z-50 border-b border-primary/20">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            {!loading && (
              <Image 
                src={fullLogoUrl}
                alt={nombreComercial}
                width={50} 
                height={50}
                className="object-contain"
              />
            )}
            <span className="text-xl font-bold text-white">{nombreComercial}</span>
          </Link>

          {/* Navegación */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#productos" className="text-gray-300 hover:text-primary transition">
              Productos
            </Link>
            <Link href="#beneficios" className="text-gray-300 hover:text-primary transition">
              Beneficios
            </Link>
            <Link href="#contacto" className="text-gray-300 hover:text-primary transition">
              Contacto
            </Link>
          </div>

          {/* Carrito - solo si habilitar_carrito está activo */}
          {config?.displaySettings?.habilitar_carrito && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-slate-800 rounded-full transition"
            >
              <svg
                className="w-6 h-6 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          )}
        </nav>
      </header>

      {config?.displaySettings?.habilitar_carrito && (
        <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}
    </>
  )
}
