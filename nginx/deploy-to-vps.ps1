# ============================================
# Script de Deploy a VPS
# ============================================
# Copia archivos de configuración Nginx al VPS

$VPS_IP = "168.231.96.205"
$VPS_USER = "root"
$VPS_PATH = "/root/docker/masas-estacion"

Write-Host "`n=======================================" -ForegroundColor Cyan
Write-Host "  Deploy Nginx Config a VPS" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "VPS: $VPS_IP" -ForegroundColor Yellow
Write-Host "Path: $VPS_PATH" -ForegroundColor Yellow
Write-Host ""

# Verificar que estamos en el directorio correcto
if (!(Test-Path "nginx.conf")) {
    Write-Host "Error: Ejecuta este script desde fme-landing/nginx/" -ForegroundColor Red
    exit 1
}

Write-Host "[1/5] Creando directorio nginx/ en VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "mkdir -p ${VPS_PATH}/nginx/conf.d ${VPS_PATH}/nginx/certbot/conf ${VPS_PATH}/nginx/certbot/www"

Write-Host "[2/5] Copiando nginx.conf..." -ForegroundColor Yellow
scp nginx.conf ${VPS_USER}@${VPS_IP}:${VPS_PATH}/nginx/

Write-Host "[3/5] Copiando conf.d/prod.conf..." -ForegroundColor Yellow
scp conf.d/prod.conf ${VPS_USER}@${VPS_IP}:${VPS_PATH}/nginx/conf.d/

Write-Host "[4/5] Copiando docker-compose.prod-nginx.yml..." -ForegroundColor Yellow
scp docker-compose.prod-nginx.yml ${VPS_USER}@${VPS_IP}:${VPS_PATH}/nginx/

Write-Host "[5/5] Copiando .env.prod e init-letsencrypt.sh..." -ForegroundColor Yellow
scp .env.prod ${VPS_USER}@${VPS_IP}:${VPS_PATH}/nginx/
scp init-letsencrypt.sh ${VPS_USER}@${VPS_IP}:${VPS_PATH}/nginx/

Write-Host ""
Write-Host "Dando permisos de ejecucion a init-letsencrypt.sh..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "chmod +x ${VPS_PATH}/nginx/init-letsencrypt.sh"

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "  Archivos copiados exitosamente" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verificando estructura en VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "ls -la ${VPS_PATH}/nginx/"
Write-Host ""
ssh ${VPS_USER}@${VPS_IP} "ls -la ${VPS_PATH}/nginx/conf.d/"

Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Cyan
Write-Host "  1. ssh root@$VPS_IP" -ForegroundColor White
Write-Host "  2. cd $VPS_PATH/nginx" -ForegroundColor White
Write-Host "  3. ./init-letsencrypt.sh" -ForegroundColor White
Write-Host "  4. docker-compose -f docker-compose.prod-nginx.yml build landing backoffice" -ForegroundColor White
Write-Host "  5. docker-compose -f docker-compose.prod-nginx.yml up -d" -ForegroundColor White
Write-Host ""
