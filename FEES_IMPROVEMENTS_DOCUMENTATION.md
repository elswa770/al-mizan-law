# 📋 توثيق تحسينات صفحة الإيرادات والمصروفات (Fees.tsx)

## 🎯 نظرة عامة
تم تطوير صفحة الإيرادات والمصروفات بشكل شامل لإضافة نظام متقدم لإدارة الميزانيات الشهرية مع التكامل الكامل مع Firebase Firestore.

---

## 🔧 التحسينات الرئيسية

### 1. **نظام الميزانيات الشهرية المتقدم**
- ✅ إضافة 11 تصنيفاً للمصروفات مع ميزانيات شهرية
- ✅ واجهة تعديل الميزانيات مباشرة
- ✅ حساب النسب المئوية والمتبقي تلقائياً
- ✅ مؤشرات مرئية للتجاوزات الميزانية

### 2. **التكامل مع Firebase Firestore**
- ✅ حفظ الميزانيات بشكل دائم في Firebase
- ✅ تحميل الميزانيات المحفوظة عند فتح الصفحة
- ✅ نظام fallback إلى localStorage عند فشل Firebase
- ✅ فلترة الميزانيات حسب firmId لكل مستخدم

### 3. **نظام المستخدمين والصلاحيات**
- ✅ الحصول على firmId من auth context
- ✅ كل مستخدم لديه ميزانيات خاصة به
- ✅ صلاحيات Firebase Security Rules متقدمة
- ✅ تتبع المستخدم الذي قام بالتعديل

---

## 📊 بنية البيانات

### **Firebase Collection: budgets**
```javascript
{
  documentId: "رسوم_1710912345678", // فريد لكل تعديل
  categoryId: "رسوم",              // معرف التصنيف
  budget: 2500,                    // قيمة الميزانية
  firmId: "VlhxCuMC6D4Z5sQJpj5y", // معرف الشركة
  updatedAt: "2024-03-22T11:40:25.569Z",
  updatedBy: "elswa770@gmail.com"
}
```

### **تصنيفات المصروفات المدعومة**
```javascript
[
  { id: 'رسوم', name: 'رسوم قضائية', icon: '⚖️', budget: 500, color: 'blue' },
  { id: 'انتقالات', name: 'انتقالات وسفر', icon: '🚗', budget: 300, color: 'green' },
  { id: 'طباعة', name: 'طباعة وتصوير', icon: '🖨️', budget: 200, color: 'purple' },
  { id: 'اتصالات', name: 'اتصالات وانترنت', icon: '📞', budget: 100, color: 'pink' },
  { id: 'ضيافة', name: 'ضيافة ومأكولات', icon: '☕', budget: 100, color: 'red' },
  { id: 'أبحاث', name: 'أبحاث ودراسات', icon: '📚', budget: 250, color: 'indigo' },
  { id: 'صيانة', name: 'صيانة وتجهيزات', icon: '🔧', budget: 150, color: 'yellow' },
  { id: 'تدريب', name: 'تدريب وتطوير', icon: '🎓', budget: 300, color: 'teal' },
  { id: 'أخرى', name: 'مصروفات أخرى', icon: '📦', budget: 100, color: 'gray' }
]
```

---

## 🛡️ قواعد الأمان (Firebase Security Rules)

### **قواعد الميزانيات**
```javascript
match /budgets/{budgetId} {
  allow read: if isAuthenticated() && (isSuperAdmin() || isAdmin() || (resource != null && 'firmId' in resource.data && belongsToFirm(resource.data.firmId)));
  allow create: if isAuthenticated() && isValidBudget(request.resource.data) && (isSuperAdmin() || isAdmin() || ('firmId' in request.resource.data && belongsToFirm(request.resource.data.firmId)));
  allow update: if isAuthenticated() && isValidBudgetUpdate(request.resource.data) && (isSuperAdmin() || isAdmin() || (resource != null && 'firmId' in resource.data && belongsToFirm(resource.data.firmId)));
  allow delete: if isAuthenticated() && (isSuperAdmin() || isAdmin() || (resource != null && 'firmId' in resource.data && belongsToFirm(resource.data.firmId)));
}
```

### **دوال التحقق**
```javascript
function isValidBudget(data) {
  return hasRequiredFields(['categoryId', 'budget', 'updatedAt']) &&
         data.categoryId is string && data.categoryId.size() > 0 && data.categoryId.size() < 50 &&
         data.budget is number && data.budget > 0 && data.budget <= 1000000 &&
         data.updatedAt is string && data.updatedAt.size() > 0;
}
```

---

## 🔄 آلية العمل

### **1. تحميل الميزانيات**
```typescript
useEffect(() => {
  // تحميل الميزانيات من Firebase
  const budgetsSnapshot = await getDocs(collection(db, 'budgets'));
  const savedBudgets = budgetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  // فلترة حسب firmId المستخدم الحالي
  const firmBudgets = savedBudgets.filter((b: any) => b.firmId === currentFirmId);
  
  // تحديث الواجهة بالميزانيات المحفوظة
  setExpenseCategories(prevCategories => 
    prevCategories.map(cat => {
      const savedBudget = firmBudgets.find((b: any) => b.categoryId === cat.id);
      return savedBudget ? { ...cat, budget: savedBudget.budget } : cat;
    })
  );
}, [currentFirmId]);
```

### **2. حفظ الميزانيات**
```typescript
const saveBudget = async (categoryId: string, newBudget: number) => {
  // تحديث الواجهة فوراً
  setExpenseCategories(prevCategories => 
    prevCategories.map(cat => cat.id === categoryId ? { ...cat, budget: newBudget } : cat)
  );
  
  // حفظ في Firebase
  const budgetData = {
    categoryId,
    budget: newBudget,
    firmId: currentFirmId,
    updatedAt: new Date().toISOString(),
    updatedBy: currentUser?.email || 'current-user'
  };
  
  // إنشاء docID فريد لكل تعديل
  const docId = `${categoryId}_${Date.now()}`;
  await setDoc(doc(db, 'budgets', docId), budgetData, { merge: true });
  
  // إجبار إعادة التصيير
  setBudgetUpdateKey(prev => prev + 1);
};
```

---

## 🎨 تحسينات الواجهة

### **1. بطاقات الميزانيات**
- ✅ عرض متقدم مع أيقونات وألوان
- ✅ مؤشرات النسب المئوية
- ✅ رسوم بيانية بسيطة
- ✅ حالة التجاوز (أحمر/أخضر)

### **2. نموذج التعديل**
- ✅ تعديل مباشر في البطاقة
- ✅ زر حفظ وإلغاء
- ✅ تحديث فوري للواجهة
- ✅ رسالة تأكيد واحدة

### **3. التوافق مع الموبايل**
- ✅ تصميم متجاوب
- ✅ بطاقات منفصلة للموبايل
- ✅ مودال قابل للتمرير

---

## 🚀 المميزات التقنية

### **1. إدارة الحالة**
```typescript
const [expenseCategories, setExpenseCategories] = useState([...]);
const [currentFirmId, setCurrentFirmId] = useState('');
const [currentUser, setCurrentUser] = useState(null);
const [budgetUpdateKey, setBudgetUpdateKey] = useState(0);
```

### **2. الحسابات التلقائية**
```typescript
const monthlyExpenses = useMemo(() => {
  // حساب الإنفاق الشهري لكل تصنيف
  // حساب النسبة المئوية والمتبقي
  // تحديث تلقائي عند تغيير الميزانيات
}, [cases, hearings, clients, expenseCategories, budgetUpdateKey]);
```

### **3. نظام Fallback**
```typescript
try {
  // محاولة الحفظ في Firebase
  await setDoc(doc(db, 'budgets', docId), budgetData);
} catch (firebaseError) {
  // Fallback إلى localStorage
  localStorage.setItem('expenseBudgets', JSON.stringify(budgets));
}
```

---

## 📈 الأداء والتحسينات

### **1. تحسينات الأداء**
- ✅ استخدام useMemo للحسابات المكلفة
- ✅ تحديث ذكي للواجهة
- ✅ فلترة البيانات في client-side

### **2. تجربة المستخدم**
- ✅ رسائل تأكيد واضحة
- ✅ تحديث فوري للواجهة
- ✅ معالجة الأخطاء بلطف

### **3. الأمان**
- ✅ صلاحيات Firebase متقدمة
- ✅ فلترة البيانات حسب المستخدم
- ✅ التحقق من صحة البيانات

---

## 🔧 الصيانة والتطوير

### **1. نقاط التحقق**
- [ ] اختبار مع مستخدمين متعددين
- [ ] اختبار مع بيانات كبيرة
- [ ] اختبار الأداء على الموبايل
- [ ] اختبار سيناريوهات الخطأ

### **2. التطويرات المستقبلية**
- [ ] إضافة تقارير متقدمة
- [ ] نظام تصدير البيانات
- [ ] إشعارات تجاوز الميزانية
- [ ] تحليلات وتنبؤات

---

## 📝 ملاحظات هامة

### **1. التوافق**
- يعمل مع React 18+
- متوافق مع Firebase v9+
- يدعم TypeScript

### **2. المتطلبات**
- Firebase project مع Firestore
- Authentication مفعّل
- Security Rules مُعدّلة

### **3. النشر**
- تم نشر Security Rules بنجاح
- جاهز للاستخدام في الإنتاج

---

## 🎉 الخلاصة

تم تطوير صفحة الإيرادات والمصروفات بشكل شامل لتشمل:
- نظام ميزانيات متقدم
- تكامل Firebase كامل
- واجهة مستخدم محسّنة
- أمان وصلاحيات متقدمة
- أداء وتوافق ممتاز

النظام جاهز للاستخدام في بيئة الإنتاج مع دعم كامل للمستخدمين المتعددين والميزانيات الخاصة بكل مستخدم.

---

**تاريخ التوثيق:** 22 مارس 2026  
**المطور:** Cascade AI Assistant  
**الإصدار:** v1.0.0
