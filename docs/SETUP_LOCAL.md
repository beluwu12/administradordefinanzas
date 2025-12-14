# 🖥️ Guía de Instalación Local

Esta guía te ayudará a ejecutar la aplicación de finanzas en tu PC local para desarrollo.

---

## 📋 Requisitos Previos

| Software | Versión Mínima | Descarga |
|----------|----------------|----------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| Git | 2.0+ | [git-scm.com](https://git-scm.com/) |
| Docker Desktop (opcional) | 4.0+ | [docker.com](https://www.docker.com/products/docker-desktop/) |

---

## 🚀 Instalación Rápida

### 1. Clonar el Repositorio

```powershell
git clone https://github.com/Gillardo/personal-finance-app.git
cd personal-finance-app
```

### 2. Configurar Variables de Entorno

```powershell
cd server
copy .env.example .env
```

Edita `server/.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=genera_una_clave_secreta_aqui
CRON_ENABLED=true
NODE_ENV=development
PORT=3000
```

> 💡 **Tip**: Genera un JWT_SECRET seguro con: `openssl rand -hex 32`

### 3. Instalar Dependencias

```powershell
# Backend
cd server
npm install

# Frontend (en otra terminal)
cd client
npm install
```

### 4. Inicializar Base de Datos

```powershell
cd server
npx prisma db push
```

### 5. Ejecutar la Aplicación

**Opción A - Scripts automáticos (Windows):**
```powershell
# Desde la raíz del proyecto
.\start.bat
```

**Opción B - Manual:**
```powershell
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

### 6. Acceder a la Aplicación

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Health Check | http://localhost:3000/api/health |

---

## 🐳 Instalación con Docker

Si prefieres usar Docker para un entorno más aislado:

```powershell
# Copiar variables de entorno
copy .env.example .env

# Iniciar contenedores (PostgreSQL + Backend + Frontend)
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

**Acceso con Docker:**
| Servicio | URL |
|----------|-----|
| Frontend | http://localhost |
| Backend | http://localhost:3000 |

---

## 🔧 Solución de Problemas

### Error: "EACCES permission denied"

```powershell
# Ejecutar PowerShell como Administrador
Set-ExecutionPolicy RemoteSigned
```

### Error: "Prisma Client not generated"

```powershell
cd server
npx prisma generate
```

### Puerto 3000 ocupado

```powershell
# Encontrar proceso
netstat -ano | findstr :3000

# Terminar proceso
taskkill /PID <PID> /F
```

### Base de datos corrupta

```powershell
cd server
del prisma\dev.db
npx prisma db push
```

### Error: "Cannot find module"

```powershell
# Reinstalar dependencias
cd server
rm -rf node_modules
npm install
```

---

## 📱 Acceder desde el Móvil (Red Local)

1. Obtén tu IP local:
```powershell
ipconfig
# Busca "IPv4 Address" (ej: 192.168.1.100)
```

2. Inicia el frontend con host expuesto:
```powershell
cd client
npm run dev -- --host
```

3. Accede desde tu móvil: `http://192.168.1.100:5173`

---

## ✅ Verificación

| Componente | URL | Respuesta Esperada |
|------------|-----|-------------------|
| API Health | http://localhost:3000/api/health | `{"success": true}` |
| Frontend | http://localhost:5173 | Página de Login |

---

## 🔄 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor en modo desarrollo |
| `npm start` | Inicia servidor en modo producción |
| `npx prisma studio` | Abre interfaz visual de la base de datos |
| `npx prisma db push` | Sincroniza schema con la base de datos |

---

**¿Problemas?** Abre un [issue](https://github.com/Gillardo/personal-finance-app/issues) en el repositorio.
