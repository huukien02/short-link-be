# ===== Backend (NestJS) Dockerfile — multi-stage =====

# --- Stage 1: deps ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# --- Stage 2: build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Stage 3: production deps (loại devDependencies) ---
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# --- Stage 4: runner ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Chạy bằng user không phải root cho an toàn
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -S nestjs
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./
USER nestjs
EXPOSE 3000
CMD ["node", "dist/main"]
