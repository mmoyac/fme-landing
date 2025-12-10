# 🎨 FME Landing - Masas Estación

Landing page moderna y responsiva para el e-commerce de Masas Estación, construida con Next.js 14, TypeScript y Tailwind CSS.

## ✨ Características

- 🌙 **Dark Mode** con acentos turquesa vibrantes
- 🛒 **Carrito de compras** con persistencia en localStorage
- 📱 **Totalmente responsivo** - Mobile-first design
- ⚡ **Server-Side Rendering** con Next.js 14
- 🎨 **Tailwind CSS** para estilos modernos y personalizables
- 🔄 **Integración API REST** con FastAPI backend

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ instalado
- Backend (`fme-backend`) corriendo en `http://localhost:8000`

### Instalación

1. Navegar al directorio del proyecto:
```bash
cd fme-landing
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Iniciar servidor de desarrollo:
```bash
npm run dev
```

5. Abrir en el navegador: http://localhost:3000

## 📁 Estructura del Proyecto

```
fme-landing/
├── app/                    # App Router de Next.js
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página principal
│   └── globals.css        # Estilos globales
├── components/            # Componentes React
│   ├── Header.tsx         # Navegación con carrito
│   ├── Hero.tsx           # Sección hero con CTA
│   ├── Benefits.tsx       # Beneficios del servicio
│   ├── ProductCatalog.tsx # Catálogo de productos
│   ├── CartSidebar.tsx    # Sidebar del carrito
│   └── Footer.tsx         # Footer
├── context/               # Context API
│   └── CartContext.tsx    # Estado global del carrito
├── public/                # Archivos estáticos
│   └── logo.png          # Logo oficial
├── tailwind.config.js     # Configuración de Tailwind
└── tsconfig.json          # Configuración TypeScript
```

## 🎨 Paleta de Colores

La landing utiliza una paleta turquesa/teal sobre fondo oscuro:

```javascript
colors: {
  primary: 'rgb(94, 200, 242)',    // Turquesa vibrante
  secondary: 'rgb(69, 162, 154)',   // Teal profundo
  background: 'slate-900',          // Fondo oscuro
}
```

## 🔌 Integración con Backend

### Endpoints Consumidos

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/productos/catalogo` | GET | Lista de productos con precios del local WEB |
| `/api/inventario/detalle/{sku}` | GET | Stock por local de un producto |
| `/api/v1/leads/` | POST | Captura de leads (futuro) |

### Ejemplo de Consumo

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const response = await fetch(`${API_URL}/api/productos/catalogo`)
const productos = await response.json()
```

## 🛒 Funcionalidades del Carrito

- **Agregar productos** con selector de cantidad
- **Actualizar cantidades** desde el sidebar
- **Eliminar items** individualmente
- **Persistencia** en localStorage
- **Cálculo automático** de totales
- **Badge** con cantidad de items en header

## 📱 Componentes Principales

### Header
- Logo oficial de Masas Estación
- Navegación responsiva
- Icono de carrito con badge
- Fixed position con backdrop blur

### Hero
- Título principal con gradiente turquesa
- CTA destacado con efecto hover
- Badges de beneficios clave
- Efectos de fondo con radial gradients

### ProductCatalog
- Grid responsivo de productos
- Imágenes placeholder con iconos SVG
- Selector de cantidad integrado
- Botón "Agregar al Carrito" con estados
- Indicador de stock disponible
- Cards con hover effects y bordes luminosos

### CartSidebar
- Overlay con cierre al click fuera
- Lista de items con controles
- Subtotales por producto
- Total general destacado
- Botón de checkout con gradiente
- Animaciones suaves

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Iniciar servidor de producción
npm start

# Linting
npm run lint
```

## 🐳 Despliegue con Docker (Futuro)

El proyecto está preparado para ser desplegado junto con el backend usando Docker Compose:

```yaml
services:
  landing:
    build: ./fme-landing
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    depends_on:
      - backend
```

## 📝 Próximas Funcionalidades

- [ ] Página de checkout con formulario de envío
- [ ] Modal de detalle de producto por local
- [ ] Integración con sistema de leads
- [ ] Galería de imágenes reales de productos
- [ ] Sistema de búsqueda y filtros
- [ ] Animaciones de carga optimizadas
- [ ] Tests unitarios y E2E

## 🤝 Desarrollo

Para contribuir al proyecto:

1. Seguir las convenciones de [AGENTS.md](./AGENTS.md)
2. Mantener el estilo dark mode consistente
3. Usar componentes TypeScript con tipos estrictos
4. Testear en mobile y desktop
5. Asegurar accesibilidad (a11y)

## 📚 Documentación Adicional

- [AGENTS.md](./AGENTS.md) - Guía operacional para agentes de IA
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🐛 Troubleshooting

### La landing no muestra productos

Verificar que:
1. El backend esté corriendo en `http://localhost:8000`
2. La variable `NEXT_PUBLIC_API_URL` esté correcta en `.env.local`
3. El endpoint `/api/productos/catalogo` responda correctamente

### Error de CORS

El backend debe permitir el origen del frontend en la configuración de CORS:

```python
# main.py en fme-backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 📄 Licencia

[Especificar licencia]

---

**Hecho con 💙 por el equipo de Masas Estación**
