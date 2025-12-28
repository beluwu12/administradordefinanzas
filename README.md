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

## 📘 Guía detallada (paso a paso)

### 1) Clonar y preparar entorno
- Instala Node.js 20+ y npm.
- Clona el repo y entra en la carpeta:
  ```bash
  git clone https://github.com/Gillardo/personal-finance-app.git
  cd personal-finance-app
  ```
- Copia los archivos de entorno:
  ```bash
  cd server && cp .env.example .env && cd ..
  ```
  Edita `server/.env` y define un `JWT_SECRET` seguro.

### 2) Backend (API Express)
```bash
cd server
npm install
npx prisma db push         # crea DB (SQLite local) o usa tu PostgreSQL
npm run dev                # http://localhost:3000
```
Comprobación rápida: `curl http://localhost:3000/api/health`.

### 3) Frontend (React + Vite)
```bash
cd client
npm install
npm run dev                # http://localhost:5173
```
El frontend detecta la URL de la API desde `src/config.js`. Si usas otro host/puerto, ajusta `VITE_API_URL`.

### 4) Flujo de uso básico
1. Regístrate en `/auth/register`.
2. Inicia sesión en `/auth/login`.
3. Agrega transacciones (ingreso/gasto) y etiquetas.
4. Consulta dashboard y balance; para VE se muestra USD/VES.
5. Crea metas de ahorro y gastos fijos si lo necesitas.

### 5) Variables de entorno mínimas
`server/.env`
```
DATABASE_URL="file:./dev.db"           # o tu cadena PostgreSQL
JWT_SECRET="cadena-super-segura"       # genera con: openssl rand -hex 32
NODE_ENV="development"
PORT=3000
CRON_ENABLED=true
```

### 6) Correr pruebas
- Backend: `cd server && npm test` (usa el runner incluido).
- Frontend: (no hay suite completa, pero existe `client/tests/unit.test.js`).

### 7) Docker (local)
```bash
docker compose up -d
docker compose logs -f
```
Frontend en `http://localhost:5173`, backend en `http://localhost:3000`.

### 8) Despliegue (resumen)
- VPS/Traefik: `cp .env.example .env` y `docker compose -f docker-compose.prod.yml up -d`.
- Azure Container Apps: sigue `docs/DEPLOY_CLOUD.md` y los scripts en `deploy/`.

### 9) Troubleshooting rápido
- CORS bloqueado: define `CORS_ALLOWED_ORIGINS` en `server/.env`.
- Token inválido: revisa `JWT_SECRET` y expira tokens borrando `localStorage` y cookies.
- Migraciones Prisma: si cambias de SQLite a Postgres, ajusta `DATABASE_URL` y ejecuta `npx prisma migrate deploy`.

---

## 🧭 Plan de mejoras pendientes (hallazgos y pasos concretos)

> Estas son las mejoras prioritarias que se detectaron al revisar el código. Están ordenadas por impacto (seguridad y datos primero).

### 1) Seguridad de tokens (alta prioridad)
- **Problema:** El refresh token se guarda en `localStorage` (JS accesible) aunque el backend lo setea como cookie httpOnly; expone credenciales largas a XSS.
- **Acción:** En el cliente, guardar el refresh token solo en cookie httpOnly+Secure; no persistirlo en `localStorage`. Guardar el access token en memoria (estado) y no en `localStorage`.
- **Archivos:** `client/src/api.js`, `client/src/context/AuthContext.jsx`, `server/routes/auth.js` (para rotación/blacklist si se implementa).
- **Paso a paso:**
  1. Quitar `finance_refresh_token` de `localStorage` en `api.js` y `AuthContext`.
  2. Usar solo la cookie httpOnly enviada por el backend para `/auth/refresh` (`withCredentials: true` ya está).
  3. Guardar access token en memoria (state) y opcionalmente en `sessionStorage` (no `localStorage`).
  4. (Opcional recomendado) Implementar rotación de refresh tokens y tabla de sesiones (hash + revokedAt).

### 2) Paginación y respuestas API (media-alta)
- **Problema:** El interceptor Axios elimina el envoltorio `{ data, pagination }` y deja la UI sin `pagination`, forzando filtrado incompleto.
- **Acción:** Conservar `pagination` en las respuestas o desestructurar explícitamente en cada uso.
- **Archivos:** `client/src/api.js`, consumidores como `client/src/pages/TransactionsPage.jsx`.
- **Paso a paso:**
  1. En el interceptor, no sobrescribir `response.data` si existen claves adicionales; devolver el objeto completo.
  2. Ajustar las vistas para leer `res.data` y `res.pagination` correctamente.

### 3) Cálculo de estadísticas en UI (media)
- **Problema:** Se comparan tipos en minúsculas (`income/expense`) pero el API devuelve `INCOME/EXPENSE`; las tarjetas de ingresos/gastos/balance muestran 0/incorrecto.
- **Acción:** Normalizar a mayúsculas o usar constantes; recalcular stats con los valores correctos.
- **Archivos:** `client/src/pages/TransactionsPage.jsx`.
- **Paso a paso:**
  1. Al iterar transacciones, comparar con `INCOME`/`EXPENSE` o hacer `tx.type.toUpperCase()`.
  2. Verificar que el valor mostrado use la moneda correcta (ya soporta dual-currency).

### 4) Reutilizar middleware de auth (media)
- **Problema:** Varias rutas de auth vuelven a parsear JWT manualmente en vez de usar `requireAuth`; riesgo de inconsistencias y duplicación.
- **Acción:** Aplicar `requireAuth` en `/auth/me`, `/auth/profile`, `/auth/password`, `/auth/account` y retirar parseo manual.
- **Archivos:** `server/routes/auth.js`, `server/middleware/requireAuth.js`.
- **Paso a paso:**
  1. Añadir `router.use(requireAuth)` para las rutas protegidas (o aplicar por endpoint).
  2. Eliminar lecturas manuales del header y llamadas directas a `jwt.verify`.
  3. Usar `req.user`/`req.userId` ya asignados por el middleware.

### 5) Calidad de datos y UX (media)
- **Problema:** Falta validación espejo en UI para límites definidos en Zod (longitud de descripción, montos máximos).
- **Acción:** Replicar reglas de `server/schemas/index.js` en los formularios del frontend para feedback inmediato.
- **Archivos:** Formularios en `client/src/components/TransactionForm` y otros formularios de metas/gastos fijos.
- **Paso a paso:**
  1. Añadir validaciones en el cliente alineadas a `VALIDATION` (descripción, montos > 0).
  2. Mostrar mensajes amigables antes de enviar al backend.

### 6) (Opcional) Resiliencia de tokens
- **Problema:** No hay lista de revocación/rotación para refresh tokens; si uno se filtra, dura 7 días.
- **Acción:** Guardar refresh tokens (hasheados) por sesión/dispositivo y permitir revocarlos en logout/rotación.
- **Archivos:** `server/routes/auth.js`, `prisma/schema.prisma` (si se crea una tabla Sessions).
- **Paso a paso:**
  1. Crear modelo `Session` (userId, tokenHash, userAgent, ip, expiresAt, revokedAt).
  2. Al hacer login/refresh, emitir nuevo refresh token, guardar hash y revocar el previo.
  3. En `/refresh`, validar contra la tabla y rechazar si revocado/expirado.

### 7) Observabilidad y seguridad extra (recomendado)
- Agregar rate limit por IP/usuario en endpoints de mutación financiera (create/update/delete transacciones).
- Evitar loggear PII en errores; revisar `logger` para sanitizar payloads.
- Considerar CSP si algún día se sirve el SPA desde el backend.

### 8) UX/Funcionalidad sugerida (producto)
- Presupuestos/envelopes por categoría con alertas al 80/100%.
- Proyección de flujo de caja con gastos fijos + metas.
- Importar/exportar CSV/OFX con validación.
- Filtros server-side (rango de fechas, tipo, tag) para listas grandes.

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
