DockerfileFROM dunglas/frankenphp:php8.3-bookworm

# تثبيت الحزم الأساسية وأدوات النظام
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libicu-dev \
    libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql zip intl

# تثبيت أداة Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# تعيين مجلد العمل
WORKDIR /app

# نسخ ملفات المشروع
COPY . .

# تثبيت حزم PHP وتخطي الحزم التطويرية لزيادة السرعة
RUN composer install --no-dev --optimize-autoloader --no-interaction

# ضبط الأذونات للمجلدات الأساسية
RUN mkdir -p storage/framework/{sessions,views,cache} storage/logs bootstrap/cache \
    && chmod -R 777 storage bootstrap/cache

# تشغيل خادم التطبيق عبر FrankenPHP
CMD [ "php", "artisan", "serve", "--host=0.0.0.0", "--port=8080" ]