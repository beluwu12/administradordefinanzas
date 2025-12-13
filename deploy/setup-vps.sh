#!/bin/bash

# Configuration
APP_DIR="/opt/finanzas"
REPO_URL="https://github.com/tu-usuario/finance-app.git"

echo "🚀 Starting VPS Setup..."

# 1. Update System
apt update && apt upgrade -y

# 2. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install -y docker-compose-plugin

# 3. Clone Repository
git clone $REPO_URL $APP_DIR
cd $APP_DIR

# 4. Create .env file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit .env file with production values!"
    nano .env
fi

# 5. Start Services
docker compose -f docker-compose.prod.yml up -d --build

echo "✅ Setup Complete! Visit your domain."
