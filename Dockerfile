# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencies yükle
COPY package*.json ./
RUN npm ci

# Source code kopyala ve build et
COPY . .
# Sessions.json dosyasını /tmp'ye hazırla (varsa kopyala, yoksa boş oluştur)
RUN if [ -f src/lib/server/data/sessions.json ]; then \
		cp src/lib/server/data/sessions.json /tmp/sessions.json; \
	else \
		echo '[]' > /tmp/sessions.json; \
	fi
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Sadece production dependencies yükle
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Build output'unu builder stage'den kopyala
COPY --from=builder /app/build ./build

ENV NODE_ENV=production
ENV PORT=3000
ENV BODY_SIZE_LIMIT=536870912
# /app/data klasörünü oluştur ve sessions.json dosyasını oraya kopyala
RUN mkdir -p /app/data
# Builder stage'den hazırlanmış sessions.json dosyasını kopyala
COPY --from=builder /tmp/sessions.json /app/data/sessions.json

# Sessions JSON dosyası için volume mount noktası (yazma için)
# Volume mount ile host'taki dosyayı /app/data/sessions.json olarak mount edebilirsiniz
# Örnek: docker run -v /host/path/sessions.json:/app/data/sessions.json ...
VOLUME ["/app/data"]

# Environment variables için .env dosyası (opsiyonel)
# COPY .env .env

# Port expose et (default 3000, PORT env variable ile değiştirilebilir)
EXPOSE 3000

# Production'da Node.js ile build output'unu çalıştır
# PORT ve HOST environment variable'ları ile ayarlanabilir
# Node.js 20.6+ için --env-file flag'i kullanılabilir
CMD ["node", "build"]

