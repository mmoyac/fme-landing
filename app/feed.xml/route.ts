import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ProductoCatalogo {
  sku: string
  nombre: string
  descripcion?: string
  imagen_url?: string
  precio: number
  stock_total: number
  tipo_venta_codigo?: string
}

interface TenantConfig {
  tenant: {
    nombre: string
    dominio_principal: string
  }
  branding: {
    nombre_comercial: string
    logo_url: string
  }
  seo: {
    title: string
    description: string
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildImageUrl(imagenUrl: string | undefined, hostname: string): string {
  if (!imagenUrl) return ''
  // Si ya es una URL absoluta, la devuelve tal cual
  if (imagenUrl.startsWith('http://') || imagenUrl.startsWith('https://')) {
    return imagenUrl
  }
  // Si es una ruta relativa del backend (/static/...), construir URL con el backend de producción
  const isDevHost = hostname.includes('localhost') || hostname.includes('.local') || hostname.includes('127.0.0.1')
  const protocol = isDevHost ? 'http' : 'https'
  return `${protocol}://${hostname}${imagenUrl}`
}

export async function GET(request: NextRequest) {
  const hostname =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    'localhost'

  // Obtener configuración del tenant
  let tenantConfig: TenantConfig | null = null
  try {
    const configRes = await fetch(`${API_URL}/api/config/landing`, {
      headers: { 'X-Forwarded-Host': hostname },
      ...(process.env.NODE_ENV === 'production' ? { next: { revalidate: 3600 } } : { cache: 'no-store' }),
    })
    if (configRes.ok) {
      tenantConfig = await configRes.json()
    }
  } catch {
    // Continúa sin config del tenant
  }

  // Obtener catálogo de productos
  let productos: ProductoCatalogo[] = []
  try {
    const catalogoRes = await fetch(`${API_URL}/api/productos/catalogo`, {
      headers: { 'X-Forwarded-Host': hostname },
      ...(process.env.NODE_ENV === 'production' ? { next: { revalidate: 1800 } } : { cache: 'no-store' }),
    })
    if (catalogoRes.ok) {
      productos = await catalogoRes.json()
    }
  } catch {
    return new NextResponse('Error al obtener catálogo', { status: 502 })
  }

  const shopName = tenantConfig?.branding?.nombre_comercial || tenantConfig?.tenant?.nombre || hostname
  const shopDomain = tenantConfig?.tenant?.dominio_principal || hostname
  // En desarrollo (.local, localhost) usar el hostname real del request (incluye puerto)
  // En producción usar el dominio del tenant con https
  const isDevHost = hostname.includes('localhost') || hostname.includes('.local') || hostname.includes('127.0.0.1')
  const shopUrl = isDevHost ? `http://${hostname}` : `https://${shopDomain}`
  const shopDescription = tenantConfig?.seo?.description || shopName

  const items = productos
    .map((p) => {
      const availability = p.stock_total > 0 ? 'in stock' : 'out of stock'
      const productUrl = `${shopUrl}/producto/${encodeURIComponent(p.sku)}`
      // Las imágenes siempre se sirven desde el backend (API_URL)
      const imageUrl = p.imagen_url
        ? p.imagen_url.startsWith('http')
          ? p.imagen_url
          : `${API_URL}${p.imagen_url}`
        : ''
      // Para productos vendidos por peso, el precio es por kg
      const priceLabel =
        p.tipo_venta_codigo === 'PESO_SUELTO'
          ? `${Math.round(p.precio)} CLP`
          : `${Math.round(p.precio)} CLP`

      return `    <item>
      <g:id>${escapeXml(p.sku)}</g:id>
      <g:title>${escapeXml(p.nombre)}</g:title>
      <g:description>${escapeXml(p.descripcion || p.nombre)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>${
        imageUrl
          ? `
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>`
          : ''
      }
      <g:price>${priceLabel}</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(shopName)}</g:brand>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(shopName)}</title>
    <link>${escapeXml(shopUrl)}</link>
    <description>${escapeXml(shopDescription)}</description>
${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
    },
  })
}
