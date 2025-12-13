#!/bin/bash
# =====================================================
# Deploy Apps - Crear PostgreSQL y Container Apps
# =====================================================
# Ejecutar en Azure Cloud Shell (Bash)
# =====================================================

set -e

echo ""
echo "========================================"
echo "  DEPLOY APPS - Azure Container Apps"
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
LOCATION="${AZURE_LOCATION}"
REGISTRY_NAME="${AZURE_REGISTRY_NAME}"
REGISTRY_URL="${REGISTRY_NAME}.azurecr.io"
POSTGRES_SERVER="${POSTGRES_SERVER_NAME}"
POSTGRES_USER="${POSTGRES_ADMIN_USER}"
POSTGRES_PASSWORD="${POSTGRES_ADMIN_PASSWORD}"
POSTGRES_DB="${POSTGRES_DB}"
CONTAINER_ENV="${CONTAINER_ENV_NAME}"
JWT_SECRET="${JWT_SECRET}"

# 1. Crear PostgreSQL Flexible Server
echo "[1/5] Verificando PostgreSQL Server..."
PG_EXISTS=$(az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER 2>/dev/null || echo "")
if [ -n "$PG_EXISTS" ]; then
    echo "      PostgreSQL ya existe"
else
    echo "      Creando PostgreSQL Flexible Server (esto toma ~3-5 minutos)..."
    az postgres flexible-server create \
        --resource-group $RESOURCE_GROUP \
        --name $POSTGRES_SERVER \
        --location $LOCATION \
        --admin-user $POSTGRES_USER \
        --admin-password $POSTGRES_PASSWORD \
        --database-name $POSTGRES_DB \
        --sku-name Standard_B1ms \
        --tier Burstable \
        --storage-size 32 \
        --version 16 \
        --public-access 0.0.0.0-255.255.255.255 \
        --yes
    echo "      PostgreSQL creado"
fi

# Obtener hostname del servidor
PG_HOST=$(az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER --query fullyQualifiedDomainName -o tsv)
DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${PG_HOST}:5432/${POSTGRES_DB}?sslmode=require"
echo "      Host: $PG_HOST"

# 2. Crear Container App Environment
echo ""
echo "[2/5] Verificando Container App Environment..."
ENV_EXISTS=$(az containerapp env show --resource-group $RESOURCE_GROUP --name $CONTAINER_ENV 2>/dev/null || echo "")
if [ -n "$ENV_EXISTS" ]; then
    echo "      Environment ya existe"
else
    echo "      Creando Container App Environment..."
    az containerapp env create \
        --name $CONTAINER_ENV \
        --resource-group $RESOURCE_GROUP \
        --location $LOCATION
    echo "      Environment creado"
fi

# 3. Habilitar acceso del registry
echo ""
echo "[3/5] Configurando acceso al Container Registry..."
az acr update --name $REGISTRY_NAME --admin-enabled true
ACR_PASSWORD=$(az acr credential show --name $REGISTRY_NAME --query "passwords[0].value" -o tsv)
echo "      Acceso configurado"

# 4. Desplegar Backend
echo ""
echo "[4/5] Desplegando BACKEND..."
BACKEND_EXISTS=$(az containerapp show --resource-group $RESOURCE_GROUP --name finanzas-backend 2>/dev/null || echo "")
if [ -n "$BACKEND_EXISTS" ]; then
    echo "      Actualizando backend..."
    az containerapp update \
        --name finanzas-backend \
        --resource-group $RESOURCE_GROUP \
        --image "$REGISTRY_URL/backend:latest"
else
    az containerapp create \
        --name finanzas-backend \
        --resource-group $RESOURCE_GROUP \
        --environment $CONTAINER_ENV \
        --image "$REGISTRY_URL/backend:latest" \
        --target-port 3000 \
        --ingress external \
        --registry-server $REGISTRY_URL \
        --registry-username $REGISTRY_NAME \
        --registry-password "$ACR_PASSWORD" \
        --env-vars "DATABASE_URL=$DATABASE_URL" "JWT_SECRET=$JWT_SECRET" "NODE_ENV=production" \
        --cpu 0.5 \
        --memory 1.0Gi \
        --min-replicas 0 \
        --max-replicas 2
fi
BACKEND_URL=$(az containerapp show --resource-group $RESOURCE_GROUP --name finanzas-backend --query "properties.configuration.ingress.fqdn" -o tsv)
echo "      Backend desplegado: https://$BACKEND_URL"

# 5. Desplegar Frontend
echo ""
echo "[5/5] Desplegando FRONTEND..."
FRONTEND_EXISTS=$(az containerapp show --resource-group $RESOURCE_GROUP --name finanzas-frontend 2>/dev/null || echo "")
if [ -n "$FRONTEND_EXISTS" ]; then
    echo "      Actualizando frontend..."
    az containerapp update \
        --name finanzas-frontend \
        --resource-group $RESOURCE_GROUP \
        --image "$REGISTRY_URL/frontend:latest"
else
    az containerapp create \
        --name finanzas-frontend \
        --resource-group $RESOURCE_GROUP \
        --environment $CONTAINER_ENV \
        --image "$REGISTRY_URL/frontend:latest" \
        --target-port 80 \
        --ingress external \
        --registry-server $REGISTRY_URL \
        --registry-username $REGISTRY_NAME \
        --registry-password "$ACR_PASSWORD" \
        --cpu 0.25 \
        --memory 0.5Gi \
        --min-replicas 0 \
        --max-replicas 2
fi
FRONTEND_URL=$(az containerapp show --resource-group $RESOURCE_GROUP --name finanzas-frontend --query "properties.configuration.ingress.fqdn" -o tsv)
echo "      Frontend desplegado: https://$FRONTEND_URL"

echo ""
echo "========================================"
echo "  DEPLOY COMPLETADO"
echo "========================================"
echo ""
echo "  URLS DE ACCESO:"
echo "  Frontend: https://$FRONTEND_URL"
echo "  Backend:  https://$BACKEND_URL"
echo ""
echo "  PostgreSQL: $PG_HOST"
echo ""
echo "[!] NOTA: El frontend debe apuntar al backend."
echo "    Actualiza VITE_API_URL si es necesario y reconstruye."
