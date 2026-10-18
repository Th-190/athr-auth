FROM dunglas/frankenphp:php8.3-bookworm

# تثبيت الحزم الأساسية لدعم PostgreSQL
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libicu-dev \
    libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql zip intl

# تثبيت Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# توجيه الجذر لمجلد public الخاص بـ Laravel
ENV DOCUMENT_ROOT=/app/public

WORKDIR /app

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

# تشغيل خادم FrankenPHP الإنتاجي المباشر
CMD [ "frankenphp", "run", "--config", "/etc/caddy/Caddyfile" ]
