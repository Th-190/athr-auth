<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>أثر كربلاء | Karbala Heritage Archive — Laravel</title>
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
        .badge {
            background: #FEF3C7;
            color: #92400E;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 600;
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
        .code-pill {
            font-family: 'JetBrains Mono', monospace;
            background: #F5F3EF;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-size: 0.85rem;
        }
    </style>
</head>
<body>
    <header>
        <div>
            <h1 class="logo-title">«أثر كربلاء» — Karbala Heritage Archive</h1>
            <small style="color: #78716C;">منظومة التوثيق الرقمي الرصين للتراث والآثار</small>
        </div>
        <div class="badge">Laravel 12 · PHP 8.3 Ready</div>
    </header>

    <div class="container">
        <div class="hero">
            <h1>الأرشيف الرقمي الموثّق لمحافظة كربلاء</h1>
            <p>
                تم تحويل وتهيئة المشروع بالكامل مع منظومة Laravel 12 وقاعدة بيانات PostGIS وواجهات RESTful API لجميع معالم التراث والتحقيق الميداني.
            </p>
            <div>
                <a href="/api/v1/health" class="code-pill">/api/v1/health</a> ·
                <a href="/api/v1/sites" class="code-pill">/api/v1/sites</a> ·
                <a href="/api/v1/taxonomies" class="code-pill">/api/v1/taxonomies</a>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>إدارة المعالم الأثرية (Sites)</h3>
                <p>متحكم SiteController مع بوابات حماية الإحداثيات الجغرافية الحساسة PostGIS وتتبع المراجعات Revisions.</p>
            </div>
            <div class="card">
                <h3>خزينة الصور والوسائط (Media Vault)</h3>
                <p>متحكم MediaController لفحص الترويسات الثنائية وتجريد بيانات EXIF ووسم الصور بالخط العربي وتدقيق SHA-256.</p>
            </div>
            <div class="card">
                <h3>المساهمات والتحقيق الأكاديمي</h3>
                <p>متحكمات ContributionController و ClaimController لتوثيق الفرضيات وتلقي المساهمات وتدقيق المصادر.</p>
            </div>
        </div>
    </div>
</body>
</html>
