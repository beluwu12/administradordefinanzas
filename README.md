<div align="center">

# 💰 Gestor Financiero (Enterprise Grade)
### Sistema de Gestión Financiera Multi-Moneda & Cloud-Native

[![🇺🇸 English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](README.en.md)
[![🇪🇸 Español](https://img.shields.io/badge/Idioma-Español-red?style=for-the-badge)](README.md)

[![Azure](https://img.shields.io/badge/Azure-Container%20Apps-0078D4?style=flat-square&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)

**Una solución robusta para la gestión financiera en economías de alta inflación.**
Integra conversión automática de divisas (USD/VES), arquitectura escalable en Azure, seguridad Enterprise, y un diseño responsive moderno.

[Características Técnicas](#-características-técnicas) •
[Arquitectura](#-arquitectura-del-sistema) •
[Stack Tecnológico](#-stack-tecnológico) •
[Instalación](#-instalación-rápida) •
[Roadmap](#-roadmap)

</div>

---

## 🚀 Propuesta de Valor

Este proyecto no es solo una calculadora de gastos. Es una **arquitectura completa full-stack** diseñada para resolver un problema real: la gestión financiera en entornos bi-monetarios complejos.

A diferencia de apps tradicionales, este sistema maneja la dualidad **Dólar/Bolívar** en tiempo real, sincronizando tasas oficiales (BCV) automáticamente y permitiendo reportes financieros precisos sin importar la moneda de la transacción original.

## ✨ Características Técnicas (The "Wow" Factor)

### 💵 Motor Multi-Moneda (Dual Currency Engine)
*   **Conversión en Tiempo Real**: Sistema agnóstico a la moneda. Las transacciones se guardan en su moneda original y se normalizan para reportes usando tasas históricas exactas.
*   **Sincronización Automática API**: Un servicio en background (`node-cron`) escrapea y actualiza la tasa del Banco Central diariamente.
*   **Precisión Decimal**: Manejo de montos con `Decimal.js` para evitar errores de punto flotante en cálculos financieros críticos.

### ☁️ Arquitectura Cloud-Native (Azure)
*   **Container Apps**: Despliegue serverless de contenedores Docker (Frontend + Backend), escalando a cero para optimización de costos.
*   **PostgreSQL Flexible Server**: Base de datos gestionada con alta disponibilidad y backups automáticos.
*   **CI/CD Pipeline**: Scripts de PowerShell automatizados para construcción de imágenes, tagging (versionado) y despliegue continuo en Azure Container Registry.

### 🛡️ Seguridad & Rendimiento
*   **Autenticación Robusta**: JWT (JSON Web Tokens) con rotación de claves y cookies `httpOnly` para mitigar XSS.
*   **Rate Limiting**: Protección contra ataques de fuerza bruta y DDoS en endpoints sensibles, configurado para entornos proxy (`trust proxy`).
*   **Optimización de Consultas**: Uso de `Prisma Aggregate` para cálculos de balance en base de datos (evitando procesar miles de registros en memoria).

---

## 🏗 Arquitectura del Sistema

El sistema sigue una arquitectura de microservicios contenerizados desplegados en Azure.

```mermaid
graph TD
    Client[Cliente (React SPA)] -->|HTTPS| AzureLB[Azure Load Balancer]
    AzureLB -->|/api| Backend[Backend API (Node.js Container)]
    AzureLB -->|/*| Frontend[Frontend (Nginx Container)]
    
    Backend -->|Query/Trans| DB[(Azure PostgreSQL)]
    Backend -->|Scrape Rate| BCV[Banco Central (External)]
    
    subgraph "Azure Container Apps Environment"
        Frontend
        Backend
    end
```

---

## 🛠 Stack Tecnológico

### Frontend (Cliente)
*   **Framework**: React 18 + Vite (SPA de alto rendimiento).
*   **Estilos**: TailwindCSS (Sistema de diseño utilitario y responsive).
*   **Estado**: React Context API + Axios Interceptors (Gestión centralizada de Auth y Errores).
*   **UX**: Diseño Glassmorphism, Modo Oscuro/Claro, Transiciones fluidas.

### Backend (API)
*   **Runtime**: Node.js v20 (LTS).
*   **Framework**: Express.js (REST API).
*   **ORM**: Prisma (Seguridad de tipos y migraciones declarativas).
*   **Servicios**: `node-cron` (Tareas programadas), `cheerio` (Scraping), `zod` (Validación de esquemas).

### DevOps & Infraestructura
*   **Contenedores**: Docker (Multi-stage builds para optimizar tamaño de imágenes).
*   **Cloud**: Microsoft Azure (Resource Groups, Container Apps, ACR).
*   **Scripting**: PowerShell (Automatización de despliegues y gestión de secretos).

---

## 🚀 Instalación Rápida (Desarrolladores)

### Prerrequisitos
*   Node.js v20+
*   Docker & Docker Compose (Opcional pero recomendado)
*   PostgreSQL (Local o Cloud)

### 1. Clonar el repositorio
```bash
git clone https://github.com/Gillardo/personal-finance-app.git
cd personal-finance-app
```

### 2. Configuración de Entorno
Copia el archivo de ejemplo y configura tu base de datos y secretos.
```bash
cd server && cp .env.example .env
# Edita DATABASE_URL y JWT_SECRET
```

### 3. Iniciar con Docker (Recomendado)
Levanta todo el stack (Frontend + Backend + DB) con un solo comando.
```bash
docker compose up -d
```
El frontend estará disponible en `http://localhost:5173`.

### 4. Despliegue en Azure
Consultar la guía detallada de despliegue en [`docs/DEPLOY_CLOUD.md`](docs/DEPLOY_CLOUD.md).
```powershell
# Ejemplo de despliegue rápido
cd deploy
.\build-and-push.ps1
.\deploy-apps.ps1
```

---

## 🗺 Roadmap de Producto

Hacia donde vamos: Transformando el MVP en una plataforma financiera integral.

- [ ] **App Móvil Nativa**: Desarrollo de versión React Native para iOS/Android reusando la lógica de negocio actual.
- [ ] **Inteligencia Artificial**: Integración con LLMs para análisis de gastos y sugerencias de ahorro personalizadas ("Financial Copilot").
- [ ] **Integración Bancaria (Open Banking)**: Conexión automática con bancos para importación de movimientos (vía Plaid o APIs locales).
- [ ] **Módulo de Inversiones**: Seguimiento de portafolio de acciones y criptomonedas en tiempo real.

---

<div align="center">
  
**Desarrollado por Jeremy**
  
[LinkedIn](https://linkedin.com/in/tu-perfil) • [GitHub](https://github.com/tu-usuario)

</div>
