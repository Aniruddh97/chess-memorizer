# build image
FROM node:18.15.0-alpine AS build

RUN apk update
RUN apk add --no-cache curl

WORKDIR /app
COPY . /app

# Fetch the content from the API and replace repertoire.json
RUN curl -o /app/server/repertoire.json https://chessmemorizer1-6a4ddn5z.b4a.run/api/folder-structure

RUN npm install
CMD ["node", "app.js"]
EXPOSE 3000