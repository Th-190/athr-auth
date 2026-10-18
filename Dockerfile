FROM node:22-bookworm-slim AS frontend

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM dunglas/frankenphp:1-php8.3-bookworm AS app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    libicu-dev \
    libzip-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libwebp-dev \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install pdo_pgsql intl zip gd pcntl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
ENV DOCUMENT_ROOT=/app/public \
    APP_ENV=production \
    APP_DEBUG=false \
    DB_CONNECTION=pgsql \
    LOG_LEVEL=info

COPY . .

RUN mkdir -p \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    storage/app/private \
    bootstrap/cache \
    && composer install \
        --no-dev \
        --no-interaction \
        --prefer-dist \
        --optimize-autoloader \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache

# Keep tracked public assets and add the generated Vite build.
COPY --from=frontend /app/dist/ /app/public/
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 8080

CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
