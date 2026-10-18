
FROM dunglas/frankenphp:latest

RUN install-php-extensions \
    pdo_pgsql \
    intl \
    zip \
    opcache

WORKDIR /app

COPY . .

RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY Caddyfile /etc/caddy/Caddyfile

ENV APP_ENV=production
ENV APP_DEBUG=false
ENV SERVER_NAME=:8080

EXPOSE 8080

CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
