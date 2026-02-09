# 🛠️ Troubleshooting Guide

## ❌ المشاكل الشائعة والحلول

### 1. خطأ "NEXT_PUBLIC_SUPABASE_URL is missing"

**المشكلة:**
```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**الحل:**
1. اذهب إلى مشروعك في Vercel
2. في Settings → Environment Variables
3. أضف:
   - `NEXT_PUBLIC_SUPABASE_URL` = رابط مشروعك في Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = مفتاح Anon من Supabase

**كيفية الحصول على البيانات:**
- في Supabase → Settings → API
- انسخ Project URL و Anon Key

### 2. خطأ "Row level security"

**المشكلة:**
```
Error: relation "public.companies" does not exist
```

**الحل:**
1. تأكد من تنفيذ السكريبت `scripts/init-database.sql`
2. في Supabase SQL Editor:
   ```sql
   SELECT * FROM companies LIMIT 1;
   ```
3. إذا لم يظهر، قم بتنفيذ السكريبت مرة أخرى

### 3. البيانات لا تظهر بعد الإضافة

**المشكلة:**
- أضفت معاملة لكنها لا تظهر في الصفحة

**الحل:**
1. افتح Developer Tools (F12)
2. اذهب إلى Console
3. تحقق من الأخطاء
4. في Network tab، شاهد requests لـ Supabase
5. تأكد من أن الـ loading state انتهى

### 4. خطأ Authentication

**المشكلة:**
```
Error: User is not authenticated
```

**الحل:**
1. تأكد من تسجيل الدخول
2. في `app/context/auth-context.tsx`، تحقق من `useAuth()`
3. تأكد من أن User موجود: `if (!user) return;`

### 5. الأرقام لا تظهر بشكل صحيح

**المشكلة:**
- الأرقام تظهر من اليمين لليسار

**الحل:**
- تأكد من وجود `dir="ltr"` في العناصر
```tsx
<p className="text-3xl font-bold" dir="ltr">
  {formatCurrency(amount)}
</p>
```

### 6. الزر معطّل ولا يعمل

**المشكلة:**
- عند الضغط على زر "إضافة" لا يحدث شيء

**الحل:**
1. تحقق من console للأخطاء
2. تأكد من ملء جميع الحقول المطلوبة
3. تأكد من أن `isSubmitting` عائد للـ false

```tsx
// ✅ صحيح
<Button disabled={isSubmitting}>
  {isSubmitting ? 'جاري...' : 'إضافة'}
</Button>

// ❌ خطأ
<Button>إضافة</Button>
```

## 🔍 خطوات التصحيح

### 1. تفعيل Console Logging

```typescript
// أضف في أي دالة
console.log('[v0] Data:', data);
console.log('[v0] Error:', error);
console.log('[v0] User:', user);
```

### 2. فحص Network Requests

1. فتح DevTools (F12)
2. الذهاب إلى Network tab
3. فلترة بـ "fetch"
4. شاهد requests لـ Supabase
5. افحص Response لترى البيانات أو الخطأ

### 3. فحص Supabase Dashboard

```sql
-- في SQL Editor

-- 1. فحص الجداول
SELECT * FROM companies LIMIT 5;
SELECT * FROM transactions LIMIT 5;

-- 2. فحص بيانات المستخدم
SELECT * FROM companies WHERE user_id = 'your-user-id';

-- 3. حساب الأرقام
SELECT 
  COUNT(*) as total_companies,
  SUM(working_capital) as total_capital
FROM companies
WHERE user_id = 'your-user-id';
```

## 🚨 رسائل الخطأ الشائعة وحلولها

| الخطأ | السبب | الحل |
|------|------|------|
| `PGRST116` | الجدول فارغ | لا توجد بيانات، يجب إضافة بيانات أولاً |
| `relation does not exist` | الجدول لم يُنشأ | قم بتنفيذ `scripts/init-database.sql` |
| `permission denied` | RLS مشكلة | تأكد من تسجيل الدخول صحيح |
| `duplicate key` | بيانات مكررة | تأكد من عدم إضافة نفس الشركة مرتين |
| `uuid is null` | user_id فارغ | تأكد من وجود المستخدم |

## ✅ Checklist للتصحيح

عند حدوث مشكلة، تحقق من:

- [ ] هل Supabase متصل؟
- [ ] هل `NEXT_PUBLIC_SUPABASE_URL` و `NEXT_PUBLIC_SUPABASE_ANON_KEY` موجودة؟
- [ ] هل السكريبت `init-database.sql` تم تنفيذه؟
- [ ] هل أنت مسجل دخول؟
- [ ] هل الجداول موجودة في Supabase؟
- [ ] هل تحتوي الجداول على بيانات؟
- [ ] هل هناك أخطاء في Console؟
- [ ] هل Network requests تعود بنتائج صحيحة؟
- [ ] هل RLS مفعّل صحيح؟
- [ ] هل `user_id` يطابق؟

## 💡 Tips للتطوير

### 1. استخدام Supabase CLI

```bash
# تثبيت
npm install -g supabase

# تسجيل الدخول
supabase login

# تشغيل محاكي محلي
supabase start

# مشاهدة السجلات
supabase functions serve
```

### 2. استخدام VS Code Extension

- ابحث عن "Supabase" في VS Code Extensions
- سيساعدك على الاتصال والاستعلام المباشر

### 3. Postman للاختبار

```
URL: https://your-project.supabase.co/rest/v1/companies
Headers: 
  - Authorization: Bearer YOUR_ANON_KEY
  - Content-Type: application/json
```

## 📞 الدعم

إذا واجهت مشكلة:
1. تحقق من هذه الوثيقة أولاً
2. ابحث في [Supabase Docs](https://supabase.com/docs)
3. ابحث في Stack Overflow
4. افتح Issue على GitHub

---

**آخر تحديث:** 2024
**الإصدار:** 1.0
