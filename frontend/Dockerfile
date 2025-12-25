# Сборка (Используем Node 20 или 22)
FROM node:22-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Эту строку с chmod можно оставить для надежности, если ошибка 126 вернется
RUN chmod +x node_modules/.bin/vite
RUN npm run build

# Раздача через Nginx
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]