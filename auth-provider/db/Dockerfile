FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

COPY prisma ./prisma/


RUN npm install

COPY . .

RUN npx prisma generate

CMD ["sh", "-c", "npx prisma migrate deploy"]
