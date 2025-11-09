FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

# Build output'u kopyala
COPY --from=builder /app/build ./build
COPY --from=builder /app/.svelte-kit ./.svelte-kit
COPY --from=builder /app/node_modules/.vite ./node_modules/.vite

# Source dosyalarını kopyala (runtime'da gerekebilir)
COPY . .

# Sessions JSON dosyası için volume mount noktası
VOLUME ["/app/src/lib/server/data"]

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "build"]

