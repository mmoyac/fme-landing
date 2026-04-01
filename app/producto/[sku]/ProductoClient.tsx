'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import { useTenantConfig } from '@/context/TenantConfigContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CartSidebar from '@/components/CartSidebar'

interface Producto {
  sku: string
  nombre: string
  descripcion: string
  imagen_url: string | null
  precio: number
  stock_total: number
  tipo_venta_codigo?: string
  tipo_venta_nombre?: string
}

interface Props {
  producto: Producto | null
}

export default function ProductoClient({ producto }: Props) {
  const { addToCart } = useCart()
  const { config } = useTenantConfig()

  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const handleAddToCart = () => {
    if (!producto) return
    addToCart({ sku: producto.sku, nombre: producto.nombre, precio: producto.precio }, cantidad)
    setAgregado(true)
    setIsCartOpen(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  const imageUrl = producto?.imagen_url
    ? producto.imagen_url.startsWith('http')
      ? producto.imagen_url
      : `${API_URL}${producto.imagen_url}`
    : null

  if (!producto) {
    return (
      <main className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-5xl mb-4">🔍</p>
            <h1 className="text-2xl font-bold text-white mb-2">Producto no encontrado</h1>
            <p className="text-gray-400 mb-6">El producto que buscas no está disponible.</p>
            <Link href="/#productos" className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-bold hover:opacity-90 transition">
              Ver todos los productos
            </Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  const esPeso = producto.tipo_venta_codigo === 'PESO_SUELTO'
  const unidad = esPeso ? 'kg' : 'unidad'
  const conCarrito = config?.displaySettings?.habilitar_carrito ?? true
  const mostrarPrecio = config?.displaySettings?.mostrar_precios ?? true
  const mostrarStock = config?.displaySettings?.mostrar_stock ?? false

  return (
    <main className="min-h-screen bg-slate-900">
      <Header />

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <section className="pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-gray-400">
            <Link href="/" className="hover:text-primary transition">Inicio</Link>
            <span>/</span>
            <Link href="/#productos" className="hover:text-primary transition">Productos</Link>
            <span>/</span>
            <span className="text-white">{producto.nombre}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Imagen */}
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 aspect-square flex items-center justify-center border border-primary/20">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-32 h-32 text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col justify-center">
              <p className="text-sm text-gray-500 mb-1">SKU: {producto.sku}</p>
              <h1 className="text-3xl font-bold text-white mb-4">{producto.nombre}</h1>

              {producto.descripcion && (
                <p className="text-gray-300 mb-6 leading-relaxed">{producto.descripcion}</p>
              )}

              {mostrarPrecio && (
                <div className="mb-4">
                  <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                    ${producto.precio.toLocaleString('es-CL')}
                    <span className="text-lg text-gray-400 font-normal ml-2">/ {unidad}</span>
                  </p>
                </div>
              )}

              {mostrarStock && (
                <div className="flex items-center gap-2 mb-6">
                  <span className={`w-2.5 h-2.5 rounded-full ${producto.stock_total > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-sm font-medium ${producto.stock_total > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {producto.stock_total > 0 ? `${producto.stock_total} disponibles` : 'Sin stock'}
                  </span>
                </div>
              )}

              {conCarrito && (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-gray-400 text-sm">Cantidad:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCantidad(q => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-bold"
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-white font-semibold text-lg">{cantidad}</span>
                      <button
                        onClick={() => setCantidad(q => q + 1)}
                        disabled={mostrarStock && cantidad >= producto.stock_total}
                        className="w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={producto.stock_total === 0}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                      producto.stock_total > 0
                        ? agregado
                          ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
                          : 'bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white shadow-lg shadow-primary/30'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {producto.stock_total === 0 ? 'Sin Stock' : agregado ? '✓ Agregado al carrito' : 'Agregar al carrito'}
                  </button>
                </>
              )}

              <Link href="/#productos" className="mt-4 text-center text-sm text-gray-500 hover:text-primary transition">
                ← Ver todos los productos
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
