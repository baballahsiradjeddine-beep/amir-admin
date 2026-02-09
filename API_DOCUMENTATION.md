# 🔌 Supabase API Documentation

## 📊 Database Schema

### 🏢 Companies Table

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY
  user_id UUID (Foreign Key)
  name TEXT NOT NULL
  owner TEXT NOT NULL
  description TEXT
  initial_capital BIGINT
  working_capital BIGINT (يتحدّث مع كل معاملة)
  share_percentage INTEGER (نسبة الأرباح)
  is_active BOOLEAN (للتفعيل/التعطيل)
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

**الاستعلامات:**
```typescript
getCompanies(userId)          // الحصول على جميع الشركات
addCompany(userId, data)      // إضافة شركة جديدة
updateCompany(id, updates)    // تحديث شركة
deleteCompany(id)             // حذف شركة
```

### 📦 Fournisseurs Table

```sql
CREATE TABLE fournisseurs (
  id UUID PRIMARY KEY
  user_id UUID (Foreign Key)
  name TEXT NOT NULL
  currency TEXT CHECK ('USD' | 'RMB')
  balance BIGINT (الرصيد الحالي)
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

**الاستعلامات:**
```typescript
getFournisseurs(userId)       // الحصول على جميع المزودين
addFournisseur(userId, data)  // إضافة مزود جديد
updateFournisseur(id, updates)// تحديث مزود
deleteFournisseur(id)         // حذف مزود
```

### 💳 Transactions Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY
  user_id UUID (Foreign Key)
  type TEXT CHECK ('company' | 'fournisseur')
  amount BIGINT (المبلغ الأساسي)
  rate DECIMAL (السعر/سعر الصرف)
  description TEXT
  company_id UUID (Foreign Key to companies)
  fournisseur_id UUID (Foreign Key to fournisseurs)
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

**الاستعلامات:**
```typescript
getTransactions(userId)       // الحصول على جميع المعاملات
addTransaction(userId, data)  // إضافة معاملة جديدة
```

### 💰 Fund Capital Table

```sql
CREATE TABLE fund_capital (
  id UUID PRIMARY KEY
  user_id UUID (Foreign Key) - UNIQUE
  amount BIGINT (قيمة الصندوق)
  password_hash TEXT
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

**الاستعلامات:**
```typescript
getFundCapital(userId)        // الحصول على الصندوق الأساسي
setFundCapital(userId, amount, password) // تعيين/تحديث الصندوق
```

## 🔄 API Flow

### إضافة معاملة جديدة

```typescript
// 1. في Component
const handleAddTransaction = async () => {
  await addTransaction({
    type: 'company',
    amount: 1000,
    rate: 1,
    description: 'بيع منتج',
    companyId: 'company-id'
  });
}

// 2. في App Context
const addTransaction = async (transaction) => {
  const newTransaction = await supabaseAddTransaction(user.id, transaction);
  
  // تحديث رأس المال الحالي
  if (transaction.type === 'company') {
    const company = companies.find(c => c.id === transaction.companyId);
    await supabaseUpdateCompany(company.id, {
      workingCapital: company.workingCapital + transaction.amount
    });
  }
  
  setTransactions([...transactions, newTransaction]);
}

// 3. في supabase-queries.ts
export async function addTransaction(userId, transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...transaction, user_id: userId }])
    .select();
  
  if (error) throw error;
  return data[0];
}

// 4. في Supabase
INSERT INTO transactions (user_id, type, amount, ...)
VALUES ('user-id', 'company', 1000, ...)
RETURNING *;

// 5. تحديث رأس المال
UPDATE companies
SET working_capital = working_capital + 1000
WHERE id = 'company-id'
RETURNING *;
```

## 🛡️ Row Level Security (RLS)

جميع الجداول لديها RLS مفعّل:

```sql
-- مثال من الـ SQL
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own companies"
ON companies
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own companies"
ON companies
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own companies"
ON companies
FOR DELETE
USING (auth.uid() = user_id);
```

**النتيجة:**
- ✅ كل مستخدم يرى فقط بيانات نفسه
- ✅ لا يمكن لأحد الوصول لبيانات الآخرين
- ✅ آمن تماماً

## 📝 أمثلة الاستخدام

### 1. إضافة شركة جديدة

```typescript
// في الصفحة
const handleAddCompany = async () => {
  await addCompany({
    name: 'شركة الأفراد',
    owner: 'أمير نوادي',
    description: 'شركة تقنية',
    initialCapital: 1000000,
    workingCapital: 1000000,
    sharePercentage: 100,
    isActive: true
  });
}
```

### 2. الحصول على جميع الشركات

```typescript
// في App Context - useEffect
useEffect(() => {
  if (!user) return;
  
  const loadData = async () => {
    const companies = await getCompanies(user.id);
    setCompanies(companies);
  };
  
  loadData();
}, [user]);
```

### 3. تحديث رأس المال

```typescript
// تحديث بعد معاملة
await updateCompany(companyId, {
  workingCapital: company.workingCapital + 1000
});
```

## 🐛 معالجة الأخطاء

```typescript
// جميع الدوال تتعامل مع الأخطاء
try {
  const result = await addCompany(user.id, companyData);
  toast.success('تمت الإضافة بنجاح');
} catch (error) {
  console.error('[v0] Error:', error);
  toast.error('حدث خطأ: ' + error.message);
}
```

## 🔍 Debugging Tips

### 1. في Console
```typescript
console.log('[v0] User:', user);
console.log('[v0] Companies:', companies);
console.log('[v0] Loading:', loading);
```

### 2. في Supabase Dashboard
- اذهب إلى SQL Editor
- قم بتنفيذ الاستعلامات مباشرة
- تحقق من البيانات

### 3. Network Tab
- افتح Developer Tools
- اذهب إلى Network
- شاهد requests إلى Supabase

## 📚 المراجع

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**آخر تحديث:** 2024
**الحالة:** ✅ منتج وجاهز
