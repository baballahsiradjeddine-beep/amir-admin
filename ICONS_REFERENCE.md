# مرجع الرموز والأيقونات المستخدمة

التطبيق يستخدم مكتبة `lucide-react` للأيقونات. جميع الأيقونات منقولة من هذه المكتبة.

## الأيقونات المستخدمة حالياً

### الملاحة والتحكم
- `Home` - الصفحة الرئيسية
- `Building2` - الشركات
- `Truck` - المزودين
- `BarChart3` - الإحصائيات
- `Settings` - الإعدادات
- `LogOut` - تسجيل الخروج
- `Moon` - الوضع الداكن
- `Sun` - الوضع الفاتح

### العمليات والإجراءات
- `Plus` - إضافة جديد
- `Trash2` - حذف
- `Edit2` - تعديل
- `Calculator` - حاسبة
- `DollarSign` - الدولار ($)
- `Lock` - قفل/أمان
- `AlertCircle` - تنبيه
- `CheckCircle` - تم بنجاح

### المقاييس والتقارير
- `TrendingUp` - ارتفاع/نمو
- `TrendingDown` - انخفاض
- `Target` - هدف/ملخص

## كيفية استخدام الأيقونات

### الاستيراد
```typescript
import { Home, Plus, Trash2 } from 'lucide-react';
```

### الاستخدام
```jsx
<Home className="h-4 w-4" />
<Plus className="h-5 w-5" />
<Trash2 className="h-6 w-6" />
```

### الأحجام القياسية
- `h-4 w-4` - صغير (icons في الجداول والقوائم)
- `h-5 w-5` - متوسط (icons في الأزرار)
- `h-6 w-6` - كبير (icons رئيسية)

## إضافة أيقونات جديدة

### البحث عن أيقونة
1. اذهب إلى [lucide.dev](https://lucide.dev)
2. ابحث عن الأيقونة المطلوبة
3. انسخ اسمها

### الاستخدام
```typescript
// مثال: أيقونة للبريد
import { Mail } from 'lucide-react';

<Mail className="h-5 w-5" />
```

## الأيقونات البديلة للعملات

نظراً لعدم وجود أيقونة "يوان" مباشرة في lucide-react:
```jsx
// للدولار:
<DollarSign className="h-4 w-4" />

// للريال:
<span className="text-sm">¥</span>

// يمكنك أيضاً:
<span className="text-sm font-bold">₹</span> // روبية
<span className="text-sm">€</span> // يورو
<span className="text-sm">£</span> // جنيه
```

## الألوان المستخدمة مع الأيقونات

```typescript
// أخضر للإيجابي
<TrendingUp className="h-5 w-5 text-green-500" />

// أحمر للسالب
<TrendingDown className="h-5 w-5 text-red-500" />

// أزرق للمعلومات
<Info className="h-5 w-5 text-blue-500" />

// برتقالي للتحذير
<AlertCircle className="h-5 w-5 text-amber-500" />
```

## قائمة الأيقونات المتاحة في lucide-react

### الرعاية الصحية
- Heart, Stethoscope, Pill, Syringe

### الأعمال والمال
- Building2, Building, Store, ShoppingCart, CreditCard, DollarSign, Euro, TrendingUp, TrendingDown, BarChart3, PieChart, LineChart

### النقل
- Truck, Car, Plane, Bike, Navigation

### الاتصالات
- Mail, MessageSquare, Phone, Bell

### الملفات والمجلدات
- File, FileText, Folder, Download, Upload

### الموارد البشرية
- Users, User, UserPlus, UserMinus

### التحكم
- Settings, Menu, X, Plus, Minus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight

### الحالة والحالات
- Check, AlertCircle, Info, Help, Lock, Unlock, Eye, EyeOff

## نصائح للاستخدام الأمثل

1. **حجم موحد**: استخدم نفس الحجم لنفس النوع من الأيقونات
2. **الألوان**: استخدم الألوان الموجودة في نظام التصميم
3. **الهامش**: أضف margin بين الأيقونة والنص
4. **الوصول**: أضف aria-label عند الحاجة

```jsx
<button aria-label="حذف العنصر">
  <Trash2 className="h-5 w-5" />
</button>
```

---

آخر تحديث: يناير 2026
