FROM node:20-alpine

WORKDIR /app

COPY package.json package.json
COPY apps/frontend/package.json apps/frontend/package.json

RUN npm install

COPY . .

WORKDIR /app/apps/frontend

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

