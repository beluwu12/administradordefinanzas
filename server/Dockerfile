FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
COPY . .

# Generate Prisma Client for Linux (Postgres)
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
