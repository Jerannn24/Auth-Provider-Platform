FROM node:22-alpine

WORKDIR /usr/src/app/app-a

COPY application/app-a/package*.json ./

RUN npm install

COPY application/app-a .

RUN npx prisma generate 

RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]