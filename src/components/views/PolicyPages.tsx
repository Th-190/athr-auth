import React from 'react';
import { archiveDB } from '../../db/archiveStore';
import { Site } from '../../types';
import { Shield, BookOpen, FileText, Camera, Database, MapPin, ArrowRight } from 'lucide-react';

interface PolicyPageProps {
  policyType: 'privacy' | 'terms' | 'copyright' | 'contribution' | 'hierarchy';
  onSelectSite?: (site: Site) => void;
  onNavigate: (tab: string, param?: string) => void;
}

export const PolicyPages: React.FC<PolicyPageProps> = ({
  policyType,
  onSelectSite,
  onNavigate,
}) => {
  // 1. ADMINISTRATIVE HIERARCHY BROWSE (المناطق والأقضية والنواحي)
  if (policyType === 'hierarchy') {
    const province = archiveDB.getProvince();
    const districts = archiveDB.getDistricts();
    const subDistricts = archiveDB.getSubDistricts();
    const areas = archiveDB.getAreas();
    const allSites = archiveDB.getAllSites(false);

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-8 space-y-8">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            التقسيم الإداري والجغرافي
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            تصفح المعالم بحسب الأقضية والنواحي والبوادي
          </h1>
          <p className="text-xs text-stone-600 mt-1 max-w-2xl leading-relaxed">
            محافظة كربلاء المقدسة (الرمز الأرشيفي: KHA) موزعة بحسب الأقضية الأربعة ومراكز الاستيطان والواحات التاريخية.
          </p>
        </div>

        <div className="space-y-8">
          {districts.map(district => {
            const districtSubDistricts = subDistricts.filter(sd => sd.district_id === district.id);
            const districtAreas = areas.filter(a => a.district_id === district.id);
            const districtSites = allSites.filter(s => s.district_id === district.id);

            return (
              <div key={district.id} className="bg-white border border-[#EBE6DF] rounded p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-3 gap-2">
                  <div>
                    <h2 className="text-xl font-serif font-bold text-stone-900">
                      {district.name_ar}
                    </h2>
                    <span className="text-xs font-mono text-stone-500">{district.name_en}</span>
                  </div>
                  <span className="text-xs font-mono bg-[#F5F2EB] text-[#78350F] px-2.5 py-1 rounded border border-[#E7E2D6] font-bold">
                    {districtSites.length} معالم موثقة
                  </span>
                </div>

                {/* Sub-areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {districtAreas.map(area => {
                    const areaSites = allSites.filter(s => s.area_id === area.id);

                    return (
                      <div key={area.id} className="p-4 bg-[#FBF9F5] border border-stone-200 rounded space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 font-serif text-sm flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#78350F]" />
                            <span>{area.name_ar}</span>
                          </span>
                          <span className="font-mono text-stone-500 text-[10px]">{areaSites.length} مواقع</span>
                        </div>
                        {area.description && (
                          <p className="text-stone-600 leading-relaxed text-[11px]">{area.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {areaSites.map(s => (
                            <button
                              key={s.id}
                              onClick={() => onSelectSite && onSelectSite(s)}
                              className="px-2 py-0.5 bg-white border border-stone-200 rounded text-[11px] text-stone-800 hover:border-[#78350F] hover:text-[#78350F] transition-colors"
                            >
                              {s.name_ar}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. PRIVACY & DATA RETENTION POLICY
  if (policyType === 'privacy') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-8 leading-relaxed text-stone-800 text-xs sm:text-sm">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            السياسات المؤسسية
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            سياسة الخصوصية وحفظ البيانات وحماية الإحداثيات
          </h1>
          <p className="text-xs text-stone-500 mt-1">تاريخ آخر تحديث: مارس 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#78350F]" />
            <span>1. ميثاق حماية الإحداثيات الأثرية الحساسة (PostGIS Safety)</span>
          </h2>
          <p className="text-stone-700">
            تدرك هيئة أرشيف «أثر كربلاء» الخطر البالغ المترتب على نشر إحداثيات المواقع غير المنقبة في البوادي والصحاري. لذا يُطبق النظام بروتوكول حجب صارم (Restricted Coordinates Gate) يمنع تصدير الإحداثيات الدقيقة إلى الواجهات العامة، ويستبدلها بإحداثيات تقريبية fuzzed لحماية الآثار من عصابات النبش والتنقيب غير المشروع.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-[#78350F]" />
            <span>2. جمع بيانات المساهمين والزوار</span>
          </h2>
          <p className="text-stone-700">
            لا يجمع الأرشيف أي بيانات شخصية تتبعية لأغراض إعلانية. بيانات البريد الإلكتروني والأسماء المدخلة في استمارات المساهمة أو الإبلاغ عن أخطاء تُستخدم حصراً للتواصل العلمي والتحقق من مصادر المعلومات ولا تُشارك مع أي طرف تجاري.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            3. سجل التدقيق والحفظ طويل الأمد
          </h2>
          <p className="text-stone-700">
            تُحفظ جميع التعديلات وسجلات التدقيق في سجلات لا تقبل الحذف (Append-only Audit Log) لضمان الشفافية المعرفية وسلامة تتبع تاريخ التوثيق عبر الأجيال.
          </p>
        </section>
      </div>
    );
  }

  // 3. COPYRIGHT & IMAGE USAGE POLICY
  if (policyType === 'copyright') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-8 leading-relaxed text-stone-800 text-xs sm:text-sm">
        <div className="border-b border-stone-200 pb-4">
          <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
            الملكية الفكرية
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900">
            سياسة حقوق الملكية الفكرية وتراخيص الصور
          </h1>
          <p className="text-xs text-stone-500 mt-1">تاريخ آخر تحديث: مارس 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#78350F]" />
            <span>1. قاعدة «حقوق غير مؤكدة» الافتراضية (Default to Unknown)</span>
          </h2>
          <p className="text-stone-700">
            لا يفترض الأرشيف أبداً أن أي صورة مجهولة المصدر هي ملك عام (Public Domain). بل تُوسم كل صورة بـ «حالة الحقوق: غير مؤكدة» حتى يتم الاستيثاق الرسمي من المصور أو المؤسسة المالكة للأصل، مع ذكر جهة التوثيق وحظر الاستغلال التجاري بدون إذن خطي.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            2. التنزيل المائي المخصص للأبحاث (Controlled Watermarked Downloads)
          </h2>
          <p className="text-stone-700">
            تُتاح النسخ الرقمية للأغراض الأكاديمية والبحثية ممهورة بختم «أثر كربلاء | Karbala Heritage Archive» وعزو المصور، لحماية التراث البصري العراقي من السرقة وإعادة النشر غير المنسوب.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-serif font-bold text-stone-900">
            3. الإبلاغ عن انتهاكات حقوق الصور
          </h2>
          <p className="text-stone-700">
            يتيح الأرشيف رابطاً مباشراً في كل لوحة مصورة للإبلاغ الفوري عن أي خطأ في عزو الصورة أو انتهاك لحقوق المؤلف، وتلتزم هيئة التحرير بحجب أو تصويب أي لوحة محل نزاع خلال 48 ساعة.
          </p>
        </section>
      </div>
    );
  }

  // 4. TERMS OF USE
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 space-y-8 leading-relaxed text-stone-800 text-xs sm:text-sm">
      <div className="border-b border-stone-200 pb-4">
        <span className="text-xs font-mono text-[#78350F] uppercase tracking-wider block">
          الشروط والأحكام
        </span>
        <h1 className="text-3xl font-serif font-bold text-stone-900">
          شروط الاستخدام وميثاق البحث الأكاديمي
        </h1>
      </div>

      <div className="space-y-4 text-stone-700">
        <p>
          يخضع استخدام منصة «أثر كربلاء» لمبادئ النزاهة العلمية. يُلزم الباحثون بالاقتباس الرسمي للسجلات باستخدام المعرف الدائم (مثال: KHA-000101) وتاريخ الاسترجاع كما هو مبيّن في نافذة الاقتباس.
        </p>
        <p>
          يُحظر استخدام بيانات الأرشيف لأي أنشطة تنقيب غير مصرح بها أو إلحاق الضرر بالمعالم التراثية والبيئية في كربلاء.
        </p>
      </div>
    </div>
  );
};
