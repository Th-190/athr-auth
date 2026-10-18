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

# تعديل منفذ الاستماع في ملف Caddyfile ليتطابق مع منفذ Railway تلقائياً، ثم تشغيل الخادم
CMD sh -c "sed -i 's/:80/:${PORT:-8080}/g' /etc/caddy/Caddyfile && frankenphp run --config /etc/caddy/Caddyfile"
