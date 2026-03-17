import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, Clock, AlertTriangle, CreditCard, Upload, FileText, X, ChevronRight, Star, Zap, Users, Briefcase, Database, Phone, Camera, CloudUpload, Cloud, LogIn, ArrowUpDown, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { Firm, SubscriptionPlan, AppUser } from '../types';
import { googleDriveService } from '../src/services/googleDriveService';
import { SubscriptionService } from '../src/services/subscriptionService';
import { addDoc, collection, db, getDocs } from '../firebase';

interface SubscriptionProps {
  currentFirm: Firm;
  currentUser?: AppUser | null;
}

const Subscription: React.FC<SubscriptionProps> = ({ currentFirm, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<SubscriptionPlan | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string>('');
  const [trialStatus, setTrialStatus] = useState<{ isExpired: boolean; daysLeft: number; message: string } | null>(null);
  const [trialEligibility, setTrialEligibility] = useState<{ canStart: boolean; message: string } | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [useGoogleDrive, setUseGoogleDrive] = useState(true);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // Plan sorting state - Now uses admin-defined order only
  const [planSortBy, setPlanSortBy] = useState<'name' | 'price' | 'users' | 'cases' | 'clients'>('price');
  const [planSortOrder, setPlanSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sort plans function - Uses admin-defined order first, then user preference
  const sortPlans = (plansToSort: SubscriptionPlan[]) => {
    // First, sort by admin-defined sortOrder if available
    const adminSorted = [...plansToSort].sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      // Fallback to name if no sortOrder
      return a.name.localeCompare(b.name);
    });
    
    // If user wants to sort by other criteria, apply secondary sorting
    if (planSortBy !== 'name' || planSortOrder !== 'asc') {
      return adminSorted.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (planSortBy) {
          case 'name':
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case 'price':
            aValue = calculatePrice(a, billingCycle);
            bValue = calculatePrice(b, billingCycle);
            break;
          case 'users':
            aValue = a.maxUsers;
            bValue = b.maxUsers;
            break;
          case 'cases':
            aValue = a.maxCases;
            bValue = b.maxCases;
            break;
          case 'clients':
            aValue = a.maxClients;
            bValue = b.maxClients;
            break;
          default:
            aValue = calculatePrice(a, billingCycle);
            bValue = calculatePrice(b, billingCycle);
        }
        
        // Handle -1 (unlimited) values
        if (aValue === -1) aValue = Infinity;
        if (bValue === -1) bValue = Infinity;
        
        if (planSortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    }
    
    return adminSorted;
  };

  const handlePlanSort = (sortBy: 'name' | 'price' | 'users' | 'cases' | 'clients') => {
    if (planSortBy === sortBy) {
      setPlanSortOrder(planSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPlanSortBy(sortBy);
      setPlanSortOrder('asc');
    }
  };

  // Calculate price based on billing cycle
  const calculatePrice = (plan: SubscriptionPlan, cycle: 'monthly' | 'yearly') => {
    if (cycle === 'monthly') {
      return plan.price;
    } else {
      // Yearly: (monthly * 12) - 10% discount
      const yearlyPrice = plan.price * 12;
      const discount = yearlyPrice * 0.1;
      return yearlyPrice - discount;
    }
  };

  // Get display price text
  const getPriceDisplay = (plan: SubscriptionPlan) => {
    const monthlyPrice = calculatePrice(plan, 'monthly');
    const yearlyPrice = calculatePrice(plan, 'yearly');
    
    if (billingCycle === 'monthly') {
      return `${monthlyPrice} ${plan.currency}/شهرياً`;
    } else {
      return `${yearlyPrice} ${plan.currency}/سنوياً`;
    }
  };

  // Get savings text for yearly
  const getSavingsText = (plan: SubscriptionPlan) => {
    const monthlyPrice = plan.price;
    const yearlyPrice = calculatePrice(plan, 'yearly');
    const originalYearlyPrice = monthlyPrice * 12;
    const savings = originalYearlyPrice - yearlyPrice;
    return `توفير ${savings} ${plan.currency} سنوياً`;
  };

  // Check trial status on component mount
  useEffect(() => {
    const checkTrialStatus = async () => {
      if (currentFirm?.id) {
        try {
          const status = await SubscriptionService.checkTrialStatus(currentFirm.id);
          setTrialStatus(status);
          
          // Check trial eligibility
          const eligibility = await SubscriptionService.canStartTrial(currentFirm.id);
          setTrialEligibility(eligibility);
        } catch (error) {
          console.error('Error checking trial status:', error);
        }
      }
    };

    checkTrialStatus();
  }, [currentFirm?.id]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanForPayment || !paymentProof) return;

    setSubmittingPayment(true);
    try {
      let fileUrl = URL.createObjectURL(paymentProof);
      
      if (useGoogleDrive) {
        if (!googleDriveService.isSignedIn()) {
          try {
            await googleDriveService.signIn();
          } catch (err: any) {
            alert(err.message || 'فشل تسجيل الدخول إلى Google Drive');
            return;
          }
        }

        setIsUploadingToDrive(true);
        try {
          const folderName = `إثباتات التحويل - ${currentFirm.name}`;
          const response = await googleDriveService.uploadFile(paymentProof, folderName);
          fileUrl = response.webViewLink;
        } catch (err: any) {
          alert('فشل الرفع إلى Google Drive: ' + err.message);
          setIsUploadingToDrive(false);
          return;
        }
        setIsUploadingToDrive(false);
      }

      // Calculate final price based on billing cycle
      const finalPrice = calculatePrice(selectedPlanForPayment, billingCycle);

      // Create subscription request in Firestore
      await addDoc(collection(db, 'subscriptionRequests'), {
        firmId: currentFirm.id,
        firmName: currentFirm.name,
        planId: selectedPlanForPayment.id,
        planName: selectedPlanForPayment.name,
        price: finalPrice,
        originalPrice: selectedPlanForPayment.price,
        currency: selectedPlanForPayment.currency,
        billingCycle: billingCycle,
        paymentProof: fileUrl,
        paymentProofType: useGoogleDrive ? 'google-drive' : 'local',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        contactInfo: {
          email: 'admin@' + currentFirm.id + '.com',
          phone: '+201000000000'
        }
      });

      alert('تم إرسال طلب الاشتراك بنجاح! سيقوم السوبر أدمن بمراجعة الطلب وتجديد اشتراكك بعد تأكيد التحويل.');
      setShowPaymentModal(false);
      setSelectedPlanForPayment(null);
      setPaymentProof(null);
      setPaymentProofUrl('');
    } catch (error) {
      console.error('Error submitting subscription request:', error);
      alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Fetch plans from Firestore
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansSnapshot = await getDocs(collection(db, 'subscriptionPlans'));
        const fetchedPlans = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
        setPlans(fetchedPlans);
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Fallback to default plans if Firestore fails
        setPlans([
          {
            id: 'basic',
            name: 'الباقة الأساسية',
            price: 500,
            currency: 'EGP',
            billingCycle: 'monthly',
            features: ['إدارة 50 قضية', '3 مستخدمين', 'تخزين 5 جيجابايت', 'دعم فني عبر البريد'],
            maxUsers: 3,
            maxCases: 50,
            maxClients: 100,
            maxStorageGB: 5,
            isActive: true
          },
          {
            id: 'pro',
            name: 'الباقة الاحترافية',
            price: 1200,
            currency: 'EGP',
            billingCycle: 'monthly',
            features: ['إدارة قضايا غير محدودة', '10 مستخدمين', 'تخزين 50 جيجابايت', 'دعم فني على مدار الساعة', 'تقارير متقدمة'],
            maxUsers: 10,
            maxCases: 999999,
            maxClients: 500,
            maxStorageGB: 50,
            isActive: true
          },
          {
            id: 'enterprise',
            name: 'باقة الشركات',
            price: 2500,
            currency: 'EGP',
            billingCycle: 'monthly',
            features: ['كل ميزات الاحترافية', 'مستخدمين غير محدودين', 'تخزين غير محدود', 'مدير حساب مخصص', 'تخصيص النظام'],
            maxUsers: 999999,
            maxCases: 999999,
            maxClients: 999999,
            maxStorageGB: 999999,
            isActive: true
          }
        ]);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // console.log('Current plans in Subscription page:', plans);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setSelectedPlanForPayment(plan);
    setShowPaymentModal(true);
  };

  // Check if trial plan should be shown
  const shouldShowTrialPlan = (): boolean => {
    // Check if user is super admin - always show trial for testing
    if (currentUser?.email === 'elswa770@gmail.com') {
      return true;
    }
    
    // Don't show trial plan if user has already used trial (from eligibility check)
    if (trialEligibility && !trialEligibility.canStart) {
      return false;
    }
    
    // Check if trial has expired by date - THIS IS THE PRIMARY CHECK
    if (currentFirm.trialEndDate) {
      const trialEnd = new Date(currentFirm.trialEndDate);
      const now = new Date();
      
      if (trialEnd < now) {
        return false;
      }
    }
    
    // If trial is still active by date, show it regardless of subscriptionStatus
    if (currentFirm.trialEndDate) {
      const trialEnd = new Date(currentFirm.trialEndDate);
      const now = new Date();
      if (trialEnd >= now) {
        return true;
      }
    }
    
    // Don't show trial if subscription is inactive and user had a trial plan AND trial is expired
    if (currentFirm.subscriptionStatus === 'inactive' && 
        currentFirm.subscriptionPlan === 'trial' && 
        currentFirm.trialEndDate) {
      const trialEnd = new Date(currentFirm.trialEndDate);
      const now = new Date();
      if (trialEnd < now) {
        return false;
      }
    }
    
    // Don't show trial plan if user has inactive subscription and has used trial AND trial is expired
    if (currentFirm.subscriptionStatus === 'inactive' && 
        (currentFirm.hasUsedTrial || currentFirm.trialEndDate)) {
      if (currentFirm.trialEndDate) {
        const trialEnd = new Date(currentFirm.trialEndDate);
        const now = new Date();
        if (trialEnd < now) {
          return false;
        }
      }
    }
    
    // Don't show trial plan if user has used trial before and is not currently in trial AND trial is expired
    if (currentFirm.hasUsedTrial && currentFirm.subscriptionStatus !== 'trial') {
      if (currentFirm.trialEndDate) {
        const trialEnd = new Date(currentFirm.trialEndDate);
        const now = new Date();
        if (trialEnd < now) {
          return false;
        }
      }
    }
    
    // Don't show trial plan if user has trialEndDate (indicates trial was used) and not currently in trial AND trial is expired
    if (currentFirm.trialEndDate && currentFirm.subscriptionStatus !== 'trial') {
      const trialEnd = new Date(currentFirm.trialEndDate);
      const now = new Date();
      if (trialEnd < now) {
        return false;
      }
    }
    
    // If user has trialEndDate but no subscriptionStatus, assume trial is expired
    if (currentFirm.trialEndDate && !currentFirm.subscriptionStatus) {
      const trialEnd = new Date(currentFirm.trialEndDate);
      const now = new Date();
      if (trialEnd < now) {
        return false;
      }
    }
    
    return true;
  };

  // Filter plans based on user eligibility
  const getVisiblePlans = (): SubscriptionPlan[] => {
    let allPlans = [...plans];
    
    // Always remove trial plan from Firestore plans to avoid duplication
    allPlans = allPlans.filter(plan => plan.id !== 'trial');
    
    // Add trial plan if eligible
    if (shouldShowTrialPlan()) {
      const trialPlan: SubscriptionPlan = {
        id: 'trial',
        name: 'باقة تجريبية',
        price: 0,
        currency: 'EGP',
        billingCycle: 'monthly',
        maxUsers: 1,
        maxCases: 2,
        maxClients: 1,
        maxStorageGB: 1,
        features: [
          'تجربة مجانية لمدة أسبوع',
          'قضيتين كحد أقصى',
          'مستخدم واحد فقط',
          'موكل واحد فقط',
          '1 جيجابايت تخزين'
        ],
        isActive: true
      };
      allPlans.unshift(trialPlan);
    }
    
    return allPlans;
  };

  const isExpired = currentFirm.subscriptionStatus === 'inactive' || 
    (currentFirm.subscriptionEndDate && new Date(currentFirm.subscriptionEndDate) < new Date());

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      {/* Trial Status Alert */}
      {(currentFirm.subscriptionStatus === 'trial' || 
        (currentFirm.trialEndDate && new Date(currentFirm.trialEndDate) >= new Date())) && 
        trialStatus && (
        <div className={`p-6 rounded-xl border ${trialStatus.isExpired ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'}`}>
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${trialStatus.isExpired ? 'bg-red-100 dark:bg-red-800' : 'bg-amber-100 dark:bg-amber-800'}`}>
              <Clock className={`w-6 h-6 ${trialStatus.isExpired ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-2 ${trialStatus.isExpired ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200'}`}>
                {trialStatus.isExpired ? 'انتهت فترة التجربة' : 'باقة تجريبية نشطة'}
              </h3>
              <p className={`text-sm ${trialStatus.isExpired ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-300'}`}>
                {trialStatus.message}
              </p>
              {!trialStatus.isExpired && (
                <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">تفاصيل الباقة التجريبية:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-slate-600 dark:text-slate-400">قضيتان كحد أقصى</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-slate-600 dark:text-slate-400">مستخدم واحد فقط</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-slate-600 dark:text-slate-400">موكل واحد فقط</span>
                    </div>
                  </div>
                </div>
              )}
              {trialStatus.isExpired && trialEligibility && !trialEligibility.canStart && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">⚠️ انتبه:</h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {trialEligibility.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trial Used Alert - For users who had trial before */}
      {currentFirm.subscriptionStatus !== 'trial' && trialEligibility && !trialEligibility.canStart && (
        <div className="p-6 rounded-xl border bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-800">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 text-amber-800 dark:text-amber-200">الباقة التجريبية مستخدمة</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {trialEligibility.message}
              </p>
              <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">الخطوات التالية:</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• اختر إحدى الباقات المدفوعة المناسبة لك</li>
                  <li>• استمتع بجميع الميزات المتقدمة</li>
                  <li>• احصل على دعم فني مخصص</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">إدارة الاشتراك والباقات</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          قم بترقية باقتك للحصول على المزيد من الميزات وإدارة مكتبك بكفاءة أعلى.
        </p>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">اختر دورة الفوترة</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              اختر بين الدفع الشهري أو السنوي مع خصم 10% على الاشتراك السنوي
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-lg font-bold transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              سنوي
              {billingCycle === 'yearly' && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  خصم 10%
                </span>
              )}
            </button>
          </div>
        </div>
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
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                  {getVisiblePlans().find(p => p.id === currentFirm.subscriptionPlan)?.name || currentFirm.subscriptionPlan}
                  {getVisiblePlans().find(p => p.id === currentFirm.subscriptionPlan)?.billingCycle && (
                    <span className="text-lg font-normal text-slate-600 dark:text-slate-400">
                      {' / '}{getVisiblePlans().find(p => p.id === currentFirm.subscriptionPlan)?.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}
                    </span>
                  )}
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
      
      {/* Sorting Controls */}
      <div className="flex items-center justify-center gap-4 mb-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">ترتيب الباقات حسب:</span>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'name', label: 'الاسم' },
            { key: 'price', label: 'السعر' },
            { key: 'users', label: 'المستخدمين' },
            { key: 'cases', label: 'القضايا' },
            { key: 'clients', label: 'العملاء' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handlePlanSort(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                planSortBy === key
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 shadow-sm'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
              }`}
            >
              {label}
              {planSortBy === key && (
                planSortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {sortPlans(getVisiblePlans()).map((plan) => (
          <div
            key={plan.id}
            className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
              plan.id === 'trial'
                ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/20 transform'
                : plan.id === 'pro'
                ? 'border-2 border-indigo-500 ring-4 ring-indigo-500/20 transform'
                : 'border border-slate-200 dark:border-slate-700 hover:border-indigo-300'
            }`}
          >
            {/* Special Badges */}
            {plan.id === 'trial' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  🆓 تجربة مجانية
                </div>
              </div>
            )}
            {plan.id === 'pro' && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ الأكثر شيوعاً
                </div>
              </div>
            )}

            <div className="p-8">
              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{plan.name}</h3>
                
                {/* Price Display */}
                <div className="mb-6">
                  <div className="relative inline-block">
                    {plan.id === 'trial' ? (
                      <div className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                        مجاناً
                      </div>
                    ) : (
                      <div className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {getPriceDisplay(plan)}
                      </div>
                    )}
                    {billingCycle === 'yearly' && plan.id !== 'trial' && (
                      <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full font-bold animate-pulse">
                        وفر 10%
                      </div>
                    )}
                  </div>
                  
                  {billingCycle === 'yearly' && plan.id !== 'trial' && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <div className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold space-y-1">
                        <div className="flex justify-between">
                          <span>السعر الأصلي:</span>
                          <span className="line-through">{plan.price * 12} {plan.currency}/سنوياً</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الخصم:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{plan.price * 12 * 0.1} {plan.currency}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-700 dark:text-emerald-300">
                          <span>توفيرك:</span>
                          <span>{getSavingsText(plan)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {plan.id === 'trial' && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <div className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold space-y-1">
                        <div className="flex justify-between">
                          <span>المدة:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">7 أيام</span>
                        </div>
                        <div className="flex justify-between">
                          <span>الحد الأقصى:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">2 قضية</span>
                        </div>
                        <div className="flex justify-between">
                          <span>بعد التجربة:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">اختر باقة مدفوعة</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Plan Tags */}
                <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                  {plan.id === 'trial' ? (
                    <div className="bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-2 rounded-full font-semibold border border-emerald-200 dark:border-emerald-800">
                      🆓 تجريبية
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-3 py-2 rounded-full font-semibold border border-indigo-200 dark:border-indigo-800">
                      {plan.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}
                    </div>
                  )}
                  {plan.maxUsers && (
                    <span className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 text-xs px-3 py-2 rounded-full font-semibold border border-blue-200 dark:border-blue-800">
                      👥 {plan.maxUsers === -1 ? 'غير محدود' : `حتى ${plan.maxUsers} مستخدم`}
                    </span>
                  )}
                  {plan.maxCases && (
                    <span className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-xs px-3 py-2 rounded-full font-semibold border border-purple-200 dark:border-purple-800">
                      📁 {plan.maxCases === -1 ? 'غير محدود' : `حتى ${plan.maxCases} قضية`}
                    </span>
                  )}
                  {plan.maxClients && (
                    <span className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 text-xs px-3 py-2 rounded-full font-semibold border border-green-200 dark:border-green-800">
                      👤 {plan.maxClients === -1 ? 'غير محدود' : `حتى ${plan.maxClients} موكل`}
                    </span>
                  )}
                  {plan.maxStorageGB && (
                    <span className="bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 text-xs px-3 py-2 rounded-full font-semibold border border-amber-200 dark:border-amber-800">
                      💾 {plan.maxStorageGB === -1 ? 'غير محدود' : `حتى ${plan.maxStorageGB} جيجابايت`}
                    </span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h4 className="text-center font-bold text-slate-700 dark:text-slate-300 mb-4">المميزات</h4>
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3 group">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <span className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed group-hover:text-slate-800 dark:group-hover:text-slate-100 transition-colors">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <div className="space-y-3">
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 text-lg ${
                    plan.id === 'trial'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      : plan.id === 'pro'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-500 text-slate-800 dark:text-white border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-400'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <span>{plan.id === 'trial' ? 'ابدأ التجربة' : 'اشترك الآن'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                
                {plan.id === 'pro' && (
                  <p className="text-center text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    ⚡ الخيار الأفضل للشركات النامية
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlanForPayment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg">تفاصيل الدفع - {selectedPlanForPayment.name}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-red-500">
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Payment Instructions */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Phone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h4 className="font-bold text-amber-800 dark:text-amber-200">رقم التحويل</h4>
                </div>
                <p className="text-2xl font-bold text-center text-amber-900 dark:text-amber-100 mb-2">01090609918</p>
                <p className="text-sm text-amber-700 dark:text-amber-300 text-center">
                  قم بتحويل المبلغ إلى الرقم أعلاه
                </p>
              </div>

              {/* Price Details */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                <h4 className="font-bold text-slate-800 dark:text-white mb-3">تفاصيل السعر</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">الباقة:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{selectedPlanForPayment.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">دورة الفوترة:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {billingCycle === 'monthly' ? 'شهري' : 'سنوي'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">السعر الأصلي:</span>
                    <span className="text-slate-800 dark:text-white">
                      {selectedPlanForPayment.price} {selectedPlanForPayment.currency}
                      {billingCycle === 'yearly' ? '/شهري' : '/شهري'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-300">السعر السنوي:</span>
                        <span className="text-slate-800 dark:text-white">
                          {selectedPlanForPayment.price * 12} {selectedPlanForPayment.currency}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>الخصم (10%):</span>
                        <span className="font-bold">-{selectedPlanForPayment.price * 12 * 0.1} {selectedPlanForPayment.currency}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    <span>المبلغ المطلوب:</span>
                    <span>{calculatePrice(selectedPlanForPayment, billingCycle)} {selectedPlanForPayment.currency}</span>
                  </div>
                </div>
              </div>

              {/* Payment Proof Upload */}
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    إثبات التحويل
                  </label>
                  
                  {/* File Input */}
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6">
                    <div className="text-center space-y-4">
                      <Upload className="w-12 h-12 mx-auto text-slate-400" />
                      <div>
                        <label className="px-4 py-2 bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700 cursor-pointer flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPaymentProof(file);
                              }
                            }}
                            className="hidden"
                          />
                          اختر ملف إثبات التحويل
                        </label>
                        <p className="text-xs text-slate-500">
                          يجب أن يكون صورة واضحة لإثبات التحويل
                        </p>
                      </div>
                    </div>
                    
                    {/* File Preview */}
                    {paymentProof && (
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-indigo-600" />
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{paymentProof.name}</p>
                            <p className="text-xs text-slate-500">
                              {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Google Drive Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-white">رفع إلى Google Drive</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">سيتم حفظ الملف في سحابة جوجل</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseGoogleDrive(!useGoogleDrive)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${useGoogleDrive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useGoogleDrive ? 'right-1' : 'right-7'}`}></div>
                  </button>
                </div>

                {useGoogleDrive && !googleDriveService.isSignedIn() && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await googleDriveService.signIn();
                      } catch (err: any) {
                        alert(err.message || 'فشل تسجيل الدخول إلى Google Drive');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    تسجيل الدخول إلى Google Drive
                  </button>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-2 border rounded-lg font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment || !paymentProof || (useGoogleDrive && !googleDriveService.isSignedIn()) || isUploadingToDrive}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingPayment || isUploadingToDrive ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        {isUploadingToDrive ? 'جاري الرفع إلى Google Drive...' : 'جاري الإرسال...'}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        إرسال الطلب
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscription;
