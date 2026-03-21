import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Firm, AppUser, ActivityLog, SubscriptionPlan } from '../types';
import { ShieldAlert, Users, Building, Activity, CheckCircle, XCircle, Search, DollarSign, Cpu, Terminal, Server, History, CreditCard, Plus, Edit2, Trash2, Calendar, Save, X, Zap, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw, Bolt, Brain, HardDrive, BarChart3, Edit, TrendingUp } from 'lucide-react';
import { logActivity, getActivityLogs } from '../services/activityService';
import { ResourceMonitoringService, ResourceMetrics } from '../services/resourceMonitoringService';

interface SuperAdminDashboardProps {
  currentUser: AppUser | null;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'firms' | 'plans' | 'logs' | 'users' | 'requests' | 'offices'>('firms');
  const [firms, setFirms] = useState<Firm[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestSearchTerm, setRequestSearchTerm] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [resourceMetrics, setResourceMetrics] = useState<ResourceMetrics | null>(null);
  const [refreshingResources, setRefreshingResources] = useState(false);
  
  // Calculate real revenue data from subscription requests
  const calculateRevenueData = () => {
    const approvedRequests = subscriptionRequests.filter(r => r.status === 'approved');
    
    // Calculate total revenue
    const totalRevenue = approvedRequests.reduce((sum, request) => sum + (request.price || 0), 0);
    
    // Calculate current month revenue
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = approvedRequests
      .filter(request => {
        const requestDate = request.approvedAt ? new Date(request.approvedAt) : new Date();
        return requestDate.getMonth() === currentMonth && requestDate.getFullYear() === currentYear;
      })
      .reduce((sum, request) => sum + (request.price || 0), 0);
    
    // Calculate current week revenue
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const weeklyRevenue = approvedRequests
      .filter(request => {
        const requestDate = request.approvedAt ? new Date(request.approvedAt) : new Date();
        return requestDate >= oneWeekAgo;
      })
      .reduce((sum, request) => sum + (request.price || 0), 0);
    
    // Calculate monthly revenue data for chart
    const monthlyData = [
      { month: 'يناير', value: 0, color: 'bg-blue-500' },
      { month: 'فبراير', value: 0, color: 'bg-indigo-500' },
      { month: 'مارس', value: 0, color: 'bg-purple-500' },
      { month: 'أبريل', value: 0, color: 'bg-pink-500' },
      { month: 'مايو', value: 0, color: 'bg-emerald-500' },
      { month: 'يونيو', value: 0, color: 'bg-amber-500' }
    ];
    
    approvedRequests.forEach(request => {
      if (request.approvedAt) {
        const requestDate = new Date(request.approvedAt);
        const monthIndex = requestDate.getMonth();
        if (monthIndex >= 0 && monthIndex < 6) {
          monthlyData[monthIndex].value += request.price || 0;
        }
      }
    });
    
    return {
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      monthlyData
    };
  };
  
  const revenueData = calculateRevenueData();

  // Filter requests based on search and status
  const filteredRequests = subscriptionRequests.filter(request => {
    const matchesSearch = !requestSearchTerm || 
      request.firmName?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
      request.planName?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
      request.billingCycle?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
      request.price?.toString().includes(requestSearchTerm);
    
    const matchesStatus = requestStatusFilter === 'all' || request.status === requestStatusFilter;
    
    return matchesSearch && matchesStatus;
  });
  const [planSortBy, setPlanSortBy] = useState<'name' | 'price' | 'users' | 'cases' | 'clients'>('name');
  const [planSortOrder, setPlanSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Admin ordering functions
  const movePlanUp = async (planId: string) => {
    const planIndex = plans.findIndex(p => p.id === planId);
    if (planIndex <= 0) return; // Already at top
    
    const newPlans = [...plans];
    // Swap with previous plan
    [newPlans[planIndex], newPlans[planIndex - 1]] = [newPlans[planIndex - 1], newPlans[planIndex]];
    
    // Update sort orders
    const updatedPlans = newPlans.map((plan, index) => ({
      ...plan,
      sortOrder: index
    }));
    
    // Update in Firestore
    try {
      await Promise.all(
        updatedPlans.map(plan => 
          updateDoc(doc(db, 'subscriptionPlans', plan.id), { sortOrder: plan.sortOrder })
        )
      );
      setPlans(updatedPlans);
    } catch (error) {
      console.error('Error updating plan order:', error);
    }
  };
  
  const movePlanDown = async (planId: string) => {
    const planIndex = plans.findIndex(p => p.id === planId);
    if (planIndex >= plans.length - 1) return; // Already at bottom
    
    const newPlans = [...plans];
    // Swap with next plan
    [newPlans[planIndex], newPlans[planIndex + 1]] = [newPlans[planIndex + 1], newPlans[planIndex]];
    
    // Update sort orders
    const updatedPlans = newPlans.map((plan, index) => ({
      ...plan,
      sortOrder: index
    }));
    
    // Update in Firestore
    try {
      await Promise.all(
        updatedPlans.map(plan => 
          updateDoc(doc(db, 'subscriptionPlans', plan.id), { sortOrder: plan.sortOrder })
        )
      );
      setPlans(updatedPlans);
    } catch (error) {
      console.error('Error updating plan order:', error);
    }
  };
  
  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan> | null>(null);
  const [isFirmModalOpen, setIsFirmModalOpen] = useState(false);
  const [editingFirm, setEditingFirm] = useState<Firm | null>(null);

  // Function to fetch resource metrics
  const fetchResourceMetrics = async () => {
    try {
      setRefreshingResources(true);
      const metrics = await ResourceMonitoringService.getResourceMetrics();
      setResourceMetrics(metrics);
    } catch (error) {
      console.error('Error fetching resource metrics:', error);
    } finally {
      setRefreshingResources(false);
    }
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      // Check if current user is super admin
      if (currentUser?.email?.toLowerCase() !== 'elswa770@gmail.com') return;
      
      try {
        console.log('Fetching super admin data...');
        const [firmsSnapshot, usersSnapshot, casesSnapshot, clientsSnapshot, plansSnapshot, fetchedLogs, requestsSnapshot] = await Promise.all([
          getDocs(collection(db, 'firms')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'cases')),
          getDocs(collection(db, 'clients')),
          getDocs(collection(db, 'subscriptionPlans')),
          getActivityLogs(20),
          getDocs(collection(db, 'subscriptionRequests'))
        ]);
        
        console.log('Firms snapshot:', firmsSnapshot.docs.length);
        console.log('Users snapshot:', usersSnapshot.docs.length);
        console.log('Plans snapshot:', plansSnapshot.docs.length);
        console.log('Requests snapshot:', requestsSnapshot.docs.length);
        
        setFirms(firmsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Firm)));
        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser)));
        setCases(casesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setClients(clientsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setPlans(plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan)));
        
        // Sort plans by sortOrder if available, otherwise by name
        const sortedPlans = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan))
          .sort((a, b) => {
            if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
              return a.sortOrder - b.sortOrder;
            }
            return a.name.localeCompare(b.name);
          });
        setPlans(sortedPlans);
        setLogs(fetchedLogs);
        
        const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Requests data:', requestsData);
        
        // Sort requests: pending first, then by date (newest first)
        const sortedRequests = requestsData.sort((a, b) => {
          // First, sort by status: pending first, then approved, then rejected
          const statusOrder = { pending: 0, approved: 1, rejected: 2 };
          const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
          const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
          
          if (aStatusOrder !== bStatusOrder) {
            return aStatusOrder - bStatusOrder;
          }
          
          // Then sort by date (newest first)
          const aDate = a.createdAt ? (typeof a.createdAt === 'string' ? new Date(a.createdAt) : new Date((a.createdAt as any).seconds * 1000)) : new Date(0);
          const bDate = b.createdAt ? (typeof b.createdAt === 'string' ? new Date(b.createdAt) : new Date((b.createdAt as any).seconds * 1000)) : new Date(0);
          
          return bDate.getTime() - aDate.getTime();
        });
        
        setSubscriptionRequests(sortedRequests);
        
        // Fetch resource metrics
        await fetchResourceMetrics();
      } catch (error) {
        console.error("Error fetching super admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [currentUser]);

  // Sort plans function
  const sortPlans = (plansToSort: SubscriptionPlan[]) => {
    const sorted = [...plansToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (planSortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
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
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
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
    
    return sorted;
  };

  const handlePlanSort = (sortBy: 'name' | 'price' | 'users' | 'cases' | 'clients') => {
    if (planSortBy === sortBy) {
      setPlanSortOrder(planSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPlanSortBy(sortBy);
      setPlanSortOrder('asc');
    }
  };

  const handleToggleFirmStatus = async (firmId: string, currentStatus: string, firmName: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await updateDoc(doc(db, 'firms', firmId), {
        subscriptionStatus: newStatus
      });
      setFirms(firms.map(f => f.id === firmId ? { ...f, subscriptionStatus: newStatus as any } : f));
      
      // Log activity
      if (currentUser) {
        await logActivity(firmId, currentUser.name, newStatus === 'active' ? 'قام بتفعيل' : 'قام بإيقاف', firmName);
        const updatedLogs = await getActivityLogs(20);
        setLogs(updatedLogs);
      }
    } catch (error) {
      console.error("Error updating firm status:", error);
      alert("حدث خطأ أثناء تحديث حالة المكتب");
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    console.log('Saving plan:', editingPlan);
    console.log('Current plans before save:', plans);

    try {
      if (editingPlan.id) {
        await updateDoc(doc(db, 'subscriptionPlans', editingPlan.id), editingPlan);
        setPlans(plans.map(p => p.id === editingPlan.id ? { ...p, ...editingPlan } as SubscriptionPlan : p));
      } else {
        const docRef = await addDoc(collection(db, 'subscriptionPlans'), { ...editingPlan, isActive: true });
        const newPlan = { ...editingPlan, id: docRef.id, isActive: true } as SubscriptionPlan;
        console.log('New plan created:', newPlan);
        
        setPlans([...plans, newPlan]);
        console.log('Plans after adding new:', [...plans, newPlan]);
        
        // Force UI update by triggering a re-render
        setTimeout(() => {
          setPlans(prev => {
            console.log('Plans in timeout:', prev);
            return [...prev];
          });
        }, 100);
      }
      setIsPlanModalOpen(false);
      setEditingPlan(null);
      
      // Refresh data to ensure latest plans are displayed
      if (currentUser?.email?.toLowerCase() === 'elswa770@gmail.com') {
        try {
          const plansSnapshot = await getDocs(collection(db, 'subscriptionPlans'));
          const refreshedPlans = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
          console.log('Refreshed plans from Firestore:', refreshedPlans);
          setPlans(refreshedPlans);
        } catch (error) {
          console.error("Error refreshing plans:", error);
        }
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      alert("حدث خطأ أثناء حفظ الباقة");
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الباقة؟")) return;
    try {
      await deleteDoc(doc(db, 'subscriptionPlans', id));
      setPlans(plans.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting plan:", error);
      alert("حدث خطأ أثناء حذف الباقة");
    }
  };

  const handleUpdateFirmSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFirm) return;

    try {
      // Filter out undefined values
      const updateData: any = {
        subscriptionPlan: editingFirm.subscriptionPlan,
        subscriptionStatus: editingFirm.subscriptionStatus,
      };
      
      // Only include subscriptionEndDate if it's defined
      if (editingFirm.subscriptionEndDate) {
        updateData.subscriptionEndDate = editingFirm.subscriptionEndDate;
      }
      
      await updateDoc(doc(db, 'firms', editingFirm.id), updateData);
      setFirms(firms.map(f => f.id === editingFirm.id ? editingFirm : f));
      setIsFirmModalOpen(false);
      setEditingFirm(null);
      
      if (currentUser) {
        await logActivity(editingFirm.id, currentUser.name, 'قام بتعديل اشتراك', editingFirm.name);
        const updatedLogs = await getActivityLogs(20);
        setLogs(updatedLogs);
      }
    } catch (error) {
      console.error("Error updating firm subscription:", error);
      alert("حدث خطأ أثناء تحديث الاشتراك");
    }
  };

  const handleApproveRequest = async (requestId: string, firmId: string, planId: string, planName: string) => {
    // Verify user is super admin
    if (!currentUser) {
      alert('يجب تسجيل الدخول للموافقة على الطلبات.');
      return;
    }
    
    if (currentUser.email?.toLowerCase() !== 'elswa770@gmail.com') {
      alert('غير مصرح لك بهذه العملية. فقط المسؤول الرئيسي يمكنه الموافقة على الطلبات.');
      return;
    }

    try {
      // Find the specific request to get its billing cycle
      const request = subscriptionRequests.find(r => r.id === requestId);
      
      console.log('Request found:', request);
      console.log('Request billingCycle:', request?.billingCycle);
      console.log('Plan ID:', planId);
      console.log('Plan Name:', planName);
      
      // Update firm subscription using billing cycle from the request
      const startDate = new Date();
      const endDate = new Date(startDate);
      
      // Calculate end date based on request billing cycle
      if (request?.billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
        console.log('Using yearly billing cycle from request');
      } else if (request?.billingCycle === 'daily') {
        endDate.setDate(endDate.getDate() + 1);
        console.log('Using daily billing cycle from request');
      } else {
        // Default to monthly
        endDate.setMonth(endDate.getMonth() + 1);
        console.log('Using monthly billing cycle (default)');
      }
      
      console.log('Start date:', startDate);
      console.log('End date:', endDate);
      console.log('Saving billing cycle:', request?.billingCycle);
      
      await updateDoc(doc(db, 'firms', firmId), {
        subscriptionPlan: planId,
        subscriptionStatus: 'active',
        subscriptionEndDate: endDate.toISOString().split('T')[0],
        billingCycle: request?.billingCycle || 'monthly', // Save the billing cycle from the request
        // Clear trial data when upgrading to paid plan
        trialStartDate: null,
        trialEndDate: null,
        hasUsedTrial: true,
        updatedAt: new Date().toISOString()
      });

      // Update request status
      await updateDoc(doc(db, 'subscriptionRequests', requestId), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.name
      });

      // Refresh data
      const requestsSnapshot = await getDocs(collection(db, 'subscriptionRequests'));
      const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort requests: pending first, then by date (newest first)
      const sortedRequests = requestsData.sort((a, b) => {
        // First, sort by status: pending first, then approved, then rejected
        const statusOrder = { pending: 0, approved: 1, rejected: 2 };
        const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
        const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
        
        if (aStatusOrder !== bStatusOrder) {
          return aStatusOrder - bStatusOrder;
        }
        
        // Then sort by date (newest first)
        const aDate = a.createdAt ? (typeof a.createdAt === 'string' ? new Date(a.createdAt) : new Date((a.createdAt as any).seconds * 1000)) : new Date(0);
        const bDate = b.createdAt ? (typeof b.createdAt === 'string' ? new Date(b.createdAt) : new Date((b.createdAt as any).seconds * 1000)) : new Date(0);
        
        return bDate.getTime() - aDate.getTime();
      });
      
      setSubscriptionRequests(sortedRequests);

      const firmsSnapshot = await getDocs(collection(db, 'firms'));
      setFirms(firmsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Firm)));

      // Update subscription status in Layout for all connected users
      if (window.parent !== window) {
        // Try to update parent window subscription status
        window.parent.postMessage({ 
          type: 'SUBSCRIPTION_UPDATED', 
          status: 'active',
          firmId: firmId 
        }, '*');
      }
      
      // Also update current firm data
      const updatedFirm = firmsSnapshot.docs.find(doc => doc.id === firmId);
      if (updatedFirm) {
        const firmData = { id: firmId, ...updatedFirm.data() } as Firm;
        // Update localStorage to trigger Layout re-render
        localStorage.setItem('currentFirm', JSON.stringify(firmData));
        // Dispatch custom event to notify Layout
        window.dispatchEvent(new CustomEvent('subscriptionUpdated', { 
          detail: { status: 'active', firm: firmData } 
        }));
      }

      const cycleText = request?.billingCycle === 'yearly' ? 'سنوية' : 
                       request?.billingCycle === 'daily' ? 'يومية' : 'شهرية';
      alert(`تم الموافقة على طلب الاشتراك وتجديد اشتراك المكتب بـ ${planName} (${cycleText})`);
    } catch (error) {
      console.error("Error approving request:", error);
      alert("حدث خطأ أثناء الموافقة على الطلب");
    }
  };

  const handleRejectRequest = async (requestId: string, firmName: string) => {
    if (!window.confirm(`هل أنت متأكد من رفض طلب اشتراك مكتب "${firmName}"؟`)) return;

    try {
      await updateDoc(doc(db, 'subscriptionRequests', requestId), {
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser?.name
      });

      // Refresh requests
      const requestsSnapshot = await getDocs(collection(db, 'subscriptionRequests'));
      const requestsData = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort requests: pending first, then by date (newest first)
      const sortedRequests = requestsData.sort((a, b) => {
        // First, sort by status: pending first, then approved, then rejected
        const statusOrder = { pending: 0, approved: 1, rejected: 2 };
        const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
        const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
        
        if (aStatusOrder !== bStatusOrder) {
          return aStatusOrder - bStatusOrder;
        }
        
        // Then sort by date (newest first)
        const aDate = a.createdAt ? (typeof a.createdAt === 'string' ? new Date(a.createdAt) : new Date((a.createdAt as any).seconds * 1000)) : new Date(0);
        const bDate = b.createdAt ? (typeof b.createdAt === 'string' ? new Date(b.createdAt) : new Date((b.createdAt as any).seconds * 1000)) : new Date(0);
        
        return bDate.getTime() - aDate.getTime();
      });
      
      setSubscriptionRequests(sortedRequests);

      alert(`تم رفض طلب اشتراك مكتب "${firmName}"`);
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("حدث خطأ أثناء رفض الطلب");
    }
  };

  if (currentUser?.email?.toLowerCase() !== 'elswa770@gmail.com') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <ShieldAlert className="w-16 h-16 mb-4 text-red-500" />
        <h2 className="text-2xl font-bold">غير مصرح لك بالدخول</h2>
        <p>هذه الصفحة مخصصة للإدارة العليا فقط.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full">جاري تحميل بيانات الإدارة...</div>;
  }

  const activeFirms = firms.filter(f => f.subscriptionStatus === 'active').length;
  const trialFirms = firms.filter(f => f.subscriptionStatus === 'trial').length;
  
  const filteredFirms = firms.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-600" />
            لوحة تحكم الإدارة العليا (Super Admin)
          </h1>
          <p className="text-slate-500 dark:text-slate-400">إدارة مكاتب المحاماة، الاشتراكات، ومراقبة النظام</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => setActiveTab('firms')}
          className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'firms' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> احصائيات النظام
          </div>
          {activeTab === 'firms' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('plans')}
          className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'plans' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> باقات الاشتراك
          </div>
          {activeTab === 'plans' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'users' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" /> المستخدمين
          </div>
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('offices')}
          className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'offices' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" /> ادارة المكاتب
          </div>
          {activeTab === 'offices' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'logs' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" /> سجل النظام
          </div>
          {activeTab === 'logs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-3 font-bold text-sm transition-colors relative ${activeTab === 'requests' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" /> طلبات الاشتراك
            {subscriptionRequests.filter(r => r.status === 'pending').length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {subscriptionRequests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </div>
          {activeTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
        </button>
      </div>

      {activeTab === 'firms' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-bold">إجمالي المكاتب</p>
                  <h3 className="text-2xl font-bold">{firms.length}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-bold">مكاتب نشطة</p>
                  <h3 className="text-2xl font-bold">{activeFirms}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-bold">فترات تجريبية</p>
                  <h3 className="text-2xl font-bold">{trialFirms}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-bold">إجمالي المستخدمين</p>
                  <h3 className="text-2xl font-bold">{users.length}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Revenue Stats */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" /> إيرادات الاشتراكات
              </h2>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>2024</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-sm text-slate-500 font-bold mb-2">إجمالي الإيرادات</p>
                <p className="text-3xl font-bold text-emerald-600">{revenueData.totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-slate-500">جنيه</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 font-bold mb-2">هذا الشهر</p>
                <p className="text-2xl font-bold text-blue-600">{revenueData.monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm text-slate-500">جنيه</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 font-bold mb-2">هذا الأسبوع</p>
                <p className="text-xl font-bold text-indigo-600">{revenueData.weeklyRevenue.toLocaleString()}</p>
                <p className="text-sm text-slate-500">جنيه</p>
              </div>
            </div>

            {/* Simple Revenue Chart */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
              <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4">الإيرادات الشهرية</h3>
              <div className="flex items-end justify-between h-24 px-4">
                {revenueData.monthlyData.map((item, index) => {
                  const maxValue = Math.max(...revenueData.monthlyData.map(d => d.value), 100);
                  const heightPercentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-bold mb-1">
                        {item.value > 0 ? `${item.value.toLocaleString()}` : '0'}
                      </span>
                      <div className="w-full max-w-6 bg-slate-200 dark:bg-slate-700 rounded-b relative" style={{ height: '80px' }}>
                        <div 
                          className={`w-full ${item.color} rounded-b transition-all duration-300 absolute bottom-0`}
                          style={{ 
                            height: `${Math.max(heightPercentage, 2)}%`,
                            minHeight: '2px'
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-500 mt-1">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* System Monitoring */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" /> صحة النظام
              </h2>
              <div className="space-y-3">
                {[
                  { label: 'قاعدة البيانات', status: 'operational', icon: Server },
                  { label: 'واجهة البرمجة (API)', status: 'operational', icon: Terminal },
                  { label: 'التخزين', status: 'operational', icon: Building },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-bold">{item.label}</span>
                    </div>
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">يعمل</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-600" /> استهلاك الموارد
                </h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <RefreshCw className={`w-4 h-4 ${refreshingResources ? 'animate-spin' : ''}`} />
                  <span>آخر تحديث: {resourceMetrics?.lastUpdate || 'جاري التحميل...'}</span>
                </div>
              </div>
              
              {resourceMetrics ? (
                <div className="space-y-6">
                  {/* Resource Usage Items */}
                  <div className="space-y-4">
                    {[
                      { 
                        label: 'المعالج (CPU)', 
                        value: resourceMetrics.cpuUsage,
                        status: 'استخدام طبيعي',
                        safe: resourceMetrics.cpuUsage < 50,
                        icon: '⚡',
                        color: 'text-blue-600',
                        barColor: 'bg-blue-500'
                      },
                      { 
                        label: 'الذاكرة (RAM)', 
                        value: resourceMetrics.ramUsage,
                        status: 'استخدام طبيعي',
                        safe: resourceMetrics.ramUsage < 50,
                        icon: '🧠',
                        color: 'text-green-600',
                        barColor: 'bg-green-500'
                      },
                      { 
                        label: 'التخزين', 
                        value: resourceMetrics.storageUsage,
                        status: 'استخدام طبيعي',
                        safe: resourceMetrics.storageUsage < 60,
                        icon: '💾',
                        color: 'text-purple-600',
                        barColor: 'bg-purple-500'
                      },
                    ].map((item, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{item.icon}</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                          </div>
                          <span className={`font-bold text-2xl ${item.color}`}>{item.value}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 relative">
                          <div 
                            className={`h-3 rounded-full transition-all duration-500 ${item.barColor}`} 
                            style={{ width: `${item.value}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-green-600">{item.status}</span>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="font-bold text-slate-500">آمن</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700" dir="rtl">
                    <div className="space-y-2 text-right">
                      <div className="flex justify-start items-center gap-2">
                        <span className="text-sm font-bold text-slate-600">إجمالي المستخدمين:</span>
                        <span className="font-bold text-lg text-slate-800">{resourceMetrics.totalUsers}</span>
                      </div>
                      <div className="flex justify-start items-center gap-2">
                        <span className="text-sm font-bold text-slate-600">متوسط استخدام النظام:</span>
                        <span className="font-bold text-lg text-slate-800">{resourceMetrics.averageSystemUsage}%</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <div className="flex justify-start items-center gap-2">
                        <span className="text-sm font-bold text-slate-600">عدد المكاتب النشطة:</span>
                        <span className="font-bold text-lg text-slate-800">{resourceMetrics.activeOffices}</span>
                      </div>
                      <div className="flex justify-start items-center gap-2">
                        <span className="text-sm font-bold text-slate-600">إجمالي التخزين المستخدم:</span>
                        <span className="font-bold text-lg text-slate-800">{resourceMetrics.totalUsedStorage}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-6">
                    <button
                      onClick={fetchResourceMetrics}
                      disabled={refreshingResources}
                      className="flex items-center gap-2 px-6 py-3 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="تحديث البيانات الآن"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshingResources ? 'animate-spin' : ''}`} />
                      تحديث البيانات الآن
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin ml-3" />
                  <span className="text-lg">جاري تحميل بيانات الموارد...</span>
                </div>
              )}
            </div>
          </div>

          {/* Office Statistics Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                إحصائيات المكاتب والاستهلاك
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
                  <tr>
                    <th className="p-4 font-bold">اسم المكتب</th>
                    <th className="p-4 font-bold">الباقة</th>
                    <th className="p-4 font-bold">المستخدمون</th>
                    <th className="p-4 font-bold">القضايا</th>
                    <th className="p-4 font-bold">الموكلون</th>
                    <th className="p-4 font-bold">المحامون</th>
                    <th className="p-4 font-bold">نسبة الاستخدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredFirms.map(firm => {
                    // Calculate actual usage from Firebase data
                    const firmUsers = users.filter(u => u.firmId === firm.id).length;
                    const firmCases = cases.filter(c => c.firmId === firm.id).length;
                    const firmClients = clients.filter(c => c.firmId === firm.id).length;
                    const firmLawyers = users.filter(u => u.firmId === firm.id && u.roleLabel === 'lawyer').length;
                    
                    // Get actual subscription limits from Firebase plans
                    // Try to find plan by ID first, then by name
                    const plan = plans.find(p => 
                      p.id === firm.subscriptionPlan || 
                      p.name === firm.subscriptionPlan
                    );
                    let planName;
                    
                    if (firm.subscriptionPlan === 'trial' || firm.subscriptionStatus === 'trial') {
                      planName = `${plan ? plan.name : 'Basic'} (تجريبي)`;
                    } else {
                      planName = plan ? plan.name : firm.subscriptionPlan;
                    }
                    
                    // Handle trial period and regular plans
                    let limits;
                    if (firm.subscriptionPlan === 'trial' || firm.subscriptionStatus === 'trial') {
                      // Trial period has specific limits: 1 user, 1 lawyer, 1 client, 2 cases
                      limits = {
                        users: 1,
                        cases: 2,
                        clients: 1,
                        lawyers: 1
                      };
                    } else if (plan) {
                      // Check if plan has unlimited limits
                      const isUnlimited = (key: string) => {
                        const value = (plan as any)[key];
                        return value === -1 || value === 'unlimited' || value === null || value === undefined;
                      };
                      
                      limits = {
                        users: isUnlimited('maxUsers') ? -1 : ((typeof plan.maxUsers === 'number' && plan.maxUsers > 0) ? plan.maxUsers : 3),
                        cases: isUnlimited('maxCases') ? -1 : ((typeof plan.maxCases === 'number' && plan.maxCases > 0) ? plan.maxCases : 10),
                        clients: isUnlimited('maxClients') ? -1 : ((typeof plan.maxClients === 'number' && plan.maxClients > 0) ? plan.maxClients : 20),
                        lawyers: isUnlimited('maxLawyers') ? -1 : ((typeof plan.maxLawyers === 'number' && plan.maxLawyers > 0) ? plan.maxLawyers : 2)
                      };
                    } else {
                      // Fallback to basic limits
                      limits = {
                        users: 3,
                        cases: 10,
                        clients: 20,
                        lawyers: 2
                      };
                    }
                    
                    // Helper function to display unlimited values
                    const displayValue = (current: number, limit: number) => {
                      if (limit === -1) {
                        return `${current}/غير محدود`;
                      }
                      return `${current}/${limit}`;
                    };

                    const getColorClass = (current: number, limit: number) => {
                      if (limit === -1) return 'text-green-600'; // Unlimited is always green
                      return current >= limit ? 'text-red-600' : current >= limit * 0.8 ? 'text-amber-600' : 'text-green-600';
                    };

                    const getTooltip = (current: number, limit: number) => {
                      if (limit === -1) {
                        return `الاستخدام: ${current} (غير محدود)`;
                      }
                      return `الاستخدام: ${current} من ${limit} (${Math.round(current/limit*100)}%)`;
                    };

                    // Calculate usage percentage (skip unlimited limits)
                    const calculatePercentage = (current: number, limit: number) => {
                      if (limit === -1) return 0; // Don't count unlimited in percentage
                      return current / limit;
                    };

                    const usagePercentage = Math.round(
                      (calculatePercentage(firmUsers, limits.users) + 
                       calculatePercentage(firmCases, limits.cases) + 
                       calculatePercentage(firmClients, limits.clients) + 
                       calculatePercentage(firmLawyers, limits.lawyers)) / 4 * 100
                    );
                    
                    return (
                      <tr key={firm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4 font-bold text-slate-800 dark:text-white">{firm.name}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                              firm.subscriptionStatus === 'trial' 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {planName}
                            </span>
                            {firm.subscriptionStatus === 'trial' && (
                              <Activity className="w-3 h-3 text-amber-600" />
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className={`font-bold ${getColorClass(firmUsers, limits.users)}`}
                                  title={getTooltip(firmUsers, limits.users)}>
                              {displayValue(firmUsers, limits.users)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className={`font-bold ${getColorClass(firmCases, limits.cases)}`}
                                  title={getTooltip(firmCases, limits.cases)}>
                              {displayValue(firmCases, limits.cases)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-slate-400" />
                            <span className={`font-bold ${getColorClass(firmClients, limits.clients)}`}
                                  title={getTooltip(firmClients, limits.clients)}>
                              {displayValue(firmClients, limits.clients)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-slate-400" />
                            <span className={`font-bold ${getColorClass(firmLawyers, limits.lawyers)}`}
                                  title={getTooltip(firmLawyers, limits.lawyers)}>
                              {displayValue(firmLawyers, limits.lawyers)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    usagePercentage >= 100 ? 'bg-red-500' : 
                                    usagePercentage >= 80 ? 'bg-amber-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className={`font-bold text-sm min-w-[3rem] text-left ${
                              usagePercentage >= 100 ? 'text-red-600' : 
                              usagePercentage >= 80 ? 'text-amber-600' : 'text-green-600'
                            }`}
                          title={`متوسط الاستخدام الإجمالي: ${usagePercentage}%`}>
                              {usagePercentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-xl flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              إدارة الباقات والاشتراكات
            </h2>
            <button 
              onClick={() => { setEditingPlan(null); setIsPlanModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              إضافة باقة جديدة
            </button>
          </div>

          {/* Plan Ordering Controls */}
          <div className="flex items-center justify-between mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                ترتيب الباقات (اسحب وأفلت للترتيب أو استخدم الأزرار)
              </span>
            </div>
            <div className="text-xs text-amber-600 dark:text-amber-400">
              الترتيب سيظهر لجميع المستخدمين
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.length === 0 && (
              <div className="col-span-3 text-center py-8 text-slate-500">
                <p>لا توجد باقات حالياً</p>
                <p className="text-sm">اضغط على "إضافة باقة جديدة" لإنشاء باقة جديدة</p>
              </div>
            )}
            {plans.map((plan, index) => (
              <div key={plan.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col hover:shadow-lg transition-shadow relative">
                {/* Order Controls */}
                <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                  <button
                    onClick={() => movePlanUp(plan.id)}
                    disabled={index === 0}
                    className={`p-1.5 rounded-lg transition-colors ${
                      index === 0 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200'
                    }`}
                    title="تحريك للأعلى"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => movePlanDown(plan.id)}
                    disabled={index === plans.length - 1}
                    className={`p-1.5 rounded-lg transition-colors ${
                      index === plans.length - 1 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200'
                    }`}
                    title="تحريك للأسفل"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
                
                {/* Order Badge */}
                <div className="absolute top-2 right-2 z-10 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-full text-xs font-bold">
                  #{index + 1}
                </div>
                
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">{plan.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        plan.isActive 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {plan.isActive ? 'نشطة' : 'معطلة'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingPlan(plan); setIsPlanModalOpen(true); }} className="text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeletePlan(plan.id)} className="text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-indigo-600">{plan.price}</span>
                    <span className="text-sm text-slate-500 font-bold">{plan.currency} / {plan.billingCycle === 'daily' ? 'يومياً' : plan.billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً'}</span>
                  </div>
                </div>
                <div className="p-6 flex-1 space-y-4">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {plan.maxUsers === -1 ? 'غير محدود' : (plan.maxUsers || 0)}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">مستخدمين</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {plan.maxCases === -1 ? 'غير محدود' : (plan.maxCases || 0)}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">قضية</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {plan.maxClients === -1 ? 'غير محدود' : (plan.maxClients || 0)}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">موكلين</div>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {plan.maxStorageGB === -1 ? 'غير محدود' : (plan.maxStorageGB || 0)}
                      </div>
                      <div className="text-xs text-amber-700 dark:text-amber-300">جيجابايت</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                        <Zap className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">المميزات المضمنة</h4>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors">
                          <div className="flex-shrink-0">
                            <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Plan Info */}
                  <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">معرّف الباقة:</span>
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{plan.id}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">العملة:</span>
                        <div className="font-semibold text-slate-700 dark:text-slate-300">{plan.currency}</div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">دورة الفوترة:</span>
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          {plan.billingCycle === 'daily' ? 'يومي' : plan.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">الحالة:</span>
                        <div className={`font-semibold ${
                          plan.isActive 
                            ? 'text-emerald-600 dark:text-emerald-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {plan.isActive ? 'نشطة' : 'معطلة'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'offices' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="font-bold text-lg">إدارة مكاتب المحاماة</h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="بحث عن مكتب..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-bold">اسم المكتب</th>
                  <th className="p-4 font-bold">الباقة</th>
                  <th className="p-4 font-bold">الحالة</th>
                  <th className="p-4 font-bold">تاريخ الانتهاء</th>
                  <th className="p-4 font-bold">المستخدمين</th>
                  <th className="p-4 font-bold">تاريخ التسجيل</th>
                  <th className="p-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filteredFirms.map(firm => {
                  const firmUsers = users.filter(u => u.firmId === firm.id).length;
                  const plan = plans.find(p => p.id === firm.subscriptionPlan);
                  const planName = plan ? plan.name : firm.subscriptionPlan;
                  return (
                    <tr key={firm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800 dark:text-white">{firm.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold uppercase">
                          {planName}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max ${
                          firm.subscriptionStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                          firm.subscriptionStatus === 'trial' ? 'bg-amber-100 text-amber-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {firm.subscriptionStatus === 'active' ? <CheckCircle className="w-3 h-3" /> : 
                           firm.subscriptionStatus === 'trial' ? <Activity className="w-3 h-3" /> : 
                           <XCircle className="w-3 h-3" />}
                          {firm.subscriptionStatus === 'active' ? 'نشط' : 
                           firm.subscriptionStatus === 'trial' ? 'تجريبي' : 'ملغي'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {(() => {
                          if (!firm.subscriptionEndDate) return 'غير محدد';
                          
                          try {
                            // Handle different date formats
                            let date: Date;
                            
                            if (typeof firm.subscriptionEndDate === 'string') {
                              // If it's a string, try to parse it
                              date = new Date(firm.subscriptionEndDate);
                            } else if ((firm.subscriptionEndDate as any)?.seconds) {
                              // If it's a Firestore timestamp
                              date = new Date((firm.subscriptionEndDate as any).seconds * 1000);
                            } else {
                              // Fallback
                              date = new Date(firm.subscriptionEndDate as any);
                            }
                            
                            // Check if date is valid
                            if (isNaN(date.getTime())) {
                              return 'تاريخ غير صالح';
                            }
                            
                            return date.toLocaleDateString('ar-SA');
                          } catch (error) {
                            console.error('Date parsing error:', error, 'subscriptionEndDate:', firm.subscriptionEndDate);
                            return 'تاريخ غير صالح';
                          }
                        })()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-800 dark:text-white">{firmUsers}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        {(() => {
                          try {
                            // Handle different date formats for createdAt
                            let date: Date;
                            
                            if (typeof firm.createdAt === 'string') {
                              // If it's a string, try to parse it
                              date = new Date(firm.createdAt);
                            } else if ((firm.createdAt as any)?.seconds) {
                              // If it's a Firestore timestamp
                              date = new Date((firm.createdAt as any).seconds * 1000);
                            } else {
                              // Fallback
                              date = new Date(firm.createdAt as any);
                            }
                            
                            // Check if date is valid
                            if (isNaN(date.getTime())) {
                              return 'تاريخ غير صالح';
                            }
                            
                            return date.toLocaleDateString('ar-SA');
                          } catch (error) {
                            console.error('Date parsing error:', error, 'createdAt:', firm.createdAt);
                            return 'تاريخ غير صالح';
                          }
                        })()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingFirm(firm);
                              setIsFirmModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                          >
                            <Edit className="w-3 h-3" />
                            تعديل
                          </button>
                          <button
                            onClick={() => handleToggleFirmStatus(firm.id, firm.subscriptionStatus)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors text-sm ${
                              firm.subscriptionStatus === 'active' 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                            }`}
                          >
                            {firm.subscriptionStatus === 'active' ? 'إيقاف' : 'تفعيل'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="font-bold text-lg">إدارة مستخدمي النظام</h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="بحث عن مستخدم..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-bold">الاسم</th>
                  <th className="p-4 font-bold">البريد الإلكتروني</th>
                  <th className="p-4 font-bold">المكتب</th>
                  <th className="p-4 font-bold">الدور</th>
                  <th className="p-4 font-bold">الحالة</th>
                  <th className="p-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(user => {
                  const firm = firms.find(f => f.id === user.firmId);
                  return (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-4 font-bold text-slate-800 dark:text-white">{user.name}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{firm?.name || user.firmId}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-bold">
                          {user.roleLabel}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {user.isActive ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={async () => {
                            if (!window.confirm(`هل أنت متأكد من ${user.isActive ? 'إيقاف' : 'تفعيل'} هذا المستخدم؟`)) return;
                            try {
                              await updateDoc(doc(db, 'users', user.id), { isActive: !user.isActive });
                              setUsers(users.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
                            } catch (error) {
                              console.error("Error updating user status:", error);
                              alert("حدث خطأ أثناء تحديث حالة المستخدم");
                            }
                          }}
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            user.isActive 
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {user.isActive ? 'إيقاف' : 'تفعيل'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" /> سجل نشاط النظام
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-bold">{log.user}</span> {log.action} <span className="font-bold text-indigo-600">{log.target}</span>
                </p>
                <span className="text-xs text-slate-400 ml-auto">{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm text-slate-500 text-center">لا توجد أنشطة مسجلة</p>}
          </div>
        </div>
      )}

      {/* Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg">{editingPlan?.id ? 'تعديل باقة' : 'إضافة باقة جديدة'}</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[calc(90vh-80px)] overflow-y-auto">
              <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold mb-1">اسم الباقة</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full border p-2 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                    value={editingPlan?.name || ''}
                    onChange={e => setEditingPlan({ ...editingPlan!, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">السعر</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full border p-2 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                    value={editingPlan?.price || 0}
                    onChange={e => setEditingPlan({ ...editingPlan!, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">دورة الفوترة</label>
                  <select 
                    className="w-full border p-2 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                    value={editingPlan?.billingCycle || 'monthly'}
                    onChange={e => setEditingPlan({ ...editingPlan!, billingCycle: e.target.value as any })}
                  >
                    <option value="daily">يومياً</option>
                    <option value="monthly">شهرياً</option>
                    <option value="yearly">سنوياً</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">أقصى عدد مستخدمين</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="flex-1 border p-2 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                      value={editingPlan?.maxUsers === -1 ? '' : (editingPlan?.maxUsers || 0)}
                      onChange={e => setEditingPlan({ ...editingPlan!, maxUsers: e.target.value === '' ? -1 : parseInt(e.target.value) })}
                      placeholder="اكتب العدد أو اترك فارغاً"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingPlan({ ...editingPlan!, maxUsers: -1 })}
                      className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                        editingPlan?.maxUsers === -1
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      غير محدود
                    </button>
                  </div>
                  {editingPlan?.maxUsers === -1 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">تم تعيين العدد كغير محدود</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">أقصى عدد قضايا</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="flex-1 border p-2 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                      value={editingPlan?.maxCases === -1 ? '' : (editingPlan?.maxCases || 0)}
                      onChange={e => setEditingPlan({ ...editingPlan!, maxCases: e.target.value === '' ? -1 : parseInt(e.target.value) })}
                      placeholder="اكتب العدد أو اترك فارغاً"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingPlan({ ...editingPlan!, maxCases: -1 })}
                      className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                        editingPlan?.maxCases === -1
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      غير محدود
                    </button>
                  </div>
                  {editingPlan?.maxCases === -1 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">تم تعيين العدد كغير محدود</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">أقصى مساحة تخزين (جيجابايت)</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="flex-1 border p-2 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                      value={editingPlan?.maxStorageGB === -1 ? '' : (editingPlan?.maxStorageGB || 0)}
                      onChange={e => setEditingPlan({ ...editingPlan!, maxStorageGB: e.target.value === '' ? -1 : parseInt(e.target.value) })}
                      placeholder="اكتب العدد أو اترك فارغاً"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingPlan({ ...editingPlan!, maxStorageGB: -1 })}
                      className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                        editingPlan?.maxStorageGB === -1
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      غير محدود
                    </button>
                  </div>
                  {editingPlan?.maxStorageGB === -1 && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">تم تعيين التخزين كغير محدود</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">أقصى عدد موكلين</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="flex-1 border p-2 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                      value={editingPlan?.maxClients === -1 ? '' : (editingPlan?.maxClients || 0)}
                      onChange={e => setEditingPlan({ ...editingPlan!, maxClients: e.target.value === '' ? -1 : parseInt(e.target.value) })}
                      placeholder="اكتب العدد أو اترك فارغاً"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingPlan({ ...editingPlan!, maxClients: -1 })}
                      className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                        editingPlan?.maxClients === -1
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      غير محدود
                    </button>
                  </div>
                  {editingPlan?.maxClients === -1 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">تم تعيين العدد كغير محدود</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">أقصى عدد محامين</label>
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      className="flex-1 border p-2 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                      value={editingPlan?.maxLawyers === -1 ? '' : (editingPlan?.maxLawyers || 0)}
                      onChange={e => setEditingPlan({ ...editingPlan!, maxLawyers: e.target.value === '' ? -1 : parseInt(e.target.value) })}
                      placeholder="اكتب العدد أو اترك فارغاً"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingPlan({ ...editingPlan!, maxLawyers: -1 })}
                      className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                        editingPlan?.maxLawyers === -1
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      غير محدود
                    </button>
                  </div>
                  {editingPlan?.maxLawyers === -1 && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">تم تعيين العدد كغير محدود</p>
                  )}
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold mb-1">المميزات</label>
                  <div className="space-y-2">
                    {editingPlan?.features?.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/30 rounded-lg">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <input 
                          type="text" 
                          className="flex-1 border p-2 rounded-lg dark:bg-slate-900 dark:border-slate-700 bg-white"
                          value={feature}
                          onChange={e => {
                            const newFeatures = [...(editingPlan?.features || [])];
                            newFeatures[idx] = e.target.value;
                            setEditingPlan({ ...editingPlan!, features: newFeatures });
                          }}
                          placeholder="اكتب مميزة الباقة"
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const newFeatures = editingPlan?.features?.filter((_, i) => i !== idx) || [];
                            setEditingPlan({ ...editingPlan!, features: newFeatures });
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => {
                        const newFeatures = [...(editingPlan?.features || []), ''];
                        setEditingPlan({ ...editingPlan!, features: newFeatures });
                      }}
                      className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة مميزة جديدة
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 py-2 border rounded-lg font-bold">إلغاء</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> حفظ الباقة
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Firm Subscription Modal */}
      {isFirmModalOpen && editingFirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="font-bold text-lg">تعديل اشتراك: {editingFirm.name}</h3>
              <button onClick={() => setIsFirmModalOpen(false)} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdateFirmSubscription} className="p-6 space-y-4">
              <div>
                <label htmlFor="subscription-plan" className="block text-sm font-bold mb-1">الباقة الحالية</label>
                <select 
                  id="subscription-plan"
                  className="w-full border p-2 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                  value={editingFirm.subscriptionPlan}
                  onChange={e => setEditingFirm({ ...editingFirm, subscriptionPlan: e.target.value as any })}
                >
                  <option value="">اختر باقة</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="subscription-status" className="block text-sm font-bold mb-1">حالة الاشتراك</label>
                <select 
                  id="subscription-status"
                  className="w-full border p-2 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                  value={editingFirm.subscriptionStatus}
                  onChange={e => setEditingFirm({ ...editingFirm, subscriptionStatus: e.target.value as any })}
                >
                  <option value="active">نشط</option>
                  <option value="inactive">موقوف</option>
                  <option value="trial">تجريبي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">تاريخ انتهاء الاشتراك</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="date" 
                    className="w-full border pr-10 pl-3 py-2 rounded-lg dark:bg-slate-900 dark:border-slate-700"
                    value={editingFirm.subscriptionEndDate || ''}
                    onChange={e => setEditingFirm({ ...editingFirm, subscriptionEndDate: e.target.value })}
                    placeholder="اختر تاريخ الانتهاء"
                    aria-label="تاريخ انتهاء الاشتراك"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsFirmModalOpen(false)} className="flex-1 py-2 border rounded-lg font-bold">إلغاء</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> تحديث الاشتراك
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg">طلبات الاشتراك</h2>
            <div className="flex gap-2">
              <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-sm font-bold">
                في الانتظار: {subscriptionRequests.filter(r => r.status === 'pending').length}
              </span>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-sm font-bold">
                موافق عليها: {subscriptionRequests.filter(r => r.status === 'approved').length}
              </span>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-bold">
                مرفوضة: {subscriptionRequests.filter(r => r.status === 'rejected').length}
              </span>
            </div>
          </div>

          {/* Advanced Search and Filters */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="بحث في الطلبات (المكتب، الباقة، السعر، دورة الفوترة)..." 
                  value={requestSearchTerm}
                  onChange={(e) => setRequestSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div>
                <select 
                  value={requestStatusFilter}
                  onChange={(e) => setRequestStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="pending">في الانتظار</option>
                  <option value="approved">موافق عليها</option>
                  <option value="rejected">مرفوضة</option>
                </select>
              </div>
              <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                <span className="font-semibold">
                  {filteredRequests.length} من {subscriptionRequests.length} طلب
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="text-right p-4 font-bold text-sm text-slate-700 dark:text-slate-300">المكتب</th>
                    <th className="text-right p-4 font-bold text-sm text-slate-700 dark:text-slate-300">الباقة</th>
                    <th className="text-right p-4 font-bold text-sm text-slate-700 dark:text-slate-300">المبلغ</th>
                    <th className="text-right p-4 font-bold text-sm text-slate-700 dark:text-slate-300">التاريخ</th>
                    <th className="text-right p-4 font-bold text-sm text-slate-700 dark:text-slate-300">الحالة</th>
                    <th className="text-right p-4 font-bold text-sm text-slate-700 dark:text-slate-300">إثبات التحويل</th>
                    <th className="text-right p-4 font-bold text-sm text-slate-700 dark:text-slate-300">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{request.firmName}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{request.firmId}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{request.planName}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{request.billingCycle === 'daily' ? 'يومياً' : request.billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-slate-800 dark:text-white">
                          {request.price} {request.currency}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                        {new Date(request.requestedAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {request.status === 'pending' ? 'في الانتظار' :
                           request.status === 'approved' ? 'موافق عليها' : 'مرفوضة'}
                        </span>
                      </td>
                      <td className="p-4">
                        {request.paymentProof ? (
                          <div className="space-y-2">
                            <span className="text-emerald-600 text-sm">✓ تم الرفع</span>
                            <button
                              onClick={() => {
                                // Handle both Base64 and URL types
                                let imageSrc = request.paymentProof;
                                if (request.paymentProof.startsWith('data:')) {
                                  // Base64 image - open in new tab
                                  window.open(request.paymentProof, '_blank');
                                } else if (request.paymentProof.startsWith('https://drive.google.com')) {
                                  // Google Drive URL - use webContentLink if available
                                  imageSrc = request.paymentProof.includes('/view?usp=sharing') 
                                    ? request.paymentProof.replace('/view?usp=sharing', '/uc?export=view')
                                    : request.paymentProof;
                                  window.open(imageSrc, '_blank');
                                } else {
                                  // Regular URL
                                  window.open(request.paymentProof, '_blank');
                                }
                              }}
                              className="text-indigo-600 text-sm underline hover:text-indigo-700"
                            >
                              فتح الصورة
                            </button>
                          </div>
                        ) : (
                          <span className="text-red-600 text-sm">✗ لم يتم الرفع</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveRequest(request.id, request.firmId, request.planId, request.planName)}
                                className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700"
                              >
                                موافقة
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.id, request.firmName)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                              >
                                رفض
                              </button>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <span className="text-emerald-600 text-xs font-bold">تمت الموافقة</span>
                          )}
                          {request.status === 'rejected' && (
                            <span className="text-red-600 text-xs font-bold">تم الرفض</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>لا توجد طلبات مطابقة للبحث</p>
                  <p className="text-sm mt-2">
                    {requestSearchTerm || requestStatusFilter !== 'all' 
                      ? 'جرب تغيير معايير البحث' 
                      : 'لا توجد طلبات اشتراك حالياً'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
