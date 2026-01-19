# ☁️ Guía de Despliegue en la Nube

Esta guía cubre el despliegue de la aplicación usando el **Free Tier Stack**:
- **Frontend**: Vercel (gratis)
- **Backend**: Render (gratis)
- **Database**: Supabase PostgreSQL (gratis)

---

## 📋 Requisitos Previos

| Servicio | Cuenta | Registro |
|----------|--------|----------|
| Vercel | Requerida | [vercel.com](https://vercel.com) |
| Render | Requerida | [render.com](https://render.com) |
| Supabase | Requerida | [supabase.com](https://supabase.com) |
| GitHub | Requerida | Para CI/CD automático |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└───────────────────┬─────────────────────┬───────────────────┘
                    │                     │
        ┌───────────▼───────────┐ ┌──────▼──────────┐
        │       VERCEL          │ │     RENDER      │
        │  (Frontend - React)   │ │ (Backend - Node)│
        │                       │ │                 │
        │  remix-of-fincontrol  │ │  finanzas-api   │
        │  -insights.vercel.app │ │  .onrender.com  │
        └───────────────────────┘ └────────┬────────┘
                                           │
                              ┌────────────▼────────────┐
                              │       SUPABASE          │
                              │   (PostgreSQL Database) │
                              │                         │
                              │  aws-1-us-east-1.pooler │
                              │    .supabase.com        │
                              └─────────────────────────┘
```

---

## 🗄️ Paso 1: Configurar Supabase (Database)

### 1.1 Crear proyecto
1. Ve a [supabase.com](https://supabase.com) → New Project
2. Nombre: `finanzas-app`
3. Región: `East US` (o la más cercana)
4. Genera una contraseña segura y **guárdala**

### 1.2 Obtener Connection String
1. Settings → Database → Connection string
2. Copia la URL de **Connection pooling** (Session mode):
   ```
   postgresql://postgres.[PROJECT-ID]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

### 1.3 Ejecutar migraciones
```bash
cd server
npx prisma migrate deploy
```

---

## 🚀 Paso 2: Desplegar Backend en Render

### 2.1 Crear Web Service
1. Ve a [render.com](https://render.com) → New → Web Service
2. Conecta tu repositorio de GitHub
3. Configuración:
   - **Name**: `finanzas-backend`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`

### 2.2 Variables de Entorno
Agrega estas variables en Render → Environment:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Tu connection string de Supabase |
| `JWT_SECRET` | Genera con `openssl rand -hex 32` |
| `NODE_ENV` | `production` |
| `CORS_ALLOWED_ORIGINS` | `https://tu-app.vercel.app` |
| `CRON_ENABLED` | `true` |
| `FEATURE_RATE_LIMIT_ENABLED` | `true` |

### 2.3 Deploy
Render automáticamente despliega cuando haces push a `master`.

**URL resultante**: `https://finanzas-backend.onrender.com`

---

## 🌐 Paso 3: Desplegar Frontend en Vercel

### 3.1 Importar proyecto
1. Ve a [vercel.com](https://vercel.com) → New Project
2. Importa tu repositorio de GitHub
3. Configuración:
   - **Root Directory**: `client` (o `lovable-ui` según tu frontend)
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.2 Variables de Entorno
En Vercel → Settings → Environment Variables:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://finanzas-backend.onrender.com/api` |

### 3.3 Deploy
Vercel automáticamente despliega cuando haces push a `master`.

---

## 🔄 Paso 4: Configurar CORS

Después de obtener tu URL de Vercel, actualiza en Render:

```
CORS_ALLOWED_ORIGINS=https://tu-app.vercel.app
```

Si tienes múltiples dominios:
```
CORS_ALLOWED_ORIGINS=https://tu-app.vercel.app,https://custom-domain.com
```

---

## 💰 Costos

| Servicio | Plan | Costo |
|----------|------|-------|
| Vercel | Hobby | **$0/mes** |
| Render | Free | **$0/mes** |
| Supabase | Free | **$0/mes** |
| **Total** | | **$0/mes** ✨ |

### Limitaciones del Free Tier

| Servicio | Limitación |
|----------|------------|
| Render | El servidor "duerme" después de 15 min de inactividad. Primera request tarda ~30s |
| Supabase | 500MB storage, 2GB bandwidth/mes |
| Vercel | 100GB bandwidth/mes |

---

## 🔧 CI/CD Automático

Ambos servicios tienen CI/CD integrado:

1. **Push to `master`** → 
2. **Vercel** reconstruye el frontend automáticamente
3. **Render** reconstruye el backend automáticamente

No necesitas hacer nada manual después del setup inicial.

---

## 📊 Variables de Entorno Completas

### Backend (Render)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | ✅ | Connection string de Supabase |
| `JWT_SECRET` | ✅ | Clave para tokens (min 32 chars) |
| `NODE_ENV` | ✅ | `production` |
| `CORS_ALLOWED_ORIGINS` | ✅ | URLs del frontend separadas por coma |
| `PORT` | ❌ | Render lo asigna automáticamente |
| `CRON_ENABLED` | ❌ | `true` para habilitar tareas programadas |
| `VAPID_PUBLIC_KEY` | ❌ | Para push notifications |
| `VAPID_PRIVATE_KEY` | ❌ | Para push notifications |

### Frontend (Vercel)

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `VITE_API_URL` | ✅ | URL completa del backend con `/api` |

---

## 🛠️ Solución de Problemas

### Error: CORS blocked origin
**Causa**: El frontend no está en `CORS_ALLOWED_ORIGINS`
**Solución**: Agregar la URL exacta del frontend en Render → Environment

### Error: Backend muy lento (30+ segundos)
**Causa**: Free tier de Render "duerme" el servidor
**Solución**: 
- Esperar la primera request
- Upgrade a paid tier ($7/mes) para eliminar sleep

### Error: Database connection failed
**Causa**: Connection string incorrecta o SSL
**Solución**: Verificar que la URL tenga `?sslmode=require` al final

### Ver logs del backend
1. Render Dashboard → Tu servicio → Logs
2. O usar el endpoint: `https://tu-backend.onrender.com/health`

---

## 💾 Backups

### Backup manual de Supabase
```bash
cd deploy
./backup.sh
```

### Backup desde Supabase Dashboard
1. Settings → Database → Backups
2. Download latest backup

---

## 🚀 Upgrade Path

Cuando necesites más capacidad:

| Servicio | Free → Paid | Beneficio |
|----------|-------------|-----------|
| Render | $7/mes | Sin sleep, más RAM |
| Supabase | $25/mes | 8GB storage, backups diarios |
| Vercel | $20/mes | Más bandwidth, analytics |

---

**¿Necesitas ayuda?**
- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
