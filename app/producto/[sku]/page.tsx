import type { Metadata } from 'next'
import { headers } from 'next/headers'
import ProductoClient from './ProductoClient'

interface Props {
  params: { sku: string }
}

interface Producto {
  sku: string
  nombre: string
  descripcion: string
  imagen_url: string | null
  precio: number
  stock_total: number
  tipo_venta_codigo?: string
}

interface TenantConfig {
  tenant: { nombre: string; dominio_principal: string }
  branding: { nombre_comercial: string }
  seo: { description: string }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getProducto(sku: string, hostname: string): Promise<Producto | null> {
  try {
    const res = await fetch(`${API_URL}/api/productos/catalogo/${encodeURIComponent(sku)}`, {
      headers: { 'X-Forwarded-Host': hostname },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function getTenantConfig(hostname: string): Promise<TenantConfig | null> {
  try {
    const res = await fetch(`${API_URL}/api/config/landing`, {
      headers: { 'X-Forwarded-Host': hostname },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function getShopUrl(hostname: string, tenantConfig: TenantConfig | null): string {
  const isDevHost = hostname.includes('localhost') || hostname.includes('.local') || hostname.includes('127.0.0.1')
  if (isDevHost) return `http://${hostname}`
  const domain = tenantConfig?.tenant?.dominio_principal || hostname.split(':')[0]
  return `https://${domain}`
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const headersList = headers()
  const hostname = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost'

  const [producto, tenantConfig] = await Promise.all([
    getProducto(params.sku, hostname),
    getTenantConfig(hostname),
  ])

  if (!producto) return { title: 'Producto no encontrado' }

  const shopName = tenantConfig?.branding?.nombre_comercial || tenantConfig?.tenant?.nombre || hostname.split(':')[0]
  const shopUrl = getShopUrl(hostname, tenantConfig)

  const imageUrl = producto.imagen_url
    ? producto.imagen_url.startsWith('http')
      ? producto.imagen_url
      : `${API_URL}${producto.imagen_url}`
    : null

  return {
    title: `${producto.nombre} — ${shopName}`,
    description: producto.descripcion || producto.nombre,
    openGraph: {
      title: `${producto.nombre} — ${shopName}`,
      description: producto.descripcion || producto.nombre,
      url: `${shopUrl}/producto/${params.sku}`,
      siteName: shopName,
      type: 'website',
      ...(imageUrl ? { images: [{ url: imageUrl, alt: producto.nombre, width: 800, height: 800 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${producto.nombre} — ${shopName}`,
      description: producto.descripcion || producto.nombre,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
    other: {
      'product:price:amount': String(Math.round(producto.precio)),
      'product:price:currency': 'CLP',
    },
  }
}

export default async function ProductoPage({ params }: Props) {
  const headersList = headers()
  const hostname = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost'

  const producto = await getProducto(params.sku, hostname)

  return <ProductoClient producto={producto} />
}
