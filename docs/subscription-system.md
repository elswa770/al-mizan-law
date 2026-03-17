# نظام الاشتراكات في مكتب العدل للمحاماة

## نظرة عامة

يحتوي المشروع على نظام اشتراكات متكامل يدير الوصول إلى ميزات التطبيق بناءً على خطة الاشتراك لكل مكتب محاماة. النظام يدعم باقات تجريبية ومدفوعة مع حدود مختلفة لكل باقة.

---

## المكونات الرئيسية

### 1. **SubscriptionService.ts**
الموقع: `src/services/subscriptionService.ts`

الوظيفة: الخدمة الرئيسية لإدارة جميع عمليات الاشتراك.

#### الدوال الرئيسية:

```typescript
// إنشاء اشتراك تجريبي جديد
static async createTrialSubscription(firmId: string): Promise<void>

// التحقق من حالة التجربة
static async checkTrialStatus(firmId: string): Promise<{ isExpired: boolean; daysLeft: number; message: string }>

// التحقق من إمكانية إضافة قضية
static async canAddCase(firmId: string, userEmail?: string): Promise<{ canAdd: boolean; message: string; current: number; max: number }>

// التحقق من إمكانية إضافة مستخدم
static async canAddUser(firmId: string, userEmail?: string): Promise<{ canAdd: boolean; message: string; current: number; max: number }>

// التحقق من إمكانية إضافة موكل
static async canAddClient(firmId: string, userEmail?: string): Promise<{ canAdd: boolean; message: string; current: number; max: number }>

// الحصول على تفاصيل خطة الاشتراك
static async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null>

// الحصول على حالة الاشتراك الكاملة
static async getSubscriptionStatus(firmId: string): Promise<{ planName: string; status: string; daysLeft: number; limits: any }>
```

---

## أنواع الاشتراكات

### 1. **الباقة التجريبية (Trial)**
- **المدة:** 7 أيام
- **الحدود:**
  - القضايا: 2 قضية كحد أقصى
  - المستخدمون: 1 مستخدم فقط
  - العملاء: 1 موكل فقط
  - التخزين: 1 جيجابايت

### 2. **الباقات المدفوعة**
يتم تخزين الباقات المدفوعة في مجموعة `subscriptionPlans` في Firestore وتحتوي على:
- اسم الباقة
- السعر والعملة
- دورة الفوترة (شهري/سنوي)
- الحدود (قضايا، مستخدمين، عملاء، تخزين)
- الميزات المتاحة

---

## قواعد السوبر أدمن

### المستخدم المميز:
- **البريد الإلكتروني:** `elswa770@gmail.com`

### المميزات:
- ✅ **وصول غير محدود** لجميع الميزات
- ✅ **لا يخضع لحدود الاشتراك**
- ✅ **لا تظهر له رسائل التحذير**
- ✅ **لا يتم توجيهه لصفحة الاشتراك**

### التحقق من السوبر أدمن:
```typescript
const isSuperAdmin = userEmail?.toLowerCase() === 'elswa770@gmail.com';
```

---

## التحقق من الاشتراك

### 1. **في App.tsx**
```typescript
// التحقق من انتهاء الاشتراك
const isSubscriptionExpired = currentFirm && !isSuperAdmin && (
  currentFirm.subscriptionStatus === 'inactive' || 
  (currentFirm.subscriptionEndDate && new Date(currentFirm.subscriptionEndDate) < new Date())
);

// التوجيه لصفحة الاشتراك إذا انتهت الصلاحية
if (isSubscriptionExpired && currentPage !== 'subscription') {
  setCurrentPage('subscription');
}
```

### 2. **في Layout.tsx**
```typescript
// عرض رسالة التحذير للمستخدمين التجريبيين
{trialStatus.isTrial && !trialStatus.isExpired && (
  <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg animate-pulse">
    <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
    <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
      باقة تجريبية: {trialStatus.daysLeft} أيام متبقية
    </span>
  </div>
)}
```

---

## حدود الاشتراك

### التحقق قبل الإضافة:

#### 1. **إضافة قضية (Cases.tsx)**
```typescript
const caseCheck = await SubscriptionService.canAddCase(currentUser.firmId, currentUser.email);
if (!caseCheck.canAdd) {
  alert(caseCheck.message);
  return;
}
```

#### 2. **إضافة موكل (Clients.tsx)**
```typescript
const clientCheck = await SubscriptionService.canAddClient(currentUser.firmId, currentUser.email);
if (!clientCheck.canAdd) {
  alert(clientCheck.message);
  return;
}
```

#### 3. **إضافة مستخدم (Settings.tsx)**
```typescript
const userCheck = await SubscriptionService.canAddUser(currentUser.firmId, currentUser.email);
if (!userCheck.canAdd) {
  alert(userCheck.message);
  return;
}
```

---

## بنية البيانات

### 1. **مجموعة firms**
```typescript
interface Firm {
  id: string;
  name: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  subscriptionPlan: string;
  subscriptionEndDate?: string;
  trialStartDate?: string;
  trialEndDate?: string;
  createdAt: string;
}
```

### 2. **مجموعة subscriptionPlans**
```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  maxUsers: number;
  maxCases: number;
  maxClients: number;
  maxStorageGB: number;
  features: string[];
  isActive: boolean;
}
```

---

## رسائل المستخدم

### 1. **رسائل التحذير**
- `"تبقى X أيام على انتهاء فترة التجربة المجانية"`
- `"انتهت فترة التجربة المجانية. يرجى الاشتراك في إحدى الباقات للاستمرار."`

### 2. **رسائل الحدود**
- `"لقد وصلت إلى الحد الأقصى للقضايا في الباقة التجريبية (2/2)"`
- `"لقد وصلت إلى الحد الأقصى للمستخدمين. يرجى ترقية اشتراكك."`
- `"غير محدود (مدير النظام)"` - للسوبر أدمن

---

## الأمان والخصوصية

### 1. **حماية البيانات**
- تمت إزالة جميع رسائل الكونسول الحساسة
- لا يتم عرض معلومات المستخدمين أو المكاتب في السجلات

### 2. **التحقق من الهوية**
- التحقق من البريد الإلكتروني للسوبر أدمن
- التحقق من صلاحيات المستخدم قبل كل عملية

---

## التكامل مع واجهة المستخدم

### 1. **صفحة الاشتراك (Subscription.tsx)**
- عرض الباقات المتاحة
- معالجة عملية الترقية
- عرض حالة الاشتراك الحالية

### 2. **لوحة التحكم (Dashboard.tsx)**
- عرض حدود الاستخدام
- إشعارات الاقتراب من الحدود
- روابط الترقية

### 3. **الإعدادات (Settings.tsx)**
- إدارة المستخدمين مع مراعاة الحدود
- عرض حالة الاشتراك

---

## الصيانة والتحديثات

### 1. **مراقبة الاشتراكات**
- التحقق اليومي من انتهاء التجارب
- إرسال إشعارات قبل انتهاء الاشتراك

### 2. **تحديث الباقات**
- يمكن إضافة باقات جديدة عبر Firestore
- تعديل الحدود والميزات ديناميكياً

### 3. **النسخ الاحتياطي**
- نسخ احتياطي لبيانات الاشتراك
- سجلات التغييرات والتعديلات

---

## استكشاف الأخطاء

### 1. **مشاكل شائعة**
- **المستخدم لا يظهر له التحذير التجريبي:** تحقق من `subscriptionStatus` في Firestore
- **السوبر أدمن يخضع لحدود:** تحقق من البريد الإلكتروني في الكود
- **رسالة "لم يتم العثور على خطة الاشتراك":** تحقق من وجود الباقة في Firestore

### 2. **أدوات التشخيص**
- رسائل الكونسول للتحقق من الحالة
- Firestore Console لفحص البيانات
- Firebase Functions Logs للمراقبة

---

## خارطة التطوير المستقبلية

### 1. **ميزات مقترحة**
- نظام نقاط وكوبونات
- باقات مخصصة حسب حجم المكتب
- تكامل مع بوابات الدفع
- تقارير واستخدامات مفصلة

### 2. **تحسينات**
-缓存 لبيانات الاشتراك
- تحديثات فورية للحالة
- دعم متعدد العملات

---

## ملخص

نظام الاشتراكات الحالي يوفر:
- ✅ إدارة شاملة للاشتراكات
- ✅ حدود مرنة وقابلة للتخصيص
- ✅ دعم الباقات التجريبية والمدفوعة
- ✅ حماية للسوبر أدمن
- ✅ واجهة مستخدم سلسة
- ✅ أمان وخصوصية

النظام جاهز للتوسع والتطوير مع نمو المشروع.
