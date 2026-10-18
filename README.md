# «أثر كربلاء» — Karbala Heritage Archive
### الأرشيف الرقمي الموثّق للمواقع الأثرية والتاريخية والتراثية في محافظة كربلاء، العراق

---

## 🏛️ نظرة عامة | Overview

«أثر كربلاء» هو أرشيف رقمي توثيقي مستقل للمواقع الأثرية والتاريخية في محافظة كربلاء، العراق. يعتمد الأرشيف على أولوية حاكمة غير قابلة للتفاوض:
```
الأصالة > الدقة التاريخية > سلسلة الإسناد > الأمان > سهولة الاستخدام > الجودة البصرية > الأداء
Authenticity > Historical Accuracy > Content Provenance > Security > Usability > Visual Quality > Performance
```

---

## 🛠️ البنية التقنية | Stack Foundation (Prompt 1)

- **Backend**: PHP 8.3+, Laravel 12+
- **Database**: PostgreSQL 16 with PostGIS 3.4 (`postgis/postgis:16-3.4`)
  - Extensions: `postgis` (نظام الإحداثيات الجغرافية), `pg_trgm` (البحث الترايغرامي العربي), `unaccent` (توحيد وتجريد الحروف)
- **Containerization**: Laravel Sail + Docker Compose
  - خدمات مدمجة: تطبيق الويب، عامل الطابور (`queue-worker`)، المجدول الآلي (`scheduler`)، صندوق البريد التجريبي (`mailpit`)
- **Storage Disks**: ثلاث أقراص منفصلة معمارياً:
  1. `originals`: قرص خاص للكتابة لمرة واحدة (`write-once`) لا يُربط به أي رابط عام أبداً.
  2. `derivatives`: مشتقات الويب والصور المصغرة المعالجة عبر شبكة توزيع المحتوى (CDN).
  3. `downloads`: نسخ بعلامة مائية رقمية يتم الوصول إليها عبر روابط موقعة ومحددة الصلاحية.
- **Frontend Architecture**: Vite + Tailwind CSS (RTL-first) + Alpine.js
- **Code Layout**:
  - `app/Actions/`
  - `app/Services/`
  - `app/Enums/`
  - `app/Policies/`
  - `app/Http/Requests/`
  - `app/Http/Resources/`
  - `app/Jobs/`
- **Tooling & Quality**:
  - **Pest**: إطار الاختبارات الآلية
  - **Laravel Pint**: تنسيق وضبط الكود وفق معايير PSR-12
  - **Larastan**: التحليل الثابت (PHPStan Level 6)
  - **GitHub Actions CI**: خط أنابيب متكامل يعمل ضد خدمة PostGIS

---

## 🚀 التشغيل والإعداد المحلي | Getting Started

### 1. الاستنساخ وتجهيز المتغيرات البيئية
```bash
git clone https://github.com/karbala-archive/heritage-archive.git
cd heritage-archive

cp .env.example .env
```

### 2. تشغيل الحاويات عبر Laravel Sail
```bash
./vendor/bin/sail up -d
```

### 3. توليد المفتاح وتشغيل التهجيرات (Migrations)
```bash
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate
```
*سيقوم أمر التهجير تلقائياً بتفعيل إضافات PostGIS و pg_trgm و unaccent داخل قاعدة بيانات PostgreSQL.*

### 4. فحص صحة المنظومة (Health Check)
```bash
curl http://localhost/up
# أو
curl http://localhost/api/v1/health
```

**استجابة الفحص المتوقعة:**
```json
{
  "status": "healthy",
  "app": "أثر كربلاء",
  "database": {
    "connection": "pgsql",
    "status": "ok",
    "extensions": {
      "postgis": true,
      "pg_trgm": true,
      "unaccent": true
    }
  },
  "storage": {
    "disks": {
      "originals": "s3",
      "derivatives": "s3",
      "downloads": "s3"
    }
  }
}
```

### 5. تشغيل الاختبارات وفحص الكود
```bash
# تشغيل حزمة اختبارات Pest
./vendor/bin/sail test

# تدقيق الكود عبر Pint
./vendor/bin/sail bin pint --test

# التحليل الثابت عبر Larastan
./vendor/bin/sail bin phpstan analyse
```

---

## 📜 التزام الأمان وسياسة البيانات (CLAUDE.md)
- الخادم هو المرجع الوحيد للصلاحيات (`Server-side authorization`).
- لا يتم توليد أو اعتماد أي تاريخ مصطنع بالذكاء الاصطناعي دون مراجعة بشرية مؤهلة.
- الإحداثيات الدقيقة للمواقع الحساسة غير المنقبة تُحجب عن الجمهور وتُعرض بنطاق تقريبي.
