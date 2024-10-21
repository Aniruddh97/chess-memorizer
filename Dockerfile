# build image
FROM node:18.15.0-alpine AS build

RUN apk update
RUN apk add --no-cache curl

WORKDIR /app
COPY . /app

RUN npm install
CMD ["node", "app.js"]
EXPOSE 3000