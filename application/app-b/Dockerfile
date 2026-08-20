FROM node:22-alpine

WORKDIR /usr/src/app/app-b

COPY application/app-b/package*.json ./

RUN npm install

COPY application/app-b .

RUN npx prisma generate 

RUN npm run build

EXPOSE 3002

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]