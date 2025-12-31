# 🎨 AGENTS.MD: Frontend Landing Page - Guía Operacional (Next.js & Docker)

Este documento es el manual de operaciones y contexto esencial para la **Landing Page** del e-commerce. La aplicación es un **Next.js** que consume la API REST de FastAPI (`fme-backend`) y **se despliega usando Docker**.

---

## 1. ⚙️ Arquitectura y Stack Tecnológico

El Frontend está diseñado para ser desplegado en un entorno de contenedores junto con el backend, priorizando la velocidad y el SEO.

| Componente | Tecnología | Rol |
| :--- | :--- | :--- |
| **Framework** | **Next.js (React)** | Construcción de la interfaz, *routing*, y SSR/SSG. |
| **Estilos** | **Tailwind CSS** | Framework CSS utilitario para diseño rápido y responsivo. |
| **Consumo de API** | **Fetch API / Axios** | Conexión a los endpoints de FastAPI. |
| **Orquestación** | **Docker / Docker Compose** | Despliegue y ejecución en producción/staging. |

---

## 2. 🔌 Integración con la API (Backend FastAPI)

### 2.1. URL Base de la API

La comunicación utiliza la IP pública del VPS para acceso desde el navegador del cliente.

| Contexto | Variable de Entorno | Valor a Usar |
| :--- | :--- | :--- |
| **Local (Desarrollo)** | `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |
| **Docker (Producción)** | `NEXT_PUBLIC_API_URL` | `http://168.231.96.205:8001` |

**Nota Importante:** Las variables `NEXT_PUBLIC_*` se incrustan durante el build de Next.js y no pueden cambiarse en runtime.

### 2.2. Consumo de Endpoints Críticos

Las funciones de conexión y los *schemas* de datos deben estar centralizados en el directorio **`context/`**.

| Funcionalidad | Método | Endpoint (Backend) | Propósito en Landing |
| :--- | :--- | :--- | :--- |
| **Catálogo** | `GET` | `/api/productos/catalogo` | Listado de productos con precios, stock y puntos de fidelización del local WEB. |
| **Crear Pedido** | `POST` | `/api/pedidos/` | Crear pedido desde el checkout con datos del cliente y cálculo de puntos. |

**Nota:** El endpoint `/api/productos/catalogo` devuelve productos con precios del local WEB (codigo='WEB') y stock total agregado de todos los locales físicos.

### 2.3. Directrices de Carga de Datos

* **Rendimiento:** Utilizar la carga de datos del servidor de Next.js (SSR/SSG/Server Components) para las secciones críticas (ej. catálogo de productos) y mejorar el SEO.
* **Tipado:** Los *schemas* de datos del frontend deben coincidir con los *schemas* Pydantic del backend.

---

## 3. 📄 Estructura y Reglas de Negocio

### 3.1. Estructura de la Landing Page

La Landing debe ser una página única enfocada en la promoción y la conversión, dividida en secciones claras (Hero, Productos, Propuesta de Valor, Formulario de Lead, Footer).

### 3.2. Reglas de Negocio en Frontend

* **Stock:** Si el campo `stock_total` del resumen de inventario es **cero**, el botón de compra o CTA asociado al producto debe ser visiblemente **deshabilitado** o transformado a **"Sin Stock / Próximamente"**.
* **Diseño:** Implementar el diseño *mobile-first* y asegurar **Perfecta Responsividad** utilizando **Tailwind CSS**.

---

## 4. 🧪 Tests End-to-End (Pendiente)

### 4.1. Estado Actual

**⏳ Tests E2E pendientes de implementación**

La landing está funcional, pero se recomienda agregar tests E2E para validar el flujo completo del usuario.

### 4.2. Tests E2E Recomendados (Playwright/Cypress)

#### Flujo de Cliente:
1. **Navegación y Catálogo**
   - [ ] Cargar página principal
   - [ ] Ver lista de productos con precios
   - [ ] Ver indicador de stock (disponible/agotado)
   - [ ] Hacer clic en "Agregar al carrito"

2. **Carrito de Compras**
   - [ ] Ver productos en carrito
   - [ ] Ajustar cantidades
   - [ ] Eliminar productos
   - [ ] Ver total calculado correctamente

3. **Checkout**
   - [ ] Llenar formulario de datos (nombre, email, teléfono)
   - [ ] Llenar dirección de entrega
   - [ ] Validar campos requeridos
   - [ ] Enviar pedido
   - [ ] Ver confirmación con número de pedido

#### Validaciones Críticas:
- [ ] Botón deshabilitado cuando producto sin stock
- [ ] No permitir checkout con carrito vacío
- [ ] Validar formato de email y teléfono
- [ ] Mostrar errores de API (stock agotado durante checkout)

#### Configuración Sugerida:

```bash
# Instalar Playwright
npm install --save-dev @playwright/test

# Inicializar configuración
npx playwright install
```

**Nota:** El backend tiene 32 tests automatizados (5 específicos de pedidos) que validan la lógica de negocio consumida por la landing.

---

## 5. 🐳 Despliegue y Comandos de Docker

El despliegue del Frontend se realiza creando una imagen optimizada de Next.js mediante un *build* multi-etapa, definida en su propio **`Dockerfile.prod`**.

### 5.1. Comandos de Producción

```bash
# Build para producción
docker build -t mmoyac/masas-estacion-frontend:latest -f Dockerfile.prod .

# Push a Docker Hub
docker push mmoyac/masas-estacion-frontend:latest

# Desplegar en VPS
ssh root@168.231.96.205 "cd docker/masas-estacion && \
  docker compose -f docker-compose.prod.yml pull landing && \
  docker compose -f docker-compose.prod.yml up -d landing"

# Ver logs en producción
ssh root@168.231.96.205 "docker logs masas_estacion_frontend --tail 50"
```

### 5.2. Configuración de Producción

**Docker Hub:**
- Imagen: `mmoyac/masas-estacion-frontend:latest`
- Puerto: 3000 (público y interno)

**VPS:**
- URL: http://168.231.96.205:3000
- Estado: ✅ Operativo

**Configuración docker-compose.prod.yml:**
```yaml
landing:
  image: mmoyac/masas-estacion-frontend:latest
  container_name: masas_estacion_frontend
  restart: always
  ports:
    - "3000:3000"
  environment:
    NEXT_PUBLIC_API_URL: http://168.231.96.205:8001
    NODE_ENV: production
  healthcheck:
    test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

### 5.3. Variables de Entorno Requeridas

**Archivo `.env.production` (crítico para el build):**
```bash
NEXT_PUBLIC_API_URL=http://168.231.96.205:8001
```

**Importante:** Este archivo debe existir antes del build. Las variables `NEXT_PUBLIC_*` se incrustan en el JavaScript compilado y no pueden cambiarse después del build.

---

**Última Actualización:** 2025-12-31  
**Cambios Recientes:**
- ✅ Despliegue en producción (VPS 168.231.96.205:3000)
- ✅ Imagen Docker publicada en Docker Hub
- ✅ Endpoint `/api/productos/catalogo` implementado con información de categorías
- ✅ Local WEB (codigo='WEB') configurado para precios
- ✅ Catálogo mostrando 16 productos con precios, stock e información de puntos
- ✅ Sistema de Puntos de Fidelización integrado en catálogo y checkout
- ✅ Carrito de compras con cálculo automático de puntos por categoría

**Docker Hub:** `https://hub.docker.com/r/mmoyac/masas-estacion-frontend`  
**Estado MVP:** ✅ **Desplegado y operativo en producción**
