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
  
  // Helper function to check if a plan is unlimited
const isUnlimited = (value: number | string | undefined) => {
  return value === -1 || value === 'unlimited' || value === null || value === undefined;
};

// Helper function to display value or "غير محدود"
const displayValue = (value: number | string | undefined, defaultValue: number) => {
  return isUnlimited(value) ? 'غير محدود' : (value || defaultValue).toString();
};
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
        // Fallback to empty plans if Firestore fails
        setPlans([]);
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
        maxLawyers:1,
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
      {/* Current Subscription Status */}
      {currentFirm.subscriptionStatus === 'active' && currentFirm.subscriptionPlan !== 'trial' && (
        <div className="p-6 rounded-xl border bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-800">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 text-emerald-800 dark:text-emerald-200">
                اشتراك نشط
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-4">
                بيانات اشتراكك الحالي مع جميع التفاصيل والمميزات
              </p>
              
              <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-4">تفاصيل الاشتراك:</h4>
                
                {/* Find current plan details */}
                {(() => {
                  console.log('Debug - Current firm subscription plan:', currentFirm.subscriptionPlan);
                  console.log('Debug - Available plans:', plans);
                  console.log('Debug - Current firm data:', currentFirm);
                  
                  // Try multiple ways to find the plan
                  let currentPlan = plans.find(p => p.id === currentFirm.subscriptionPlan);
                  
                  // If not found by ID, try by name
                  if (!currentPlan && currentFirm.subscriptionPlan) {
                    currentPlan = plans.find(p => p.name === currentFirm.subscriptionPlan);
                  }
                  
                  // If still not found, show basic info with available data
                  if (!currentPlan) {
                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-slate-500 dark:text-slate-400">الباقة:</span>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {currentFirm.subscriptionPlan}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-slate-500 dark:text-slate-400">الحالة:</span>
                            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                              نشط
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-slate-500 dark:text-slate-400">تاريخ الانتهاء:</span>
                            <p className="font-semibold text-slate-800 dark:text-white">
                              {currentFirm.subscriptionEndDate ? 
                                new Date(currentFirm.subscriptionEndDate).toLocaleDateString('ar-EG') : 
                                'غير محدد'
                              }
                            </p>
                          </div>
                        </div>
                        
                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            ⚠️ لم يتم العثور على تفاصيل الباقة. يرجى تحديث الصفحة.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  
                  console.log('Debug - Found current plan:', currentPlan);
                  
                  return (
                    <div className="space-y-4">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">الباقة:</span>
                          <p className="font-semibold text-slate-800 dark:text-white">
                            {currentPlan?.name || currentFirm.subscriptionPlan}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">الحالة:</span>
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                            نشط
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">تاريخ البدء:</span>
                          <p className="font-semibold text-slate-800 dark:text-white">
                            {currentFirm.createdAt ? 
                              new Date(currentFirm.createdAt).toLocaleDateString('ar-EG') : 
                              'غير محدد'
                            }
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-slate-500 dark:text-slate-400">تاريخ الانتهاء:</span>
                          <p className="font-semibold text-slate-800 dark:text-white">
                            {currentFirm.subscriptionEndDate ? 
                              new Date(currentFirm.subscriptionEndDate).toLocaleDateString('ar-EG') : 
                              'غير محدد'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Usage Limits */}
                      {currentPlan && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          <h5 className="font-semibold text-slate-800 dark:text-white mb-3">حدود الباقة:</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                              <Users className="w-5 h-5 mx-auto mb-1 text-slate-600 dark:text-slate-400" />
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {displayValue(currentPlan.maxUsers, 3)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">مستخدمين</p>
                            </div>
                            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                              <Briefcase className="w-5 h-5 mx-auto mb-1 text-slate-600 dark:text-slate-400" />
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {displayValue(currentPlan.maxCases, 10)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">قضايا</p>
                            </div>
                            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                              <Database className="w-5 h-5 mx-auto mb-1 text-slate-600 dark:text-slate-400" />
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {displayValue(currentPlan.maxClients, 20)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">عملاء</p>
                            </div>
                            <div className="text-center p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                              <Shield className="w-5 h-5 mx-auto mb-1 text-slate-600 dark:text-slate-400" />
                              <p className="font-semibold text-slate-800 dark:text-white">
                                {displayValue(currentPlan.maxLawyers, 2)}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">محامين</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Features */}
                      {currentPlan?.features && currentPlan.features.length > 0 && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          <h5 className="font-semibold text-slate-800 dark:text-white mb-3">المميزات:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {currentPlan.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Storage */}
                      {currentPlan?.maxStorageGB && (
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          <h5 className="font-semibold text-slate-800 dark:text-white mb-3">مساحة التخزين:</h5>
                          <div className="flex items-center gap-3">
                            <Cloud className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {displayValue(currentPlan.maxStorageGB, 2)} جيجابايت
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* No Subscription Alert - For new users without any subscription */}
      {currentFirm.subscriptionStatus === 'inactive' && !currentFirm.subscriptionPlan && !currentFirm.trialEndDate && (
        <div className="p-6 rounded-xl border bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 text-blue-800 dark:text-blue-200">مرحباً! اختر باقتك</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                لقد تم إنشاء مكتبك بنجاح! الآن اختر الباقة التي تناسب احتياجاتك لبدء استخدام النظام.
              </p>
              <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2">الخطوات التالية:</h4>
                <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                  <li>• اختر الباقة التجريبية المجانية لمدة 7 أيام</li>
                  <li>• أو اختر إحدى الباقات المدفوعة المناسبة لك</li>
                  <li>• استمتع بجميع الميزات المتقدمة فوراً</li>
                  <li>• احصل على دعم فني مخصص</li>
                </ul>
              </div>
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
                  {plan.maxLawyers && (
                    <span className="bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 text-xs px-3 py-2 rounded-full font-semibold border border-purple-200 dark:border-purple-800">
                      ⚖️ {plan.maxLawyers === -1 ? 'غير محدود' : `حتى ${plan.maxLawyers} محامي`}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 border border-slate-200 dark:border-slate-700">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center z-10">
              <h3 className="font-bold text-xl text-slate-800 dark:text-white">تفاصيل الدفع - {selectedPlanForPayment.name}</h3>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Payment Instructions */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 p-6 rounded-xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-800 rounded-full">
                    <Phone className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-amber-800 dark:text-amber-200">رقم التحويل</h4>
                    <p className="text-sm text-amber-600 dark:text-amber-400">قم بتحويل المبلغ إلى الرقم التالي</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-amber-300 dark:border-amber-700">
                  <p className="text-3xl font-bold text-center text-amber-900 dark:text-amber-100 mb-2">01090609918</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 text-center">رقم المحفظة: Vodafone Cash</p>
                </div>
              </div>

              {/* Price Details */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-4">تفاصيل السعر</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">الباقة:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{selectedPlanForPayment.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">دورة الفوترة:</span>
                    <span className="font-bold text-slate-800 dark:text-white">
                      {billingCycle === 'monthly' ? 'شهري' : 'سنوي'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-300">السعر الأصلي:</span>
                    <span className="text-slate-800 dark:text-white">
                      {selectedPlanForPayment.price} {selectedPlanForPayment.currency}
                      {billingCycle === 'yearly' ? '/شهري' : '/شهري'}
                    </span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-300">السعر السنوي:</span>
                        <span className="text-slate-800 dark:text-white">
                          {selectedPlanForPayment.price * 12} {selectedPlanForPayment.currency}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400">
                        <span>الخصم (10%):</span>
                        <span className="font-bold">-{selectedPlanForPayment.price * 12 * 0.1} {selectedPlanForPayment.currency}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center pt-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    <span>المبلغ المطلوب:</span>
                    <span>{calculatePrice(selectedPlanForPayment, billingCycle)} {selectedPlanForPayment.currency}</span>
                  </div>
                </div>
              </div>

              {/* Payment Proof Upload */}
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div>
                  <label className="block text-lg font-bold mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Camera className="w-5 h-5" />
                    إثبات التحويل
                  </label>
                  
                  {/* File Input */}
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 bg-slate-50 dark:bg-slate-900/30 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
                    <div className="text-center space-y-4">
                      <Upload className="w-16 h-16 mx-auto text-slate-400" />
                      <div>
                        <label className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 cursor-pointer flex items-center gap-3 mx-auto inline-flex transition-colors">
                          <FileText className="w-5 h-5" />
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setPaymentProof(file);
                                const url = URL.createObjectURL(file);
                                setPaymentProofUrl(url);
                              }
                            }}
                            className="hidden"
                          />
                          اختر ملف إثبات التحويل
                        </label>
                        <p className="text-sm text-slate-500 mt-2">
                          يجب أن يكون صورة واضحة أو PDF لإثبات التحويل
                        </p>
                      </div>
                    </div>
                    
                    {/* File Preview */}
                    {paymentProof && (
                      <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-800 dark:text-white">{paymentProof.name}</p>
                            <p className="text-sm text-slate-500">
                              {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPaymentProof(null);
                              setPaymentProofUrl('');
                            }}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Google Drive Toggle */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                      <Cloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">رفع إلى Google Drive</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">سيتم حفظ الملف في سحابة جوجل</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseGoogleDrive(!useGoogleDrive)}
                    className={`w-14 h-7 rounded-full transition-colors relative ${useGoogleDrive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${useGoogleDrive ? 'right-1' : 'right-8'}`}></div>
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
                    className="w-full flex items-center justify-center gap-3 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    تسجيل الدخول إلى Google Drive
                  </button>
                )}

                <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment || !paymentProof || (useGoogleDrive && !googleDriveService.isSignedIn()) || isUploadingToDrive}
                    className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:from-indigo-700 hover:to-purple-700"
                  >
                    {submittingPayment || isUploadingToDrive ? (
                      <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        {isUploadingToDrive ? 'جاري الرفع إلى Google Drive...' : 'جاري الإرسال...'}
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
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
