<div align="center">

# 💰 Administrador de Finanzas Personales

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)
[![Azure](https://img.shields.io/badge/Azure-Container%20Apps-0078D4?style=flat-square&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Aplicación de finanzas personales multiusuario con soporte para USD y Bolívares (VES), seguimiento de metas de ahorro con sistema de quincenas, y tasa de cambio BCV automática.**

[Características](#-características) •
[Instalación](#-instalación-rápida) •
[Docker](#-docker) •
[Azure Deployment](#-despliegue-en-azure) •
[API](#-api-endpoints)

</div>

---

## ✨ Características

| Característica | Descripción |
|----------------|-------------|
| 👥 **Multiusuario** | Perfiles con email/contraseña y JWT |
| 💵 **Multi-moneda** | USD y VES con tasa BCV automática |
| 🏷️ **Etiquetas** | Categoriza transacciones con colores |
| 🎯 **Metas de Ahorro** | Sistema de quincenas (2 pagos/mes) |
| 📅 **Gastos Fijos** | Registro de pagos recurrentes |
| 📊 **Dashboard** | Resumen de 30 días + balance total |
| 🐳 **Docker Ready** | Despliegue con Docker Compose |
| ☁️ **Cloud Ready** | Scripts para Azure Container Apps |

---

## 🚀 Instalación Rápida

### Prerrequisitos
- Node.js v20+
- npm o pnpm

### Opción 1: Scripts Automáticos (Windows)

```powershell
# Clonar e instalar
git clone https://github.com/Gillardo/personal-finance-app.git
cd personal-finance-app

# Instalar dependencias
cd server && npm install && cd ../client && npm install && cd ..

# Configurar variables de entorno
copy server\.env.example server\.env

# Iniciar la base de datos (SQLite por defecto)
cd server && npx prisma db push && cd ..

# Iniciar la app
.\start.bat
```

**Scripts disponibles:**
- `start.bat` - Inicia backend + frontend
- `stop.bat` - Detiene todos los servicios

### Opción 2: Manual

```bash
# Terminal 1 - Backend
cd server
npm install
cp .env.example .env  # Editar con tu JWT_SECRET
npx prisma db push
npm run dev

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

### Acceso Local
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Health Check | http://localhost:3000/api/health |

---

## 🐳 Docker

### Desarrollo Local con Docker

```bash
# Iniciar con PostgreSQL local
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

### Producción con Traefik (VPS)

```bash
# Crear archivo .env con tus variables
cp .env.example .env

# Iniciar con HTTPS automático
docker compose -f docker-compose.prod.yml up -d
```

---

## ☁️ Despliegue en Azure

La aplicación incluye scripts automatizados para desplegar en **Azure Container Apps**.

### Requisitos
- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli) instalado
- [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado
- Cuenta de Azure activa

### Paso 1: Configurar Variables

```powershell
cd deploy
copy .env.azure.example .env.azure
# Editar .env.azure con tus valores
```

Variables requeridas en `.env.azure`:
```bash
AZURE_RESOURCE_GROUP="finanzas-app"
AZURE_LOCATION="eastus"
AZURE_REGISTRY_NAME="tufinanzasregistry"  # Debe ser único
POSTGRES_SERVER_NAME="finanzas-postgres"
POSTGRES_ADMIN_USER="finanzas"
POSTGRES_ADMIN_PASSWORD="TuPasswordSegura123!"
POSTGRES_DB="finanzas"
CONTAINER_ENV_NAME="finanzas-env"
JWT_SECRET="genera-esto-con-openssl-rand-hex-32"
```

### Paso 2: Ejecutar Scripts

```powershell
cd deploy

# 1. Configurar Azure (login, resource group, registry)
.\setup-azure.ps1

# 2. Construir y subir imágenes Docker
.\build-and-push.ps1

# 3. Crear PostgreSQL y desplegar apps
.\deploy-apps.ps1
```

### URLs de Producción
Después del despliegue, obtendrás URLs como:
- **Frontend**: `https://finanzas-frontend.xxxxx.azurecontainerapps.io`
- **Backend**: `https://finanzas-backend.xxxxx.azurecontainerapps.io`

> 📖 **Guía detallada**: Ver [docs/DEPLOY_CLOUD.md](docs/DEPLOY_CLOUD.md)

---

## 🔧 Variables de Entorno

### Desarrollo Local (server/.env)
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="tu-clave-muy-segura-minimo-32-caracteres"
NODE_ENV="development"
PORT=3000
CRON_ENABLED=true
```

### Producción (PostgreSQL)
```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
JWT_SECRET="genera-con-openssl-rand-hex-32"
NODE_ENV="production"
PORT=3000
CRON_ENABLED=true
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
```

> ⚠️ **Importante**: Genera un `JWT_SECRET` seguro:
> ```bash
> openssl rand -hex 32
> ```

---

## 📡 API Endpoints

### Formato de Respuesta
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Crear usuario (email+contraseña) |
| `POST` | `/api/auth/login` | Login → JWT |
| `GET` | `/api/auth/me` | Usuario actual |

### Transacciones (🔒 Requiere JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/transactions` | Listar |
| `GET` | `/api/transactions/balance` | Balance USD/VES |
| `POST` | `/api/transactions` | Crear |
| `PUT` | `/api/transactions/:id` | Actualizar |
| `DELETE` | `/api/transactions/:id` | Eliminar |

### Otros Endpoints

| Ruta | Descripción |
|------|-------------|
| `/api/tags` | CRUD etiquetas |
| `/api/fixed-expenses` | CRUD gastos fijos |
| `/api/goals` | CRUD metas de ahorro |
| `/api/insight/summary` | Resumen 30 días |
| `/api/exchange-rate/usd-ves` | Tasa BCV |
| `/api/health` | Estado del servidor |

---

## 📁 Estructura del Proyecto

```
personal-finance-app/
├── start.bat               # 🚀 Iniciar app (Windows)
├── stop.bat                # 🛑 Detener app (Windows)
├── docker-compose.yml      # 🐳 Docker desarrollo
├── docker-compose.prod.yml # 🐳 Docker producción (Traefik)
│
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── config.js       # Detección automática de API URL
│   │   ├── api.js          # Axios + interceptors
│   │   ├── pages/          # Vistas
│   │   └── components/     # UI components
│   ├── Dockerfile          # Multi-stage build
│   └── nginx.conf
│
├── server/                 # Backend Express
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth, errors
│   ├── schemas/            # Validación Zod
│   ├── prisma/             # DB schema (PostgreSQL/SQLite)
│   └── Dockerfile
│
├── deploy/                 # Scripts de despliegue
│   ├── .env.azure.example  # Template variables Azure
│   ├── setup-azure.ps1     # Configurar recursos Azure
│   ├── build-and-push.ps1  # Construir y subir imágenes
│   ├── deploy-apps.ps1     # Desplegar Container Apps
│   └── backup.ps1          # Backup de base de datos
│
└── docs/                   # Documentación
    ├── SETUP_LOCAL.md      # Guía instalación local
    └── DEPLOY_CLOUD.md     # Guía despliegue cloud
```

---

## 🔐 Seguridad

- ✅ JWT Authentication (7 días)
- ✅ Helmet (headers HTTP seguros)
- ✅ Rate Limiting (login)
- ✅ Zod Validation (inputs)
- ✅ Ownership Checks (recursos)
- ✅ bcrypt (hashing passwords)
- ✅ Error Sanitization
- ✅ SSL/TLS en producción

---

## 🗄️ Base de Datos

**Desarrollo**: SQLite (archivo local)
**Producción**: PostgreSQL 16

```
User ──┬──► Transaction
       ├──► Tag
       ├──► FixedExpense
       └──► Goal ──► GoalMonth
```

---

## 📱 Uso

1. **Registrarse** con email y contraseña
2. **Iniciar sesión** con credenciales
3. **Dashboard**: Ver balance y transacciones
4. **Agregar transacciones** con el botón "+"
5. **Crear metas** de ahorro con quincenas
6. **Gestionar gastos fijos** recurrentes

---

## 🔄 Actualizaciones

Para actualizar una instalación existente en Azure:

```powershell
cd deploy
.\build-and-push.ps1   # Reconstruir imágenes
.\deploy-apps.ps1      # Actualizar containers
```

---

## 📄 Licencia

MIT © 2024 Jeremy

---

<div align="center">

**¿Preguntas?** Abre un [issue](https://github.com/Gillardo/personal-finance-app/issues)

</div>
