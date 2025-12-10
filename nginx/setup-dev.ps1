# Script de PowerShell para configurar entorno de desarrollo
# Requiere privilegios de administrador para modificar el archivo hosts

#Requires -RunAsAdministrator

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Masas de la Estacion - Setup Dev  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$domains = @(
    "127.0.0.1 api.masasestacion.local",
    "127.0.0.1 masasestacion.local",
    "127.0.0.1 www.masasestacion.local",
    "127.0.0.1 admin.masasestacion.local"
)

# Funcion para verificar si Docker esta instalado
function Test-Docker {
    try {
        $null = docker --version
        return $true
    } catch {
        return $false
    }
}

# Verificar Docker
Write-Host "[1/4] Verificando Docker..." -ForegroundColor Yellow
if (-not (Test-Docker)) {
    Write-Host "Error: Docker no esta instalado o no esta en el PATH" -ForegroundColor Red
    Write-Host "   Instala Docker Desktop desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK - Docker instalado correctamente" -ForegroundColor Green
Write-Host ""

# Leer archivo hosts actual
Write-Host "[2/4] Configurando archivo hosts..." -ForegroundColor Yellow
$hostsContent = Get-Content $hostsPath

# Verificar y agregar dominios
$modified = $false
foreach ($domain in $domains) {
    if ($hostsContent -notcontains $domain) {
        Add-Content -Path $hostsPath -Value $domain
        Write-Host "   Agregado: $domain" -ForegroundColor Green
        $modified = $true
    } else {
        Write-Host "   Ya existe: $domain" -ForegroundColor Gray
    }
}

if ($modified) {
    Write-Host "OK - Archivo hosts actualizado" -ForegroundColor Green
} else {
    Write-Host "OK - Archivo hosts ya configurado" -ForegroundColor Green
}
Write-Host ""

# Detener contenedores previos si existen
Write-Host "[3/4] Limpiando contenedores previos..." -ForegroundColor Yellow
$currentPath = Get-Location
Set-Location -Path $PSScriptRoot
docker-compose -f docker-compose.dev.yml down 2>$null
Write-Host "OK - Limpieza completada" -ForegroundColor Green
Write-Host ""

# Levantar servicios
Write-Host "[4/4] Iniciando servicios (esto puede tomar unos minutos)..." -ForegroundColor Yellow
Write-Host "   Building images y creando contenedores..." -ForegroundColor Gray
docker-compose -f docker-compose.dev.yml up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - Servicios iniciados correctamente" -ForegroundColor Green
    Write-Host ""
    
    # Esperar a que los servicios esten listos
    Write-Host "Esperando a que los servicios esten listos (30 segundos)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Mostrar URLs
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "   Servicios disponibles:           " -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Landing Page:       " -NoNewline; Write-Host "http://masasestacion.local" -ForegroundColor Green
    Write-Host "   Backoffice:         " -NoNewline; Write-Host "http://admin.masasestacion.local" -ForegroundColor Green
    Write-Host "   API Backend:        " -NoNewline; Write-Host "http://api.masasestacion.local/docs" -ForegroundColor Green
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Comandos utiles:" -ForegroundColor Yellow
    Write-Host "   Ver logs:        docker-compose -f docker-compose.dev.yml logs -f" -ForegroundColor Gray
    Write-Host "   Detener todo:    docker-compose -f docker-compose.dev.yml down" -ForegroundColor Gray
    Write-Host "   Reiniciar:       docker-compose -f docker-compose.dev.yml restart" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "Error al iniciar servicios" -ForegroundColor Red
    Write-Host "   Revisa los logs con: docker-compose -f docker-compose.dev.yml logs" -ForegroundColor Yellow
    Set-Location -Path $currentPath
    exit 1
}

Set-Location -Path $currentPath
