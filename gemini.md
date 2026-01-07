Personal Finance App → Android APK Migration
Current Phase: Fase 1 - Capacitor Básico
Decisiones del usuario:

appId: com.finanzas.app
Recordatorios de metas: Semanales
Sincronización: Automática
Fase 0: Configuración de Entorno ✅
 Analizar estructura actual del proyecto
 Revisar schema de Prisma para diseño SQLite
 Verificar Android Studio instalado y configurado
 Crear plan de implementación detallado
Fase 1: Capacitor Básico
 Instalar dependencias de Capacitor
 Inicializar Capacitor en /client
 Configurar capacitor.config.ts
 Generar proyecto Android
 Ejecutar app en emulador Android
 Verificar funcionamiento básico
Fase 2: SQLite + Offline
 Instalar @capacitor-community/sqlite
 Crear esquema SQLite local (mirror de Prisma)
 Implementar DatabaseService para operaciones CRUD
 Crear SyncService para cola de sincronización
 Implementar lógica de sync con Supabase
 Manejar conflictos (last-write-wins o merge)
 Crear hook useOfflineData
Fase 3: Notificaciones Locales
 Instalar @capacitor/local-notifications
 Crear NotificationService
 Implementar recordatorios de presupuesto
 Implementar recordatorios de metas
 Implementar recordatorios de gastos fijos
 UI para configurar frecuencia de recordatorios
Fase 4: Biometría
 Instalar @capacitor-community/biometric-auth
 Crear opción en Settings para activar/desactivar
 Implementar unlock con huella/Face ID
 Almacenar preferencia de biometría
Fase 5: Pulido y Testing
 Probar en múltiples dispositivos/emuladores
 Optimizar rendimiento
 Crear iconos de app (launcher icons)
 Crear splash screen
 Generar APK de release firmado
Plan de Implementación: Personal Finance → Android APK
Migrar la aplicación Personal Finance (React + Vite PWA) a una aplicación Android nativa usando Capacitor, con soporte para datos offline, notificaciones locales y biometría.

User Review Required
IMPORTANT

Decisión de sincronización offline: Propongo usar estrategia "last-write-wins" para conflictos. ¿Prefieres un merge más complejo o está bien?

WARNING

Cambios en arquitectura: Se agregará una capa de abstracción de datos que decidirá si usar SQLite local o API remota según el estado de conexión.

Proposed Changes
Fase 1: Capacitor Básico
[NEW] 

capacitor.config.ts
Configuración principal de Capacitor:

const config: CapacitorConfig = {
  appId: 'com.finanzas.app',
  appName: 'Administrador de Finanzas',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};
[MODIFY] 

package.json
Agregar dependencias de Capacitor:

{
  "@capacitor/core": "^7.x",
  "@capacitor/cli": "^7.x",
  "@capacitor/android": "^7.x",
  "@capacitor/network": "^7.x",
  "@capacitor/preferences": "^7.x"
}
[NEW] android/ (directorio)
Proyecto Android generado por Capacitor. Requiere:

Configurar AndroidManifest.xml para permisos
Generar iconos de launcher
Fase 2: SQLite + Sincronización Offline
[NEW] 

DatabaseService.js
Servicio central para operaciones SQLite:

// Funciones principales:
// - initDatabase(): Crear tablas
// - getTransactions(): Leer desde SQLite
// - saveTransaction(): Guardar localmente
// - getPendingSync(): Obtener operaciones pendientes
[NEW] 

SyncService.js
Servicio de sincronización:

// Funciones principales:
// - queueOperation(type, entity, data): Encolar cambio
// - syncToServer(): Enviar cambios pendientes a Supabase
// - syncFromServer(): Obtener cambios del servidor
// - resolveConflicts(): Resolver conflictos (last-write-wins)
Esquema SQLite Local (mirror de Prisma)
-- Transacciones
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'USD',
  exchangeRate REAL,
  type TEXT NOT NULL,
  description TEXT,
  source TEXT,
  date TEXT,
  userId TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  syncStatus TEXT DEFAULT 'synced'  -- 'synced', 'pending', 'conflict'
);
-- Tags
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  userId TEXT,
  syncStatus TEXT DEFAULT 'synced'
);
-- Goals
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  totalCost REAL,
  currency TEXT DEFAULT 'USD',
  durationMonths INTEGER,
  monthlyAmount REAL,
  deadline TEXT,
  startDate TEXT,
  savedAmount REAL DEFAULT 0,
  userId TEXT,
  syncStatus TEXT DEFAULT 'synced'
);
-- Fixed Expenses (Presupuestos)
CREATE TABLE fixed_expenses (
  id TEXT PRIMARY KEY,
  amount REAL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  dueDay INTEGER,
  isActive INTEGER DEFAULT 1,
  userId TEXT,
  syncStatus TEXT DEFAULT 'synced'
);
-- Cola de sincronización
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation TEXT NOT NULL,      -- 'CREATE', 'UPDATE', 'DELETE'
  entity TEXT NOT NULL,         -- 'transaction', 'tag', 'goal', 'fixed_expense'
  entityId TEXT NOT NULL,
  payload TEXT,                 -- JSON
  createdAt TEXT,
  attempts INTEGER DEFAULT 0
);
[NEW] 

useOfflineData.js
Hook React para manejar datos offline:

// Uso:
// const { data, loading, save, sync } = useOfflineData('transactions');
// - Automáticamente usa SQLite si no hay red
// - Encola cambios para sincronizar después
Fase 3: Notificaciones Locales
[NEW] 

NotificationService.js
// Funciones:
// - scheduleReminder(type, config): Programar recordatorio
// - cancelReminder(id): Cancelar
// - checkBudgetAlerts(): Verificar si presupuesto > 80%
// - checkGoalDeadlines(): Verificar metas próximas a vencer
Tipos de recordatorios:

Tipo	Trigger	Mensaje Ejemplo
budget_warning	Gasto > 80% del presupuesto	"⚠️ Has gastado el 85% de tu presupuesto de Comida"
budget_exceeded	Gasto > 100%	"🚨 Excediste tu presupuesto de Transporte"
goal_reminder	Semanal/mensual	"💰 Recuerda ahorrar $50 para tu meta 'Viaje'"
goal_deadline	7 días antes	"📅 Tu meta 'Laptop' vence en 7 días"
fixed_expense	3 días antes del dueDay	"📋 Pago de 'Netflix' vence el día 15"
Fase 4: Biometría
[MODIFY] 

SettingsPage.jsx
Agregar toggle para biometría:

<Toggle
  label="Desbloqueo con huella/Face ID"
  checked={biometricEnabled}
  onChange={toggleBiometric}
/>
[NEW] 

BiometricService.js
// Funciones:
// - isAvailable(): Verificar si dispositivo soporta biometría
// - authenticate(): Solicitar autenticación
// - setEnabled(bool): Guardar preferencia
Resumen de Nuevos Archivos
Archivo	Propósito
capacitor.config.ts	Configuración Capacitor
services/DatabaseService.js	Operaciones SQLite
services/SyncService.js	Sincronización offline
services/NotificationService.js	Notificaciones locales
services/BiometricService.js	Autenticación biométrica
hooks/useOfflineData.js	Hook para datos offline
android/ (directorio)	Proyecto Android nativo
Verification Plan
Fase 1: Capacitor Básico
Test manual - Emulador Android:

Ejecutar npm run build en /client
Ejecutar npx cap sync android
Abrir Android Studio: npx cap open android
Ejecutar en emulador
Verificar: App carga correctamente, navegación funciona, UI se ve igual que en web
Fase 2: SQLite + Offline
Test manual - Modo offline:

Ejecutar app en emulador
Activar modo avión en emulador
Crear una nueva transacción
Verificar: Transacción se guarda localmente (aparece en lista)
Desactivar modo avión
Esperar sincronización automática
Verificar: Transacción aparece en Supabase/servidor
Test manual - Conflictos:

Crear transacción offline
Desde otro dispositivo/web, modificar la misma transacción
Reconectar y sincronizar
Verificar: Estrategia last-write-wins aplica correctamente
Fase 3: Notificaciones Locales
Test manual:

Configurar recordatorio de presupuesto
Agregar gastos hasta superar 80% del presupuesto
Verificar: Notificación aparece
Programar recordatorio para 1 minuto después
Verificar: Notificación se dispara en tiempo correcto
Fase 4: Biometría
Test manual:

Ir a Settings → Activar biometría
Cerrar app completamente
Reabrir app
Verificar: Solicita autenticación biométrica antes de mostrar contenido
Test General
Generación de APK:

cd client
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
Verificar: APK generado en android/app/build/outputs/apk/debug/
Instalar en dispositivo físico y probar todas las funcionalidades
Preguntas para ti
¿Tienes alguna preferencia para el appId? Propongo com.finanzas.app pero puedes elegir otro (ej: com.tuempresa.finanzas)

¿Cada cuánto quieres los recordatorios de metas? ¿Semanal, quincenal, mensual?

¿Quieres que la sincronización sea automática al detectar conexión, o manual con un botón "Sincronizar"?