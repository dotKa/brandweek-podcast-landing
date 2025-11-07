FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Sessions JSON dosyası için volume mount noktası
VOLUME ["/app/src/lib/server/data"]

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]

