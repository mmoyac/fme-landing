#!/bin/bash

# ============================================
# Script de Inicialización Let's Encrypt
# ============================================
# Este script obtiene certificados SSL para todos los dominios
# Debe ejecutarse UNA VEZ después de configurar DNS

set -e

# Configuración
domains=(api.masasestacion.cl masasestacion.cl www.masasestacion.cl admin.masasestacion.cl)
rsa_key_size=4096
data_path="./certbot"
email="contacto@masasestacion.cl"  # Cambiar a email real
staging=0  # Cambiar a 1 para testing con staging

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  Let's Encrypt - Inicialización SSL${NC}"
echo -e "${GREEN}=======================================${NC}"
echo ""

# Verificar que docker-compose esté instalado
if ! [ -x "$(command -v docker-compose)" ]; then
  echo -e "${RED}Error: docker-compose no está instalado.${NC}" >&2
  exit 1
fi

# Verificar que Nginx esté corriendo
if [ ! "$(docker ps -q -f name=masas_estacion_nginx)" ]; then
    echo -e "${YELLOW}Nginx no está corriendo. Iniciando servicios...${NC}"
    docker-compose -f docker-compose.prod-nginx.yml up -d nginx
    echo -e "${GREEN}Esperando 10 segundos para que Nginx inicie...${NC}"
    sleep 10
fi

# Crear directorios necesarios
echo -e "${YELLOW}Creando estructura de directorios...${NC}"
mkdir -p "$data_path/conf/live"
mkdir -p "$data_path/www"

# Verificar DNS antes de continuar
echo -e "${YELLOW}Verificando DNS de los dominios...${NC}"
for domain in "${domains[@]}"; do
    echo -n "  Verificando $domain... "
    if host $domain | grep -q "168.231.96.205"; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAIL${NC}"
        echo -e "${RED}Error: $domain no apunta a 168.231.96.205${NC}"
        echo -e "${YELLOW}Por favor configura el DNS en Cloudflare primero.${NC}"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}DNS verificado correctamente.${NC}"
echo ""

# Determinar si es staging o producción
if [ $staging != "0" ]; then
  staging_arg="--staging"
  echo -e "${YELLOW}Modo: STAGING (certificados de prueba)${NC}"
else
  staging_arg=""
  echo -e "${GREEN}Modo: PRODUCCIÓN (certificados reales)${NC}"
fi

echo ""
echo -e "${YELLOW}Obteniendo certificados para los siguientes dominios:${NC}"
for domain in "${domains[@]}"; do
    echo "  - $domain"
done
echo ""

# Obtener certificado para API
echo -e "${YELLOW}[1/3] Obteniendo certificado para api.masasestacion.cl...${NC}"
docker-compose -f docker-compose.prod-nginx.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    --email $email \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d api.masasestacion.cl" certbot
echo -e "${GREEN}Certificado API obtenido.${NC}"
echo ""

# Obtener certificado para Landing (con www)
echo -e "${YELLOW}[2/3] Obteniendo certificado para masasestacion.cl + www...${NC}"
docker-compose -f docker-compose.prod-nginx.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    --email $email \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d masasestacion.cl \
    -d www.masasestacion.cl" certbot
echo -e "${GREEN}Certificado Landing obtenido.${NC}"
echo ""

# Obtener certificado para Backoffice
echo -e "${YELLOW}[3/3] Obteniendo certificado para admin.masasestacion.cl...${NC}"
docker-compose -f docker-compose.prod-nginx.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    --email $email \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d admin.masasestacion.cl" certbot
echo -e "${GREEN}Certificado Backoffice obtenido.${NC}"
echo ""

# Recargar Nginx
echo -e "${YELLOW}Recargando configuración de Nginx...${NC}"
docker-compose -f docker-compose.prod-nginx.yml exec nginx nginx -s reload

echo ""
echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}  Certificados SSL obtenidos exitosamente${NC}"
echo -e "${GREEN}=======================================${NC}"
echo ""
echo -e "${GREEN}Próximos pasos:${NC}"
echo "  1. Verificar certificados: ls -la $data_path/conf/live/"
echo "  2. Reiniciar Nginx: docker-compose -f docker-compose.prod-nginx.yml restart nginx"
echo "  3. Probar HTTPS: curl -I https://api.masasestacion.cl"
echo ""
echo -e "${YELLOW}Nota: Los certificados se renovarán automáticamente cada 12 horas.${NC}"
