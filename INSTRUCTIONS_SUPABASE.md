# Supabase Migration Instructions

لقد تم تحويل التطبيق بالكامل ليعمل مع Supabase بدلاً من SQLite المحلي. لكي يعمل الموقع، يجب عليك اتباع الخطوات التالية بدقة:

## 1. إعداد مشروع Supabase
1. اذهب إلى [Supabase](https://supabase.com) وأنشئ مشروعاً جديداً.
2. بعد إنشاء المشروع، اذهب إلى إعدادات المشروع (Project Settings) -> API.
3. انسخ `Project URL` و `anon public key`.

## 2. إعداد متغيرات البيئة
1. أنشئ ملفاً جديداً في المجلد الرئيسي للمشروع باسم `.env.local`.
2. انسخ المحتوى التالي وأضف مفاتيحك:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (اختياري، للمهام الإدارية فقط)

> **ملاحظة:**
> - `ANON_KEY`: هو المفتاح العام (Public) ويستخدم في المتصفح. (Project Settings > API > anon public)
> - `SERVICE_ROLE_KEY`: هو مفتاح سري (Secret) يتجاوز الصلاحيات. (Project Settings > API > service_role (secret))
>   - هذا المفتاح **اختياري** لتشغيل الموقع، ولكن قد تحتاجه مستقبلاً لمهام الإدارة الخلفية.
```

## 3. إنشاء الجداول (Database Schema)
1. اذهب إلى قائمة `SQL Editor` في لوحة تحكم Supabase.
2. انقر على `New Query`.
3. انسخ محتوى الملف الموجود في مسار:
   `d:/bossamir/lib/supabase/schema.sql`
4. ألصق المحتوى في المحرر واضغط `Run`.
   - هذا سينشئ جميع الجداول (Users, Companies, Transactions...) مع سياسات الأمان (RLS).

## 4. إعداد المصادقة (Authentication)
1. اذهب إلى `Authentication` -> `Providers` في Supabase وتأكد أن `Email` مفعل.
2. في `Authentication` -> `URL Configuration`، تأكد من إضافة `http://localhost:3000` (أو رابط موقعك) في `Site URL` و `Redirect URLs`.

## 5. التشغيل
بعد القيام بهذه الخطوات، أعد تشغيل السيرفر المحلي:
```bash
npm run dev
```

الآن، عند فتح التطبيق، سيطلب منك تسجيل الدخول. يمكنك إنشاء حساب جديد عبر Supabase Dashboard (Authentication -> Users -> Add User) أو تفعيل التسجيل في صفحة الدخول إذا أردت.
**ملاحظة:** البيانات القديمة في SQLite لن تظهر تلقائياً. ستبدأ بقاعدة بيانات نظيفة.
