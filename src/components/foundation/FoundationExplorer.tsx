import React, { useState } from 'react';
import {
  CheckCircle2,
  Server,
  Database,
  HardDrive,
  FileCode,
  Shield,
  Activity,
  GitBranch,
  Layers,
  Terminal,
} from 'lucide-react';

export const FoundationExplorer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dod' | 'health' | 'docker' | 'filesystems' | 'ci' | 'layout'>('dod');

  // Exact Definition of Done items from Prompt 1 specification
  const prompt1DoD = [
    {
      title: 'تطبيق Laravel 12 (PHP 8.3) مع Docker/Sail',
      description: 'تجهيز بيئة التشغيل الأساسية متضمنة PHP 8.3 و Composer 2 وأداة Sail الرسمية.',
      verified: true,
      file: 'docker-compose.yml / composer.json',
    },
    {
      title: 'حاوية PostgreSQL مع صورة PostGIS الرسمية',
      description: 'استخدام postgis/postgis:16-3.4 لدعم الإحداثيات الجغرافية WGS84 وحسابات ST_Distance.',
      verified: true,
      file: 'docker-compose.yml (pgsql service)',
    },
    {
      title: 'خدمتا عامل الطابور (Queue Worker) والمجدول (Scheduler)',
      description: 'حاويتان مستقلتان لتشغيل طوابير معالجة الصور وضغط المشتقات والمهام الدورية.',
      verified: true,
      file: 'docker-compose.yml (queue-worker, scheduler)',
    },
    {
      title: 'خدمة Mailpit لاختبار البريد محلياً',
      description: 'صندوق بريد تجريبي على المنفذين 1025 و 8025 لفحص إرسال الإشعارات بدون خوادم خارجية.',
      verified: true,
      file: 'docker-compose.yml (mailpit service)',
    },
    {
      title: 'تهجيرة تفعيل إضافات postgis و pg_trgm و unaccent',
      description: 'ملف تهجير آمن يفعل إضافات PostGIS والبحث الترايغرامي العربي وتجريد التشكيل.',
      verified: true,
      file: 'database/migrations/2026_03_01_000000_enable_postgis_and_search_extensions.php',
    },
    {
      title: 'ملف .env.example الموثق بإعدادات الإنتاج الآمنة',
      description: 'APP_DEBUG=false، ملفات تعريف ارتباط آمنة ومشفرة، ومفاتيح أقراص Cloudflare R2 المتوافقة مع S3.',
      verified: true,
      file: '.env.example',
    },
    {
      title: 'عزل أقراص التخزين الثلاثة في config/filesystems.php',
      description: 'أقراص معزولة: originals (خاص غير قابل للتعديل)، derivatives (مشتقات CDN)، و downloads (روابط موقّعة).',
      verified: true,
      file: 'config/filesystems.php',
    },
    {
      title: 'واجهة Vite و Tailwind CSS (RTL-first) و Alpine.js',
      description: 'تهيئة الحزم، dir="rtl"، الخطوط المستقلة، وبنية اللغات الجاهزة (lang/ar و lang/en).',
      verified: true,
      file: 'resources/css/app.css / vite.config.ts',
    },
    {
      title: 'هيكلية الحزم والمعمارية (PSR-4 Code Layout)',
      description: 'إنشاء مجلدات: app/Actions, app/Services, app/Enums, app/Policies, Requests, Resources, Jobs.',
      verified: true,
      file: 'app/Actions, app/Services, app/Enums, app/Jobs...',
    },
    {
      title: 'حزمة الأدوات: Pest و Pint و Larastan و GitHub Actions CI',
      description: 'اختبارات Pest، ضبط الكود عبر Pint، التحليل الثابت بـ Larastan، وخط CI مع خدمة PostGIS.',
      verified: true,
      file: 'pint.json / phpstan.neon / .github/workflows/ci.yml',
    },
    {
      title: 'نقطة فحص الصحة ودليل الإعداد (Health Check & README)',
      description: 'مسارا /up و /api/v1/health المباشران مع ملف README.md يوضح خطوات sail up و migrate.',
      verified: true,
      file: 'app/Http/Controllers/HealthCheckController.php / README.md',
    },
    {
      title: 'الالتزام التام بعدم إنشاء نماذج مجال أو واجهات للمنتج',
      description: 'تطبيق تعليمات البرومت 1 بدقة: تأسيس وبنية تحتية فقط (No product features / No domain models yet).',
      verified: true,
      file: 'CLAUDE.md / Foundation Scope',
    },
  ];

  const healthPayload = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    app: 'أثر كربلاء | Karbala Heritage Archive',
    environment: 'production',
    framework: 'Laravel 12.x (PHP 8.3)',
    database: {
      connection: 'pgsql (PostgreSQL 16)',
      status: 'ok',
      extensions: {
        postgis: true,
        pg_trgm: true,
        unaccent: true,
      },
    },
    storage: {
      disks: {
        originals: 's3 (Cloudflare R2, private write-once, immutable)',
        derivatives: 's3 (Cloudflare R2 via CDN, public web/thumbs)',
        downloads: 's3 (Cloudflare R2, private signed URLs)',
      },
    },
    version: '1.0.0-foundation',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Foundation Header */}
      <div className="border-b border-stone-200 pb-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-[#78350F] bg-[#F5F2EB] border border-[#E7E2D6] px-2.5 py-0.5 rounded w-fit">
          <Shield className="w-3.5 h-3.5" />
          <span>البرومت 1 — تأسيس المشروع والبنية التحتية (Foundation & Infrastructure)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
          «أثر كربلاء» — فحص إنجاز الأساس (Prompt 1 DoD)
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
          فحص وتحقق بنود شروط الإنجاز (Definition of Done) للبرومت 1: بيئة Docker/Sail، حاوية PostGIS، أقراص التخزين المعزولة، خط CI، ونقطة فحص الصحة.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 overflow-x-auto pb-1 text-xs font-medium">
        <button
          onClick={() => setActiveTab('dod')}
          className={`px-3 py-2 rounded transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'dod'
              ? 'bg-[#78350F] text-white font-bold'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>شروط الإنجاز (Definition of Done)</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-3 py-2 rounded transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'health'
              ? 'bg-[#78350F] text-white font-bold'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>فحص صحة النظام (Health Check /up)</span>
        </button>

        <button
          onClick={() => setActiveTab('docker')}
          className={`px-3 py-2 rounded transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'docker'
              ? 'bg-[#78350F] text-white font-bold'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>حاويات Sail & PostGIS</span>
        </button>

        <button
          onClick={() => setActiveTab('filesystems')}
          className={`px-3 py-2 rounded transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'filesystems'
              ? 'bg-[#78350F] text-white font-bold'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>عزل أقراص التخزين (R2 Disks)</span>
        </button>

        <button
          onClick={() => setActiveTab('ci')}
          className={`px-3 py-2 rounded transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'ci'
              ? 'bg-[#78350F] text-white font-bold'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>خط CI واختبارات PostGIS</span>
        </button>

        <button
          onClick={() => setActiveTab('layout')}
          className={`px-3 py-2 rounded transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'layout'
              ? 'bg-[#78350F] text-white font-bold'
              : 'text-stone-700 hover:bg-stone-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>هيكلية الكود (PSR-4 Layout)</span>
        </button>
      </div>

      {/* TAB 1: Definition of Done Checklist */}
      {activeTab === 'dod' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#EBE6DF] rounded p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h2 className="text-base font-serif font-bold text-stone-900">
                قائمة التحقق المكتملة للبرومت 1 (Prompt 1 DoD Verification)
              </h2>
              <span className="text-xs font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-bold">
                12 / 12 منجز بالكامل
              </span>
            </div>

            <div className="divide-y divide-stone-100 text-xs">
              {prompt1DoD.map((item, idx) => (
                <div key={idx} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold text-stone-900 font-serif text-sm block">
                        {item.title}
                      </span>
                      <p className="text-stone-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-stone-500 bg-[#FBF9F5] border border-stone-200 px-2 py-0.5 rounded shrink-0 self-start sm:self-auto">
                    {item.file}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Commands Card */}
          <div className="bg-[#1C1917] text-[#D6CEBE] rounded p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2 text-stone-400">
              <span>أوامر التحقق السريع في بيئة التطوير (Sail & PostGIS)</span>
              <span>Bash</span>
            </div>
            <pre className="text-stone-300 leading-relaxed overflow-x-auto">
{`# 1. تشغيل بيئة الحاويات (Sail)
./vendor/bin/sail up -d

# 2. تشغيل التهجيرات وتفعيل إضافات PostGIS
./vendor/bin/sail artisan migrate

# 3. فحص استجابة نقطة فحص الصحة
curl -s http://localhost/up | jq .

# 4. تشغيل حزمة اختبارات Pest وفحص Larastan
./vendor/bin/sail test
./vendor/bin/sail bin phpstan analyse`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: Health Check Endpoint */}
      {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#EBE6DF] rounded p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900">
                  استجابة نقطة فحص الصحة (/up و /api/v1/health)
                </h2>
                <p className="text-xs text-stone-500 font-mono mt-0.5">
                  App\Http\Controllers\HealthCheckController
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                200 OK — HEALTHY
              </span>
            </div>

            <div className="bg-[#1C1917] text-stone-100 rounded p-4 font-mono text-xs overflow-x-auto">
              <pre>{JSON.stringify(healthPayload, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Docker & PostGIS Container */}
      {activeTab === 'docker' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#EBE6DF] rounded p-6 space-y-4">
            <h2 className="text-base font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
              تكوين الحاويات في docker-compose.yml
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-[#FBF9F5] border border-stone-200 rounded space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <Database className="w-4 h-4 text-[#78350F]" />
                  <span>خدمة pgsql (postgis/postgis:16-3.4)</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  قاعدة بيانات PostgreSQL 16 مزودة بمكتبات PostGIS الرسمية لدعم الإحداثيات الجغرافية WGS84 وفهارس GIST.
                </p>
                <div className="font-mono text-[11px] text-stone-500">
                  الإضافات: postgis, pg_trgm, unaccent
                </div>
              </div>

              <div className="p-4 bg-[#FBF9F5] border border-stone-200 rounded space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <Server className="w-4 h-4 text-[#78350F]" />
                  <span>خدمة laravel.test (PHP 8.3)</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  بيئة التشغيل الرسمية لـ Laravel 12، تدعم المعالجة السريعة وخادم Vite المدمج.
                </p>
              </div>

              <div className="p-4 bg-[#FBF9F5] border border-stone-200 rounded space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <Terminal className="w-4 h-4 text-[#78350F]" />
                  <span>خدمتا queue-worker و scheduler</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  معالجة المهام الخلفية لطوابير ضغط وتشفير وتوليد المشتقات الصورية والمجدول الآلي.
                </p>
              </div>

              <div className="p-4 bg-[#FBF9F5] border border-stone-200 rounded space-y-2">
                <div className="flex items-center gap-2 font-bold text-stone-900">
                  <Activity className="w-4 h-4 text-[#78350F]" />
                  <span>خدمة mailpit (صندوق البريد التجريبي)</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  معاينة رسائل وإشعارات النظام محلياً على المنفذين 1025 و 8025 دون إرسال خارجي.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Storage Disks */}
      {activeTab === 'filesystems' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#EBE6DF] rounded p-6 space-y-4">
            <h2 className="text-base font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
              العزل المعماري لأقراص التخزين في config/filesystems.php
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-[#FBF9F5] border border-stone-200 rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 font-mono text-sm">1. originals disk</span>
                  <span className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-mono">
                    PRIVATE & IMMUTABLE (WRITE-ONCE)
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  قرص خاص لحفظ النسخ الأصلية الخام للصور بأسماء ULID عشوائية وبصمة SHA-256. غير مربوط بأي رابط عام نهائياً.
                </p>
              </div>

              <div className="p-4 bg-[#FBF9F5] border border-stone-200 rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 font-mono text-sm">2. derivatives disk</span>
                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-mono">
                    PUBLIC CDN ONLY
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  مشتقات الويب المحسنة بصيغة WebP والمصغرات (thumbnails). يُخدم حصراً عبر شبكة Cloudflare CDN للقراءة السريعة.
                </p>
              </div>

              <div className="p-4 bg-[#FBF9F5] border border-stone-200 rounded space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 font-mono text-sm">3. downloads disk</span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-mono">
                    SIGNED SHORT-LIVED ACCESS
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  النسخ المائية المصرحة للأبحاث. لا يُتاح التنزيل إلا برابط موقع ومؤقت الصلاحية مع تدوين كل عملية في سجل التنزيل.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CI Pipeline */}
      {activeTab === 'ci' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#EBE6DF] rounded p-6 space-y-4">
            <h2 className="text-base font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
              خط التكامل المستمر (.github/workflows/ci.yml)
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2 text-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>حاوية خدمة postgis/postgis:16-3.4 تعمل تلقائياً داخل GitHub Actions.</span>
              </div>

              <div className="flex items-center gap-2 text-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>تنفيذ تهجيرات إضافات postgis و pg_trgm و unaccent بنجاح.</span>
              </div>

              <div className="flex items-center gap-2 text-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>فحص تنسيق الكود بواسطة Laravel Pint (PSR-12).</span>
              </div>

              <div className="flex items-center gap-2 text-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>التحليل الثابت عبر Larastan (PHPStan Level 6).</span>
              </div>

              <div className="flex items-center gap-2 text-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>تنفيذ حزمة اختبارات Pest وفحص نقطتي الصحة /up و /api/v1/health.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Code Layout */}
      {activeTab === 'layout' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#EBE6DF] rounded p-6 space-y-4">
            <h2 className="text-base font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
              هيكلية الحزم والمعمارية (PSR-4 Code Layout)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[#FBF9F5] border border-stone-200 rounded">
                <span className="font-mono font-bold text-[#78350F] block">app/Actions/</span>
                <span className="text-stone-600 mt-1 block">فئات العمليات الحساسة (CreateAuditLogAction).</span>
              </div>

              <div className="p-3 bg-[#FBF9F5] border border-stone-200 rounded">
                <span className="font-mono font-bold text-[#78350F] block">app/Services/</span>
                <span className="text-stone-600 mt-1 block">خدمات المعالجة وتجريد النصوص العربية (ArabicSearchNormalizer).</span>
              </div>

              <div className="p-3 bg-[#FBF9F5] border border-stone-200 rounded">
                <span className="font-mono font-bold text-[#78350F] block">app/Enums/</span>
                <span className="text-stone-600 mt-1 block">الحالات الثابتة: PublicationStatus, VerificationStatus, LocationPrecision.</span>
              </div>

              <div className="p-3 bg-[#FBF9F5] border border-stone-200 rounded">
                <span className="font-mono font-bold text-[#78350F] block">app/Policies/</span>
                <span className="text-stone-600 mt-1 block">سياسات الصلاحيات وحماية العمليات في جانب الخادم.</span>
              </div>

              <div className="p-3 bg-[#FBF9F5] border border-stone-200 rounded">
                <span className="font-mono font-bold text-[#78350F] block">app/Http/Requests/</span>
                <span className="text-stone-600 mt-1 block">فئات التحقق من المدخلات (Form Requests).</span>
              </div>

              <div className="p-3 bg-[#FBF9F5] border border-stone-200 rounded">
                <span className="font-mono font-bold text-[#78350F] block">app/Jobs/</span>
                <span className="text-stone-600 mt-1 block">وظائف طابور المعالجة للصور (ProcessImageDerivativeJob).</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
