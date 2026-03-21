
import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Briefcase, Users, Gavel, FileText, BrainCircuit, LogOut, Menu, Bell, Calendar, X, Clock, AlertTriangle, CheckCircle, ChevronRight, ChevronLeft, Settings, BarChart3, Wallet, File, Search, Library, PlusCircle, Shield, CheckSquare, Map, Calculator, PenTool, Archive, Scale, Wifi, WifiOff, Cloud, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { AppUser } from '../types';
import { offlineManager } from '../services/offlineManager';
import { SubscriptionService } from '../src/services/subscriptionService';
import MobileNavigation from './MobileNavigation';

interface NotificationItem {
  id: string;
  date: string;
  time?: string;
  title: string;
  message?: string;
  caseNumber?: string;
  clientName?: string;
  court?: string;
  caseId?: string; 
  clientId?: string;
  hearingId?: string;
  appointmentId?: string;
  taskId?: string;
  type: 'hearing' | 'poa_expiry' | 'task' | 'appointment'; 
  urgency: 'critical' | 'high' | 'medium' | 'low';
  location?: string;
  assignedTo?: string;
}

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  notifications?: NotificationItem[];
  onNotificationClick?: (id: string, type: 'hearing' | 'poa_expiry' | 'task' | 'appointment') => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate, notifications = [], onNotificationClick, currentUser, onLogout }) => {
  // Sidebar State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});
  const [subscriptionStatus, setSubscriptionStatus] = useState<'active' | 'inactive' | 'trial'>('active');
  const [currentFirm, setCurrentFirm] = useState<any>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);
  
  // Connection State
  const [connectionStatus, setConnectionStatus] = useState<{
    online: boolean;
    pendingActions: number;
    lastSync?: string;
  }>({ online: true, pendingActions: 0 });

  // Trial Status State
  const [trialStatus, setTrialStatus] = useState<{
    isTrial: boolean;
    daysLeft: number;
    message: string;
    isExpired: boolean;
  }>({ isTrial: false, daysLeft: 0, message: '', isExpired: false });

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isDesktopInside = notificationRef.current && notificationRef.current.contains(target);
      const isMobileInside = mobileNotificationRef.current && mobileNotificationRef.current.contains(target);

      if (!isDesktopInside && !isMobileInside) {
        setIsNotificationsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check trial status
  useEffect(() => {
    const checkTrialStatus = async () => {
      if (currentUser?.firmId) {
        try {
          const status = await SubscriptionService.checkTrialStatus(currentUser.firmId);
          if (status.message && !status.isExpired) {
            setTrialStatus({
              isTrial: true,
              daysLeft: status.daysLeft,
              message: status.message,
              isExpired: status.isExpired
            });
          } else {
            setTrialStatus({ isTrial: false, daysLeft: 0, message: '', isExpired: false });
          }
        } catch (error) {
          console.error('Error checking trial status:', error);
          setTrialStatus({ isTrial: false, daysLeft: 0, message: '', isExpired: false });
        }
      }
    };

    checkTrialStatus();
  }, [currentUser?.firmId]);

  // Load and monitor connection status
  useEffect(() => {
    const loadConnectionStatus = async () => {
      try {
        const status = await offlineManager.getOfflineStatus();
        setConnectionStatus(status);
      } catch (error) {
        console.error('Failed to load connection status:', error);
      }
    };

    loadConnectionStatus();

    // Listen for connection status changes
    const unsubscribe = offlineManager.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    return unsubscribe;
  }, []);

  // Helper to format time
  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'م' : 'ص';
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Helper for notification styling
  const getNotificationStyle = (urgency: string) => {
    switch (urgency) {
      case 'critical': return { bg: 'bg-red-50', border: 'border-red-100', icon: 'text-red-600', text: 'text-red-800' };
      case 'high': return { bg: 'bg-amber-50', border: 'border-amber-100', icon: 'text-amber-600', text: 'text-amber-800' };
      case 'medium': return { bg: 'bg-blue-50', border: 'border-blue-100', icon: 'text-blue-600', text: 'text-blue-800' };
      default: return { bg: 'bg-slate-50', border: 'border-slate-100', icon: 'text-slate-500', text: 'text-slate-700' };
    }
  };

  const getNotificationIcon = (type: string, urgency: string) => {
    if (type === 'poa_expiry') return AlertTriangle;
    if (type === 'task') return CheckCircle;
    if (type === 'appointment') return Calendar;
    if (urgency === 'critical') return AlertTriangle;
    return Calendar;
  };

  // Navigation Groups Configuration
  const navGroups = [
    {
      title: 'لوحة التحكم',
      items: [
        { id: 'dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
        { id: 'ai-assistant', label: 'المساعد الذكي', icon: BrainCircuit, special: true },
      ]
    },
    {
      title: 'إدارة القضايا',
      items: [
        { id: 'cases', label: 'جميع القضايا', icon: Briefcase },
        { id: 'hearings', label: 'الجلسات', icon: Gavel },
        { id: 'appointments', label: 'المواعيد', icon: Calendar },
        { id: 'tasks', label: 'المهام', icon: CheckSquare },
        { id: 'generator', label: 'العقود والمحررات', icon: PenTool },
      ]
    },
    {
      title: 'إدارة العملاء',
      items: [
        { id: 'clients', label: 'الموكلين', icon: Users },
        { id: 'lawyers', label: 'فريق المحامين', icon: Scale },
      ]
    },
    {
      title: 'المصادر القانونية',
      items: [
        { id: 'references', label: 'المراجع القانونية', icon: Library },
        { id: 'locations', label: 'دليل المحاكم', icon: Map },
        { id: 'calculators', label: 'الحاسبات القانونية', icon: Calculator },
      ]
    },
    {
      title: 'المستندات والأرشيف',
      items: [
        { id: 'documents', label: 'المستندات', icon: File },
        { id: 'archive', label: 'الأرشيف الرقمي', icon: Archive },
      ]
    },
    {
      title: 'المالية والتقارير',
      items: [
        { id: 'fees', label: 'الأتعاب والمصروفات', icon: Wallet },
        { id: 'reports', label: 'التقارير والإحصائيات', icon: BarChart3 },
      ]
    },
    {
      title: 'إدارة النظام',
      items: [
        { id: 'settings', label: 'الإعدادات العامة', icon: Settings },
        { id: 'advanced-settings', label: 'الإعدادات المتقدمة', icon: Settings },
        { id: 'subscription', label: 'الاشتراكات والباقات', icon: Shield },
        { id: 'office-admin', label: 'إدارة المكتب', icon: Shield },
        ...(currentUser?.email === 'elswa770@gmail.com' ? [{ id: 'super-admin', label: 'الإدارة العليا', icon: Shield }] : [])
      ]
    }
  ];

  // Toggle section collapse
  const toggleSection = (sectionTitle: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle]
    }));
  };

  // Check subscription status on component mount
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (currentUser?.firmId) {
        try {
          const firm = await SubscriptionService.getCurrentFirm(currentUser.firmId);
          if (firm) {
            // If trial is expired, update status
            if (firm.subscriptionStatus === 'trial') {
              await SubscriptionService.checkTrialStatus(currentUser.firmId);
              const updatedFirm = await SubscriptionService.getCurrentFirm(currentUser.firmId);
              setSubscriptionStatus(updatedFirm?.subscriptionStatus || 'inactive');
            } else {
              setSubscriptionStatus(firm.subscriptionStatus);
            }
          }
        } catch (error) {
          console.error('Error checking subscription status:', error);
          setSubscriptionStatus('inactive');
        }
      }
    };

    checkSubscriptionStatus();
  }, [currentUser?.firmId]);

  // Auto-expand sections with active items
  useEffect(() => {
    const newCollapsedSections = { ...collapsedSections };
    visibleGroups.forEach(group => {
      const hasActiveItem = group.items.some(item => activePage === item.id);
      if (hasActiveItem) {
        newCollapsedSections[group.title] = false;
      }
    });
    setCollapsedSections(newCollapsedSections);
  }, [activePage]);

  // Listen for subscription updates from SuperAdmin
  useEffect(() => {
    const handleSubscriptionUpdate = (event: any) => {
      console.log('Subscription update event received:', event.detail);
      if (event.detail?.status) {
        setSubscriptionStatus(event.detail.status);
      }
      if (event.detail?.firm) {
        setCurrentFirm(event.detail.firm);
      }
    };

    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);

    // Listen for messages from iframe (if any)
    const handleMessage = (event: any) => {
      if (event.data?.type === 'SUBSCRIPTION_UPDATED' && event.data?.firmId === currentFirm?.id) {
        setSubscriptionStatus('active');
        // Re-check subscription status by calling the function directly
        const recheckStatus = async () => {
          if (currentUser?.firmId) {
            try {
              const firm = await SubscriptionService.getCurrentFirm(currentUser.firmId);
              if (firm) {
                setSubscriptionStatus(firm.subscriptionStatus);
                setCurrentFirm(firm);
              }
            } catch (error) {
              console.error('Error rechecking subscription status:', error);
            }
          }
        };
        recheckStatus();
      }
    };

    window.addEventListener('message', handleMessage);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
      window.removeEventListener('message', handleMessage);
    };
  }, [currentFirm?.id]);

  // Helper to check permissions
  const checkPermission = (moduleId: string): boolean => {
    if (!currentUser) return false;
    
    // Super admin always has access
    if (currentUser.email === 'elswa770@gmail.com') {
      return true;
    }
    
    // Admin always has access
    if (currentUser.username === 'admin' || currentUser.roleLabel === 'مدير النظام') {
      return true;
    }

    // Check subscription status for non-super admin users
    if (moduleId !== 'subscription' && moduleId !== 'super-admin') {
      // Check if user is actually in trial period
      const isInTrialPeriod = currentUser.firmId && subscriptionStatus === 'trial' && 
        currentFirm?.trialEndDate && new Date(currentFirm.trialEndDate) >= new Date();
      
      // Block access if subscription is inactive AND not in trial period
      if (subscriptionStatus === 'inactive' && !isInTrialPeriod) {
        return false;
      }
    }

    if (moduleId === 'subscription' || moduleId === 'super-admin') {
      return true;
    }

    // Special handling for 'fees'
    if (moduleId === 'fees') {
       const hasFees = currentUser.permissions.find(p => p.moduleId === 'fees')?.access !== 'none';
       const hasExpenses = currentUser.permissions.find(p => p.moduleId === 'expenses')?.access !== 'none';
       return hasFees || hasExpenses;
    }
    
    // Check main permissions
    const permission = currentUser.permissions.find(p => p.moduleId === moduleId);
    return permission ? permission.access !== 'none' : false;
  };

  // Get REALISTIC badge count (Urgent only)
  const getBadgeCount = (id: string) => {
    const urgentNotifications = notifications.filter(n => n.urgency === 'critical' || n.urgency === 'high');

    if (id === 'hearings') return urgentNotifications.filter(n => n.type === 'hearing').length;
    if (id === 'clients') return urgentNotifications.filter(n => n.type === 'poa_expiry').length;
    if (id === 'appointments') return urgentNotifications.filter(n => n.type === 'appointment').length;
    if (id === 'tasks') return urgentNotifications.filter(n => n.type === 'task').length;
    return 0;
  };

  const getPageTitle = () => {
    switch (activePage) {
      case 'case-details': return 'تفاصيل القضية';
      case 'client-details': return 'ملف الموكل';
      case 'locations': return 'دليل المحاكم والجهات';
      case 'calculators': return 'الحاسبات القانونية';
      case 'generator': return 'منشئ العقود والمحررات';
      default: 
        return navGroups.flatMap(g => g.items).find(n => n.id === activePage)?.label || 'الميزان';
    }
  };

  const renderNotificationsList = () => (
    <div className="max-h-80 overflow-y-auto">
      {notifications.length > 0 ? (
        <div className="divide-y divide-slate-50 dark:divide-slate-700">
          {notifications.map((notif) => {
            const style = getNotificationStyle(notif.urgency);
            const Icon = getNotificationIcon(notif.type, notif.urgency);
            
            return (
              <div 
                key={notif.id} 
                onClick={() => {
                  if (onNotificationClick) {
                    let targetId = '';
                    if (notif.type === 'poa_expiry') {
                      targetId = notif.clientId || '';
                    } else if (notif.type === 'appointment') {
                      targetId = notif.appointmentId || '';
                    } else if (notif.type === 'task') {
                      targetId = notif.taskId || '';
                    } else {
                      targetId = notif.caseId || '';
                    }
                    onNotificationClick(targetId, notif.type);
                  }
                  setIsNotificationsOpen(false);
                }}
                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-l-4 ${style.border.replace('border', 'border-l')}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${style.bg} p-2 rounded-lg shrink-0`}>
                    <Icon className={`w-4 h-4 ${style.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                       <p className={`text-sm font-bold truncate pl-2 ${style.text}`} title={notif.title}>
                         {notif.title}
                       </p>
                       <div className="flex flex-col items-end gap-1">
                         <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 whitespace-nowrap">
                           {notif.date}
                         </span>
                       </div>
                    </div>
                    {notif.message && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 font-medium">{notif.message}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-1">
                       {notif.clientName && <span className="font-medium text-slate-500 dark:text-slate-400">{notif.clientName}</span>}
                       {notif.assignedTo && <span className="font-medium text-blue-500 dark:text-blue-400">المكلف: {notif.assignedTo}</span>}
                       {notif.location && <span className="font-medium text-green-500 dark:text-green-400">المكان: {notif.location}</span>}
                       {notif.time && <span className="font-bold text-primary-600">• {formatTime(notif.time)}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center text-slate-400">
          <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">لا توجد تنبيهات جديدة</p>
        </div>
      )}
    </div>
  );

  // Filter groups
  const visibleGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => checkPermission(item.id))
  })).filter(group => group.items.length > 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
      
      {/* --- Mobile Navigation (NEW) --- */}
      <div className="md:hidden">
        <MobileNavigation
          activePage={activePage}
          onNavigate={onNavigate}
          currentUser={currentUser}
          notificationsCount={notifications.length}
          onLogout={onLogout}
          theme="auto"
          pinnedItems={[]}
          onNotificationsToggle={() => setIsNotificationsOpen(!isNotificationsOpen)}
        />
      </div>

      {/* --- Legacy Mobile Header (REMOVED) --- */}
      {/* Old mobile header is now replaced by MobileNavigation */}

      {/* --- Sidebar (Desktop & Mobile) --- */}
      <aside className={`
        fixed md:static inset-y-0 right-0 z-50 bg-slate-900 dark:bg-slate-900 text-slate-100 transform transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : 'translate-x-full md:translate-x-0'}
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
        flex flex-col shadow-2xl md:shadow-none border-l border-slate-800
      `}>
        
        {/* Sidebar Header */}
        <div className={`h-16 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-5'} border-b border-slate-800 transition-all duration-300`}>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="bg-gradient-to-br from-primary-500 to-indigo-600 p-1.5 rounded-lg shadow-lg shadow-primary-900/50">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold tracking-wide">الميزان</h1>
            </div>
          )}
          {isSidebarCollapsed && (
             <div className="bg-gradient-to-br from-primary-500 to-indigo-600 p-2 rounded-lg">
                <Scale className="w-6 h-6 text-white" />
             </div>
          )}
          {/* Collapse Toggle (Desktop only) */}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {isSidebarCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Quick Action Button - Hide if no permissions for Cases */}
        {checkPermission('cases') && (
          <div className={`px-4 py-4 ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
             <button 
               onClick={() => onNavigate('cases')}
               className={`
                 flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl shadow-lg shadow-primary-900/20 transition-all duration-300
                 ${isSidebarCollapsed ? 'w-10 h-10 p-0' : 'w-full py-2.5 px-3'}
               `}
               title="قضية جديدة"
             >
                <PlusCircle className="w-5 h-5" />
                {!isSidebarCollapsed && <span className="font-bold text-sm">قضية جديدة</span>}
             </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {visibleGroups.map((group, groupIndex) => {
            const isCollapsed = collapsedSections[group.title] || false;
            const hasActiveItem = group.items.some(item => activePage === item.id);
            
            return (
              <div key={groupIndex} className="border border-slate-800/50 rounded-lg overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(group.title)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider
                    hover:text-slate-400 hover:bg-slate-800/30 transition-all duration-200
                    ${hasActiveItem ? 'text-slate-300 bg-slate-800/20' : ''}
                    ${isSidebarCollapsed ? 'px-2 justify-center' : ''}
                  `}
                  title={isSidebarCollapsed ? group.title : ''}
                >
                  {!isSidebarCollapsed && (
                    <>
                      <span>{group.title}</span>
                      <div className="flex items-center gap-2">
                        {hasActiveItem && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                        )}
                        <ChevronDown 
                          className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </>
                  )}
                  {isSidebarCollapsed && (
                    <div className="w-3 h-3 bg-slate-600 rounded"></div>
                  )}
                </button>

                {/* Section Content */}
                {!isSidebarCollapsed && (
                  <div className={`
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}
                  `}>
                    <div className="space-y-1 p-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.id;
                        const badgeCount = getBadgeCount(item.id);

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              onNavigate(item.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`
                              w-full flex items-center relative group rounded-lg transition-all duration-200
                              px-3 py-2 gap-3
                              ${isActive 
                                ? 'bg-slate-800 text-white shadow-md shadow-slate-900/20' 
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                              }
                              ${item.special && !isActive ? 'text-indigo-400 hover:text-indigo-300' : ''}
                            `}
                          >
                            {/* Active Indicator Line (Left) */}
                            {isActive && (
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-l-full"></div>
                            )}

                            <Icon className={`
                              w-5 h-5 
                              ${isActive ? 'text-primary-400' : ''} 
                              ${item.special && !isActive ? 'text-indigo-400' : ''}
                              transition-colors
                            `} />
                            
                            <div className="flex-1 flex justify-between items-center">
                              <span className={`font-medium text-sm ${isActive ? 'text-white' : ''}`}>
                                {item.label}
                              </span>
                              {badgeCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 min-w-[1.25rem] h-5 rounded-full flex items-center justify-center font-bold">
                                  {badgeCount}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer / User Profile */}
        <div className="border-t border-slate-800 bg-slate-900/50 p-2">
           <div className={`flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer group ${isSidebarCollapsed ? 'justify-center' : ''}`}>
              <div className="relative">
                 <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-slate-800 overflow-hidden">
                    {currentUser?.avatar ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : currentUser?.name.charAt(0)}
                 </div>
                 <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
              </div>
              
              {!isSidebarCollapsed && (
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{currentUser?.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser?.roleLabel}</p>
                 </div>
              )}
              
              {!isSidebarCollapsed && (
                 <button onClick={onLogout} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors" title="تسجيل الخروج">
                    <LogOut className="w-4 h-4" />
                 </button>
              )}
           </div>
        </div>
      </aside>

      {/* --- Main Content Area --- */}
      <main className="flex-1 h-[calc(100vh-64px)] md:h-screen overflow-y-auto bg-slate-50 dark:bg-slate-950 relative flex flex-col transition-colors duration-300">
        {/* Mobile Notification Dropdown Overlay */}
        {isNotificationsOpen && (
           <div 
             className="fixed inset-0 bg-black/50 z-40 md:hidden"
             onClick={() => setIsNotificationsOpen(false)}
           >
              <div 
                className="absolute top-16 left-4 right-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden"
                onClick={e => e.stopPropagation()}
                ref={mobileNotificationRef}
              >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm">التنبيهات</h3>
                      <button onClick={() => setIsNotificationsOpen(false)} title="إغلاق الإشعارات">
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                   </div>
                   {renderNotificationsList()}
              </div>
           </div>
        )}
        {/* Subscription Inactive Warning */}
        {subscriptionStatus === 'inactive' && currentUser?.email !== 'elswa770@gmail.com' && (
          <div className="bg-red-50 border-b border-red-200 dark:bg-red-900/20 dark:border-red-800 px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-bold text-red-800 dark:text-red-200">
                    اشتراكك غير نشط
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    انتهت فترة التجربة. يرجى الاشتراك في إحدى الباقات للاستمرار في استخدام التطبيق.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onNavigate('subscription')}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                تجديد الاشتراك
              </button>
            </div>
          </div>
        )}

        {/* Desktop Topbar */}
        <header className="bg-white dark:bg-slate-900 shadow-sm border-b border-slate-200 dark:border-slate-800 px-8 py-4 hidden md:flex justify-between items-center sticky top-0 z-30 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
             {activePage === 'ai-assistant' && <BrainCircuit className="w-6 h-6 text-indigo-500"/>}
             {getPageTitle()}
          </h2>
          
          <div className="flex items-center gap-6">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {connectionStatus.online ? (
                <>
                  <Wifi className="w-4 h-4 text-green-500" />
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">متصل</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">غير متصل</span>
                </>
              )}
              {connectionStatus.pendingActions > 0 && (
                <div className="flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded">
                    {connectionStatus.pendingActions}
                  </span>
                </div>
              )}
            </div>

            {/* Trial Status */}
            {trialStatus.isTrial && !trialStatus.isExpired && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg animate-pulse">
                <Timer className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  باقة تجريبية: {trialStatus.daysLeft} أيام متبقية
                </span>
              </div>
            )}

            {/* Global Search */}
            <div className="relative hidden lg:block">
               <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input type="text" placeholder="بحث عام (قضية، موكل، مستند)..." className="pl-4 pr-9 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm w-72 focus:ring-2 focus:ring-primary-500 transition-all dark:text-white" />
            </div>

            {/* Notifications Bell */}
            <div className="relative" ref={notificationRef}>
              <button 
                className="relative p-2.5 text-slate-500 hover:text-primary-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 rounded-full w-2 h-2 border border-white dark:border-slate-900"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute left-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                   <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm">التنبيهات</h3>
                      {notifications.length > 0 && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold border border-red-200">
                          {notifications.length} جديد
                        </span>
                      )}
                   </div>
                   {renderNotificationsList()}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Notification Dropdown Overlay */}
        {isNotificationsOpen && (
           <div 
             className="fixed inset-0 bg-black/50 z-40 md:hidden"
             onClick={() => setIsNotificationsOpen(false)}
           >
              <div 
                className="absolute top-16 left-4 right-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden"
                onClick={e => e.stopPropagation()}
                ref={mobileNotificationRef}
              >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm">التنبيهات</h3>
                      <button onClick={() => setIsNotificationsOpen(false)} title="إغلاق الإشعارات">
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                   </div>
                   {renderNotificationsList()}
              </div>
           </div>
        )}

        {/* Page Content */}
        <div className="p-6 max-w-7xl mx-auto w-full flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
