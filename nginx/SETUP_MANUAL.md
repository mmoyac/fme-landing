# 🚀 Setup Manual de Desarrollo (Sin Admin)

Si no puedes ejecutar setup-dev.ps1 como administrador, sigue estos pasos:

## Paso 1: Configurar archivo hosts (REQUIERE ADMIN)

Abre PowerShell **como Administrador** (Win + X → Windows PowerShell (Admin)) y ejecuta:

```powershell
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 api.masasestacion.local"
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 masasestacion.local"
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 www.masasestacion.local"
Add-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Value "127.0.0.1 admin.masasestacion.local"
```

O manualmente edita el archivo:
```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```

Y agrega estas líneas al final:
```
127.0.0.1 api.masasestacion.local
127.0.0.1 masasestacion.local
127.0.0.1 www.masasestacion.local
127.0.0.1 admin.masasestacion.local
```

## Paso 2: Levantar servicios (NO requiere admin)

Desde PowerShell normal en la carpeta `nginx/`:

```powershell
cd d:\ProyectosAI\Masas_Estacion\fme-landing\nginx
docker-compose -f docker-compose.dev.yml up -d --build
```

## Paso 3: Esperar que los servicios inicien

```powershell
# Ver logs en tiempo real
docker-compose -f docker-compose.dev.yml logs -f

# O esperar 30-60 segundos
Start-Sleep -Seconds 30
```

## Paso 4: Verificar que funcionan

Abre tu navegador y visita:

- **Landing Page:** http://masasestacion.local
- **Backoffice:** http://admin.masasestacion.local
- **API Docs:** http://api.masasestacion.local/docs

## Comandos útiles

```powershell
# Ver estado de contenedores
docker-compose -f docker-compose.dev.yml ps

# Ver logs específicos
docker-compose -f docker-compose.dev.yml logs backend
docker-compose -f docker-compose.dev.yml logs nginx

# Reiniciar un servicio
docker-compose -f docker-compose.dev.yml restart nginx

# Detener todo
docker-compose -f docker-compose.dev.yml down
```

## Troubleshooting

### Error: "No se puede resolver masasestacion.local"
- Verifica que agregaste las entradas al archivo hosts
- Cierra y reabre el navegador

### Error: "Puerto 80 ya en uso"
```powershell
# Ver qué proceso usa el puerto 80
netstat -ano | findstr :80

# Detener IIS si está corriendo
Stop-Service -Name W3SVC -Force
```

### Error: "Base de datos no conecta"
```powershell
# Esperar más tiempo (PostgreSQL tarda en iniciar)
docker-compose -f docker-compose.dev.yml logs db

# Reiniciar backend
docker-compose -f docker-compose.dev.yml restart backend
```
