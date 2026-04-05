# fme-landing — Documentación para IA

## Contexto del proyecto

Landing pública de **Masas Estación** (`masasestacion.cl`). Es un proyecto Next.js 14 (App Router) que actúa como vitrina de productos y punto de entrada al e-commerce.

El backend es una API FastAPI separada en `fme-backend`, accesible desde el env `NEXT_PUBLIC_API_URL`. El landing consume esa API para obtener configuración del tenant, catálogo de productos y datos de checkout.

---

## Google Merchant Center — Feed de productos

### Ubicación

```
app/feed.xml/route.ts  →  https://masasestacion.cl/feed.xml
```

Ruta dinámica de Next.js que genera un XML en formato RSS 2.0 compatible con Google Merchant Center (namespace `xmlns:g="http://base.google.com/ns/1.0"`).

### Fuente de datos

El feed consume dos endpoints del backend:

| Endpoint | Uso |
|---|---|
| `GET /api/config/landing` | Nombre del tenant, dominio, branding, SEO |
| `GET /api/productos/catalogo` | Lista de productos con stock |

Ambos reciben el header `X-Forwarded-Host` para resolución multi-tenant.

### Atributos que se publican por producto

| Atributo Google | Fuente en backend | Notas |
|---|---|---|
| `g:id` | `producto.sku` | Identificador único. Es un número (ej: `10132`). Coincide con la URL del producto. |
| `g:title` | `producto.nombre` | |
| `g:description` | `producto.descripcion` o `nombre` si está vacía | |
| `g:link` | `https://masasestacion.cl/producto/{sku}` | |
| `g:image_link` | `producto.imagen_url` | Se sirve desde `api.masasestacion.cl/static/productos/{sku}.png` |
| `g:price` | `producto.precio` | En CLP, redondeado. Formato: `2800 CLP` |
| `g:availability` | `producto.stock_total > 0` → `"in stock"` / `"out of stock"` | |
| `g:quantity` | `producto.stock_total` | Entero, mínimo 0. Necesario para que Merchant Center no marque "Faltan datos de inventario" |
| `g:condition` | Siempre `"new"` | |
| `g:brand` | Nombre comercial del tenant | |

### Historial de cambios relevantes

- **2026-04-05**: Se agregó `g:quantity` para resolver el error "Faltan datos de inventario" en Google Merchant Center. Sin este atributo, Google marcaba productos con "Disponibilidad limitada" aunque `g:availability` estuviera correcta.

### Reglas de negocio

- Los productos con `tipo_venta_codigo = "PESO_SUELTO"` se venden por kg. El precio en el feed es el precio por kg (sin etiqueta diferenciada por ahora).
- El campo `g:id` usa el SKU numérico del producto, no un slug de texto. Las URLs de producto también usan el SKU: `/producto/10132`.
- Las imágenes siempre se sirven desde el backend (`api.masasestacion.cl`), nunca desde el dominio del landing.

### Configuración en Google Merchant Center

- **Una sola fuente de datos** registrada apuntando a `https://masasestacion.cl/feed.xml`.
- No hay feed de inventario suplementario.
- El campo de identificación de productos es `g:id` (SKU numérico).

---

## Estructura de rutas relevantes

```
app/
  feed.xml/route.ts        # Feed Google Merchant Center
  producto/[sku]/page.tsx  # Página individual de producto (con OG meta tags)
  checkout/                # Flujo de pago
  confirmacion/            # Confirmación post-pago
  politica-devoluciones/   # Política de devoluciones
```

---

## Variables de entorno

| Variable | Uso |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL base del backend FastAPI |

En producción apunta a `https://api.masasestacion.cl`.
