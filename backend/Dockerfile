FROM node:18-alpine
# lub
# FROM python:3.9
# lub
# FROM openjdk:17

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]