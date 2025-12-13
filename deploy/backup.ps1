# =====================================================
# Backup - Respaldo de PostgreSQL
# =====================================================
# Ejecutar desde: c:\Users\jerem\personal-finance-app\deploy
# =====================================================

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BACKUP - PostgreSQL Database" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Cargar variables
if (Test-Path ".\.env.azure") {
    Get-Content ".\.env.azure" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
}
else {
    Write-Host "[ERROR] .env.azure no encontrado" -ForegroundColor Red
    exit 1
}

$RESOURCE_GROUP = $env:AZURE_RESOURCE_GROUP
$POSTGRES_SERVER = $env:POSTGRES_SERVER_NAME
$POSTGRES_USER = $env:POSTGRES_ADMIN_USER
$POSTGRES_PASSWORD = $env:POSTGRES_ADMIN_PASSWORD
$POSTGRES_DB = $env:POSTGRES_DB

# Obtener hostname
$pgHost = az postgres flexible-server show --resource-group $RESOURCE_GROUP --name $POSTGRES_SERVER --query fullyQualifiedDomainName -o tsv

# Crear directorio de backups
$BACKUP_DIR = Join-Path $PSScriptRoot "backups"
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
}

$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BACKUP_FILE = Join-Path $BACKUP_DIR "finanzas_backup_$TIMESTAMP.sql"

Write-Host "[1/2] Ejecutando backup de PostgreSQL..." -ForegroundColor Yellow
Write-Host "      Servidor: $pgHost" -ForegroundColor Gray
Write-Host "      Base de datos: $POSTGRES_DB" -ForegroundColor Gray

# Establecer variable de entorno para password
$env:PGPASSWORD = $POSTGRES_PASSWORD

try {
    # Ejecutar pg_dump
    pg_dump -h $pgHost -U $POSTGRES_USER -d $POSTGRES_DB -F p -f $BACKUP_FILE
    Write-Host "      Backup creado" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] pg_dump no encontrado. Instala PostgreSQL client tools." -ForegroundColor Red
    Write-Host "        Descarga: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    
    # Alternativa: usar Azure CLI
    Write-Host "`n[ALTERNATIVA] Creando backup usando Azure..." -ForegroundColor Yellow
    $BACKUP_NAME = "backup-$TIMESTAMP"
    az postgres flexible-server backup create `
        --resource-group $RESOURCE_GROUP `
        --name $POSTGRES_SERVER `
        --backup-name $BACKUP_NAME
    Write-Host "      Backup creado en Azure: $BACKUP_NAME" -ForegroundColor Green
    Write-Host "      Para restaurar, usa Azure Portal o az CLI" -ForegroundColor Gray
    exit 0
}

$env:PGPASSWORD = $null

# Comprimir backup
Write-Host "`n[2/2] Comprimiendo backup..." -ForegroundColor Yellow
$COMPRESSED_FILE = "$BACKUP_FILE.zip"
Compress-Archive -Path $BACKUP_FILE -DestinationPath $COMPRESSED_FILE
Remove-Item $BACKUP_FILE
Write-Host "      Comprimido: $COMPRESSED_FILE" -ForegroundColor Green

$SIZE = (Get-Item $COMPRESSED_FILE).Length / 1KB
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  BACKUP COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`n  Archivo: $COMPRESSED_FILE" -ForegroundColor Gray
Write-Host "  Tamaño: $([math]::Round($SIZE, 2)) KB" -ForegroundColor Gray
