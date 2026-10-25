<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>أثر كربلاء | الأرشيف الرقمي للتراث والآثار</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Cairo:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-canvas: #FBF9F5;
            --text-main: #1C1917;
            --brand-primary: #78350F;
            --brand-accent: #B45309;
            --border-subtle: #E7E0D3;
        }
        body {
            background-color: var(--bg-canvas);
            color: var(--text-main);
            font-family: 'Cairo', system-ui, sans-serif;
            margin: 0;
            padding: 0;
            direction: rtl;
        }
        header {
            border-bottom: 2px solid var(--brand-primary);
            background: #fff;
            padding: 1.25rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo-title {
            font-family: 'Amiri', serif;
            font-size: 1.75rem;
            font-weight: 700;
            color: var(--brand-primary);
            margin: 0;
        }
        .admin-link {
            color: var(--brand-primary);
            border: 1px solid var(--border-subtle);
            border-radius: 6px;
            padding: 0.6rem 0.9rem;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 700;
            min-height: 44px;
            display: inline-flex;
            align-items: center;
        }
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1.5rem;
        }
        .hero {
            background: #fff;
            border: 1px solid var(--border-subtle);
            border-radius: 8px;
            padding: 3rem 2rem;
            text-align: center;
            box-shadow: 0 4px 20px -2px rgba(28, 25, 23, 0.05);
        }
        .hero h1 {
            font-family: 'Amiri', serif;
            font-size: 2.5rem;
            color: #1C1917;
            margin: 0 0 1rem;
        }
        .hero p {
            color: #57534E;
            max-width: 700px;
            margin: 0 auto 2rem;
            line-height: 1.8;
            font-size: 1.1rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        .card {
            background: #fff;
            border: 1px solid var(--border-subtle);
            border-radius: 8px;
            padding: 1.5rem;
        }
        .card h3 {
            font-family: 'Amiri', serif;
            margin-top: 0;
            color: var(--brand-primary);
        }
    </style>
</head>
<body>
    <header>
        <div>
            <h1 class="logo-title">«أثر كربلاء» — Karbala Heritage Archive</h1>
            <small style="color: #78716C;">منظومة التوثيق الرقمي الرصين للتراث والآثار</small>
        </div>
        <a class="admin-link" href="/admin/login">دخول هيئة الإدارة</a>
    </header>

    <div class="container">
        <div class="hero">
            <h1>الأرشيف الرقمي الموثّق لمحافظة كربلاء</h1>
            <p>
                أرشيف رقمي يوثّق المواقع الأثرية والتاريخية والتراثية في محافظة كربلاء، ويربط السجلات بالمصادر والمراجعة العلمية.
            </p>
        </div>

        <div class="grid">
            <div class="card">
                <h3>سجل المعالم الأثرية</h3>
                <p>سجلات توثيقية للمواقع والعمارة التاريخية في محافظة كربلاء مع معلومات الموقع والحالة والأهمية.</p>
            </div>
            <div class="card">
                <h3>الصور والأدلة</h3>
                <p>مواد بصرية مرتبطة بسجلاتها ومصادرها وبيانات الحقوق والنسبة، وفق ضوابط حفظ الأصول.</p>
            </div>
            <div class="card">
                <h3>المصادر والتحقيق العلمي</h3>
                <p>إسناد تاريخي وأثري قابل للمراجعة، مع فصل حالة النشر عن مستوى التحقق من المعلومات.</p>
            </div>
        </div>
    </div>
</body>
</html>
