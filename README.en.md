<div align="center">

# 💰 Personal Finance Manager (Enterprise Grade)
### Multi-Currency Financial Management System & Cloud-Native Architecture

[![🇺🇸 English](https://img.shields.io/badge/Language-English-blue?style=for-the-badge)](README.en.md)
[![🇪🇸 Español](https://img.shields.io/badge/Idioma-Español-red?style=for-the-badge)](README.md)

[![Azure](https://img.shields.io/badge/Azure-Container%20Apps-0078D4?style=flat-square&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)

**A robust financial management solution tailored for high-inflation economies.**
Seamlessly integrates automatic currency conversion (USD/VES), scalable Azure architecture, Enterprise-grade security, and a modern responsive design.

[Technical Features](#-technical-features) •
[Architecture](#-system-architecture) •
[Tech Stack](#-tech-stack) •
[Installation](#-quick-start) •
[Roadmap](#-roadmap)

</div>

---

## 🚀 Value Proposition

This project is not just another expense tracker. It is a **full-stack architectural solution** designed to solve a real-world problem: financial management in complex bi-monetary environments.

Unlike traditional apps, this system handles the **Dollar/Bolivar** duality in real-time, automatically synchronizing official rates (Central Bank) and enabling accurate financial reporting regardless of the original transaction currency.

## ✨ Technical Features (The "Wow" Factor)

### 💵 Dual Currency Engine
*   **Real-Time Conversion**: Currency-agnostic system. Transactions are stored in their source currency and normalized for reporting using precise historical rates.
*   **Automatic Synchronization**: A background microservice (`node-cron`) scrapes and updates the Central Bank (BCV) exchange rate daily.
*   **Decimal Precision**: Utilizes `Decimal.js` for floating-point arithmetic precision in critical financial calculations.

### ☁️ Cloud-Native Architecture (Azure)
*   **Container Apps**: Serverless deployment of Docker containers (Frontend + Backend), capable of scaling to zero for cost optimization.
*   **PostgreSQL Flexible Server**: Managed database service ensuring high availability and automated backups.
*   **CI/CD Pipeline**: Automated PowerShell scripts for image building, version tagging, and continuous deployment to Azure Container Registry.

### 🛡️ Security & Performance
*   **Robust Authentication**: JWT (JSON Web Tokens) with key rotation and `httpOnly` cookies to mitigate XSS attacks.
*   **Rate Limiting**: Protection against Brute-force and DDoS attacks on sensitive endpoints, configured for proxy environments (`trust proxy`).
*   **Query Optimization**: Leverages `Prisma Aggregate` for database-level balance calculations (offloading processing from application memory).

---

## 🏗 System Architecture

The system follows a containerized microservices architecture deployed on Azure.

```mermaid
graph TD
    Client[Client (React SPA)] -->|HTTPS| AzureLB[Azure Load Balancer]
    AzureLB -->|/api| Backend[Backend API (Node.js Container)]
    AzureLB -->|/*| Frontend[Frontend (Nginx Container)]
    
    Backend -->|Query/Trans| DB[(Azure PostgreSQL)]
    Backend -->|Scrape Rate| BCV[Central Bank (External)]
    
    subgraph "Azure Container Apps Environment"
        Frontend
        Backend
    end
```

---

## 🛠 Tech Stack

### Frontend (Client)
*   **Framework**: React 18 + Vite (High-performance SPA).
*   **Styling**: TailwindCSS (Utility-first responsive design system).
*   **State Management**: React Context API + Axios Interceptors (Centralized Auth & Error handling).
*   **UX**: Glassmorphism Design, Dark/Light Mode, Fluid Transitions.

### Backend (API)
*   **Runtime**: Node.js v20 (LTS).
*   **Framework**: Express.js (REST API).
*   **ORM**: Prisma (Type safety & declarative migrations).
*   **Services**: `node-cron` (Scheduled tasks), `cheerio` (Scraping), `zod` (Schema validation).

### DevOps & Infrastructure
*   **Containers**: Docker (Multi-stage builds for optimized image sizes).
*   **Cloud**: Microsoft Azure (Resource Groups, Container Apps, ACR).
*   **Scripting**: PowerShell (Deployment automation & secret management).

---

## 🚀 Quick Start (Developers)

### Prerequisites
*   Node.js v20+
*   Docker & Docker Compose (Optional but recommended)
*   PostgreSQL (Local or Cloud)

### 1. Clone the repository
```bash
git clone https://github.com/Gillardo/personal-finance-app.git
cd personal-finance-app
```

### 2. Environment Setup
Copy the example file and configure your database and secrets.
```bash
cd server && cp .env.example .env
# Edit DATABASE_URL and JWT_SECRET
```

### 3. Start with Docker (Recommended)
Spin up the entire stack (Frontend + Backend + DB) with a single command.
```bash
docker compose up -d
```
Access the frontend at `http://localhost:5173`.

### 4. Deploy to Azure
Refer to the detailed deployment guide in [`docs/DEPLOY_CLOUD.md`](docs/DEPLOY_CLOUD.md).
```powershell
# Quick deployment example
cd deploy
.\build-and-push.ps1
.\deploy-apps.ps1
```

---

## 🗺 Product Roadmap

Where we are going: Evolving the MVP into a comprehensive financial platform.

- [ ] **Native Mobile App**: React Native development for iOS/Android reusing the current business logic.
- [ ] **Artificial Intelligence**: LLM integration for expense analysis and personalized savings suggestions ("Financial Copilot").
- [ ] **Open Banking Integration**: Automatic connection with banks for transaction importing (via Plaid or local APIs).
- [ ] **Investment Module**: Real-time tracking of stock and crypto portfolios.

---

<div align="center">
  
**Developed by Jeremy**
  
[LinkedIn](https://linkedin.com/in/your-profile) • [GitHub](https://github.com/your-username)

</div>
