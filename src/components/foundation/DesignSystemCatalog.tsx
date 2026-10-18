import React, { useState } from 'react';
import { ArchivalLogo, ArchivalWordmark, WatermarkStamp } from './BrandAssets';
import { VerificationBadge, LocationPrecisionBadge } from '../common/VerificationBadge';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Search,
  BookOpen,
  ArrowRight,
  Download,
  Copy,
  Clock,
  Eye,
  Sliders,
  Compass,
} from 'lucide-react';

export const DesignSystemCatalog: React.FC<{ onBackToApp?: () => void }> = ({ onBackToApp }) => {
  const [btnLoading, setBtnLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('حصن الأخيضر');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 space-y-16 py-8">
      {/* 1. Header & Design Constitution */}
      <div className="border-b border-stone-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-[#78350F] bg-[#F5F2EB] px-2.5 py-0.5 rounded border border-[#E7E2D6] mb-2">
            <span>دليل الهوية البصرية ومكتبة المكونات</span>
            <span>·</span>
            <span>WCAG 2.1 AA Compliant</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            نظام تصميم «أثر كربلاء» (Design System)
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            مستوحى من عمارة الآجر العراقي، عقود حصن الأخيضر، ورق المخطوطات القديمة، وأختام المعاينة الأثرية. خالٍ من الزخارف البلاستيكية والتدرجات المصطنعة.
          </p>
        </div>

        {onBackToApp && (
          <button
            onClick={onBackToApp}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-stone-800 bg-white border border-stone-300 rounded hover:bg-stone-50 cursor-pointer shadow-2xs"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للمنصة الرئيسية</span>
          </button>
        )}
      </div>

      {/* 2. Brand Identity Assets */}
      <section className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          1. الهوية والشعار الرسمي (Brand Vectors)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo */}
          <div className="bg-white border border-stone-200 rounded p-6 text-center space-y-4">
            <ArchivalLogo size={80} className="mx-auto" />
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">الختم الأرشيفي الرسمي</h3>
              <p className="text-[11px] text-stone-500 mt-0.5">رمز القبو الإسطواني وتدرج الآجر التاريخي</p>
            </div>
          </div>

          {/* Wordmark */}
          <div className="bg-white border border-stone-200 rounded p-6 flex flex-col items-center justify-center space-y-4">
            <ArchivalWordmark />
            <p className="text-[11px] text-stone-500">العلامة النصية المدمجة (خط أميري + لاتيني)</p>
          </div>

          {/* Stamp */}
          <div className="bg-stone-900 border border-stone-800 rounded p-6 flex flex-col items-center justify-center space-y-4">
            <WatermarkStamp siteName="حصن الأخيضر" year="1956" />
            <p className="text-[11px] text-stone-400">ختم التوثيق المائي للمشتقات الرقمية</p>
          </div>
        </div>
      </section>

      {/* 3. Color Tokens & WCAG AA Contrast Checks */}
      <section className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          2. باليت الألوان الترابية ونسب التباين (Color Tokens)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div className="p-3 bg-[#78350F] text-white rounded space-y-1 shadow-2xs">
            <span className="font-bold block">Brick / آجر</span>
            <span className="font-mono text-[10px] opacity-80 block">#78350F</span>
            <span className="text-[9px] bg-black/30 px-1 py-0.5 rounded block text-center">AAA (10.2:1)</span>
          </div>

          <div className="p-3 bg-[#9A3412] text-white rounded space-y-1 shadow-2xs">
            <span className="font-bold block">Clay / طين</span>
            <span className="font-mono text-[10px] opacity-80 block">#9A3412</span>
            <span className="text-[9px] bg-black/30 px-1 py-0.5 rounded block text-center">AA (7.4:1)</span>
          </div>

          <div className="p-3 bg-[#B45309] text-white rounded space-y-1 shadow-2xs">
            <span className="font-bold block">Bronze / برونز</span>
            <span className="font-mono text-[10px] opacity-80 block">#B45309</span>
            <span className="text-[9px] bg-black/30 px-1 py-0.5 rounded block text-center">AA (5.1:1)</span>
          </div>

          <div className="p-3 bg-[#1C1917] text-white rounded space-y-1 shadow-2xs">
            <span className="font-bold block">Charcoal / فحم</span>
            <span className="font-mono text-[10px] opacity-80 block">#1C1917</span>
            <span className="text-[9px] bg-black/30 px-1 py-0.5 rounded block text-center">AAA (15.6:1)</span>
          </div>

          <div className="p-3 bg-[#FBF9F5] text-stone-900 border border-stone-300 rounded space-y-1">
            <span className="font-bold block">Paper / ورق دافئ</span>
            <span className="font-mono text-[10px] text-stone-500 block">#FBF9F5</span>
            <span className="text-[9px] bg-stone-200 px-1 py-0.5 rounded block text-center">خلفية رئيسية</span>
          </div>

          <div className="p-3 bg-[#EBE6DF] text-stone-900 border border-stone-300 rounded space-y-1">
            <span className="font-bold block">Limestone / كلس</span>
            <span className="font-mono text-[10px] text-stone-500 block">#EBE6DF</span>
            <span className="text-[9px] bg-stone-200 px-1 py-0.5 rounded block text-center">فواصل وبطاقات</span>
          </div>

          <div className="p-3 bg-[#D6CEBE] text-stone-900 border border-stone-300 rounded space-y-1">
            <span className="font-bold block">Sand / رمل البادية</span>
            <span className="font-mono text-[10px] text-stone-500 block">#D6CEBE</span>
            <span className="text-[9px] bg-stone-200 px-1 py-0.5 rounded block text-center">حواف ناعمة</span>
          </div>
        </div>
      </section>

      {/* 4. Typography Scale */}
      <section className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          3. الهرمية التيبوغرافية (Typography Hierarchy)
        </h2>

        <div className="bg-white border border-stone-200 rounded p-6 space-y-5">
          <div className="border-b border-stone-100 pb-3">
            <span className="text-[10px] font-mono text-stone-500 block">Display Title (Amiri Bold 36px)</span>
            <h1 className="text-3xl font-serif font-bold text-stone-900 mt-1">
              حصن الأخيضر التاريخي وعمارة البادية
            </h1>
          </div>

          <div className="border-b border-stone-100 pb-3">
            <span className="text-[10px] font-mono text-stone-500 block">Section Header (Amiri Bold 22px)</span>
            <h2 className="text-xl font-serif font-bold text-stone-800 mt-1">
              التحقيق المعماري في نظام الأروقة والعقود الإسطوانية
            </h2>
          </div>

          <div className="border-b border-stone-100 pb-3">
            <span className="text-[10px] font-mono text-stone-500 block">Body Text (Cairo Regular 15px - Measure 70ch)</span>
            <p className="text-sm text-stone-700 max-w-2xl leading-relaxed mt-1">
              يعد الحصن من الشواهد المعمارية الكبرى على تطور تقنيات البناء في العصر الإسلامي المبكر، حيث شُيد بالحجر الكلسي والآجر المفخور بمونة الجص المقاومة للتعرية.
            </p>
          </div>

          <div>
            <span className="text-[10px] font-mono text-stone-500 block">Metadata & Accession Number (JetBrains Mono 12px Tabular)</span>
            <div className="flex items-center gap-3 font-mono text-xs text-stone-600 mt-1">
              <span className="font-bold text-[#78350F]">KHA-000101</span>
              <span>·</span>
              <span>32.4419° N, 43.6031° E</span>
              <span>·</span>
              <span>Rev: 2026-03-15</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Verification & Precision Badges */}
      <section className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          4. أوسمة التحقيق وسلامة الإحداثيات (Verification & Precision)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-stone-200 rounded p-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-serif">
              حالات التحقيق العلمي المستقلة
            </h3>
            <div className="space-y-2">
              <VerificationBadge status="verified" showDescription />
              <VerificationBadge status="partially_verified" showDescription />
              <VerificationBadge status="unverified" showDescription />
              <VerificationBadge status="disputed" showDescription />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider font-serif">
              بوابات دقة الإحداثيات (PostGIS Gate)
            </h3>
            <div className="space-y-2.5">
              <div>
                <LocationPrecisionBadge precision="exact" />
                <p className="text-[11px] text-stone-500 mt-1">موقع مساحي مثبت ميدانياً ومتاح للعموم.</p>
              </div>
              <div>
                <LocationPrecisionBadge precision="approximate" />
                <p className="text-[11px] text-stone-500 mt-1">إحداثيات المنطقة المحيطة بدون تثبيت النقطة الصفرية.</p>
              </div>
              <div>
                <LocationPrecisionBadge precision="restricted" />
                <p className="text-[11px] text-rose-800 mt-1">محجوب احترازياً لحماية الآثار من النبش والتعدي.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Form Controls & Buttons */}
      <section className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          5. الأزرار وحقول الإدخال (Interactive Controls)
        </h2>

        <div className="bg-white border border-stone-200 rounded p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <button className="px-4 py-2 bg-[#78350F] hover:bg-[#9A3412] text-white text-xs font-medium rounded transition-colors shadow-2xs">
              زر أساسي (Primary Action)
            </button>
            <button className="px-4 py-2 bg-[#EBE6DF] hover:bg-[#DCD6C9] text-stone-800 text-xs font-medium rounded transition-colors">
              زر ثانوي (Secondary Action)
            </button>
            <button className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 text-xs font-medium rounded border border-stone-300">
              زر إطار (Outline Action)
            </button>
            <button className="px-4 py-2 bg-rose-800 hover:bg-rose-900 text-white text-xs font-medium rounded transition-colors">
              إجراء خطر (Destructive Action)
            </button>
            <button
              onClick={() => {
                setBtnLoading(true);
                setTimeout(() => setBtnLoading(false), 1500);
              }}
              className="px-4 py-2 bg-stone-800 text-white text-xs font-medium rounded flex items-center gap-1.5"
            >
              {btnLoading ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{btnLoading ? 'جارِ المعالجة...' : 'زر حالة نشطة'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block">حقل نصي عادي:</label>
              <input
                type="text"
                defaultValue="قصر شمعون الأثري"
                className="w-full bg-[#FBF9F5] border border-stone-300 rounded px-3 py-2 text-stone-800 focus:outline-none focus:border-[#78350F]"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block">قائمة اختيار منسدلة:</label>
              <select className="w-full bg-[#FBF9F5] border border-stone-300 rounded px-3 py-2 text-stone-800 focus:outline-none focus:border-[#78350F]">
                <option>العصر العباسي (750 - 1258 م)</option>
                <option>العصر الساساني (ما قبل الإسلام)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-stone-700 block">حقل بحث موثق:</label>
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-stone-300 rounded pr-9 pl-3 py-2 text-stone-800 focus:outline-none focus:border-[#78350F]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Alerts & Banners */}
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          6. التنبيهات وإشعارات الشفافية (Alerts & Disclosures)
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-[#F5F2EB] border border-[#E7E2D6] rounded flex items-start gap-3 text-stone-800">
            <HelpCircle className="w-4 h-4 text-[#78350F] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">إفصاح الشفافية والأمانة التاريخية:</span>
              <span>تعتبر جميع البيانات المسجلة خاضعة للتدقيق الميداني المستمر، ولا يُعتبر أي معلم مؤكداً إلا إذا اقترن بوثيقة أو تقرير تنقيب رسمي.</span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded flex items-start gap-3 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">تنبيه اختلاف الروايات التاريخية:</span>
              <span>هذا الموقع مسجل بصفة (محل خلاف تاريخي) لوجود أكثر من رواية أكاديمية متنافسة في تحديد سنة التأسيس.</span>
            </div>
          </div>

          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded flex items-start gap-3 text-rose-900">
            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">حظر الوصول وتحديد الصلاحيات:</span>
              <span>لا يملك هذا الدور صلاحية تعديل السجلات المنشورة. يُرجى تسجيل الدخول بحساب محرر أو باحث معتمد.</span>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Cards: Site Catalogue Card & Source Card */}
      <section className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          7. البطاقات التوثيقية (Source & Site Cards)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Site Card */}
          <div className="bg-white border border-stone-200 rounded p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-stone-500">
              <span className="font-bold text-[#78350F]">KHA-000101</span>
              <span>تاريخ التوثيق: 2026-03-01</span>
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              حصن الأخيضر التاريخي
            </h3>
            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
              حصن دفاعي صحراوي فخم مشيد بالحجر الكلسي والآجر، يمثل إحدى روائع العمارة العباسية الباكرة في بادية كربلاء الغربية.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
              <VerificationBadge status="verified" />
              <LocationPrecisionBadge precision="exact" />
              <span className="text-[11px] font-mono text-stone-500 mr-auto">3 مصادر مسندة</span>
            </div>
          </div>

          {/* Source Card */}
          <div className="bg-[#FAF7F2] border border-[#E7E2D6] rounded p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="bg-[#EAE4D7] text-stone-800 px-2 py-0.5 rounded font-mono text-[10px]">
                كتاب وبحث أكاديمي (Book)
              </span>
              <span className="text-emerald-800 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                درجة وثوقية: أصلية أولية (Primary)
              </span>
            </div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              الآثار والأوابد التاريخية في العراق - الجزء الثالث: الفرات الأوسط
            </h3>
            <div className="text-xs text-stone-600 space-y-1">
              <div><span className="font-bold">المؤلف:</span> د. طارق مظلوم وآخرون</div>
              <div><span className="font-bold">جهة النشر:</span> وزارة الثقافة والآثار، بغداد (1976)</div>
              <div><span className="font-bold">الاستشهاد:</span> ص 142-159، لوحة المعاينة رقم 24</div>
            </div>
            <div className="text-[11px] font-mono text-stone-500 pt-2 border-t border-stone-200 flex items-center justify-between">
              <span>المعرف: SRC-001</span>
              <span>مقتبس في 4 مواقع مسجلة</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Navigation Elements: Breadcrumbs & Tabs */}
      <section className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          8. مسار التصفح والتبويبات (Breadcrumbs & Tabs)
        </h2>

        <div className="bg-white border border-stone-200 rounded p-6 space-y-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <span className="text-stone-700 hover:text-[#78350F] cursor-pointer">الرئيسية</span>
            <span>/</span>
            <span className="text-stone-700 hover:text-[#78350F] cursor-pointer">محافظة كربلاء</span>
            <span>/</span>
            <span className="text-stone-700 hover:text-[#78350F] cursor-pointer">قضاء عين التمر</span>
            <span>/</span>
            <span className="text-[#78350F] font-bold">حصن الأخيضر التاريخي</span>
          </nav>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-stone-200 text-xs">
            <button className="px-4 py-2 border-b-2 border-[#78350F] text-[#78350F] font-bold">
              الوصف والتحقيق
            </button>
            <button className="px-4 py-2 text-stone-600 hover:text-stone-900">
              معرض اللوحات (8)
            </button>
            <button className="px-4 py-2 text-stone-600 hover:text-stone-900">
              المسح الطوبوغرافي
            </button>
            <button className="px-4 py-2 text-stone-600 hover:text-stone-900">
              المصادر والأدلة (3)
            </button>
            <button className="px-4 py-2 text-stone-600 hover:text-stone-900">
              سجل التعديلات
            </button>
          </div>
        </div>
      </section>

      {/* 10. Compact Researcher Table */}
      <section className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          9. جدول الباحثين المدمج (Compact Researcher Table)
        </h2>

        <div className="bg-white border border-stone-200 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F5F2EB] text-stone-700 font-serif border-b border-stone-200">
                <tr>
                  <th className="p-3 font-mono">المعرف</th>
                  <th className="p-3">اسم المعلم الأثري</th>
                  <th className="p-3">التصنيف</th>
                  <th className="p-3">الحقبة</th>
                  <th className="p-3">المنطقة</th>
                  <th className="p-3">حالة التحقيق</th>
                  <th className="p-3">المصادر</th>
                  <th className="p-3">آخر فحص</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                <tr className="hover:bg-stone-50">
                  <td className="p-3 font-mono font-bold text-[#78350F]">KHA-000101</td>
                  <td className="p-3 font-medium">حصن الأخيضر التاريخي</td>
                  <td className="p-3 text-stone-600">حصون وقلاع</td>
                  <td className="p-3 text-stone-600">العصر العباسي</td>
                  <td className="p-3 text-stone-600">عين التمر</td>
                  <td className="p-3"><VerificationBadge status="verified" /></td>
                  <td className="p-3 font-mono">3</td>
                  <td className="p-3 font-mono text-stone-500">2026-03-15</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-3 font-mono font-bold text-[#78350F]">KHA-000102</td>
                  <td className="p-3 font-medium">خان النخيلة (خان الربع)</td>
                  <td className="p-3 text-stone-600">خانات وقوافل</td>
                  <td className="p-3 text-stone-600">العصر العثماني</td>
                  <td className="p-3 text-stone-600">الجدول الغربي</td>
                  <td className="p-3"><VerificationBadge status="verified" /></td>
                  <td className="p-3 font-mono">2</td>
                  <td className="p-3 font-mono text-stone-500">2026-03-10</td>
                </tr>
                <tr className="hover:bg-stone-50">
                  <td className="p-3 font-mono font-bold text-[#78350F]">KHA-000103</td>
                  <td className="p-3 font-medium">أطلال كنيسة الأقيصر الأثرية</td>
                  <td className="p-3 text-stone-600">معالم دينية</td>
                  <td className="p-3 text-stone-600">الساساني / الحيري</td>
                  <td className="p-3 text-stone-600">عين التمر</td>
                  <td className="p-3"><VerificationBadge status="disputed" /></td>
                  <td className="p-3 font-mono">4</td>
                  <td className="p-3 font-mono text-stone-500">2026-02-28</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 11. Audit Log Row & Revision History Diff */}
      <section className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          10. سجل التدقيق والمقارنة النصية (Audit Log & Diff)
        </h2>

        <div className="space-y-4">
          {/* Audit Log Row */}
          <div className="bg-white border border-stone-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-stone-500">2026-03-15 11:42</span>
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono text-[10px]">
                update_verification
              </span>
              <span className="text-stone-800 font-medium">
                تعديل حالة تحقيق المعلم KHA-000103 من (غير محقق) إلى (محل خلاف)
              </span>
            </div>
            <div className="flex items-center gap-2 text-stone-500 font-mono text-[11px]">
              <span>المحرر: د. علي الحسيني</span>
              <span>·</span>
              <span className="bg-stone-100 px-1.5 py-0.5 rounded">IP: e3b0c442...</span>
            </div>
          </div>

          {/* Revision Diff View */}
          <div className="bg-white border border-stone-200 rounded p-5 space-y-3 text-xs">
            <div className="font-serif font-bold text-stone-800">
              مقارنة التعديل الميداني: حقل «الوصف الأثري الموجز»
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-[11px]">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900">
                <span className="block font-bold mb-1 text-rose-700">القيمة السابقة:</span>
                «شيدت الكنيسة في القرن الخامس الميلادي بحسب كتابات الرحالة.»
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-900">
                <span className="block font-bold mb-1 text-emerald-700">القيمة الجديدة المحققة:</span>
                «شيدت الكنيسة في الحقبة الساسانية المتأخرة، وتؤكد نتائج تنقيبات 1976 تأريخها بين القرنين الخامس والسادس الميلاديين.»
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Honest Empty, Loading, and Error States */}
      <section className="space-y-6">
        <h2 className="text-xl font-serif font-bold text-stone-900 border-b border-stone-200 pb-2">
          11. الحالات النزيهة (Empty, Loading & Error States)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Empty State */}
          <div className="bg-white border border-dashed border-stone-300 rounded p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-sm text-stone-800">لا توجد سجلات مطابقة للبحث</h3>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              لم نعثر على معالم أثرية تطابق معايير الفلترة المحددة. الأرشيف يضم المواقع المحققة فقط حتى الآن.
            </p>
          </div>

          {/* Loading State */}
          <div className="bg-white border border-stone-200 rounded p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#FAF7F2] text-[#78350F] flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <h3 className="font-serif font-bold text-sm text-stone-800">جارِ مطابقة التوقيعات الرقمية...</h3>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              يتم استرجاع الإحداثيات المسجلة ومقارنة تجزئة SHA-256 للمشتقات المنشورة.
            </p>
          </div>

          {/* Error State */}
          <div className="bg-white border border-rose-200 rounded p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-sm text-rose-900">تعذر تحميل السجل الأرشيفي</h3>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              السجل المطلوب خاضع لمراجعة أمنية أو تم نقله لمسار توثيقي آخر.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

