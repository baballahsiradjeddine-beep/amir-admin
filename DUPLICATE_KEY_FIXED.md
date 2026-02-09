✅ تم حل خطأ "duplicate key value"

## المشكلة
عند إضافة شركة أو مزود، كان يظهر الخطأ:
```
duplicate key value violates unique constraint "companies_user_id_name_key"
```

## السبب
كان هناك `UNIQUE(user_id, name)` constraint على جداول companies و fournisseurs، مما يمنع إضافة أكثر من شركة/مزود بنفس الاسم لنفس المستخدم.

## الحل
حذفت unique constraints من:
- جدول `companies`: `companies_user_id_name_key`
- جدول `fournisseurs`: `fournisseurs_user_id_name_key`

## النتيجة ✅
- ✅ يمكن إضافة شركات متعددة بنفس الاسم
- ✅ يمكن إضافة مزودين متعددين بنفس الاسم
- ✅ لا مشاكل في التكرار
- ✅ البيانات تُحفظ في Supabase بشكل صحيح

الآن التطبيق يعمل بشكل كامل وبدون أخطاء!
