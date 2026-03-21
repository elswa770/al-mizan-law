import React, { useState } from 'react';
import { Building, Briefcase, Scale, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, secondaryAuth, signOut, auth } from '../firebase';
import { collection, addDoc, doc, updateDoc, setDoc } from 'firebase/firestore';
import { SubscriptionService } from '../src/services/subscriptionService';
import { MOCK_ROLES } from '../services/mockData';
import { createDefaultSettingsUnified } from '../src/services/settingsService';

const Onboarding: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [firmName, setFirmName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    
    setIsLoading(true);
    setError('');

    try {
      console.log('🎯 Starting firm creation...');
      console.log('👤 Firebase user:', firebaseUser);
      
      // 1. Create the Firm document
      const firmRef = await addDoc(collection(db, 'firms'), {
        name: firmName,
        email: firebaseUser.email || '',        // البريد الإلكتروني من Firebase Auth
        ownerId: firebaseUser.uid,               // معرف المالك من Firebase Auth
        subscriptionStatus: 'trial',
        subscriptionPlan: 'trial', // Changed to 'trial'
        isActive: true,                          // حالة نشطة
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()      // تاريخ التحديث
      });
      
      console.log('✅ Firm created with ID:', firmRef.id);

      // 2. Create trial subscription
      await SubscriptionService.createTrialSubscription(firmRef.id);
      console.log('✅ Trial subscription created');

      // 3. Create User document linked to new firm
      // Give them the "Admin" role permissions by default
      const adminRole = MOCK_ROLES.find(r => r.name === 'مدير النظام') || MOCK_ROLES[0];
      
      console.log('🔑 Admin role found:', adminRole);
      
      const userData: any = {
        id: firebaseUser.uid,
        firmId: firmRef.id,
        name: firebaseUser.displayName || 'مستخدم جديد',
        email: firebaseUser.email || '',
        roleLabel: 'مدير النظام',
        isActive: true,
        permissions: adminRole.permissions,
      };
      if (firebaseUser.photoURL) {
        userData.avatar = firebaseUser.photoURL;
      }
      
      console.log('👤 User data to create:', userData);
      
      await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      console.log('✅ User document created successfully');

      // 4. Create default settings with delay using unified function
      setTimeout(async () => {
        try {
          await createDefaultSettingsUnified(firmRef.id, firmName);
          console.log('✅ Default settings created successfully');
        } catch (settingsError: any) {
          console.warn('⚠️ Could not create settings after delay:', settingsError);
          // Settings will be created when user first accesses settings page
        }
      }, 5000); // 5 seconds delay to ensure Firebase permissions are updated

      // Force a page reload to trigger AuthContext to update
      console.log('🔄 Reloading page...');
      window.location.reload();
      
      // The AuthContext onSnapshot will automatically pick up the new user document
      // and update the currentUser state, moving them past the onboarding screen.
    } catch (err: any) {
      console.error("Error creating firm:", err);
      setError('حدث خطأ أثناء إنشاء المكتب. يرجى المحاولة مرة أخرى.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-all"
        title="تسجيل الخروج"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium">تسجيل الخروج</span>
      </button>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary-600/20 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 relative animate-in fade-in slide-in-from-bottom-4">
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
           <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-xl mx-auto flex items-center justify-center text-white shadow-lg mb-4">
              <Scale className="w-8 h-8" />
           </div>
           <h1 className="text-2xl font-bold text-slate-900">مرحباً بك في الميزان</h1>
           <p className="text-sm text-slate-500 mt-1">لنقم بإعداد مساحة العمل الخاصة بمكتبك</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center">
                 {error}
              </div>
           )}

           <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">اسم مكتب المحاماة</label>
              <div className="relative">
                 <Building className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                 <input 
                   type="text" 
                   value={firmName}
                   onChange={(e) => setFirmName(e.target.value)}
                   className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                   placeholder="مثال: مكتب العدالة للمحاماة والاستشارات"
                   required
                 />
              </div>
              <p className="text-xs text-slate-500 mt-2">سيكون هذا الاسم مرئياً لجميع أعضاء فريقك.</p>
           </div>

           <button 
             type="submit" 
             disabled={isLoading || !firmName.trim()}
             className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
           >
              {isLoading ? (
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                 <>
                    إنشاء المكتب والبدء <ArrowRight className="w-4 h-4" />
                 </>
              )}
           </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
