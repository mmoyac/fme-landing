'use client'

import { useCart } from '@/context/CartContext'
import Link from 'next/link'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { cart, updateQuantity, removeFromCart, getTotalPrice } = useCart()

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-slate-900 shadow-xl shadow-primary/20 z-50 flex flex-col border-l border-primary/30">
        {/* Header */}
        <div className="p-4 border-b border-primary/30 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Carrito de Compras</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-400">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.sku} className="flex gap-4 p-4 bg-slate-800 border border-primary/20 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{item.nombre}</h3>
                    <p className="text-sm text-gray-400">SKU: {item.sku}</p>
                    <p className="text-primary font-bold mt-1">
                      ${item.precio.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.sku, item.cantidad - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-slate-700 border border-primary/30 text-white rounded hover:bg-slate-600"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-semibold text-white">{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.sku, item.cantidad + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-slate-700 border border-primary/30 text-white rounded hover:bg-slate-600"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <p className="text-sm font-semibold text-gray-300">
                      ${(item.precio * item.cantidad).toLocaleString()}
                    </p>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.sku)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Checkout */}
        {cart.length > 0 && (
          <div className="border-t border-primary/30 p-4 space-y-4">
            <div className="flex justify-between text-lg font-bold">
              <span className="text-white">Total:</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">${getTotalPrice().toLocaleString()}</span>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="block w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-light hover:to-primary text-white text-center font-bold py-3 rounded-lg shadow-lg shadow-primary/30 transition"
            >
              Finalizar Pedido
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
