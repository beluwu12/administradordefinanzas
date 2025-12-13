#!/bin/bash
# =====================================================
# Backup - Respaldo de PostgreSQL
# =====================================================
# Ejecutar en Azure Cloud Shell (Bash)
# =====================================================

set -e

echo ""
echo "========================================"
echo "  BACKUP - PostgreSQL Database"
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
POSTGRES_SERVER="${POSTGRES_SERVER_NAME}"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="backup-$TIMESTAMP"

echo "[1/1] Creando backup de PostgreSQL..."
echo "      Servidor: $POSTGRES_SERVER"

# Crear backup usando Azure CLI
az postgres flexible-server backup create \
    --resource-group $RESOURCE_GROUP \
    --name $POSTGRES_SERVER \
    --backup-name $BACKUP_NAME

echo ""
echo "========================================"
echo "  BACKUP COMPLETADO"
echo "========================================"
echo ""
echo "  Nombre del backup: $BACKUP_NAME"
echo "  Servidor: $POSTGRES_SERVER"
echo ""
echo "  Para ver backups:"
echo "  az postgres flexible-server backup list --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER"
echo ""
echo "  Para restaurar:"
echo "  az postgres flexible-server restore --resource-group $RESOURCE_GROUP --name nuevo-servidor --source-server $POSTGRES_SERVER --restore-point-in-time <timestamp>"
