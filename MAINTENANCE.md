# دليل صيانة THE FOUNDERS dz

## نظرة عامة على الصيانة

هذا الدليل يوضح كيفية الحفاظ على التطبيق في حالة جيدة والتعامل مع المشاكل الشائعة.

## النسخ الاحتياطية والاسترجاع

### حفظ البيانات يدوياً

نظراً لأن البيانات تُحفظ في localStorage:

```javascript
// في متصفح الويب (Console)
const backupData = {
  companies: JSON.parse(localStorage.getItem('companies') || '[]'),
  fournisseurs: JSON.parse(localStorage.getItem('fournisseurs') || '[]'),
  transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
  user: JSON.parse(localStorage.getItem('auth_user') || 'null'),
};
console.log(JSON.stringify(backupData, null, 2));
```

### استرجاع البيانات

```javascript
const backupData = {
  // ضع البيانات المحفوظة هنا
};
localStorage.setItem('companies', JSON.stringify(backupData.companies));
localStorage.setItem('fournisseurs', JSON.stringify(backupData.fournisseurs));
localStorage.setItem('transactions', JSON.stringify(backupData.transactions));
```

## تحديث المتطلبات

### فحص التحديثات
```bash
npm outdated
```

### تحديث الحزم
```bash
npm update
npm update --save-dev
```

### تحديث نسخة Node
تأكد من استخدام Node.js 18 أو أحدث:
```bash
node --version
```

## الأداء والتحسينات

### مراقبة الأداء
- استخدم DevTools في المتصفح
- تحقق من Network tab للطلبات
- راقب Memory usage

### تحسين الأداء
1. **ضغط الصور**: استخدم WebP format
2. **Code Splitting**: استخدم dynamic imports
3. **Caching**: استخدم next/cache

### تحليل الحزم
```bash
npm install -D @next/bundle-analyzer
# ثم أضف ل next.config.js:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# })
```

## الأمان والامتثال

### فحوصات الأمان
```bash
npm audit
npm audit fix
```

### تحديثات الأمان الحرجة
إذا وجدت ثغرة أمان:
1. تحديث الحزمة على الفور
2. اختبار التطبيق بالكامل
3. نشر التحديث

### حماية البيانات الحساسة
- لا تخزن أسرار في الكود
- استخدم environment variables
- لا تسجل البيانات الحساسة

## الأخطاء الشائعة والحلول

### مشكلة: الذاكرة تمتلئ
**الأعراض**: التطبيق يصبح بطيء
**الحل**: 
```bash
# مسح localStorage
localStorage.clear();
# أو مسح بيانات محددة
localStorage.removeItem('auth_user');
```

### مشكلة: الوضع الداكن لا يعمل
**الأعراض**: الوضع لا يتبدل
**الحل**:
```bash
# تحقق من ملف globals.css
# تأكد من وجود @theme inline
# تحقق من الـ html tag: dir="rtl" وغيرها
```

### مشكلة: المعاملات لا تُحفظ
**الأعراض**: تضيع البيانات بعد التحديث
**الحل**:
1. تحقق من localStorage quota
2. افسح الذاكرة المؤقتة
3. استخدم متصفح مختلف

### مشكلة: تسجيل الدخول يفشل
**الأعراض**: لا يمكن الدخول
**الحل**:
- التحقق من البيانات الافتراضية
- مسح localStorage
- حذف cookies

## الاختبار والجودة

### اختبار يدوي
1. **الانسيابية**: اختبر جميع الخطوات
2. **الحدود**: اختبر مع بيانات كبيرة
3. **التوافق**: اختبر على متصفحات مختلفة
4. **الاستجابة**: اختبر على أحجام مختلفة

### أدوات الاختبار المقترحة
```bash
# تثبيت Jest (اختياري)
npm install --save-dev jest @testing-library/react

# تشغيل الاختبارات
npm test
```

### قائمة التحقق قبل النشر
- [ ] اختبار كامل التطبيق
- [ ] التحقق من عدم وجود أخطاء في Console
- [ ] اختبار على جميع الأجهزة
- [ ] مراجعة الأداء
- [ ] تحديث الوثائق

## التوثيق والتعليقات

### معايير التعليقات
```typescript
// تعليق مختصر لسطر واحد

/**
 * وصف الدالة
 * @param param1 وصف المعامل الأول
 * @returns وصف القيمة المرجعة
 */
function myFunction(param1: string): boolean {
  // التعليقات التفصيلية
  return true;
}
```

### تحديث الوثائق
- حدّث README.md عند إضافة ميزات
- حدّث GUIDE.md عند تغيير الواجهة
- حدّث CHANGELOG.md عند الإصدارات

## المراقبة والتسجيل

### تسجيل الأخطاء
```typescript
// استخدام try-catch
try {
  // عملية حساسة
} catch (error) {
  console.error('خطأ:', error);
  // إرسال إلى خدمة logging (مستقبلاً)
}
```

### مراقبة الأداء
```typescript
console.time('operation-name');
// عملية
console.timeEnd('operation-name');
```

## الإرشادات الموسمية

### فقبل رأس السنة
- [ ] مراجعة شاملة للكود
- [ ] تحديث جميع الحزم
- [ ] اختبار شامل
- [ ] نسخ احتياطية

### قبل الأعياد
- [ ] تأكد من استقرار التطبيق
- [ ] انسخ احتياطياً البيانات
- [ ] أخطر المستخدمين بالصيانة

## إجراء الطوارئ

### في حالة خطأ حرج:
1. **تقييم الضرر**: هل البيانات مفقودة؟
2. **إيقاف مؤقت**: أوقف التطبيق إن لزم
3. **الاستجابة**: أصلح الخطأ على الفور
4. **الاختبار**: اختبر بعد الإصلاح
5. **الإشعار**: أخطر المستخدمين

### استرجاع من كارثة
```bash
# استرجاع من git
git log --oneline
git revert <commit-id>
git push
```

## التواصل والدعم

### للإبلاغ عن مشاكل:
- البريد: support@thefounders.dz
- GitHub Issues: (عند توفره)

### ساعات الدعم:
- 24/7 للمشاكل الحرجة
- أيام العمل للمشاكل العادية

---

آخر تحديث: يناير 2026
