import { doc, getDoc, collection, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Firm, SubscriptionPlan } from '../../types';

export class SubscriptionService {
  
  // Create trial subscription for new firms
  static async createTrialSubscription(firmId: string): Promise<void> {
    try {
      console.log('🎯 Creating trial subscription for firm:', firmId);
      
      const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days from now
      
      // Update firm with trial subscription (without creating subscription plan document)
      await updateDoc(doc(db, 'firms', firmId), {
        subscriptionPlan: 'trial',
        trialStartDate: new Date().toISOString(),
        trialEndDate: trialEndDate,
        subscriptionStatus: 'trial'
      });
      
      console.log('✅ Trial subscription created successfully');
    } catch (error) {
      console.error('❌ Error creating trial subscription:', error);
      throw error;
    }
  }

  // Check if trial has expired
  static async checkTrialStatus(firmId: string): Promise<{ isExpired: boolean; daysLeft: number; message: string }> {
    try {
      const firm = await this.getCurrentFirm(firmId);
      if (!firm || firm.subscriptionStatus !== 'trial') {
        return { isExpired: false, daysLeft: 0, message: '' };
      }
      
      const trialEndDate = new Date(firm.trialEndDate);
      const now = new Date();
      const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysLeft <= 0) {
        return { 
          isExpired: true, 
          daysLeft: 0, 
          message: 'انتهت فترة التجربة المجانية. يرجى الاشتراك في إحدى الباقات للاستمرار.' 
        };
      }
      
      return { 
        isExpired: false, 
        daysLeft, 
        message: `تبقى ${daysLeft} أيام على انتهاء فترة التجربة المجانية` 
      };
    } catch (error) {
      console.error('❌ Error checking trial status:', error);
      return { isExpired: true, daysLeft: 0, message: 'حدث خطأ في التحقق من حالة التجربة' };
    }
  }
  
  // Get current firm with subscription details
  static async getCurrentFirm(firmId: string): Promise<Firm | null> {
    try {
      const firmDoc = await getDoc(doc(db, 'firms', firmId));
      return firmDoc.exists() ? firmDoc.data() as Firm : null;
    } catch (error) {
      console.error('Error getting firm:', error);
      return null;
    }
  }

  // Get subscription plan details
  static async getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      // For trial plan, return hardcoded trial plan details
      if (planId === 'trial') {
        return {
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
      }
      
      const planDoc = await getDoc(doc(db, 'subscriptionPlans', planId));
      return planDoc.exists() ? planDoc.data() as SubscriptionPlan : null;
    } catch (error) {
      console.error('Error getting subscription plan:', error);
      return null;
    }
  }

  // Check if firm can add more cases
  static async canAddCase(firmId: string, userEmail?: string): Promise<{ canAdd: boolean; message: string; current: number; max: number }> {
    try {
      // Check if user is super admin - bypass all limits
      if (userEmail?.toLowerCase() === 'elswa770@gmail.com') {
        return { canAdd: true, message: 'غير محدود (مدير النظام)', current: -1, max: -1 };
      }
      
      const firm = await this.getCurrentFirm(firmId);
      
      if (!firm) {
        return { canAdd: false, message: 'لم يتم العثور على الشركة', current: 0, max: 0 };
      }

      
      // Check trial status first
      if (firm.subscriptionStatus === 'trial') {
        const trialStatus = await this.checkTrialStatus(firmId);
                
        if (trialStatus.isExpired) {
          return { canAdd: false, message: trialStatus.message, current: 0, max: 0 };
        }
        
                // For trial users, get the trial plan
        const plan = await this.getSubscriptionPlan('trial');
        if (!plan) {
                    return { canAdd: false, message: 'باقة التجربة غير متوفرة', current: 0, max: 0 };
        }
        
                
        // Count current cases
        const casesSnapshot = await getDocs(collection(db, 'cases'));
        const currentCases = casesSnapshot.docs.filter(doc => doc.data().firmId === firmId).length;
        
        if (currentCases >= plan.maxCases) {
          return { 
            canAdd: false, 
            message: `لقد وصلت إلى الحد الأقصى للقضايا في الباقة التجريبية (${currentCases}/${plan.maxCases})`, 
            current: currentCases, 
            max: plan.maxCases 
          };
        }
        
        return { 
          canAdd: true, 
          message: `باقة تجريبية - يمكنك إضافة المزيد من القضايا (${currentCases}/${plan.maxCases})`, 
          current: currentCases, 
          max: plan.maxCases 
        };
      }

      // Get subscription plan for non-trial users
      const plan = await this.getSubscriptionPlan(firm.subscriptionPlan);
            
      if (!plan) {
                return { canAdd: false, message: 'لم يتم العثور على خطة الاشتراك', current: 0, max: 0 };
      }

      // Check if unlimited
      if (plan.maxCases === -1) {
                return { canAdd: true, message: 'غير محدود', current: -1, max: -1 };
      }

      // Count current cases
            const casesSnapshot = await getDocs(collection(db, 'cases'));
      const currentCases = casesSnapshot.docs.filter(doc => doc.data().firmId === firmId).length;
            
      // Check limit
      const canAdd = currentCases < plan.maxCases;
      const message = canAdd 
        ? `يمكنك إضافة المزيد من القضايا (${currentCases}/${plan.maxCases})`
        : `لقد وصلت إلى الحد الأقصى للقضايا (${currentCases}/${plan.maxCases}). يرجى ترقية اشتراكك.`;

            return { canAdd, message, current: currentCases, max: plan.maxCases };

    } catch (error) {
      console.error('❌ Error checking case limit:', error);
      return { canAdd: false, message: 'حدث خطأ في التحقق من الحد', current: 0, max: 0 };
    }
  }

  // Check if firm can add more users
  static async canAddUser(firmId: string, userEmail?: string): Promise<{ canAdd: boolean; message: string; current: number; max: number }> {
    try {
      console.log('🔍 canAddUser called with firmId:', firmId, 'userEmail:', userEmail);
      
      // Check if user is super admin - bypass all limits
      if (userEmail?.toLowerCase() === 'elswa770@gmail.com') {
        console.log('👑 Super admin detected - unlimited access');
        return { canAdd: true, message: 'غير محدود (مدير النظام)', current: -1, max: -1 };
      }
      
      const firm = await this.getCurrentFirm(firmId);
      console.log('📋 Firm data:', firm);
      
      if (!firm) {
        console.log('❌ Firm not found');
        return { canAdd: false, message: 'لم يتم العثور على الشركة', current: 0, max: 0 };
      }

      
      // Check trial status first
      if (firm.subscriptionStatus === 'trial') {
        const trialStatus = await this.checkTrialStatus(firmId);
                
        if (trialStatus.isExpired) {
          return { canAdd: false, message: trialStatus.message, current: 0, max: 0 };
        }
        
                // For trial users, get the trial plan
        const plan = await this.getSubscriptionPlan('trial');
        if (!plan) {
                    return { canAdd: false, message: 'باقة التجربة غير متوفرة', current: 0, max: 0 };
        }
        
                
        // Count current users
                const mainUsersSnapshot = await getDocs(collection(db, 'users'));
        const mainUsers = mainUsersSnapshot.docs.filter(doc => doc.data().firmId === firmId).length;
                
        const subUsersSnapshot = await getDocs(collection(db, 'firms', firmId, 'users'));
        const subUsers = subUsersSnapshot.docs.length;
                
        const currentUsers = mainUsers + subUsers;
                        
        if (currentUsers >= plan.maxUsers) {
          return { 
            canAdd: false, 
            message: `لقد وصلت إلى الحد الأقصى للمستخدمين في الباقة التجريبية (${currentUsers}/${plan.maxUsers})`, 
            current: currentUsers, 
            max: plan.maxUsers 
          };
        }
        
        return { 
          canAdd: true, 
          message: `باقة تجريبية - يمكنك إضافة المزيد من المستخدمين (${currentUsers}/${plan.maxUsers})`, 
          current: currentUsers, 
          max: plan.maxUsers 
        };
      }

      // Get subscription plan for non-trial users
      const plan = await this.getSubscriptionPlan(firm.subscriptionPlan);
            
      if (!plan) {
                // If no subscription plan, assign default basic plan
                return { canAdd: true, message: 'باقة أساسية افتراضية (3 مستخدمين)', current: 0, max: 3 };
      }

      // Check if unlimited
      if (plan.maxUsers === -1) {
        return { canAdd: true, message: 'غير محدود', current: -1, max: -1 };
      }

      // Count current users from both main collection and subcollection
            
      // Count from main collection
      const mainUsersSnapshot = await getDocs(collection(db, 'users'));
      const mainUsers = mainUsersSnapshot.docs.filter(doc => doc.data().firmId === firmId).length;
            
      // Count from subcollection
      const subUsersSnapshot = await getDocs(collection(db, 'firms', firmId, 'users'));
      const subUsers = subUsersSnapshot.docs.length;
            
      // Total users count
      const currentUsers = mainUsers + subUsers;
            
      // Check limit
      const canAdd = currentUsers < plan.maxUsers;
      const message = canAdd 
        ? `يمكنك إضافة المزيد من المستخدمين (${currentUsers}/${plan.maxUsers})`
        : `لقد وصلت إلى الحد الأقصى للمستخدمين (${currentUsers}/${plan.maxUsers}). يرجى ترقية اشتراكك.`;

      return { canAdd, message, current: currentUsers, max: plan.maxUsers };

    } catch (error) {
      console.error('❌ Error checking user limit:', error);
      return { canAdd: false, message: 'حدث خطأ في التحقق من الحد', current: 0, max: 0 };
    }
  }

  // Check if firm can add more clients
  static async canAddClient(firmId: string, userEmail?: string): Promise<{ canAdd: boolean; message: string; current: number; max: number }> {
    try {
      console.log('🔍 canAddClient called with firmId:', firmId, 'userEmail:', userEmail);
      
      // Check if user is super admin - bypass all limits
      if (userEmail?.toLowerCase() === 'elswa770@gmail.com') {
        console.log('👑 Super admin detected - unlimited access');
        return { canAdd: true, message: 'غير محدود (مدير النظام)', current: -1, max: -1 };
      }
      
      const firm = await this.getCurrentFirm(firmId);
      console.log('📋 Firm data:', firm);
      
      if (!firm) {
        console.log('❌ Firm not found');
        return { canAdd: false, message: 'لم يتم العثور على الشركة', current: 0, max: 0 };
      }

      
      // Check trial status first
      if (firm.subscriptionStatus === 'trial') {
        const trialStatus = await this.checkTrialStatus(firmId);
                
        if (trialStatus.isExpired) {
          return { canAdd: false, message: trialStatus.message, current: 0, max: 0 };
        }
        
                // For trial users, get the trial plan
        const plan = await this.getSubscriptionPlan('trial');
        if (!plan) {
                    return { canAdd: false, message: 'باقة التجربة غير متوفرة', current: 0, max: 0 };
        }
        
                
        // Count current clients
                const clientsSnapshot = await getDocs(collection(db, 'clients'));
        const currentClients = clientsSnapshot.docs.filter(doc => doc.data().firmId === firmId).length;
                        
        if (currentClients >= plan.maxClients) {
          return { 
            canAdd: false, 
            message: `لقد وصلت إلى الحد الأقصى للموكلين في الباقة التجريبية (${currentClients}/${plan.maxClients})`, 
            current: currentClients, 
            max: plan.maxClients 
          };
        }
        
        return { 
          canAdd: true, 
          message: `باقة تجريبية - يمكنك إضافة المزيد من الموكلين (${currentClients}/${plan.maxClients})`, 
          current: currentClients, 
          max: plan.maxClients 
        };
      }

      // Get subscription plan for non-trial users
      const plan = await this.getSubscriptionPlan(firm.subscriptionPlan);
            
      if (!plan) {
                return { canAdd: false, message: 'لم يتم العثور على خطة الاشتراك', current: 0, max: 0 };
      }

      // Check if unlimited
      if (plan.maxClients === -1) {
                return { canAdd: true, message: 'غير محدود', current: -1, max: -1 };
      }

      // Count current clients
            const clientsSnapshot = await getDocs(collection(db, 'clients'));
      const currentClients = clientsSnapshot.docs.filter(doc => doc.data().firmId === firmId).length;
            
      // Check limit
      const canAdd = currentClients < plan.maxClients;
      const message = canAdd 
        ? `يمكنك إضافة المزيد من الموكلين (${currentClients}/${plan.maxClients})`
        : `لقد وصلت إلى الحد الأقصى للموكلين (${currentClients}/${plan.maxClients}). يرجى ترقية اشتراكك.`;

            return { canAdd, message, current: currentClients, max: plan.maxClients };

    } catch (error) {
      console.error('❌ Error checking client limit:', error);
      return { canAdd: false, message: 'حدث خطأ في التحقق من الحد', current: 0, max: 0 };
    }
  }

  // Get subscription status with details
  static async getSubscriptionStatus(firmId: string): Promise<{
    planName: string;
    planId: string;
    status: string;
    casesUsed: number;
    casesMax: number;
    usersUsed: number;
    usersMax: number;
    storageUsed: number;
    storageMax: number;
    billingCycle: string;
  }> {
    try {
      const firm = await this.getCurrentFirm(firmId);
      if (!firm) {
        throw new Error('لم يتم العثور على الشركة');
      }

      const plan = await this.getSubscriptionPlan(firm.subscriptionPlan);
      if (!plan) {
        throw new Error('لم يتم العثور على خطة الاشتراك');
      }

      // Count current usage
      const casesSnapshot = await getDocs(collection(db, 'firms', firmId, 'cases'));
      const usersSnapshot = await getDocs(collection(db, 'firms', firmId, 'users'));
      
      const casesUsed = casesSnapshot.docs.length;
      const usersUsed = usersSnapshot.docs.length;

      return {
        planName: plan.name,
        planId: plan.id,
        status: firm.subscriptionStatus,
        casesUsed: plan.maxCases === -1 ? -1 : casesUsed,
        casesMax: plan.maxCases,
        usersUsed: plan.maxUsers === -1 ? -1 : usersUsed,
        usersMax: plan.maxUsers,
        storageUsed: 0, // TODO: Implement storage calculation
        storageMax: plan.maxStorageGB,
        billingCycle: plan.billingCycle
      };

    } catch (error) {
      console.error('Error getting subscription status:', error);
      throw error;
    }
  }
}
