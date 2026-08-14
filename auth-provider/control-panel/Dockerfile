FROM node:22-alpine

WORKDIR /usr/src/app

COPY auth-provider/package*.json ./
COPY auth-provider/control-panel/package.json ./control-panel/
COPY auth-provider/db/package.json ./db/

RUN npm install

COPY auth-provider .

RUN npx prisma generate --schema=./db/prisma/schema.prisma

WORKDIR /usr/src/app/control-panel

EXPOSE 3000

CMD ["npm", "run", "start"]