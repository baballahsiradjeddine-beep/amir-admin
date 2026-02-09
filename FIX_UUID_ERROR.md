# إصلاح خطأ UUID غير محدد

## المشكلة
```
[v0] Error loading data from Supabase: invalid input syntax for type uuid: "undefined"
```

## السبب
هناك سببان محتملان:

### 1. متغيرات البيئة ناقصة (الأكثر شيوعاً)
متغيرات Supabase لم تُضف إلى `.env.local`

### 2. مستخدم غير معرّف
المستخدم لم يسجل الدخول بشكل صحيح، أو `user.id` لم يكن محدداً

## الحل

### الخطوة 1: إضافة متغيرات البيئة

1. افتح `Supabase Dashboard` على https://app.supabase.com
2. اختر مشروعك
3. انقر على **Settings** → **API**
4. انسخ:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. أنشئ ملف `.env.local` في جذر المشروع:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### الخطوة 2: إعادة تشغيل الخادم

```bash
# توقف الخادم (Ctrl+C)
# ثم أعد تشغيله
npm run dev
```

### الخطوة 3: تسجيل الدخول

استخدم بيانات الدخول:
- **البريد**: thefoundersdz@gmail.com
- **كلمة المرور**: amirnouadi26

### الخطوة 4: التحقق

افتح متصفحك على http://localhost:3000/dashboard

إذا رأيت البيانات تُحمّل بدون أخطاء، فالمشكلة حُلّت! ✅

## التشخيص

إذا استمرت المشكلة، افحص:

### تحقق من الملف `lib/supabase.ts`
```bash
# تأكد من أن المتغيرات تُقرأ بشكل صحيح
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### تحقق من Console
افتح Developer Tools (F12) وابحث عن:
- رسالة خطأ Supabase
- معرّف المستخدم (user ID)

### تحقق من Supabase Dashboard
1. اذهب إلى **Logs** → **API Logs**
2. ابحث عن الأخطاء
3. تحقق من سياسات RLS

## الأسباب الشائعة الأخرى

| المشكلة | الحل |
|--------|------|
| بيانات دخول خاطئة | استخدم: thefoundersdz@gmail.com / amirnouadi26 |
| Supabase معطّل | تحقق من https://status.supabase.com |
| مشاكل CORS | تأكد من أن النطاق مسموح في Supabase |
| مشاكل RLS | تحقق من سياسات RLS في Supabase |

## التشخيص المتقدم

إذا أردت المزيد من المعلومات، افتح `app/context/app-context.tsx` وابحث عن:
```javascript
console.log('[v0] Loading data for user:', user.id);
```

هذا سيطبع معرّف المستخدم في console إذا كان محدداً.

## الدعم

إذا استمرت المشكلة:
1. تأكد من أن Supabase متصل بالفعل
2. تحقق من سجلات Supabase API
3. جرّب إعادة تشغيل الخادم
4. امسح ذاكرة التخزين المؤقت (Ctrl+Shift+Delete)
