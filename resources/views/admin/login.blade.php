<!doctype html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>دخول الإدارة | أثر كربلاء</title>
    <style>
        :root { color-scheme: light; font-family: Tahoma, Arial, sans-serif; background: #f8f6f2; color: #1c1917; }
        * { box-sizing: border-box; }
        body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 1rem; }
        main { width: min(100%, 28rem); background: #fff; border: 1px solid #e8e2d8; border-radius: 1rem; padding: 2rem; box-shadow: 0 16px 45px #1c191712; }
        h1 { margin: 0 0 .5rem; font-family: Georgia, serif; font-size: 1.65rem; }
        p { color: #57534e; line-height: 1.7; font-size: .9rem; }
        label { display: block; margin: 1.1rem 0 .4rem; font-size: .85rem; font-weight: 700; }
        input { width: 100%; padding: .8rem; border: 1px solid #d6d3d1; border-radius: .55rem; font: inherit; }
        button { width: 100%; margin-top: 1.4rem; padding: .85rem; background: #78350f; color: white; border: 0; border-radius: .55rem; font: inherit; font-weight: 700; cursor: pointer; }
        .error { margin-top: .5rem; color: #b91c1c; font-size: .82rem; }
        .notice { padding: .75rem; background: #fff7ed; border: 1px solid #fed7aa; border-radius: .5rem; color: #9a3412; }
        .back { display: inline-block; margin-top: 1rem; color: #78350f; font-size: .85rem; }
    </style>
</head>
<body>
<main>
    <p>أثر كربلاء · بوابة إدارية</p>
    <h1>دخول هيئة الإدارة</h1>
    <p>هذه الصفحة مخصصة للحساب الإداري المحدد ولأعضاء التحرير المخولين.</p>

    @if (!$adminEmailConfigured)
        <p class="notice">لم يُهيأ بريد المدير المحدد بعد. اطلب من مسؤول النشر ضبط ARCHIVE_ADMIN_EMAIL وتشغيل إجراء تهيئة المدير.</p>
    @endif

    @if ($errors->any())
        <p class="error" role="alert">{{ $errors->first() }}</p>
    @endif

    <form method="post" action="{{ route('admin.login.store') }}">
        @csrf
        <label for="email">البريد الإلكتروني</label>
        <input id="email" name="email" type="email" autocomplete="username" value="{{ old('email') }}" required maxlength="255" autofocus>
        <label for="password">كلمة المرور</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required maxlength="1024">
        <button type="submit" @disabled(!$adminEmailConfigured)>دخول الإدارة</button>
    </form>
    <a class="back" href="/">العودة إلى الأرشيف العام</a>
</main>
</body>
</html>
