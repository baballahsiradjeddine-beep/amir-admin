✅ تم حل جميع مشاكل البيانات والـ RLS بنجاح!

## المشاكل التي تم حلها:

### 1. خطأ RLS: "new row violates row-level security policy"
- **السبب:** RLS policies الأصلي تحقق من `auth.uid() = user_id` فقط
- **الحل:** حدثنا RLS policies ليقبل إما:
  - المستخدم الذي يطابق `auth.uid()`
  - أو طلب من service_role (admin client)
- **تم تنفيذ:** سكريبت `/scripts/update-rls-policies.sql` بنجاح ✓

### 2. الرأس المال الأساسي لا يُحفظ
- تم إضافة `saveFundCapital()` في App Context
- تم إضافة `setFundCapital()` و `getFundCapital()` في supabase-queries.ts
- تم تحديث صفحة الإعدادات لحفظ الصندوق في Supabase

### 3. عدم القدرة على إضافة شركات أو مزودين
- السبب الأول: RLS policies - تم حله بتحديث الـ policies
- السبب الثاني: عدم التطابق بين أسماء الأعمدة - تم حله بـ conversion functions

### 4. خطأ "Could not find the 'initialCapital' column"
- السبب: قاعدة البيانات تستخدم snake_case (`initial_capital`)
- الحل: أضفنا دوال تحويل تلقائية في supabase-queries.ts

### 5. البيانات تختفي عند الخروج من الصفحة
- تم إضافة تحميل البيانات من Supabase في useEffect
- الآن البيانات تُحمّل فوراً عند دخول المستخدم

## ما تم تغييره:

### 1. `/scripts/init-database.sql` (محدّث)
- جميع RLS policies الآن تقبل service_role (admin)
- الشرط: `auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role'`

### 2. `/scripts/update-rls-policies.sql` (جديد - تم تنفيذه)
- سكريبت لتحديث RLS policies بدون حذف البيانات
- تم تنفيذه بنجاح في قاعدة البيانات ✓

### 3. `/lib/supabase-queries.ts`
- `toSnakeCase()` و `toCamelCase()` helper functions
- جميع العمليات الآن تحول البيانات تلقائياً

### 4. `/app/context/app-context.tsx`
- إضافة fundCapital state و saveFundCapital
- تحديث تحميل البيانات

### 5. `/app/dashboard/settings/page.tsx`
- تحديث معالج الحفظ ليكون async

### 6. `/.env.example`
- إضافة SUPABASE_SERVICE_ROLE_KEY (اختياري)

## الآن:

✅ يمكنك إضافة شركات ومزودين بدون أخطاء RLS
✅ البيانات تُحفظ وتُسترجع من Supabase
✅ تحويل البيانات يعمل تلقائياً بين camelCase و snake_case
✅ الرأس المال الأساسي يُحفظ بشكل دائم

## تعيين الأعمدة:

| التطبيق (camelCase) | قاعدة البيانات (snake_case) |
|---|---|
| initialCapital | initial_capital |
| workingCapital | working_capital |
| sharePercentage | share_percentage |
| isActive | is_active |
| companyId | company_id |
| fournisseurId | fournisseur_id |
| passwordHash | password_hash |
| createdAt | created_at |
| updatedAt | updated_at |

**الحالة:** كل شيء جاهز وعامل! 🎉
