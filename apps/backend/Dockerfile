FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package.json
COPY apps/backend/package.json apps/backend/package.json

RUN npm install

COPY . .

RUN npm run db:generate --workspace backend

WORKDIR /app/apps/backend

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
