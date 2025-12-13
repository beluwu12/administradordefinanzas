#!/bin/bash
# =====================================================
# Build and Push - Construir imágenes Docker
# =====================================================
# Ejecutar en Azure Cloud Shell (Bash)
# Nota: Cloud Shell tiene Docker, pero para build usamos ACR Tasks
# =====================================================

set -e

echo ""
echo "========================================"
echo "  BUILD AND PUSH - Docker Images"
echo "========================================"
echo ""

# Cargar variables
if [ -f ".env.azure" ]; then
    source .env.azure
else
    echo "[ERROR] .env.azure no encontrado"
    exit 1
fi

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP}"
REGISTRY_NAME="${AZURE_REGISTRY_NAME}"
REGISTRY_URL="${REGISTRY_NAME}.azurecr.io"

echo "Registry: $REGISTRY_URL"
echo ""

# Nota: En Azure Cloud Shell usamos ACR Tasks para build
# porque Docker daemon no está disponible directamente

# 1. Construir Backend con ACR Tasks
echo "[1/2] Construyendo imagen BACKEND con ACR Tasks..."
az acr build \
    --registry $REGISTRY_NAME \
    --resource-group $RESOURCE_GROUP \
    --image backend:latest \
    --file server/Dockerfile \
    ./server
echo "      Backend construido y subido"

# 2. Construir Frontend con ACR Tasks  
echo ""
echo "[2/2] Construyendo imagen FRONTEND con ACR Tasks..."
az acr build \
    --registry $REGISTRY_NAME \
    --resource-group $RESOURCE_GROUP \
    --image frontend:latest \
    --file client/Dockerfile \
    .
echo "      Frontend construido y subido"

echo ""
echo "========================================"
echo "  BUILD AND PUSH COMPLETADO"
echo "========================================"
echo ""
echo "Imágenes disponibles en: $REGISTRY_URL"
echo "  - $REGISTRY_URL/backend:latest"
echo "  - $REGISTRY_URL/frontend:latest"
echo ""
echo "Siguiente paso: ./deploy-apps.sh"
