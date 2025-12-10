# 🔒 Nginx + SSL Configuration - Masas de la Estación

Solución completa de reverse proxy con Nginx y Let's Encrypt para el e-commerce Masas de la Estación.

## 🎯 ¿Qué Resuelve Esto?

**Antes:**
- ❌ Conexiones HTTP sin cifrar
- ❌ 3 puertos expuestos directamente (8001, 3000, 3001)
- ❌ Acceso por IP pública (168.231.96.205:puerto)
- ❌ Sin protección contra ataques

**Después:**
- ✅ Conexiones HTTPS cifradas con Let's Encrypt
- ✅ Solo 2 puertos expuestos (80, 443)
- ✅ Acceso por dominios profesionales
- ✅ Rate limiting, compresión gzip, headers de seguridad
- ✅ Renovación automática de certificados
- ✅ Red interna aislada (servicios no expuestos)

---

## 🚀 Modo Desarrollo (Local)

### Requisitos

- Windows con PowerShell
- Docker Desktop instalado
- Privilegios de administrador

### Pasos

1. **Abrir PowerShell como Administrador**
   ```powershell
   # Click derecho en PowerShell → Ejecutar como Administrador
   ```

2. **Navegar a la carpeta nginx**
   ```powershell
   cd d:\ProyectosAI\Masas_Estacion\fme-landing\nginx
   ```

3. **Ejecutar el script de setup**
   ```powershell
   .\setup-dev.ps1
   ```

El script automáticamente:
- ✅ Configura el archivo `hosts` con los dominios locales
- ✅ Construye las imágenes Docker
- ✅ Levanta todos los servicios
- ✅ Muestra las URLs de acceso

### URLs de Desarrollo

Después de ejecutar el script, accede a:

- **Landing Page:** http://masasestacion.local
- **Backoffice:** http://admin.masasestacion.local
- **API Docs:** http://api.masasestacion.local/docs

### Comandos Útiles (Desarrollo)

```powershell
# Ver logs en tiempo real
docker-compose -f docker-compose.dev.yml logs -f

# Ver logs de un servicio específico
docker-compose -f docker-compose.dev.yml logs -f nginx
docker-compose -f docker-compose.dev.yml logs -f backend

# Reiniciar un servicio
docker-compose -f docker-compose.dev.yml restart nginx

# Detener todo
docker-compose -f docker-compose.dev.yml down

# Detener y eliminar volúmenes (reset completo)
docker-compose -f docker-compose.dev.yml down -v
```

---

## 🌐 Modo Producción (VPS)

### Requisitos Previos

1. **Dominios configurados** con registros DNS tipo A:
   ```
   api.masasestacion.cl      → 168.231.96.205
   masasestacion.cl          → 168.231.96.205
   www.masasestacion.cl      → 168.231.96.205
   admin.masasestacion.cl    → 168.231.96.205
   ```

2. **Puertos abiertos** en el firewall del VPS:
   - Puerto 80 (HTTP)
   - Puerto 443 (HTTPS)

3. **Email válido** para notificaciones de Let's Encrypt

### Pasos de Despliegue

Ver el archivo **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** para instrucciones detalladas paso a paso.

**Resumen rápido:**

1. Copiar carpeta `nginx/` al VPS
2. Crear archivo `.env.prod` con tus dominios
3. Ejecutar `validate-setup.sh` para verificar configuración
4. Ejecutar `init-letsencrypt.sh` para obtener certificados SSL
5. Levantar servicios con `docker-compose.prod-nginx.yml`

---

## 📁 Estructura de Archivos

```
nginx/
├── nginx.conf                    # Configuración base de Nginx
├── conf.d/
│   ├── dev.conf                 # Config desarrollo (HTTP)
│   └── prod.conf.template       # Config producción (HTTPS)
├── docker-compose.dev.yml       # Compose para desarrollo
├── docker-compose.prod-nginx.yml # Compose para producción
├── .env.dev                     # Variables desarrollo
├── .env.prod.example            # Template variables producción
├── setup-dev.ps1                # Script setup Windows
├── init-letsencrypt.sh          # Script obtención SSL
├── validate-setup.sh            # Script validación pre-deploy
├── README.md                    # Este archivo
├── MIGRATION_GUIDE.md           # Guía paso a paso
└── COMMANDS.md                  # Referencia rápida comandos
```

---

## 🔧 Arquitectura

### Desarrollo (HTTP)
```
Navegador → localhost:80 (Nginx) → backend:8000
                                 → landing:3000
                                 → backoffice:3000
```

### Producción (HTTPS)
```
Internet → VPS:443 (Nginx SSL) → backend:8000 (red interna)
                                → landing:3000 (red interna)
                                → backoffice:3000 (red interna)
         → Certbot (renovación automática cada 12h)
```

---

## 🛡️ Características de Seguridad

- **SSL/TLS:** Certificados gratuitos de Let's Encrypt
- **Rate Limiting:** 
  - API: 10 req/s con burst de 20
  - General: 30 req/s con burst de 50
- **Security Headers:**
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
  - `X-XSS-Protection: 1; mode=block`
  - `server_tokens: off` (oculta versión de Nginx)
- **Gzip Compression:** Reduce ancho de banda
- **Red Aislada:** Servicios no expuestos directamente
- **Auto-renovación:** Certbot renueva certificados automáticamente

---

## 🐛 Troubleshooting

### Problema: "No se puede resolver api.masasestacion.local"

**Solución:**
Verificar que el archivo hosts fue modificado correctamente:
```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```

Debe contener:
```
127.0.0.1 api.masasestacion.local
127.0.0.1 masasestacion.local
127.0.0.1 www.masasestacion.local
127.0.0.1 admin.masasestacion.local
```

### Problema: "Puerto 80 ya en uso"

**Solución:**
Detener IIS o cualquier servidor web local:
```powershell
# Detener IIS
Stop-Service -Name W3SVC -Force

# O encontrar qué proceso usa el puerto 80
netstat -ano | findstr :80
```

### Problema: "Error de conexión a la base de datos"

**Solución:**
Esperar a que PostgreSQL esté listo (healthcheck toma ~30 segundos):
```powershell
docker-compose -f docker-compose.dev.yml logs db
```

### Problema: Next.js no recarga automáticamente

**Solución:**
Los cambios en código Next.js deberían recargar automáticamente. Si no funciona:
```powershell
docker-compose -f docker-compose.dev.yml restart landing
# o
docker-compose -f docker-compose.dev.yml restart backoffice
```

---

## 📚 Documentación Adicional

- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Guía completa de migración a producción
- **[COMMANDS.md](./COMMANDS.md)** - Referencia rápida de comandos
- **[SUMMARY.md](./SUMMARY.md)** - Resumen ejecutivo de la solución

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs:
   ```powershell
   docker-compose -f docker-compose.dev.yml logs -f
   ```

2. Verifica el estado de los servicios:
   ```powershell
   docker-compose -f docker-compose.dev.yml ps
   ```

3. Consulta la documentación en los archivos `.md`

---

**Última actualización:** 2025-11-25
