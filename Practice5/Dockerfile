# nginx-сервер
FROM nginx:alpine

# Удаляем дефолтную заглушку
RUN rm -rf /usr/share/nginx/html/*

# Копируем то, что есть в папке — ты же сам всё туда положил руками
COPY . /usr/share/nginx/html

EXPOSE 80