<div align="center">

# 💰 Administrador de Finanzas Personales

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Aplicación de finanzas personales multiusuario con soporte para USD y Bolívares (VES), seguimiento de metas de ahorro con sistema de quincenas, y tasa de cambio BCV automática.**

[Características](#-características) •
[Instalación](#-instalación-rápida) •
[API](#-api-endpoints) •
[Docker](#-docker)

</div>

---

## ✨ Características

| Característica | Descripción |
|----------------|-------------|
| 👥 **Multiusuario** | Perfiles con PIN de 4 dígitos y JWT |
| 💵 **Multi-moneda** | USD y VES con tasa BCV automática |
| 🏷️ **Etiquetas** | Categoriza transacciones con colores |
| 🎯 **Metas de Ahorro** | Sistema de quincenas (2 pagos/mes) |
| 📅 **Gastos Fijos** | Registro de pagos recurrentes |
| 📊 **Dashboard** | Resumen de 30 días + balance total |

---

## 🚀 Instalación Rápida

### Prerrequisitos
- Node.js v18+
- npm

### Opción 1: Scripts (Recomendado para Windows)

```bash
# Clonar e instalar
git clone https://github.com/tu-usuario/personal-finance-app.git
cd personal-finance-app

# Instalar dependencias
cd server && npm install && cd ../client && npm install && cd ..

# Configurar variables de entorno
copy server\.env.example server\.env

# Iniciar la app
start.bat
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

### Acceso
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:3000 |
| Health Check | http://localhost:3000/api/health |

---

## 🔧 Variables de Entorno

Copiar `server/.env.example` a `server/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="tu-clave-muy-segura-minimo-32-caracteres"
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"
CRON_ENABLED=true
```

> ⚠️ **Importante**: Genera un `JWT_SECRET` seguro para producción:
> ```bash
> openssl rand -base64 32
> ```

---

## 🐳 Docker

```bash
# Iniciar todo con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

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
| `GET` | `/api/users` | Listar usuarios |
| `POST` | `/api/users` | Crear usuario |
| `POST` | `/api/users/verify` | Login → JWT |

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

### Ejemplo: Crear Transacción

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INCOME",
    "amount": 500,
    "currency": "USD",
    "description": "Salario"
  }'
```

---

## 📁 Estructura del Proyecto

```
personal-finance-app/
├── start.bat              # 🚀 Iniciar app
├── stop.bat               # 🛑 Detener app
├── docker-compose.yml     # 🐳 Docker config
│
├── client/                # Frontend React
│   ├── src/
│   │   ├── api.js        # Axios + interceptors
│   │   ├── pages/        # Vistas
│   │   └── components/   # UI components
│   └── Dockerfile
│
└── server/                # Backend Express
    ├── routes/           # API endpoints
    ├── middleware/       # Auth, errors
    ├── schemas/          # Validación Zod
    ├── prisma/           # DB schema
    └── Dockerfile
```

---

## 🔐 Seguridad

- ✅ JWT Authentication (7 días)
- ✅ Helmet (headers HTTP seguros)
- ✅ Rate Limiting (login)
- ✅ Zod Validation (inputs)
- ✅ Ownership Checks (recursos)
- ✅ bcrypt (hashing PINs)
- ✅ Error Sanitization

---

## 🗄️ Base de Datos

```
User ──┬──► Transaction
       ├──► Tag
       ├──► FixedExpense
       └──► Goal ──► GoalMonth
```

---

## 📱 Uso

1. **Seleccionar usuario** o crear uno nuevo
2. **Ingresar PIN** de 4 dígitos
3. **Dashboard**: Ver balance y transacciones
4. **Agregar transacciones** con el botón "+"
5. **Crear metas** de ahorro con quincenas
6. **Gestionar gastos fijos** recurrentes

---

## 📄 Licencia

MIT © 2024 Jeremy

---

<div align="center">

**¿Preguntas?** Abre un [issue](https://github.com/tu-usuario/personal-finance-app/issues)

</div>
