# =====================================================
# Setup Azure - Verificar recursos existentes
# =====================================================
# Ejecutar desde: c:\Users\jerem\personal-finance-app\deploy
# =====================================================

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SETUP AZURE - Finanzas App" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Cargar variables de entorno
if (Test-Path ".\.env.azure") {
    Get-Content ".\.env.azure" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
    Write-Host "[OK] Variables cargadas de .env.azure" -ForegroundColor Green
} else {
    Write-Host "[!] Copia .env.azure.example a .env.azure y configura los valores" -ForegroundColor Red
    exit 1
}

# Variables
$RESOURCE_GROUP = $env:AZURE_RESOURCE_GROUP
$LOCATION = $env:AZURE_LOCATION
$REGISTRY_NAME = $env:AZURE_REGISTRY_NAME
$POSTGRES_SERVER = $env:POSTGRES_SERVER_NAME
$POSTGRES_USER = $env:POSTGRES_ADMIN_USER
$POSTGRES_PASSWORD = $env:POSTGRES_ADMIN_PASSWORD
$POSTGRES_DB = $env:POSTGRES_DB

# 1. Verificar Azure CLI
Write-Host "`n[1/5] Verificando Azure CLI..." -ForegroundColor Yellow
try {
    $azVersion = az version --output json | ConvertFrom-Json
    Write-Host "      Azure CLI v$($azVersion.'azure-cli')" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Azure CLI no encontrado. Instala con: winget install Microsoft.AzureCLI" -ForegroundColor Red
    exit 1
}

# 2. Verificar login
Write-Host "`n[2/5] Verificando login de Azure..." -ForegroundColor Yellow
$account = az account show --output json 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "      Iniciando login..." -ForegroundColor Yellow
    az login
    $account = az account show --output json | ConvertFrom-Json
}
Write-Host "      Conectado como: $($account.user.name)" -ForegroundColor Green
Write-Host "      Suscripcion: $($account.name)" -ForegroundColor Green

# 3. Verificar Docker
Write-Host "`n[3/5] Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "      $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker no encontrado" -ForegroundColor Red
    exit 1
}

# 4. Verificar Resource Group existente
Write-Host "`n[4/5] Verificando Resource Group '$RESOURCE_GROUP'..." -ForegroundColor Yellow
$rgExists = az group exists --name $RESOURCE_GROUP
if ($rgExists -eq "true") {
    Write-Host "      Resource Group existe" -ForegroundColor Green
} else {
    Write-Host "      Creando Resource Group..." -ForegroundColor Yellow
    az group create --name $RESOURCE_GROUP --location $LOCATION
    Write-Host "      Resource Group creado" -ForegroundColor Green
}

# 5. Verificar Container Registry
Write-Host "`n[5/5] Verificando Container Registry '$REGISTRY_NAME'..." -ForegroundColor Yellow
$acrExists = az acr show --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP 2>$null
if ($acrExists) {
    Write-Host "      Container Registry existe" -ForegroundColor Green
    # Login al registry
    Write-Host "      Iniciando sesion en el registry..." -ForegroundColor Yellow
    az acr login --name $REGISTRY_NAME
    Write-Host "      Login exitoso" -ForegroundColor Green
} else {
    Write-Host "      Creando Container Registry..." -ForegroundColor Yellow
    az acr create --resource-group $RESOURCE_GROUP --name $REGISTRY_NAME --sku Basic
    az acr login --name $REGISTRY_NAME
    Write-Host "      Container Registry creado" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nSiguiente paso: .\build-and-push.ps1" -ForegroundColor Yellow
