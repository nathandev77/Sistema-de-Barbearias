# ── Stage 1: Frontend Build (Vite) ───────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Ultra-light Nginx Runtime ────────────────────────
FROM nginx:alpine

# Copy the bundle generated in the previous stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx configuration for the SPA (React Router) and /api reverse proxy
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    \
    # Docker internal DNS — resolves the "backend" hostname dynamically \
    resolver 127.0.0.11 valid=10s ipv6=off; \
    \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-store, no-cache, must-revalidate"; \
    } \
    location /api/ { \
        set $backend backend; \
        proxy_pass http://$backend:3001; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_cache_bypass $http_upgrade; \
        proxy_read_timeout 60s; \
        proxy_connect_timeout 10s; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]



