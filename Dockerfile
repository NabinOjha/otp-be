FROM node:24-alpine

WORKDIR /app

COPY package*.json .

RUN npm i

COPY . .

RUN ["npm" "run", "dev"]