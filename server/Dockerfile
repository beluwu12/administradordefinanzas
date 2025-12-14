FROM node:20-alpine

# Install OpenSSL for Prisma compatibility
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma/
COPY . .

# Generate Prisma Client for Linux
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]

