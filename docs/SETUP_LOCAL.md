# 🖥️ Guía de Instalación Local (Windows)

Esta guía te llevará paso a paso para ejecutar la aplicación de finanzas en tu PC con Windows.

---

## 📋 Requisitos Previos

| Software | Versión Mínima | Descarga |
|----------|----------------|----------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Git | 2.0+ | [git-scm.com](https://git-scm.com/) |
| Docker Desktop (opcional) | 4.0+ | [docker.com](https://www.docker.com/products/docker-desktop/) |

---

## 🚀 Instalación Rápida

### 1. Clonar el Repositorio
```powershell
git clone https://github.com/tu-usuario/personal-finance-app.git
cd personal-finance-app
```

### 2. Configurar Variables de Entorno

**Backend (server/.env):**
```powershell
cd server
copy .env.example .env
```

Edita `server/.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=tu_clave_secreta_aqui
CRON_ENABLED=true
```

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

**Opción A - Scripts automáticos:**
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
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000/api/health

---

## 🐳 Instalación con Docker (Alternativa)

Si prefieres usar Docker para un entorno más aislado:

```powershell
# Iniciar contenedores
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down
```

**Acceso:**
- Frontend: http://localhost
- Backend: http://localhost:3000

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
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Base de datos corrupta
```powershell
cd server
del prisma\dev.db
npx prisma db push
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
| PWA | Chrome DevTools > Application | Manifest detectado |

---

**¿Problemas?** Abre un issue en el repositorio o revisa los logs del servidor.
