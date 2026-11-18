# Project Context — fme-landing

## Purpose

Landing pública de **Masas Estación** (`masasestacion.cl`). Proyecto Next.js 14 (App Router)
que actúa como vitrina de productos y punto de entrada al e-commerce: catálogo, ficha de
producto, checkout (Mercado Pago), confirmación de pedido y seguimiento por token.

Es **uno de los repositorios** del sistema Masas Estación. Ver "Sistema general" abajo.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript 5
- **Estilos**: Tailwind CSS 3.4 + PostCSS / Autoprefixer
- **Pagos**: `@mercadopago/sdk-react` (Brick de pago)
- **Lint**: ESLint 8 (`eslint-config-next`)
- **Dev server**: `next dev -H 0.0.0.0` (`npm run dev`)

## Sistema general (multi-repo)

El workspace `Masas_Estacion/` contiene varios repos independientes (cada uno su propio git):

| Repo | Rol | Stack |
|---|---|---|
| `fme-landing` | Landing pública / e-commerce (este repo) | Next.js 14 |
| `fme-backend` | API central multi-tenant | FastAPI |
| `fme-backoffice` | Panel de administración (pedidos, catálogo, etiquetas, cobranza) | — |
| `fme-pos` | Punto de venta | — |

El landing **no tiene base de datos propia**: consume la API de `fme-backend` vía
`NEXT_PUBLIC_API_URL` (en prod `https://api.masasestacion.cl`). La resolución multi-tenant
se hace por el header `X-Forwarded-Host`.

## Estructura de rutas (App Router)

```
app/
  page.tsx                  # Home / catálogo
  layout.tsx                # Layout raíz + metadata
  producto/[sku]/page.tsx   # Ficha de producto (OG meta tags)
  checkout/                 # Flujo de pago (success | failure | pending)
  confirmacion/             # Confirmación post-pago
  seguimiento/[token]/      # Seguimiento de pedido por token
  politica-devoluciones/    # Política de devoluciones
  feed.xml/route.ts         # Feed Google Merchant Center (RSS 2.0)
components/                 # Header, Hero, ProductCatalog, CartSidebar, MercadoPagoBrick, etc.
lib/api/                    # Clientes de la API backend (p. ej. pedidos.ts)
```

## Capacidades destacadas

### Feed Google Merchant Center (`app/feed.xml/route.ts`)
Genera XML RSS 2.0 (`xmlns:g`) en `https://masasestacion.cl/feed.xml`. Consume
`GET /api/config/landing` (branding/SEO) y `GET /api/productos/catalogo` (productos+stock).
Publica `g:id` (= SKU numérico), `g:title`, `g:description`, `g:link`, `g:image_link`,
`g:price` (CLP), `g:availability`, `g:quantity` (stock total, evita "Faltan datos de
inventario"), `g:condition` (`new`), `g:brand`.

> Detalle histórico y reglas en `Agent.md` (raíz del repo).

## Convenciones

- **Idioma**: código y docs en español; nombres de identificadores en español cuando ya
  existen en el dominio (ej. `pedidos`, `producto.sku`).
- **SKU como identificador**: las fichas de producto e IDs del feed usan el SKU numérico
  (`/producto/10132`), no slugs de texto.
- **Imágenes**: siempre desde el backend (`api.masasestacion.cl/static/productos/{sku}.png`),
  nunca desde el dominio del landing.
- **Productos `PESO_SUELTO`**: se venden por kg; el precio mostrado es por kg.

## Variables de entorno

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base del backend FastAPI (prod: `https://api.masasestacion.cl`) |

## Eficiencia (ver `CLAUDE.md`)

Localizar con Grep/Glob antes de leer; leer con offset/limit; no releer lo que ya está en
contexto; búsquedas en paralelo.
