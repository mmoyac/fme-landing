'use client'

import { useEffect, useState } from 'react'
import { useCart } from '@/context/CartContext'
import { useTenantConfig } from '@/context/TenantConfigContext'

interface Producto {
  sku: string
  nombre: string
  descripcion: string
  imagen_url: string | null
  precio: number
  stock_total: number
}

export default function ProductCatalog() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [cantidad, setCantidad] = useState<Record<string, number>>({})
  const { addToCart } = useCart()
  const { config } = useTenantConfig()

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const currentHostname = window.location.hostname
    
    console.log('🛒 Cargando productos desde:', `${API_URL}/api/productos/catalogo`)
    console.log('🌐 Dominio actual:', currentHostname)
    
    fetch(`${API_URL}/api/productos/catalogo`, {
      headers: {
        'X-Forwarded-Host': currentHostname
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log(`✅ Productos cargados: ${data.length}`)
        setProductos(data)
        // Inicializar cantidades en 1
        const initialQty: Record<string, number> = {}
        data.forEach((p: Producto) => {
          initialQty[p.sku] = 1
        })
        setCantidad(initialQty)
      })
      .catch(err => console.error('Error cargando productos:', err))
      .finally(() => setLoading(false))
  }, [API_URL])

  const handleAddToCart = (producto: Producto) => {
    const qty = cantidad[producto.sku] || 1
    addToCart(
      {
        sku: producto.sku,
        nombre: producto.nombre,
        precio: producto.precio,
      },
      qty
    )
    // Resetear cantidad a 1
    setCantidad(prev => ({ ...prev, [producto.sku]: 1 }))
  }

  const updateCantidad = (sku: string, value: number) => {
    if (value < 1) return
    setCantidad(prev => ({ ...prev, [sku]: value }))
  }

  if (loading) {
    return (
      <section id="productos" className="py-16 bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400">Cargando productos...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="productos" className="py-16 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Nuestros Productos
          </h2>
          <p className="text-xl text-gray-300">
            Masas frescas de la mejor calidad
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map((producto) => (
            <div
              key={producto.sku}
              className="bg-slate-800 rounded-lg border border-primary/30 hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-200 overflow-hidden"
            >
              {/* Product Image */}
              <div className="h-48 bg-gradient-to-br from-primary/30 to-secondary/30 relative">
                {producto.imagen_url ? (
                  <img
                    src={`${API_URL}${producto.imagen_url}?t=${Date.now()}`}
                    alt={producto.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-24 h-24 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1">
                  {producto.nombre}
                </h3>
                <p className="text-sm text-gray-400 mb-3">SKU: {producto.sku}</p>

                {/* Stock Info - solo si displaySettings.mostrar_stock */}
                {config?.displaySettings?.mostrar_stock && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Stock disponible:</span>
                      <span className={`font-semibold ${producto.stock_total > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {producto.stock_total} unidades
                      </span>
                    </div>
                  </div>
                )}

                {/* Price - solo si displaySettings.mostrar_precios */}
                {config?.displaySettings?.mostrar_precios && (
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-4">
                    ${producto.precio.toLocaleString('es-CL')}
                  </p>
                )}

                {/* Quantity Selector y Cart Button - solo si displaySettings.habilitar_carrito */}
                {config?.displaySettings?.habilitar_carrito ? (
                  <>
                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => updateCantidad(producto.sku, (cantidad[producto.sku] || 1) - 1)}
                        className="w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={cantidad[producto.sku] || 1}
                        onChange={(e) => updateCantidad(producto.sku, parseInt(e.target.value) || 1)}
                        className="w-16 text-center bg-slate-700 border border-primary/30 text-white rounded-lg py-2 font-semibold"
                        min="1"
                      />
                      <button
                        onClick={() => updateCantidad(producto.sku, (cantidad[producto.sku] || 1) + 1)}
                        className="w-10 h-10 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(producto)}
                      disabled={producto.stock_total === 0}
                      className={`w-full py-3 rounded-lg font-bold transition ${
                        producto.stock_total > 0
                          ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-primary text-white shadow-lg shadow-primary/30'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {producto.stock_total > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                    </button>
                  </>
                ) : (
                  /* Modo catálogo - sin opción de compra */
                  <div className="text-center py-3 bg-slate-700 rounded-lg">
                    <span className="text-gray-400 text-sm">Solo catálogo</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
