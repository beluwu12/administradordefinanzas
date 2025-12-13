# 💰 Administrador de Finanzas Personales

Aplicación de finanzas personales multiusuario con soporte para **USD y Bolívares (VES)**, seguimiento de metas de ahorro con sistema de quincenas, y tasa de cambio BCV automática.

## 📚 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Base de Datos](#-base-de-datos)
- [Seguridad](#-seguridad)
- [Uso](#-uso)

---

## ✨ Características

### 👥 Multiusuario
- Sistema de perfiles con autenticación por PIN de 4 dígitos
- JWT para sesiones seguras
- Cada usuario tiene sus propios datos aislados

### 💵 Transacciones
- Ingresos y gastos en **USD** o **VES**
- Tasa de cambio BCV actualizada automáticamente (3 veces al día)
- Etiquetas personalizables con colores
- Historial completo con filtros

### 📊 Dashboard
- Balance total en USD y VES
- Conversión automática a Bolívares usando tasa BCV
- Resumen de últimos 30 días
- Top 3 categorías de gastos

### 🎯 Metas de Ahorro
- Define meta, costo total y duración en meses
- Sistema de **quincenas** (2 pagos por mes)
- Seguimiento visual de progreso
- Cálculo automático de ahorro mensual

### 📅 Gastos Fijos
- Registro de gastos recurrentes
- Día de vencimiento configurable
- Soporte multi-moneda

---

## 🛠 Tecnologías

### Backend
| Tecnología | Uso |
|------------|-----|
| Node.js + Express | Servidor API REST |
| Prisma ORM | Acceso a base de datos |
| SQLite | Base de datos local |
| JWT | Autenticación |
| Zod | Validación de datos |
| Helmet | Headers de seguridad HTTP |
| bcryptjs | Hashing de PINs |
| decimal.js | Precisión en cálculos monetarios |
| date-fns | Manejo de fechas |
| node-cron | Tareas programadas (BCV) |

### Frontend
| Tecnología | Uso |
|------------|-----|
| React 18 | Interfaz de usuario |
| React Router | Navegación SPA |
| Axios | Llamadas HTTP |
| Tailwind CSS | Estilos |
| Lucide React | Iconos |

---

## 🚀 Instalación

### Prerrequisitos
- Node.js v18+
- npm o yarn

### Pasos

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/personal-finance-app.git
cd personal-finance-app

# Backend
cd server
npm install
echo "DATABASE_URL=\"file:./dev.db\"" > .env
echo "JWT_SECRET=\"tu-clave-secreta-muy-segura-aqui\"" >> .env
npx prisma db push
npm run dev

# Frontend (nueva terminal)
cd ../client
npm install
npm run dev
```

### Acceso
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

---

## 📁 Estructura del Proyecto

```
personal-finance-app/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── api.js            # Módulo centralizado axios
│   │   ├── config.js         # Configuración API URL
│   │   ├── App.jsx           # Rutas principales
│   │   ├── components/       # Componentes reutilizables
│   │   │   ├── ErrorBoundary.jsx
│   │   │   ├── TransactionForm.jsx
│   │   │   ├── TransactionItem.jsx
│   │   │   ├── TransactionsModal.jsx
│   │   │   └── dashboard/
│   │   │       └── Summary30Days.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useApiRequest.js
│   │   ├── pages/
│   │   │   ├── auth/         # Login, PIN, Crear usuario
│   │   │   ├── DashboardHelper.jsx
│   │   │   ├── TransactionsPage.jsx
│   │   │   ├── TagsPage.jsx
│   │   │   ├── BudgetPage.jsx
│   │   │   ├── GoalsPage.jsx
│   │   │   └── GoalDetailPage.jsx
│   │   └── i18n/
│   │       └── es.js         # Textos en español
│   └── package.json
│
├── server/                    # Backend Express
│   ├── index.js              # Entry point + middlewares
│   ├── db.js                 # Prisma client singleton
│   ├── middleware/
│   │   ├── requireAuth.js    # JWT authentication
│   │   └── errorHandler.js   # Global error handler
│   ├── routes/
│   │   ├── users.js          # Auth + usuarios
│   │   ├── transactions.js   # CRUD transacciones
│   │   ├── tags.js           # CRUD etiquetas
│   │   ├── fixedExpenses.js  # CRUD gastos fijos
│   │   ├── goals.js          # CRUD metas
│   │   ├── insight.js        # Resumen 30 días
│   │   └── exchangeRate.js   # Tasa BCV
│   ├── schemas/
│   │   └── index.js          # Validaciones Zod
│   ├── services/
│   │   └── bcvScraper.js     # Scraping tasa BCV
│   ├── utils/
│   │   └── responseUtils.js  # Respuestas estandarizadas
│   ├── prisma/
│   │   └── schema.prisma     # Modelos de BD
│   └── package.json
│
└── .gitignore
```

---

## 📡 API Endpoints

### Formato de Respuesta
Todas las respuestas usan formato estandarizado:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa",
  "error": null,
  "code": null
}
```

### Autenticación

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| POST | `/api/users/verify` | Verificar PIN → JWT |

```bash
# Crear usuario
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Juan","lastName":"Pérez","pin":"1234"}'

# Login
curl -X POST http://localhost:3000/api/users/verify \
  -H "Content-Type: application/json" \
  -d '{"userId":"<UUID>","pin":"1234"}'
```

### Transacciones (Requiere JWT)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/transactions` | Listar transacciones |
| GET | `/api/transactions/balance` | Obtener balance |
| POST | `/api/transactions` | Crear transacción |
| PUT | `/api/transactions/:id` | Actualizar |
| DELETE | `/api/transactions/:id` | Eliminar |

```bash
# Crear ingreso
curl -X POST http://localhost:3000/api/transactions \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INCOME",
    "amount": 500,
    "currency": "USD",
    "description": "Salario",
    "tags": []
  }'
```

### Etiquetas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/tags` | Listar etiquetas |
| POST | `/api/tags` | Crear etiqueta |
| DELETE | `/api/tags/:id` | Eliminar |

### Gastos Fijos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/fixed-expenses` | Listar |
| POST | `/api/fixed-expenses` | Crear |
| PUT | `/api/fixed-expenses/:id` | Actualizar |
| DELETE | `/api/fixed-expenses/:id` | Eliminar |

### Objetivos/Metas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/goals` | Listar metas |
| POST | `/api/goals` | Crear meta |
| PATCH | `/api/goals/:id/toggle-month` | Marcar quincena |
| DELETE | `/api/goals/:id` | Eliminar |

### Otros

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/insight/summary` | Resumen 30 días |
| GET | `/api/exchange-rate/usd-ves` | Tasa BCV |
| GET | `/api/health` | Estado del servidor |

---

## 🗄 Base de Datos

### Modelos

```
User (1) ─────────┬───► (N) Transaction
                  ├───► (N) Tag
                  ├───► (N) FixedExpense
                  └───► (N) Goal ────► (N) GoalMonth

ExchangeRate (independiente)
```

### Campos Principales

**User**: `id`, `firstName`, `lastName`, `pin` (hashed)

**Transaction**: `amount`, `currency`, `type` (INCOME/EXPENSE), `description`, `date`, `tags[]`

**Tag**: `name`, `color`, `userId` (unique por usuario)

**Goal**: `title`, `totalCost`, `monthlyAmount`, `durationMonths`, `savedAmount`

**GoalMonth**: `monthIndex`, `target`, `isQ1Paid`, `isQ2Paid`

---

## 🔐 Seguridad

### Implementada
- ✅ **JWT Authentication** con tokens de 7 días
- ✅ **Helmet** para headers HTTP seguros
- ✅ **Rate Limiting** en endpoints de autenticación
- ✅ **Zod Validation** en todos los inputs
- ✅ **Ownership Checks** en todas las operaciones
- ✅ **Password Hashing** con bcryptjs
- ✅ **Error Sanitization** (sin detalles internos al cliente)

### Variables de Entorno Requeridas
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="clave-muy-segura-minimo-32-caracteres"
```

---

## 📱 Uso

### Flujo Principal

1. **Seleccionar/Crear Usuario** → Pantalla inicial
2. **Ingresar PIN** → 4 dígitos numéricos
3. **Dashboard** → Ver balances y transacciones recientes
4. **Agregar Transacción** → Botón "+" 
5. **Categorías** → Crear y gestionar etiquetas
6. **Metas** → Crear objetivos de ahorro con quincenas
7. **Presupuesto** → Gestionar gastos fijos

### Responsive
- **Desktop**: Sidebar lateral
- **Móvil**: Navegación inferior

---

## 🧪 Scripts Útiles

```bash
# Servidor
cd server
npm run dev          # Iniciar con nodemon
npm start            # Iniciar producción
node e2e-seed.js     # Cargar datos de prueba

# Cliente
cd client
npm run dev          # Desarrollo con HMR
npm run build        # Build producción
```

---

## 📄 Licencia

MIT © 2024
