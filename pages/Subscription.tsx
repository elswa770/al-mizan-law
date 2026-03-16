import React, { useState } from 'react';
import { Firm } from '../types';
import { CheckCircle, CreditCard, Shield, Zap, AlertTriangle, ArrowRight } from 'lucide-react';

interface SubscriptionProps {
  currentFirm: Firm;
}

const Subscription: React.FC<SubscriptionProps> = ({ currentFirm }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'basic',
      name: 'الباقة الأساسية',
      price: 500,
      features: ['إدارة 50 قضية', '3 مستخدمين', 'تخزين 5 جيجابايت', 'دعم فني عبر البريد'],
      recommended: false
    },
    {
      id: 'pro',
      name: 'الباقة الاحترافية',
      price: 1200,
      features: ['إدارة قضايا غير محدودة', '10 مستخدمين', 'تخزين 50 جيجابايت', 'دعم فني على مدار الساعة', 'تقارير متقدمة'],
      recommended: true
    },
    {
      id: 'enterprise',
      name: 'باقة الشركات',
      price: 2500,
      features: ['كل ميزات الاحترافية', 'مستخدمين غير محدودين', 'تخزين غير محدود', 'مدير حساب مخصص', 'تخصيص النظام'],
      recommended: false
    }
  ];

  const handleSubscribe = async (planId: string, price: number) => {
    setLoading(true);
    setSelectedPlan(planId);
    try {
      // Call our backend to initiate Paymob checkout
      const response = await fetch('/api/paymob/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: price,
          firmId: currentFirm.id,
          planId: planId,
          billingData: {
            firstName: currentFirm.name,
            lastName: 'Admin',
            email: 'admin@' + currentFirm.id + '.com',
            phone: '+201000000000'
          }
        }),
      });

      const data = await response.json();
      
      if (data.iframeUrl) {
        // Redirect to Paymob iframe
        window.location.href = data.iframeUrl;
      } else {
        throw new Error(data.error || 'Failed to get payment URL');
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      alert('حدث خطأ أثناء بدء عملية الدفع. يرجى التحقق من إعدادات بوابة الدفع.');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const isExpired = currentFirm.subscriptionStatus === 'inactive' || 
    (currentFirm.subscriptionEndDate && new Date(currentFirm.subscriptionEndDate) < new Date());

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">إدارة الاشتراك والباقات</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          قم بترقية باقتك للحصول على المزيد من الميزات وإدارة مكتبك بكفاءة أعلى.
        </p>
      </div>

      {/* Current Status Alert */}
      {isExpired ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-xl flex items-start gap-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-500 shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-1">اشتراكك منتهي</h3>
            <p className="text-red-600 dark:text-red-300">
              لقد انتهت فترة اشتراكك أو الفترة التجريبية. يرجى تجديد الاشتراك لتتمكن من الوصول إلى جميع ميزات النظام وإدارة قضاياك.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">حالة الاشتراك الحالي</p>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white uppercase">
                  {currentFirm.subscriptionPlan}
                </h3>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                  {currentFirm.subscriptionStatus === 'trial' ? 'فترة تجريبية' : 'نشط'}
                </span>
              </div>
              {currentFirm.subscriptionEndDate && (
                <p className="text-xs text-slate-500 mt-1">
                  ينتهي في: {new Date(currentFirm.subscriptionEndDate).toLocaleDateString('ar-EG')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border-2 transition-all hover:-translate-y-2 ${
              plan.recommended 
                ? 'border-indigo-500 shadow-indigo-100 dark:shadow-none' 
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Zap className="w-3 h-3" /> الأكثر شعبية
              </div>
            )}
            
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{plan.name}</h3>
              <div className="flex items-end justify-center gap-1">
                <span className="text-4xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                <span className="text-slate-500 dark:text-slate-400 font-bold mb-1">ج.م / شهرياً</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 text-sm font-bold">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id, plan.price)}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                plan.recommended
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white'
              } ${loading && selectedPlan === plan.id ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading && selectedPlan === plan.id ? (
                'جاري التحويل...'
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  {currentFirm.subscriptionPlan === plan.id ? 'تجديد الاشتراك' : 'اشترك الآن'}
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;
