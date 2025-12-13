#!/bin/bash
# =====================================================
# Setup Azure - Verificar recursos existentes
# =====================================================
# Ejecutar en Azure Cloud Shell (Bash)
# =====================================================

set -e

echo ""
echo "========================================"
echo "  SETUP AZURE - Finanzas App"
echo "========================================"
echo ""

# Cargar variables de entorno
if [ -f ".env.azure" ]; then
    source .env.azure
    echo "[OK] Variables cargadas de .env.azure"
else
    echo "[!] Copia .env.azure.example a .env.azure y configura los valores"
    exit 1
fi

# Variables
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP}"
LOCATION="${AZURE_LOCATION}"
REGISTRY_NAME="${AZURE_REGISTRY_NAME}"

# 1. Verificar Azure CLI (en Cloud Shell siempre está disponible)
echo ""
echo "[1/3] Verificando Azure CLI..."
az version --query '"azure-cli"' -o tsv
echo "      Azure CLI disponible"

# 2. Verificar cuenta activa
echo ""
echo "[2/3] Verificando cuenta Azure..."
ACCOUNT_NAME=$(az account show --query "name" -o tsv)
USER_NAME=$(az account show --query "user.name" -o tsv)
echo "      Conectado como: $USER_NAME"
echo "      Suscripción: $ACCOUNT_NAME"

# 3. Verificar Resource Group existente
echo ""
echo "[3/3] Verificando Resource Group '$RESOURCE_GROUP'..."
RG_EXISTS=$(az group exists --name $RESOURCE_GROUP)
if [ "$RG_EXISTS" = "true" ]; then
    echo "      Resource Group existe"
else
    echo "      Creando Resource Group..."
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo "      Resource Group creado"
fi

# 4. Verificar Container Registry
echo ""
echo "[4/3] Verificando Container Registry '$REGISTRY_NAME'..."
ACR_EXISTS=$(az acr show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP 2>/dev/null || echo "")
if [ -n "$ACR_EXISTS" ]; then
    echo "      Container Registry existe"
    echo "      Iniciando sesión en el registry..."
    az acr login --name $REGISTRY_NAME
    echo "      Login exitoso"
else
    echo "      Creando Container Registry..."
    az acr create --resource-group $RESOURCE_GROUP --name $REGISTRY_NAME --sku Basic
    az acr login --name $REGISTRY_NAME
    echo "      Container Registry creado"
fi

echo ""
echo "========================================"
echo "  SETUP COMPLETADO"
echo "========================================"
echo ""
echo "Siguiente paso: ./build-and-push.sh"
