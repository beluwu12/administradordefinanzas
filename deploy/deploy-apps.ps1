# =====================================================
# Deploy Apps - Crear PostgreSQL y Container Apps
# =====================================================
# Ejecutar desde: c:\Users\jerem\personal-finance-app\deploy
# =====================================================

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY APPS - Azure Container Apps" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Cargar variables
if (Test-Path ".\.env.azure") {
    Get-Content ".\.env.azure" | ForEach-Object {
        $line = $_ -replace "^export\s+", ""
        if ($line -match "^([A-Za-z_][A-Za-z0-9_]*)=(.*)$") {
            $varName = $matches[1]
            $varValue = $matches[2] -replace '^"(.*)"$', '$1'
            [Environment]::SetEnvironmentVariable($varName, $varValue)
        }
    }
}
else {
    Write-Host "[ERROR] .env.azure no encontrado" -ForegroundColor Red
    exit 1
}

$RESOURCE_GROUP = $env:AZURE_RESOURCE_GROUP
$LOCATION = $env:AZURE_LOCATION
$REGISTRY_NAME = $env:AZURE_REGISTRY_NAME
$REGISTRY_URL = "$REGISTRY_NAME.azurecr.io"
$POSTGRES_SERVER = $env:POSTGRES_SERVER_NAME
$POSTGRES_USER = $env:POSTGRES_ADMIN_USER
$POSTGRES_PASSWORD = $env:POSTGRES_ADMIN_PASSWORD
$POSTGRES_DB = $env:POSTGRES_DB
$CONTAINER_ENV = $env:CONTAINER_ENV_NAME
$JWT_SECRET = $env:JWT_SECRET

# 1. Crear PostgreSQL Flexible Server
Write-Host "[1/5] Verificando PostgreSQL Server..." -ForegroundColor Yellow
try {
    $pgExists = az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "      PostgreSQL ya existe" -ForegroundColor Green
    }
    else {
        $pgExists = $null
    }
}
catch {
    $pgExists = $null
}
if (-not $pgExists) {
    Write-Host "      Creando PostgreSQL Flexible Server (esto toma ~3-5 minutos)..." -ForegroundColor Yellow
    az postgres flexible-server create `
        --resource-group $RESOURCE_GROUP `
        --name $POSTGRES_SERVER `
        --location $LOCATION `
        --admin-user $POSTGRES_USER `
        --admin-password $POSTGRES_PASSWORD `
        --database-name $POSTGRES_DB `
        --sku-name Standard_B1ms `
        --tier Burstable `
        --storage-size 32 `
        --version 16 `
        --public-access 0.0.0.0-255.255.255.255
    Write-Host "      PostgreSQL creado" -ForegroundColor Green
}

# Obtener hostname del servidor
$pgHost = az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER --query fullyQualifiedDomainName -o tsv
$DATABASE_URL = "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${pgHost}:5432/${POSTGRES_DB}?sslmode=require"
Write-Host "      Host: $pgHost" -ForegroundColor Gray

# 2. Crear Container App Environment
Write-Host "`n[2/5] Verificando Container App Environment..." -ForegroundColor Yellow
try {
    $envExists = az containerapp env show --resource-group $RESOURCE_GROUP --name $CONTAINER_ENV 2>&1
    if ($LASTEXITCODE -ne 0) { $envExists = $null }
}
catch { $envExists = $null }
if ($envExists) {
    Write-Host "      Environment ya existe" -ForegroundColor Green
}
else {
    Write-Host "      Creando Container App Environment..." -ForegroundColor Yellow
    az containerapp env create `
        --name $CONTAINER_ENV `
        --resource-group $RESOURCE_GROUP `
        --location $LOCATION
    Write-Host "      Environment creado" -ForegroundColor Green
}

# 3. Habilitar acceso del registry
Write-Host "`n[3/5] Configurando acceso al Container Registry..." -ForegroundColor Yellow
az acr update --name $REGISTRY_NAME --admin-enabled true
$ACR_PASSWORD = az acr credential show --name $REGISTRY_NAME --query "passwords[0].value" -o tsv
Write-Host "      Acceso configurado" -ForegroundColor Green

# 4. Desplegar Backend
Write-Host "`n[4/5] Desplegando BACKEND..." -ForegroundColor Yellow
try {
    $backendExists = az containerapp show --resource-group $RESOURCE_GROUP --name finanzas-backend 2>&1
    if ($LASTEXITCODE -ne 0) { $backendExists = $null }
}
catch { $backendExists = $null }
if ($backendExists) {
    Write-Host "      Actualizando backend..." -ForegroundColor Yellow
    az containerapp update `
        --name finanzas-backend `
        --resource-group $RESOURCE_GROUP `
        --image "$REGISTRY_URL/backend:latest"
}
else {
    az containerapp create `
        --name finanzas-backend `
        --resource-group $RESOURCE_GROUP `
        --environment $CONTAINER_ENV `
        --image "$REGISTRY_URL/backend:latest" `
        --target-port 3000 `
        --ingress external `
        --registry-server $REGISTRY_URL `
        --registry-username $REGISTRY_NAME `
        --registry-password $ACR_PASSWORD `
        --env-vars "DATABASE_URL=$DATABASE_URL" "JWT_SECRET=$JWT_SECRET" "NODE_ENV=production" `
        --cpu 0.5 `
        --memory 1.0Gi `
        --min-replicas 0 `
        --max-replicas 2
}
$BACKEND_URL = az containerapp show --resource-group $RESOURCE_GROUP --name finanzas-backend --query "properties.configuration.ingress.fqdn" -o tsv
Write-Host "      Backend desplegado: https://$BACKEND_URL" -ForegroundColor Green

# 5. Desplegar Frontend
Write-Host "`n[5/5] Desplegando FRONTEND..." -ForegroundColor Yellow
try {
    $frontendExists = az containerapp show --resource-group $RESOURCE_GROUP --name finanzas-frontend 2>&1
    if ($LASTEXITCODE -ne 0) { $frontendExists = $null }
}
catch { $frontendExists = $null }
if ($frontendExists) {
    Write-Host "      Actualizando frontend..." -ForegroundColor Yellow
    az containerapp update `
        --name finanzas-frontend `
        --resource-group $RESOURCE_GROUP `
        --image "$REGISTRY_URL/frontend:latest"
}
else {
    az containerapp create `
        --name finanzas-frontend `
        --resource-group $RESOURCE_GROUP `
        --environment $CONTAINER_ENV `
        --image "$REGISTRY_URL/frontend:latest" `
        --target-port 80 `
        --ingress external `
        --registry-server $REGISTRY_URL `
        --registry-username $REGISTRY_NAME `
        --registry-password $ACR_PASSWORD `
        --cpu 0.25 `
        --memory 0.5Gi `
        --min-replicas 0 `
        --max-replicas 2
}
$FRONTEND_URL = az containerapp show --resource-group $RESOURCE_GROUP --name finanzas-frontend --query "properties.configuration.ingress.fqdn" -o tsv
Write-Host "      Frontend desplegado: https://$FRONTEND_URL" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DEPLOY COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n  URLS DE ACCESO:" -ForegroundColor White
Write-Host "  Frontend: https://$FRONTEND_URL" -ForegroundColor Green
Write-Host "  Backend:  https://$BACKEND_URL" -ForegroundColor Green
Write-Host "`n  PostgreSQL: $pgHost" -ForegroundColor Gray
Write-Host "`n[!] NOTA: El frontend necesita saber la URL del backend." -ForegroundColor Yellow
Write-Host "    Actualiza VITE_API_URL en el build del frontend si es necesario." -ForegroundColor Yellow
