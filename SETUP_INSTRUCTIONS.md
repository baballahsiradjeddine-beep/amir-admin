# إعداد Supabase - خطوة بخطوة

## الخطوة 1: الحصول على بيانات Supabase

1. اذهب إلى https://app.supabase.com
2. اختر مشروعك
3. اذهب إلى **Settings** → **API**
4. انسخ:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **Anon Key** (NEXT_PUBLIC_SUPABASE_ANON_KEY)

## الخطوة 2: إنشاء ملف .env.local

في جذر المشروع، أنشئ ملف `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

استبدل:
- `your-project` برمز مشروعك
- `your-anon-key-here` بـ Anon Key الخاص بك

## الخطوة 3: تشغيل SQL Scripts

في لوحة Supabase:

1. اذهب إلى **SQL Editor** 
2. أنسخ محتوى `/scripts/init-database.sql` والصقه
3. اضغط "Run"
4. ثم أنسخ محتوى `/scripts/create-demo-user.sql` والصقه
5. اضغط "Run"

## الخطوة 4: تشغيل التطبيق

```bash
npm install
npm run dev
```

## الخطوة 5: تسجيل الدخول

استخدم بيانات الدخول:
- **البريد:** thefoundersdz@gmail.com
- **كلمة المرور:** amirnouadi26

## ✅ يجب أن تعمل الآن!

إذا واجهت أي أخطاء:
- تأكد من نسخ البيانات بشكل صحيح
- تحقق من SQL Scripts وتم تنفيذها بنجاح
- افتح Browser Console (F12) لرؤية الأخطاء التفصيلية
