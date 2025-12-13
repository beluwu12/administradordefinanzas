# =====================================================
# Build and Push - Construir imagenes Docker
# =====================================================
# Ejecutar desde: c:\Users\jerem\personal-finance-app\deploy
# =====================================================

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BUILD AND PUSH - Docker Images" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Cargar variables
if (Test-Path ".\.env.azure") {
    Get-Content ".\.env.azure" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
} else {
    Write-Host "[ERROR] .env.azure no encontrado" -ForegroundColor Red
    exit 1
}

$REGISTRY_NAME = $env:AZURE_REGISTRY_NAME
$REGISTRY_URL = "$REGISTRY_NAME.azurecr.io"
$PROJECT_ROOT = Split-Path -Parent $PSScriptRoot

Write-Host "Registry: $REGISTRY_URL" -ForegroundColor Gray
Write-Host "Proyecto: $PROJECT_ROOT`n" -ForegroundColor Gray

# Login al registry
Write-Host "[1/4] Login al Container Registry..." -ForegroundColor Yellow
az acr login --name $REGISTRY_NAME
Write-Host "      Login exitoso" -ForegroundColor Green

# Build Backend
Write-Host "`n[2/4] Construyendo imagen BACKEND..." -ForegroundColor Yellow
Set-Location $PROJECT_ROOT
docker build -t "$REGISTRY_URL/backend:latest" ./server
Write-Host "      Backend construido" -ForegroundColor Green

# Build Frontend
Write-Host "`n[3/4] Construyendo imagen FRONTEND..." -ForegroundColor Yellow
docker build -t "$REGISTRY_URL/frontend:latest" -f client/Dockerfile .
Write-Host "      Frontend construido" -ForegroundColor Green

# Push images
Write-Host "`n[4/4] Subiendo imagenes a Azure..." -ForegroundColor Yellow
docker push "$REGISTRY_URL/backend:latest"
Write-Host "      Backend subido" -ForegroundColor Green
docker push "$REGISTRY_URL/frontend:latest"
Write-Host "      Frontend subido" -ForegroundColor Green

Set-Location $PSScriptRoot

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BUILD AND PUSH COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nImagenes disponibles en: $REGISTRY_URL" -ForegroundColor Gray
Write-Host "  - $REGISTRY_URL/backend:latest" -ForegroundColor Gray
Write-Host "  - $REGISTRY_URL/frontend:latest" -ForegroundColor Gray
Write-Host "`nSiguiente paso: .\deploy-apps.ps1" -ForegroundColor Yellow
