FROM node:20-alpine AS build

WORKDIR /repo/Chrome_Extension-UI_Part

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=build /repo/Chrome_Extension-Plugin /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
