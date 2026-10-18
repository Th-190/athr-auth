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

RUN if [ -f package-lock.json ]; then \
        curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
        apt-get update && apt-get install -y nodejs && \
        npm install --legacy-peer-deps && npm run build; \
    fi

RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

# إنشاء Caddyfile وتوجيه الخادم مع تشغيل الهجرة تلقائياً
RUN echo ":{\$PORT:-8080} {\n  root * /app/public\n  encode zstd br gzip\n  php_server\n}" > /etc/caddy/Caddyfile

# تشغيل الـ Migrations ثم تشغيل خادم FrankenPHP
CMD sh -c "php artisan migrate --force && frankenphp run --config /etc/caddy/Caddyfile"
