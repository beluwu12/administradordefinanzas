# ☁️ Guía de Despliegue en la Nube

Esta guía cubre el despliegue de la aplicación en **Azure Container Apps** con PostgreSQL.

---

## 📋 Requisitos Previos

| Software | Versión | Descarga |
|----------|---------|----------|
| Azure CLI | 2.50+ | [Instalar](https://docs.microsoft.com/cli/azure/install-azure-cli) |
| Docker Desktop | 4.0+ | [Descargar](https://www.docker.com/products/docker-desktop/) |
| PowerShell | 7+ (Windows) | Incluido en Windows |

Además necesitas:
- ✅ Cuenta de Azure activa
- ✅ Suscripción con créditos disponibles

---

## 🔷 Despliegue en Azure Container Apps

### Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                 Azure Container Apps                     │
│                                                         │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   Frontend   │────────▶│   Backend    │             │
│  │   (Nginx)    │         │  (Node.js)   │             │
│  └──────────────┘         └──────┬───────┘             │
│                                  │                      │
└──────────────────────────────────┼──────────────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │  Azure PostgreSQL Flexible   │
                    │        (Managed DB)          │
                    └──────────────────────────────┘
```

---

### Paso 1: Configurar Variables de Entorno

```powershell
cd deploy
copy .env.azure.example .env.azure
```

Edita `.env.azure` con tus valores:

```bash
# Recursos Azure
AZURE_RESOURCE_GROUP="finanzas-app"
AZURE_LOCATION="eastus"
AZURE_REGISTRY_NAME="mifinanzasregistry"  # ¡Debe ser único globalmente!

# PostgreSQL
POSTGRES_SERVER_NAME="finanzas-postgres"
POSTGRES_ADMIN_USER="finanzas"
POSTGRES_ADMIN_PASSWORD="MiPassword$egur0123!"  # Mínimo: 8 caracteres, mayúsculas, números, símbolos
POSTGRES_DB="finanzas"

# Container Apps
CONTAINER_ENV_NAME="finanzas-env"

# Secrets de la App
JWT_SECRET="genera-esto-con-openssl-rand-hex-32"
```

> ⚠️ **Importante**: El nombre del registry (`AZURE_REGISTRY_NAME`) debe ser único en todo Azure.

---

### Paso 2: Ejecutar Setup Azure

Este script verifica y crea los recursos base:

```powershell
cd deploy
.\setup-azure.ps1
```

**¿Qué hace este script?**
1. ✅ Verifica Azure CLI instalado
2. ✅ Inicia sesión en Azure (si es necesario)
3. ✅ Verifica Docker instalado
4. ✅ Crea Resource Group (si no existe)
5. ✅ Crea Container Registry (si no existe)
6. ✅ Hace login al registry

---

### Paso 3: Construir y Subir Imágenes

```powershell
.\build-and-push.ps1
```

**¿Qué hace este script?**
1. 🔐 Login al Container Registry
2. 🐳 Construye imagen del backend (`./server`)
3. 🐳 Construye imagen del frontend (`./client`)
4. ⬆️ Sube ambas imágenes al registry

---

### Paso 4: Desplegar Aplicaciones

```powershell
.\deploy-apps.ps1
```

**¿Qué hace este script?**
1. 🗄️ Crea PostgreSQL Flexible Server (~3-5 minutos)
2. 🌐 Crea Container App Environment
3. 🔧 Configura acceso al registry
4. 🚀 Despliega Backend con variables de entorno
5. 🚀 Despliega Frontend

Al finalizar, obtendrás las URLs de acceso:
```
Frontend: https://finanzas-frontend.xxxxx.azurecontainerapps.io
Backend:  https://finanzas-backend.xxxxx.azurecontainerapps.io
```

---

## 🔄 Actualizaciones de la Aplicación

Para actualizar después de cambios en el código:

```powershell
cd deploy

# Reconstruir y subir nuevas imágenes
.\build-and-push.ps1

# Actualizar los containers
.\deploy-apps.ps1
```

Los containers existentes se actualizarán automáticamente con las nuevas imágenes.

---

## 🔧 Configuración del Frontend

El frontend detecta automáticamente si está en Azure usando `client/src/config.js`:

```javascript
const hostname = window.location.hostname;

const isProduction = hostname.includes('azurecontainerapps.io') || 
                     !hostname.includes('localhost');

const API_URL = isProduction 
    ? 'https://TU-BACKEND-URL.azurecontainerapps.io/api'
    : `http://${hostname}:3000/api`;
```

> **Nota**: Después del primer despliegue, debes actualizar la URL del backend en `config.js` y volver a ejecutar `build-and-push.ps1` + `deploy-apps.ps1`.

---

## 💾 Backups de Base de Datos

### Backup Manual

```powershell
.\backup.ps1
```

Esto crea un archivo SQL en la carpeta `backups/`.

### Restaurar Backup

```powershell
# Conectar a PostgreSQL
psql -h tu-servidor.postgres.database.azure.com -U finanzas -d finanzas

# Restaurar
\i backups/backup_2024-01-15.sql
```

---

## 📊 Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | Clave para tokens JWT | Generar con `openssl rand -hex 32` |
| `NODE_ENV` | Entorno de ejecución | `production` |
| `CRON_ENABLED` | Habilitar tareas programadas | `true` |
| `VAPID_PUBLIC_KEY` | Push notifications (opcional) | Ver `.env.example` |
| `VAPID_PRIVATE_KEY` | Push notifications (opcional) | Ver `.env.example` |

---

## 💰 Costos Estimados (Azure)

| Recurso | SKU | Costo Mensual |
|---------|-----|---------------|
| Container Apps (Backend) | 0.5 vCPU, 1GB RAM | ~$10-20 |
| Container Apps (Frontend) | 0.25 vCPU, 0.5GB RAM | ~$5-10 |
| PostgreSQL Flexible | B1ms (Burstable) | ~$15-25 |
| Container Registry | Basic | ~$5 |
| **Total Estimado** | | **~$35-60/mes** |

> 💡 **Tip**: Configura `min-replicas: 0` para reducir costos cuando no hay tráfico.

---

## 🛠️ Solución de Problemas

### Error: "The subscription is not registered to use namespace 'Microsoft.App'"

```powershell
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
```

### Error: Container App no inicia

```powershell
# Ver logs del container
az containerapp logs show --name finanzas-backend --resource-group finanzas-app --follow
```

### Error: "Connection refused" a PostgreSQL

1. Verifica que el firewall permite todas las IPs:
```powershell
az postgres flexible-server firewall-rule create \
    --resource-group finanzas-app \
    --name finanzas-postgres \
    --rule-name AllowAll \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 255.255.255.255
```

2. Verifica SSL mode en la URL de conexión: `?sslmode=require`

### Ver recursos desplegados

```powershell
# Listar todos los recursos
az resource list --resource-group finanzas-app --output table

# Ver estado de Container Apps
az containerapp list --resource-group finanzas-app --output table
```

---

## 🗑️ Eliminar Recursos

Para eliminar todos los recursos de Azure:

```powershell
# ⚠️ CUIDADO: Esto elimina TODO incluyendo la base de datos
az group delete --name finanzas-app --yes --no-wait
```

---

## 🟢 Alternativa: Google Cloud Run

Si prefieres Google Cloud, consulta la documentación oficial:
- [Cloud Run](https://cloud.google.com/run/docs)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)

---

**¿Necesitas ayuda?**
- [Azure Container Apps Docs](https://learn.microsoft.com/azure/container-apps/)
- [Azure PostgreSQL Docs](https://learn.microsoft.com/azure/postgresql/)
