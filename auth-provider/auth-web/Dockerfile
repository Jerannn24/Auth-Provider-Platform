FROM node:22-alpine

WORKDIR /usr/src/app/auth-web

COPY auth-provider/auth-web/package*.json ./

RUN npm install

COPY auth-provider/auth-web/. .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]