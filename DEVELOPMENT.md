# ملاحظات التطوير

## نظرة عامة على العمارة

### Context API
التطبيق يستخدم React Context للإدارة الحالة:

```
RootLayout
├── ThemeProvider (next-themes)
├── AuthProvider
│   └── useAuth() hook
└── DashboardLayout
    └── AppProvider
        └── useAppData() hook
```

### آلية المصادقة
- تخزين بيانات المستخدم في localStorage
- بيانات افتراضية محددة مسبقاً
- لا توجد قاعدة بيانات حقيقية (demo فقط)

### تخزين البيانات
- **Companies**: تُحفظ في state context
- **Fournisseurs**: تُحفظ في state context
- **Transactions**: تُحفظ في state context وتؤثر على working capital

## هيكل الملفات المهمة

```
/app
├── context/
│   ├── auth-context.tsx      # إدارة المصادقة
│   └── app-context.tsx       # إدارة البيانات العامة
├── components/
│   ├── sidebar.tsx           # الشريط الجانبي
│   ├── page-header.tsx       # رأس الصفحة
│   └── toaster-provider.tsx  # إدارة الإشعارات
├── dashboard/
│   ├── layout.tsx            # layout لوحة التحكم
│   ├── page.tsx              # المعاملات اليومية
│   ├── companies/page.tsx    # الشركات
│   ├── fournisseurs/page.tsx # المزودين
│   ├── stats/page.tsx        # الإحصائيات
│   └── settings/page.tsx     # الإعدادات
├── login/page.tsx            # صفحة الدخول
├── page.tsx                  # صفحة إعادة التوجيه
└── layout.tsx                # الـ layout الرئيسي
```

## تدفق البيانات

### إضافة معاملة:
```
page.tsx (حدث onClick)
  ↓
addTransaction() من AppContext
  ↓
تحديث state للـ transactions
  ↓
إذا كانت company: تحديث workingCapital
  ↓
إعادة render بالبيانات الجديدة
```

### تحديث رأس المال:
```
transaction.amount (موجب/سالب)
  ↓
إذا موجب: workingCapital += amount
إذا سالب: workingCapital += amount (يزيل تلقائياً)
```

## الميزات الرئيسية وكيفية عملها

### 1. التعبيرات الحسابية
```javascript
// في page.tsx
const calculateResult = () => {
  try {
    // eslint-disable-next-line no-eval
    const result = eval(expression);
    return result;
  } catch {
    return 0;
  }
};
```
⚠️ تحذير: استخدام eval() يمكن أن يكون خطراً، لكنه محدود هنا لأغراض العرض.

### 2. تنسيق الأرقام
```javascript
const formatCentimes = (num: number) => {
  const str = Math.abs(num).toString();
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
```
يضيف فاصل كل 3 أرقام: `1000000` → `1 000 000`

### 3. إدارة المظهر
```javascript
// next-themes توفر:
// - theme: الموضوع الحالي
// - setTheme(): لتغيير المظهر
```

## خطوات الإضافة الجديدة

### إضافة صفحة جديدة:
1. أنشئ ملف في `/app/dashboard/[section]/page.tsx`
2. استخدم useAuth() للتحقق من المصادقة
3. استخدم useAppData() للوصول للبيانات
4. استخدم المكونات من `/components/ui`

### إضافة مكون جديد:
1. أنشئ ملف في `/app/components/[name].tsx`
2. استخدم server component إلا إذا احتجت interaction
3. استخدم 'use client' للمكونات التفاعلية فقط

### إضافة context جديد:
1. أنشئ ملف في `/app/context/[name].tsx`
2. استخدم `createContext()` و `useContext()`
3. وفر Provider في layout
4. أنشئ hook للاستخدام

## تحسينات مستقبلية

### قصيرة الأجل:
- [ ] حفظ البيانات في localStorage بشكل أفضل
- [ ] التحقق من المدخلات بشكل أكثر صرامة
- [ ] إضافة animation للمكونات
- [ ] تحسين الأداء بـ useMemo

### طويلة الأجل:
- [ ] إضافة قاعدة بيانات Supabase
- [ ] نظام مصادقة حقيقي
- [ ] تصدير التقارير (PDF, Excel)
- [ ] نسخ احتياطية سحابية
- [ ] تعاون متعدد الحسابات
- [ ] API REST للبيانات
- [ ] تطبيق جوال

## النصائح والتحسينات

### الأداء:
- استخدم `useMemo` للحسابات الثقيلة
- استخدم `useCallback` لتمرير الدوال
- تجنب الـ re-renders غير الضرورية

### الأمان:
- تحقق من المدخلات دائماً
- استخدم zod/validator للـ schema
- تجنب تخزين البيانات الحساسة بشكل مباشر

### UX:
- أضف toast notifications لكل عملية
- استخدم dialog للعمليات المهمة
- وفر undo للعمليات الحساسة

## اختبار التطبيق

### خطوات الاختبار:
1. **المصادقة**: جرب الدخول والخروج
2. **المعاملات**: أضف معاملات مختلفة
3. **الحسابات**: تحقق من الأرصدة
4. **الرسوم البيانية**: تأكد من ظهور الإحصائيات
5. **المظهر**: اختبر الوضع الفاتح والداكن
6. **الاستجابة**: اختبر على أحجام مختلفة

## استكشاف الأخطاء

### خطأ: `useAuth must be used within AuthProvider`
- تأكد من أن AuthProvider موجود في layout الأب

### خطأ: البيانات لا تُحدث
- تحقق من استخدام updateTag() بدلاً من setState
- تأكد من أن hook يُستخدم في client component

### خطأ: الوضع الداكن لا يعمل
- تحقق من `suppressHydrationWarning` في html tag
- تأكد من `dark` class في CSS

## موارد مفيدة

- [Next.js 16 Docs](https://nextjs.org)
- [React Docs](https://react.dev)
- [Shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Recharts](https://recharts.org)
