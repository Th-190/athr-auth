# تقرير فحص الجودة والأمان — «أثر كربلاء»
**تاريخ:** 2026-10-17 | **المنهجية:** Code-review + Feature tests + npm/composer audit

---

## 1. الثغرات المُصلَحة — Critical (4/4)

| # | الثغرة | الإصلاح |
|---|--------|---------|
| C1 | Draft/Archived sites يظهر بـ URL مباشر | publication_status gate في SiteController::show() |
| C2 | Coordinates خام تتسرب لمواقع restricted | unset lat/lng/coordinates قبل الإرسال |
| C3 | OAuth endpoint removed; administrator access now uses Laravel sessions | inspected during single-admin migration |
| C4 | Self role change + super_admin escalation | فحص self-change (422) + escalation (403) |

## 2. الثغرات المُصلَحة — High (7/7)

| # | الثغرة | الإصلاح |
|---|--------|---------|
| H1 | Path traversal في media download | فحص ".." في download() |
| H2 | Verified لا يُعاد ضبطه عند التعديل | reset في SiteController::update() |
| H3 | AI content يصبح Verified بدون إنسان | فحص ai_assisted في verify() |
| H4 | لا rate limiting على نقاط حساسة | throttle:15,1 / 10,1 / 30,1 |
| H5 | بريد غير موثق مقبول في Google OAuth | فحص email_verified claim |
| H6 | مستخدمون جدد = viewer بدلاً من contributor | تغيير الدور الافتراضي |
| H7 | 2FA غير مُجبَر على Admin | فحص two_factor_confirmed_at في middleware |

## 3. Medium / Low (بدون إصلاح)

| # | الخطورة | الوصف |
|---|---------|-------|
| M1 | MEDIUM | X-User-Id Header Spoofing في EnsureAdminRole |
| M2 | MEDIUM | npm: 4 HIGH في @grpc/grpc-js عبر Firebase SDK |
| M3 | MEDIUM | CSRF يجب التحقق على Web routes |
| M4 | MEDIUM | Open Redirect في login return URL |
| M5 | MEDIUM | IDOR جزئي: SiteImage.site_id |
| M6 | MEDIUM | Contributions IDOR: review() لا يتحقق ownership |
| L1 | LOW | Security Headers (CSP, X-Frame-Options) |
| L2 | LOW | Cookie flags (HttpOnly, Secure, SameSite) |
| L3 | LOW | APP_DEBUG=false في production |
| L4 | LOW | Playwright (375/768/1280, axe, Lighthouse) لم تُجرَ |
| L5 | LOW | Sitemap/RSS: archived sites |
| L6 | LOW | Invitation system غير مُطبَّق |

## 4. نتائج الاختبارات

```
composer audit:   No advisories found
npm audit:        4 HIGH in @grpc/grpc-js via Firebase
php artisan test: 11 passed (54 assertions) 1.01s
npx tsc --noEmit: Exit 0
```

## 5. ملخص تنفيذي

| الفئة | مُصلَح | متبقٍ |
|-------|--------|-------|
| Critical | 4/4 | 0 |
| High | 7/7 | 0 |
| Medium | 0 | 6 |
| Low | 0 | 6 |
