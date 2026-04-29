# ============================================================
# Build context = racine du projet (cf. docker-compose.yml)
# Cela permet de COPY à la fois app/ et nginx/.
# ============================================================

# ─── Stage 1 — Builder Node 20 ─────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /build

# Vite remplace les VITE_* à la build : on les passe via ARG/ENV.
ARG VITE_MOCK_USER=admin
ARG VITE_MOCK_PASS=homelab2024
ARG VITE_URL_GARAGE=http://garage.local
ARG VITE_URL_N8N=http://n8n.local
ARG VITE_URL_CV=https://monCV.fr
ENV VITE_MOCK_USER=$VITE_MOCK_USER \
    VITE_MOCK_PASS=$VITE_MOCK_PASS \
    VITE_URL_GARAGE=$VITE_URL_GARAGE \
    VITE_URL_N8N=$VITE_URL_N8N \
    VITE_URL_CV=$VITE_URL_CV

COPY app/package.json app/package-lock.json* ./
RUN npm install --no-audit --no-fund

COPY app/ ./
RUN npm run build

# ─── Stage 2 — Nginx ───────────────────────────────────────
FROM nginx:alpine
COPY --from=builder /build/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
