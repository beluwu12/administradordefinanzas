# ☁️ Guía de Despliegue en la Nube

Esta guía cubre el despliegue de la aplicación en servicios de contenedores como **Azure Container Apps** y **Google Cloud Run**.

---

## 📋 Requisitos Previos

- Cuenta en Azure o Google Cloud
- Docker instalado localmente
- CLI del proveedor instalado (`az` o `gcloud`)
- Dominio configurado (opcional para HTTPS)

---

## 🔷 Opción 1: Microsoft Azure Container Apps

### Paso 1: Configurar Azure CLI
```bash
# Instalar Azure CLI (Windows)
winget install -e --id Microsoft.AzureCLI

# Iniciar sesión
az login

# Crear grupo de recursos
az group create --name finanzas-rg --location eastus
```

### Paso 2: Crear Azure Container Registry
```bash
az acr create --resource-group finanzas-rg \
  --name finanzasregistry --sku Basic

az acr login --name finanzasregistry
```

### Paso 3: Construir y Subir Imágenes
```bash
# Backend
docker build -t finanzasregistry.azurecr.io/backend:latest ./server
docker push finanzasregistry.azurecr.io/backend:latest

# Frontend
docker build -t finanzasregistry.azurecr.io/frontend:latest -f client/Dockerfile .
docker push finanzasregistry.azurecr.io/frontend:latest
```

### Paso 4: Crear Azure Database for PostgreSQL
```bash
az postgres flexible-server create \
  --resource-group finanzas-rg \
  --name finanzas-db \
  --admin-user finanzas \
  --admin-password TU_PASSWORD_SEGURA \
  --sku-name Standard_B1ms \
  --tier Burstable
```

### Paso 5: Crear Container App Environment
```bash
az containerapp env create \
  --name finanzas-env \
  --resource-group finanzas-rg \
  --location eastus
```

### Paso 6: Desplegar Backend
```bash
az containerapp create \
  --name finanzas-backend \
  --resource-group finanzas-rg \
  --environment finanzas-env \
  --image finanzasregistry.azurecr.io/backend:latest \
  --target-port 3000 \
  --ingress external \
  --registry-server finanzasregistry.azurecr.io \
  --env-vars \
    DATABASE_URL="postgresql://finanzas:PASSWORD@finanzas-db.postgres.database.azure.com:5432/finanzas" \
    JWT_SECRET="TU_SECRET" \
    NODE_ENV="production"
```

### Paso 7: Desplegar Frontend
```bash
az containerapp create \
  --name finanzas-frontend \
  --resource-group finanzas-rg \
  --environment finanzas-env \
  --image finanzasregistry.azurecr.io/frontend:latest \
  --target-port 80 \
  --ingress external \
  --registry-server finanzasregistry.azurecr.io
```

---

## 🟢 Opción 2: Google Cloud Run

### Paso 1: Configurar Google Cloud CLI
```bash
# Instalar gcloud SDK
# https://cloud.google.com/sdk/docs/install

# Iniciar sesión
gcloud auth login
gcloud config set project TU_PROJECT_ID

# Habilitar APIs
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

### Paso 2: Crear Cloud SQL (PostgreSQL)
```bash
gcloud sql instances create finanzas-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

gcloud sql users set-password postgres \
  --instance=finanzas-db \
  --password=TU_PASSWORD
```

### Paso 3: Construir con Cloud Build
```bash
# Backend
gcloud builds submit --tag gcr.io/TU_PROJECT_ID/backend ./server

# Frontend
gcloud builds submit --tag gcr.io/TU_PROJECT_ID/frontend -f client/Dockerfile .
```

### Paso 4: Desplegar Backend
```bash
gcloud run deploy finanzas-backend \
  --image gcr.io/TU_PROJECT_ID/backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=postgresql://postgres:PASSWORD@/finanzas?host=/cloudsql/TU_PROJECT_ID:us-central1:finanzas-db" \
  --set-env-vars="JWT_SECRET=TU_SECRET" \
  --add-cloudsql-instances=TU_PROJECT_ID:us-central1:finanzas-db
```

### Paso 5: Desplegar Frontend
```bash
gcloud run deploy finanzas-frontend \
  --image gcr.io/TU_PROJECT_ID/frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🔐 Configurar Dominio Personalizado

### Azure
```bash
az containerapp hostname add \
  --hostname finanzas.tudominio.com \
  --resource-group finanzas-rg \
  --name finanzas-frontend
```

### Google Cloud
```bash
gcloud run domain-mappings create \
  --service finanzas-frontend \
  --domain finanzas.tudominio.com \
  --region us-central1
```

---

## 📊 Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Clave para tokens | `openssl rand -hex 32` |
| `NODE_ENV` | Entorno | `production` |
| `VAPID_PUBLIC_KEY` | Push notifications | Ver `.env.example` |
| `VAPID_PRIVATE_KEY` | Push notifications | Ver `.env.example` |

---

## 💰 Costos Estimados

| Servicio | Azure | Google Cloud |
|----------|-------|--------------|
| Container Apps/Run | ~$10-30/mes | ~$5-20/mes |
| PostgreSQL | ~$15-50/mes | ~$10-30/mes |
| **Total Estimado** | **~$25-80/mes** | **~$15-50/mes** |

*Ambos proveedores ofrecen créditos gratuitos para nuevos usuarios.*

---

## 🔄 CI/CD (Opcional)

Configura GitHub Actions para despliegue automático:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Login to Registry
        run: echo ${{ secrets.REGISTRY_PASSWORD }} | docker login ...
      - name: Build and Push
        run: docker build -t ... && docker push ...
```

---

**¿Necesitas ayuda?** Consulta la documentación oficial:
- [Azure Container Apps](https://learn.microsoft.com/azure/container-apps/)
- [Google Cloud Run](https://cloud.google.com/run/docs)
