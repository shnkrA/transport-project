# ==========================================
# Build stage
# ==========================================
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --workspace backend

COPY backend ./backend
RUN npm run build --workspace backend

# ==========================================
# Production stage
# ==========================================
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --omit=dev --workspace backend

COPY --from=builder /app/backend/dist ./backend/dist

# Non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000

CMD ["node", "backend/dist/main.js"]
