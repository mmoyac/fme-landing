'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  sku: string
  nombre: string
  precio: number
  cantidad: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'cantidad'>, cantidad: number) => void
  removeFromCart: (sku: string) => void
  updateQuantity: (sku: string, cantidad: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [])

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (item: Omit<CartItem, 'cantidad'>, cantidad: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(i => i.sku === item.sku)
      
      if (existingItem) {
        return prevCart.map(i =>
          i.sku === item.sku
            ? { ...i, cantidad: i.cantidad + cantidad }
            : i
        )
      }
      
      return [...prevCart, { ...item, cantidad }]
    })
  }

  const removeFromCart = (sku: string) => {
    setCart(prevCart => prevCart.filter(item => item.sku !== sku))
  }

  const updateQuantity = (sku: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(sku)
      return
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.sku === sku ? { ...item, cantidad } : item
      )
    )
  }

  const clearCart = () => {
    setCart([])
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.cantidad, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.precio * item.cantidad), 0)
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
