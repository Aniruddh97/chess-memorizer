# build image
FROM node:18.15.0-alpine AS build
RUN apk update && apk add --no-cache dumb-init
WORKDIR /app
COPY . /app
RUN npm install
CMD ["node", "app.js"]
EXPOSE 3000