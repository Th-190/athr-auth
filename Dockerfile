
FROM dunglas/frankenphp:1-php8.3-bookworm

RUN install-php-extensions \
    pdo_pgsql \
    intl \
    zip \
    opcache \
    gd \
    bcmath \
    pcntl \
    redis

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY . .

RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

RUN if [ -f package-lock.json ]; then \
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
        apt-get update && apt-get install -y nodejs && \
        npm ci && npm run build; \
    fi

RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

COPY Caddyfile /etc/caddy/Caddyfile

ENV APP_ENV=production
ENV APP_DEBUG=false
ENV SERVER_NAME=:8080

EXPOSE 8080

CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
