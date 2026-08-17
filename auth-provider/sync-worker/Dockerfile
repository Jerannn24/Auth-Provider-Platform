FROM node:22-alpine

WORKDIR /usr/src/app

COPY auth-provider/package*.json ./
COPY auth-provider/sync-worker/package.json ./sync-worker/
COPY auth-provider/db/package.json ./db/

RUN npm install

COPY auth-provider .

RUN npx prisma generate --schema=./db/prisma/schema.prisma

WORKDIR /usr/src/app/sync-worker

CMD ["npm", "run", "start"]