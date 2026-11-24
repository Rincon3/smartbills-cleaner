FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
    tesseract-ocr tesseract-ocr-spa tesseract-ocr-eng poppler-utils \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json

RUN npm ci

COPY . .

RUN npm run db:generate --workspace backend

WORKDIR /app/apps/backend

HEALTHCHECK --interval=20s --timeout=5s --start-period=40s --retries=8 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Generate from the monorepo root so @prisma/client lands in /app/node_modules.
# A bind-mounted apps/backend/node_modules volume would otherwise hide the client.
CMD ["sh", "-c", "cd /app && npx prisma generate --schema apps/backend/prisma/schema.prisma && cd /app/apps/backend && npx prisma migrate deploy && node src/server.js"]
