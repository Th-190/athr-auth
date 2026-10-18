FROM dunglas/frankenphp:php8.3-bookworm

<<<<<<< HEAD
# تثبيت الحزم والمكتبات الأساسية لدعم PostgreSQL والمكونات
=======
>>>>>>> 9320f5d0d6bfc2ec80fc6ba9439ba96f001917da
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libicu-dev \
    libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql zip intl

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

<<<<<<< HEAD
# ضبط جذر المستند إلى مجلد public الخاص بـ Laravel
ENV DOCUMENT_ROOT=/app/public

# تعيين مجلد العمل
=======
>>>>>>> 9320f5d0d6bfc2ec80fc6ba9439ba96f001917da
WORKDIR /app

COPY . .

<<<<<<< HEAD
# تثبيت حزم PHP والتحسين للإنتاج
RUN composer install --no-dev --optimize-autoloader --no-interaction

# إنشاء المجلدات وضبط الصلاحيات
RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

# تشغيل خادم FrankenPHP مباشرة على الجذر المقترن بـ Laravel
CMD [ "php", "artisan", "config:cache" ]
CMD [ "frankenphp", "run", "--config", "/etc/caddy/Caddyfile" ]
=======
RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

CMD [ "php", "artisan", "serve", "--host=0.0.0.0", "--port=8080" ]
>>>>>>> 9320f5d0d6bfc2ec80fc6ba9439ba96f001917da
