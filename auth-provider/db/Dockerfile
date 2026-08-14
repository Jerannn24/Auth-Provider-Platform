FROM node:22-alpine

WORKDIR /usr/src/app/db

COPY auth-provider/package*.json ../
COPY auth-provider/db/package.json ./

RUN npm install

COPY auth-provider/db .

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]