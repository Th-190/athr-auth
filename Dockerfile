FROM dunglas/frankenphp:php8.3-bookworm

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libicu-dev \
    libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql zip intl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

ENV DOCUMENT_ROOT=/app/public

WORKDIR /app

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

# كتابة ملف Caddyfile مخصص يوجه المسار للعام ويضبط المنفذ مباشرة أثناء التشغيل
RUN echo ':{$PORT:-8080} {' > /etc/caddy/Caddyfile \
    && echo '    root * /app/public' >> /etc/caddy/Caddyfile \
    && echo '    encode zstd br gzip' >> /etc/caddy/Caddyfile \
    && echo '    php_server' >> /etc/caddy/Caddyfile \
    && echo '}' >> /etc/caddy/Caddyfile

CMD [ "frankenphp", "run", "--config", /etc/caddy/Caddyfile ]
