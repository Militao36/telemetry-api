FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3333

CMD [ "node", "./dist/src/server.js" ]
