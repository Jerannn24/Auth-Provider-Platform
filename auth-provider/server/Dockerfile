FROM node:22-alpine

WORKDIR /usr/src/app

COPY auth-provider/server/package*.json ./
RUN npm ci

COPY auth-provider/db/prisma ./prisma/
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY auth-provider/server ./
RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start"]