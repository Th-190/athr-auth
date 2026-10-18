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

# إعادة كتابة Caddyfile بشكل إلزامي ونظيف
RUN echo ":{\$PORT:-8080} {" > /etc/caddy/Caddyfile \
    && echo "  root * /app/public" >> /etc/caddy/Caddyfile \
    && echo "  encode zstd br gzip" >> /etc/caddy/Caddyfile \
    && echo "  php_server" >> /etc/caddy/Caddyfile \
    && echo "}" >> /etc/caddy/Caddyfile

# تشغيل الهجرة ثم تشغيل الخادم بالتكوين الصريح
CMD sh -c "php artisan migrate --force && frankenphp run --config /etc/caddy/Caddyfile"
