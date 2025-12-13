#!/bin/bash

echo "🔄 Updating Application..."

git pull origin main

docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

echo "✅ Update Complete!"
docker system prune -f
