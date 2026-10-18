FROM dunglas/frankenphp:php8.3-bookworm

# تثبيت الحزم والمكتبات الأساسية لدعم PostgreSQL والمكونات
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libicu-dev \
    libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql zip intl

# تثبيت أداة Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ضبط جذر المستند إلى مجلد public الخاص بـ Laravel
ENV DOCUMENT_ROOT=/app/public

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملفات المشروع
COPY . .

# تثبيت حزم PHP والتحسين للإنتاج
RUN composer install --no-dev --optimize-autoloader --no-interaction

# إنشاء المجلدات وضبط الصلاحيات
RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

# تشغيل خادم FrankenPHP مباشرة على الجذر المقترن بـ Laravel
CMD [ "php", "artisan", "config:cache" ]
CMD [ "frankenphp", "run", "--config", "/etc/caddy/Caddyfile" ]