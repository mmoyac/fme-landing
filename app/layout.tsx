import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import { TenantConfigProvider } from '@/context/TenantConfigContext'
import DynamicMetadata from '@/components/DynamicMetadata'
import TenantErrorScreen from '@/components/TenantErrorScreen'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Masas Estación - Las mejores masas frescas a tu mesa',
  description: 'Fideos, Ñoquis y Tapas de Empanadas. Directo de fábrica.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <TenantConfigProvider>
          <DynamicMetadata />
          <TenantErrorScreen>
            <CartProvider>
              {children}
            </CartProvider>
          </TenantErrorScreen>
        </TenantConfigProvider>
      </body>
    </html>
  )
}
