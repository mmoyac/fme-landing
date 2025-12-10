# ============================================
# Script para Actualizar Imágenes en VPS
# ============================================
# Actualiza las imágenes de Frontend/Backoffice en producción

$VPS_IP = "168.231.96.205"
$VPS_USER = "root"

Write-Host "`n=======================================" -ForegroundColor Cyan
Write-Host "  Actualizando Imágenes en VPS" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/4] Conectando al VPS..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd /root/docker/masas-estacion && echo 'Conectado exitosamente'"

Write-Host "[2/4] Descargando nuevas imágenes..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd /root/docker/masas-estacion && docker compose -f docker-compose.prod.yml pull landing backoffice"

Write-Host "[3/4] Recreando contenedores..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "cd /root/docker/masas-estacion && docker compose -f docker-compose.prod.yml up -d --force-recreate landing backoffice"

Write-Host "[4/4] Verificando estado..." -ForegroundColor Yellow
ssh ${VPS_USER}@${VPS_IP} "docker ps | grep -E 'landing|backoffice'"

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "  Actualización Completada" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Prueba las URLs:" -ForegroundColor Cyan
Write-Host "  - https://masasestacion.cl" -ForegroundColor White
Write-Host "  - https://admin.masasestacion.cl" -ForegroundColor White
Write-Host ""
Write-Host "Ver logs:" -ForegroundColor Cyan
Write-Host "  ssh root@$VPS_IP 'docker logs masas_estacion_frontend -f'" -ForegroundColor White
Write-Host "  ssh root@$VPS_IP 'docker logs masas_estacion_backoffice -f'" -ForegroundColor White
Write-Host ""
