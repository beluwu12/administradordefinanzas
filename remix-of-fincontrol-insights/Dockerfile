# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY lovable-ui/package*.json ./
RUN npm ci

# Copy source code and build
COPY lovable-ui/ .

# Set API URL for production build
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Production Stage - Nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config (reuse from client)
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
