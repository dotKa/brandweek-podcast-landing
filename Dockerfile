# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencies yükle
COPY package*.json ./
RUN npm ci

# Source code kopyala ve build et
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Sadece production dependencies yükle
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build output'unu builder stage'den kopyala
COPY --from=builder /app/build ./build
# Static dosyalar build içinde olacak, ayrıca kopyalamaya gerek yok

# Sessions JSON dosyası için volume mount noktası
VOLUME ["/app/src/lib/server/data"]

# Environment variables için .env dosyası (opsiyonel)
# COPY .env .env

# Port expose et (default 3000, PORT env variable ile değiştirilebilir)
EXPOSE 3000

# Production'da Node.js ile build output'unu çalıştır
# PORT ve HOST environment variable'ları ile ayarlanabilir
# Node.js 20.6+ için --env-file flag'i kullanılabilir
CMD ["node", "build"]

