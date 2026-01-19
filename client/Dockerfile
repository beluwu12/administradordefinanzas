FROM node:20-alpine AS build

WORKDIR /app

COPY lovable-ui/package*.json ./
RUN npm ci

COPY lovable-ui/ .

# Set production API URL - CRITICAL for login to work
ARG VITE_API_URL=https://finanzas-backend.orangeflower-43ff1781.eastus.azurecontainerapps.io/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Nginx Stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY lovable-ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

