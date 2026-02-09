# 📚 Quick Reference - الموارد السريعة

## 🎯 الروابط الهامة

### Supabase
- 🔗 [Supabase Console](https://app.supabase.com)
- 🔗 [Documentation](https://supabase.com/docs)
- 🔗 [API Reference](https://supabase.com/docs/reference)

### Vercel
- 🔗 [Vercel Dashboard](https://vercel.com/dashboard)
- 🔗 [Documentation](https://vercel.com/docs)
- 🔗 [Deployments](https://vercel.com/deployments)

### Next.js
- 🔗 [Next.js Docs](https://nextjs.org/docs)
- 🔗 [App Router](https://nextjs.org/docs/app)
- 🔗 [Deployment](https://nextjs.org/docs/deployment)

### Tailwind CSS
- 🔗 [Tailwind Docs](https://tailwindcss.com/docs)
- 🔗 [Component Library](https://tailwindcss.com/docs/components)

### Shadcn/UI
- 🔗 [Components](https://ui.shadcn.com)
- 🔗 [Documentation](https://ui.shadcn.com/docs)

---

## 📁 الملفات المهمة

### Core Files
```
/lib/supabase.ts                    # عميل Supabase
/lib/supabase-queries.ts            # دوال الاستعلام
/app/context/app-context.tsx        # إدارة البيانات
```

### Pages
```
/app/dashboard/page.tsx             # الصفحة الرئيسية
/app/dashboard/companies/page.tsx   # الشركات
/app/dashboard/transactions/page.tsx# المعاملات
/app/dashboard/settings/page.tsx    # الإعدادات
```

### Scripts
```
/scripts/init-database.sql          # إنشاء الجداول
/start.sh                           # برنامج البدء السريع
```

### Documentation
```
/README.md                          # الدليل الرئيسي
/COMPLETION_SUMMARY.md              # ملخص الإنجازات
/API_DOCUMENTATION.md               # توثيق API
/SUPABASE_SETUP.md                  # دليل الإعداد
/TROUBLESHOOTING.md                 # حل المشاكل
/SUCCESS_SUMMARY.md                 # ملخص النجاح
/FINAL_CHECKLIST.md                 # قائمة التحقق
```

---

## 🚀 الأوامر السريعة

### التطوير
```bash
npm run dev              # بدء السيرفر
npm run build            # بناء المشروع
npm run start            # تشغيل المشروع المبني
npm run lint             # التحقق من الأكواد
```

### البحث والتنقل
```bash
grep -r "TODO" .        # البحث عن أشياء معلقة
find . -name "*.tsx"    # البحث عن ملفات
```

### Git
```bash
git add .               # إضافة الملفات
git commit -m "msg"     # حفظ التغييرات
git push origin main    # رفع للخادم
```

---

## 🔐 متغيرات البيئة المطلوبة

```env
# .env.local (للتطوير)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Vercel (للإنتاج)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📊 هيكل قاعدة البيانات

### Companies Table
```sql
id (UUID)
user_id (UUID)
name (TEXT)
owner (TEXT)
description (TEXT)
initial_capital (BIGINT)
working_capital (BIGINT)
share_percentage (INTEGER)
is_active (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Fournisseurs Table
```sql
id (UUID)
user_id (UUID)
name (TEXT)
currency (TEXT)
balance (BIGINT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Transactions Table
```sql
id (UUID)
user_id (UUID)
type (TEXT)
amount (BIGINT)
rate (DECIMAL)
description (TEXT)
company_id (UUID)
fournisseur_id (UUID)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Fund Capital Table
```sql
id (UUID)
user_id (UUID)
amount (BIGINT)
password_hash (TEXT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

---

## 🎨 نظام الألوان

### Colors Used
```
Primary: #0ea5e9 (Sky Blue)
Green: #10b981 (Emerald)
Red: #ef4444 (Red)
Gray: #6b7280 (Gray-500)
Background: #ffffff / #1f2937
Text: #000000 / #f3f4f6
```

### CSS Classes
```css
text-primary        /* النص الأساسي */
bg-primary          /* الخلفية الأساسية */
text-green-600      /* نص أخضر */
bg-red-50           /* خلفية حمراء فاتحة */
text-muted-foreground /* نص مخفّف */
```

---

## 🧠 نصائح التطوير

### عند إضافة ميزة جديدة
1. أضف في Backend أولاً
2. ثم أضف في Frontend
3. ثم أختبر بشكل شامل

### عند البحث عن خطأ
1. افحص Console أولاً
2. ثم افحص Network
3. ثم افحص Supabase Dashboard
4. ثم قم بـ Debug في الكود

### عند النشر
1. اختبر محلياً بشكل كامل
2. تحقق من Console
3. تحقق من Network
4. ثم انشر على Vercel

---

## ⚡ الأداء والتحسينات

### تحسينات مطلقة
- ✅ استخدام React Context بدلاً من Prop Drilling
- ✅ async/await بدلاً من .then()
- ✅ Loading States لتحسين UX
- ✅ Error Boundaries للأمان

### تحسينات مستقبلية
- 📋 استخدام React Query أو SWR
- 📋 Pagination للبيانات الكبيرة
- 📋 Search و Filter محسّنة
- 📋 Caching Strategy

---

## 🐛 مشاكل شائعة وحلولها

| المشكلة | الحل | الملف |
|--------|------|-------|
| API Error | افحص متغيرات البيئة | .env.local |
| RLS Error | تأكد من تسجيل الدخول | auth-context.tsx |
| Loading لا ينتهي | افحص الـ async/await | supabase-queries.ts |
| البيانات لا تظهر | افحص Supabase Dashboard | - |
| الأزرار لا تعمل | افحص disabled state | page.tsx |

---

## 📱 اختبار سريع

### في Terminal
```bash
# تشغيل محاكي Supabase (إذا كنت تريد تطوير محلي)
supabase start

# اختبار الاتصال
curl https://your-project.supabase.co/rest/v1/companies \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### في Browser
```
http://localhost:3000/dashboard              # الصفحة الرئيسية
http://localhost:3000/dashboard/companies    # الشركات
http://localhost:3000/dashboard/transactions # المعاملات
```

---

## 🎓 موارد إضافية

### مقاطع فيديو مفيدة
- Supabase Basics
- Next.js 16 Features
- React Context Pattern
- Tailwind CSS v4

### المقالات المفيدة
- Row Level Security in Supabase
- Next.js App Router Deep Dive
- React Hooks Best Practices
- Performance Optimization

### الكتب الموصى بها
- "React Up & Running"
- "Next.js by Example"
- "The Road to GraphQL"

---

## ✅ قائمة سريعة للبدء

- [ ] تثبيت Node.js
- [ ] استنساخ المشروع
- [ ] تثبيت المكتبات: `npm install`
- [ ] إعداد متغيرات البيئة
- [ ] بدء السيرفر: `npm run dev`
- [ ] فتح http://localhost:3000
- [ ] اختبر الميزات الأساسية
- [ ] استمتع! 🎉

---

## 🆘 الدعم والمساعدة

### عند الحاجة للمساعدة
1. اقرأ الوثائق المتاحة
2. افحص TROUBLESHOOTING.md
3. ابحث عن ال��طأ على Google
4. اسأل في Stack Overflow
5. افتح Issue على GitHub

### معلومات الاتصال
- 📧 Email: support@thefoundersdz.com
- 🌐 Website: https://thefoundersdz.com
- 📞 Phone: +213 XX XXX XXXX
- 💬 Discord: [رابط Discord]

---

## 📈 متابعة التقدم

```
Week 1: Database Setup ✅
Week 2: Backend Integration ✅
Week 3: Frontend Integration ✅
Week 4: Testing & Deployment ✅

Status: COMPLETE ✅
```

---

**آخر تحديث:** 2024  
**النسخة:** 1.0.0  
**الحالة:** 🟢 جاهز للعمل
