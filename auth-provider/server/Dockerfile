FROM node:22-alpine

WORKDIR /usr/src/app

COPY auth-provider/server/package*.json ./
COPY auth-provider/server/package.json ./server/
COPY auth-provider/db/package.json ./db/

RUN npm install

COPY auth-provider .

RUN npx prisma generate --schema=./db/prisma/schema.prisma

WORKDIR /usr/src/app/server

EXPOSE 8080

CMD ["npm", "run", "start"]