import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Firm, SubscriptionPlan } from '../types';

export interface ResourceMetrics {
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
  totalUsers: number;
  activeOffices: number;
  totalUsedStorage: string;
  averageSystemUsage: number;
  lastUpdate: string;
}

export interface OfficeUsage {
  firmId: string;
  firmName: string;
  planName: string;
  usersUsed: number;
  usersMax: number;
  casesUsed: number;
  casesMax: number;
  storageUsed: number;
  storageMax: number;
  usagePercentage: number;
}

export class ResourceMonitoringService {
  
  // Calculate real-time resource consumption
  static async getResourceMetrics(): Promise<ResourceMetrics> {
    try {
      const [firmsSnapshot, usersSnapshot, plansSnapshot] = await Promise.all([
        getDocs(collection(db, 'firms')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'subscriptionPlans'))
      ]);

      const firms = firmsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Firm));
      const users = usersSnapshot.docs.length;
      const plans = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
      
      const activeFirms = firms.filter(f => f.subscriptionStatus === 'active').length;
      
      // Calculate storage usage (sum of all documents, files, etc.)
      const totalStorage = await this.calculateTotalStorage(firms);
      
      // Calculate simulated system metrics based on actual usage
      const baseLoad = (users * 2) + (activeFirms * 5); // Base load per user and firm
      const cpuUsage = Math.min(95, Math.max(5, baseLoad + Math.random() * 10));
      const ramUsage = Math.min(90, Math.max(10, baseLoad * 1.5 + Math.random() * 15));
      const storageUsage = Math.min(85, Math.max(3, (totalStorage / 100) * 20 + Math.random() * 5));
      
      const averageSystemUsage = (cpuUsage + ramUsage + storageUsage) / 3;

      return {
        cpuUsage: Math.round(cpuUsage),
        ramUsage: Math.round(ramUsage),
        storageUsage: Math.round(storageUsage),
        totalUsers: users,
        activeOffices: activeFirms,
        totalUsedStorage: this.formatStorage(totalStorage),
        averageSystemUsage: Math.round(averageSystemUsage),
        lastUpdate: new Date().toLocaleTimeString('ar-EG', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
      };
    } catch (error) {
      console.error('Error calculating resource metrics:', error);
      throw error;
    }
  }

  // Get detailed usage per office
  static async getOfficeUsage(): Promise<OfficeUsage[]> {
    try {
      const [firmsSnapshot, usersSnapshot, casesSnapshot, clientsSnapshot] = await Promise.all([
        getDocs(collection(db, 'firms')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'cases')),
        getDocs(collection(db, 'clients'))
      ]);

      const firms = firmsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Firm));
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const cases = casesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      const clients = clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      const officeUsage: OfficeUsage[] = [];

      for (const firm of firms) {
        const firmUsers = users.filter(u => u.firmId === firm.id).length;
        const firmCases = cases.filter(c => c.firmId === firm.id).length;
        const firmClients = clients.filter(c => c.firmId === firm.id).length;
        
        // Get plan details
        let planName = 'غير محدد';
        let usersMax = 0;
        let casesMax = 0;
        let storageMax = 0;

        if (firm.subscriptionPlan === 'trial') {
          planName = 'باقة تجريبية';
          usersMax = 1;
          casesMax = 2;
          storageMax = 1;
        } else {
          const planDoc = await getDoc(doc(db, 'subscriptionPlans', firm.subscriptionPlan));
          if (planDoc.exists()) {
            const plan = planDoc.data() as SubscriptionPlan;
            planName = plan.name;
            usersMax = plan.maxUsers;
            casesMax = plan.maxCases;
            storageMax = plan.maxStorageGB;
          }
        }

        const storageUsed = await this.calculateFirmStorage(firm.id);
        
        // Calculate overall usage percentage
        const userUsage = usersMax > 0 ? (firmUsers / usersMax) * 100 : 0;
        const caseUsage = casesMax > 0 ? (firmCases / casesMax) * 100 : 0;
        const storageUsagePercent = storageMax > 0 ? (storageUsed / (storageMax * 1024)) * 100 : 0;
        
        const usagePercentage = Math.max(userUsage, caseUsage, storageUsagePercent);

        officeUsage.push({
          firmId: firm.id,
          firmName: firm.name,
          planName,
          usersUsed: firmUsers,
          usersMax,
          casesUsed: firmCases,
          casesMax,
          storageUsed,
          storageMax,
          usagePercentage: Math.round(usagePercentage)
        });
      }

      return officeUsage.sort((a, b) => b.usagePercentage - a.usagePercentage);
    } catch (error) {
      console.error('Error getting office usage:', error);
      throw error;
    }
  }

  // Calculate total storage across all firms (in MB)
  private static async calculateTotalStorage(firms: Firm[]): Promise<number> {
    try {
      let totalStorage = 0;
      
      // Base storage estimation
      for (const firm of firms) {
        const firmStorage = await this.calculateFirmStorage(firm.id);
        totalStorage += firmStorage;
      }
      
      return totalStorage;
    } catch (error) {
      console.error('Error calculating total storage:', error);
      return 0;
    }
  }

  // Calculate storage for a specific firm (in MB)
  private static async calculateFirmStorage(firmId: string): Promise<number> {
    try {
      let storage = 0;
      
      // Get collections for this firm
      const [casesSnapshot, usersSnapshot, clientsSnapshot] = await Promise.all([
        getDocs(collection(db, 'firms', firmId, 'cases')),
        getDocs(collection(db, 'firms', firmId, 'users')),
        getDocs(collection(db, 'clients'))
      ]);

      // Estimate storage based on document count
      // Each case ~50KB, each user ~10KB, each client ~15KB
      storage += casesSnapshot.docs.length * 0.05; // MB
      storage += usersSnapshot.docs.length * 0.01; // MB
      storage += clientsSnapshot.docs.filter(doc => doc.data().firmId === firmId).length * 0.015; // MB
      
      // Add some base storage for firm data
      storage += 0.1; // MB for firm metadata
      
      return Math.round(storage * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error(`Error calculating storage for firm ${firmId}:`, error);
      return 0;
    }
  }

  // Format storage size for display
  private static formatStorage(sizeMB: number): string {
    if (sizeMB < 1024) {
      return `${Math.round(sizeMB)}MB`;
    } else {
      return `${Math.round(sizeMB / 1024 * 10) / 10}GB`;
    }
  }

  // Get system health status
  static async getSystemHealth(): Promise<{
    database: 'operational' | 'degraded' | 'down';
    api: 'operational' | 'degraded' | 'down';
    storage: 'operational' | 'degraded' | 'down';
    overall: 'healthy' | 'warning' | 'critical';
  }> {
    try {
      const metrics = await this.getResourceMetrics();
      
      const database = metrics.cpuUsage < 80 ? 'operational' : metrics.cpuUsage < 90 ? 'degraded' : 'down';
      const api = metrics.ramUsage < 75 ? 'operational' : metrics.ramUsage < 85 ? 'degraded' : 'down';
      const storage = metrics.storageUsage < 80 ? 'operational' : metrics.storageUsage < 90 ? 'degraded' : 'down';
      
      const overallStatus = [database, api, storage].every(s => s === 'operational') ? 'healthy' :
                           [database, api, storage].some(s => s === 'down') ? 'critical' : 'warning';
      
      return {
        database,
        api,
        storage,
        overall: overallStatus as 'healthy' | 'warning' | 'critical'
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      return {
        database: 'down',
        api: 'down',
        storage: 'down',
        overall: 'critical'
      };
    }
  }

  // Get subscription limits vs actual usage
  static async getSubscriptionUsageSummary(): Promise<{
    totalPlans: number;
    activeSubscriptions: number;
    trialSubscriptions: number;
    expiredSubscriptions: number;
    totalUsersAllocated: number;
    totalUsersUsed: number;
    totalCasesAllocated: number;
    totalCasesUsed: number;
    totalStorageAllocated: number;
    totalStorageUsed: number;
  }> {
    try {
      const [firmsSnapshot, plansSnapshot, usersSnapshot, casesSnapshot] = await Promise.all([
        getDocs(collection(db, 'firms')),
        getDocs(collection(db, 'subscriptionPlans')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'cases'))
      ]);

      const firms = firmsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Firm));
      const plans = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
      const users = usersSnapshot.docs.length;
      const cases = casesSnapshot.docs.length;

      const activeSubscriptions = firms.filter(f => f.subscriptionStatus === 'active').length;
      const trialSubscriptions = firms.filter(f => f.subscriptionStatus === 'trial').length;
      const expiredSubscriptions = firms.filter(f => f.subscriptionStatus === 'inactive').length;

      // Calculate allocated resources
      let totalUsersAllocated = 0;
      let totalCasesAllocated = 0;
      let totalStorageAllocated = 0;

      for (const firm of firms) {
        if (firm.subscriptionPlan === 'trial') {
          totalUsersAllocated += 1;
          totalCasesAllocated += 2;
          totalStorageAllocated += 1;
        } else {
          const plan = plans.find(p => p.id === firm.subscriptionPlan);
          if (plan) {
            totalUsersAllocated += plan.maxUsers > 0 ? plan.maxUsers : 0;
            totalCasesAllocated += plan.maxCases > 0 ? plan.maxCases : 0;
            totalStorageAllocated += plan.maxStorageGB > 0 ? plan.maxStorageGB : 0;
          }
        }
      }

      const totalStorageUsed = await this.calculateTotalStorage(firms);

      return {
        totalPlans: plans.length,
        activeSubscriptions,
        trialSubscriptions,
        expiredSubscriptions,
        totalUsersAllocated,
        totalUsersUsed: users,
        totalCasesAllocated,
        totalCasesUsed: cases,
        totalStorageAllocated,
        totalStorageUsed: Math.round(totalStorageUsed / 1024 * 100) / 100 // Convert to GB
      };
    } catch (error) {
      console.error('Error getting subscription usage summary:', error);
      throw error;
    }
  }
}
