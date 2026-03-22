
import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SimplePermissionLevel } from './types';
import Layout from './components/Layout';
import Onboarding from './pages/Onboarding';
import Login from './pages/Login';

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Cases = lazy(() => import('./pages/Cases'));
const Clients = lazy(() => import('./pages/Clients'));
const Hearings = lazy(() => import('./pages/Hearings'));
const Documents = lazy(() => import('./pages/Documents'));
const Fees = lazy(() => import('./pages/Fees'));
const Reports = lazy(() => import('./pages/Reports'));
const AIAssistant = lazy(() => import('./pages/AIAssistant'));
const CaseDetails = lazy(() => import('./pages/CaseDetails'));
const ClientDetails = lazy(() => import('./pages/ClientDetails'));
const Settings = lazy(() => import('./pages/Settings'));
const AdvancedSettings = lazy(() => import('./pages/AdvancedSettings'));
const LegalReferences = lazy(() => import('./pages/LegalReferences'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Locations = lazy(() => import('./pages/Locations'));
const Calculators = lazy(() => import('./pages/Calculators'));
const DocumentGenerator = lazy(() => import('./pages/DocumentGenerator'));
const ArchivePage = lazy(() => import('./pages/Archive'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Lawyers = lazy(() => import('./pages/Lawyers'));
const LawyerDetails = lazy(() => import('./pages/LawyerDetails'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const OfficeAdminDashboard = lazy(() => import('./pages/OfficeAdminDashboard'));
const Subscription = lazy(() => import('./pages/Subscription'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-white dark:bg-slate-900">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full"></div>
      <p className="text-sm text-slate-600 dark:text-slate-400">جاري التحميل...</p>
    </div>
  </div>
);

import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { logActivity } from './services/activityService';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth, db } from './firebase';

// Initialize secondary auth instance for user creation
const secondaryAuth = auth;
import { Shield, AlertTriangle, User, Settings as SettingsIcon, FileText, Calendar, Users, CreditCard, Phone, Mail, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Plus, Search, Filter, X, Edit2, Trash2, Save, Upload, Download, Clock, CheckCircle, AlertCircle, Home, Briefcase, Building, UserCheck, Archive, Bell, Menu, LogOut, UserPlus, ShieldAlert, ArrowRight } from 'lucide-react';
import { 
  AppUser, 
  Case, 
  Client, 
  Hearing, 
  HearingStatus,
  Task, 
  Lawyer, 
  Appointment, 
  ActivityLog, 
  Role, 
  LegalReference,
  NotificationSettings, 
  SMTPSettings, 
  WhatsAppSettings, 
  AlertPreferences, 
  SecuritySettings, 
  LoginAttempt, 
  ActiveSession, 
  DataManagementSettings, 
  SystemHealth, 
  SystemError, 
  ResourceUsage, 
  MaintenanceSettings 
} from './types';
import { SubscriptionService } from './src/services/subscriptionService';
import { googleDriveService } from './src/services/googleDriveService';
import { MOCK_ROLES } from './services/mockData';

const sanitizeData = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (typeof obj === 'object' && typeof obj.toDate === 'function') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeData);
  if (typeof obj === 'object') {
    const sanitized: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        sanitized[key] = sanitizeData(obj[key]);
      }
    });
    return sanitized;
  }
  return obj;
};

function AppContent() {
  // Auth State from Context
  const { currentUser, firebaseUser, loading } = useAuth();
  const isAuthenticated = !!firebaseUser;

  useEffect(() => {
    googleDriveService.initialize().catch(err => {
      console.error("Failed to initialize Google Drive service", err);
    });
  }, []);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (currentUser?.firmId) {
      const savedSettings = localStorage.getItem(`app_general_settings_${currentUser.firmId}`);
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.theme) {
            setTheme(parsed.theme);
          }
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
      
      // Check if firm has trial subscription (skip for super admin)
      const checkTrialSubscription = async () => {
        // Skip subscription checks for super admin
        if (currentUser?.email?.toLowerCase() === 'elswa770@gmail.com') {
          // console.log('👑 Super admin detected - skipping subscription checks');
          return;
        }
        
        try {
          const firmDoc = await getDoc(doc(db, 'firms', currentUser.firmId));
          if (firmDoc.exists()) {
            const firmData = firmDoc.data();
            // console.log('🏢 Firm data on login:', firmData);
            
            // If firm has no subscription plan, create trial subscription
            if (!firmData.subscriptionPlan || firmData.subscriptionPlan === '') {
              // console.log('🎯 No subscription plan found, creating trial subscription...');
              await SubscriptionService.createTrialSubscription(currentUser.firmId);
              // console.log('✅ Trial subscription created successfully');
            } else if (firmData.subscriptionStatus === 'trial') {
              // Check if trial has expired
              const trialStatus = await SubscriptionService.checkTrialStatus(currentUser.firmId);
              if (trialStatus.isExpired) {
                // console.log('⏰ Trial has expired:', trialStatus.message);
                // You might want to show a modal or redirect to subscription page
              } else {
                // console.log('✅ Trial is active:', trialStatus.message);
              }
            }
          }
        } catch (error) {
          // console.error('❌ Error checking trial subscription:', error);
        }
      };
      
      checkTrialSubscription();
    }
  }, [currentUser?.firmId]);

  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedLawyerId, setSelectedLawyerId] = useState<string | null>(null);
  
  // Data State
  const [cases, setCases] = useState<Case[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>(MOCK_ROLES);
  const [references, setReferences] = useState<LegalReference[]>([]);
  const [currentFirm, setCurrentFirm] = useState<any>(null);

  // --- Firestore Data Fetching ---
  useEffect(() => {
    if (!currentUser?.firmId) return;
    const firmId = currentUser.firmId;

    const unsubFirm = onSnapshot(doc(db, 'firms', firmId), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentFirm({ id: docSnap.id, ...docSnap.data() });
      }
    });

    const qCases = query(collection(db, 'cases'), where('firmId', '==', firmId));
    const unsubCases = onSnapshot(qCases, (snapshot) => {
      setCases(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Case)));
    });

    const qClients = query(collection(db, 'clients'), where('firmId', '==', firmId));
    const unsubClients = onSnapshot(qClients, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Client)));
    });

    const qHearings = query(collection(db, 'hearings'), where('firmId', '==', firmId));
    const unsubHearings = onSnapshot(qHearings, (snapshot) => {
      setHearings(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Hearing)));
    });

    const qTasks = query(collection(db, 'tasks'), where('firmId', '==', firmId));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task)));
    });

    const qAppointments = query(collection(db, 'appointments'), where('firmId', '==', firmId));
    const unsubAppointments = onSnapshot(qAppointments, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Appointment)));
    });

    const qLawyers = query(collection(db, 'lawyers'), where('firmId', '==', firmId));
    const unsubLawyers = onSnapshot(qLawyers, (snapshot) => {
      setLawyers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Lawyer)));
    });

    // For activities: show all for super admin, otherwise filter by firm and limit to 5
    let qActivities;
    if (currentUser?.email?.toLowerCase() === 'elswa770@gmail.com') {
      // Super admin sees all activities (limited to 50 for performance)
      qActivities = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(50));
    } else {
      // Regular users see only their firm's activities (limited to 5 for dashboard)
      qActivities = query(collection(db, 'activities'), where('firmId', '==', firmId), orderBy('timestamp', 'desc'), limit(5));
    }
    const unsubActivities = onSnapshot(qActivities, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ActivityLog)));
    });

    const qUsers = query(collection(db, 'users'), where('firmId', '==', firmId));
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AppUser)));
    });

    const qReferences = query(collection(db, 'references'), where('firmId', '==', firmId));
    const unsubReferences = onSnapshot(qReferences, (snapshot) => {
      setReferences(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as LegalReference)));
    });

    return () => {
      unsubFirm();
      unsubCases();
      unsubClients();
      unsubHearings();
      unsubTasks();
      unsubAppointments();
      unsubLawyers();
      unsubActivities();
      unsubUsers();
      unsubReferences();
    };
  }, [currentUser?.firmId]);

  // --- Role Handlers ---
  const handleAddRole = (role: Role) => {
    setRoles([...roles, role]);
  };

  const handleUpdateRole = (updatedRole: Role) => {
    setRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter(r => r.id !== roleId));
  };

  // --- Theme Effect ---
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- Auth Handlers ---
  const handleLogout = () => {
    import('./firebase').then(({ auth, signOut }) => {
      signOut(auth);
    });
    setCurrentPage('dashboard');
  };

  // --- SMART NOTIFICATION SYSTEM ---
  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const notificationList: any[] = [];

    const parseDate = (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    // 1. Hearing Notifications (Existing)
    hearings.forEach(h => {
      if (!h.date) return;
      const hDate = parseDate(h.date);
      const diffTime = hDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const relatedCase = cases.find(c => c.id === h.caseId);
      const caseTitle = relatedCase?.title || 'قضية غير معروفة';

      if (diffDays >= 0 && h.status !== HearingStatus.COMPLETED && h.status !== HearingStatus.CANCELLED) {
        let title = '';
        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
        let message = '';

        if (diffDays === 0) {
          title = `جلسة اليوم: ${caseTitle}`;
          urgency = 'critical';
          message = 'يرجى مراجعة الملف والاستعداد للجلسة';
        } else if (diffDays === 1) {
          title = `جلسة غداً: ${caseTitle}`;
          urgency = 'high';
          message = 'تذكير: الجلسة غداً، هل تم تجهيز المستندات؟';
        } else if (diffDays === 3) {
          title = `جلسة بعد 3 أيام: ${caseTitle}`;
          urgency = 'medium';
          message = 'تذكير بالموعد القادم';
        } else if (diffDays === 7) {
          title = `جلسة بعد أسبوع: ${caseTitle}`;
          urgency = 'low';
          message = 'تنبيه مبكر';
        }

        if (title) {
          notificationList.push({
            id: `hearing-upcoming-${h.id}-${diffDays}`,
            date: h.date,
            time: h.time,
            title,
            message,
            caseNumber: relatedCase?.caseNumber,
            clientName: relatedCase?.clientName,
            court: relatedCase?.court,
            caseId: h.caseId,
            hearingId: h.id,
            type: 'hearing',
            urgency
          });
        }
      }

      if (diffDays < 0 && (h.status === HearingStatus.SCHEDULED || !h.status)) {
        notificationList.push({
          id: `hearing-overdue-${h.id}`,
          date: h.date,
          title: `تأخير إجراء: ${caseTitle}`,
          message: 'مر موعد الجلسة ولم يتم تحديث الحالة أو القرار',
          caseNumber: relatedCase?.caseNumber,
          clientName: relatedCase?.clientName,
          court: relatedCase?.court,
          caseId: h.caseId,
          hearingId: h.id,
          type: 'hearing',
          urgency: 'critical'
        });
      }

      if (diffDays <= 0 && h.requirements && !h.isCompleted && h.status !== HearingStatus.CANCELLED) {
         notificationList.push({
          id: `hearing-task-${h.id}`,
          date: h.date,
          title: `مطلوب تنفيذ: ${caseTitle}`,
          message: `المطلوب: ${h.requirements}`,
          caseNumber: relatedCase?.caseNumber,
          clientName: relatedCase?.clientName,
          caseId: h.caseId,
          hearingId: h.id,
          type: 'task',
          urgency: 'high'
        });
      }
    });

    // 2. Appointments Notifications (NEW)
    appointments.forEach(apt => {
      if (!apt.date) return;
      const aptDate = parseDate(apt.date);
      const diffTime = aptDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Only show appointments for today and upcoming
      if (diffDays >= 0 && diffDays <= 1) {
        const relatedCase = apt.relatedCaseId ? cases.find(c => c.id === apt.relatedCaseId) : null;
        const relatedClient = apt.relatedClientId ? clients.find(c => c.id === apt.relatedClientId) : null;
        
        let title = '';
        let urgency: 'critical' | 'high' | 'medium' | 'low' = 'medium';
        let message = '';
        
        if (diffDays === 0) {
          title = `موعد اليوم: ${apt.title}`;
          urgency = 'high';
          message = `الوقت: ${apt.startTime || 'غير محدد'} - ${apt.location || 'غير محدد'}`;
        } else if (diffDays === 1) {
          title = `موعد غداً: ${apt.title}`;
          urgency = 'medium';
          message = `الوقت: ${apt.startTime || 'غير محدد'} - ${apt.location || 'غير محدد'}`;
        }

        if (title) {
          notificationList.push({
            id: `appointment-${apt.id}`,
            date: apt.date,
            time: apt.startTime,
            title,
            message,
            caseNumber: relatedCase?.caseNumber,
            clientName: relatedClient?.name || relatedCase?.clientName,
            caseId: apt.relatedCaseId,
            clientId: apt.relatedClientId,
            appointmentId: apt.id,
            type: 'appointment',
            urgency,
            location: apt.location
          });
        }
      }
    });

    // 3. Tasks Notifications (NEW)
    tasks.forEach(task => {
      // Only show high priority tasks that are not completed
      if (task.status === 'completed') return;
      
      const isUrgent = task.priority === 'high';
      const isInProgress = task.status === 'in_progress' || task.status === 'pending';
      
      if (isUrgent && isInProgress) {
        const relatedCase = task.relatedCaseId ? cases.find(c => c.id === task.relatedCaseId) : null;
        const assignedUser = task.assignedTo ? users.find(u => u.id === task.assignedTo) : null;
        
        const urgency: 'critical' | 'high' | 'medium' | 'low' = 'high';
        const statusText = task.status === 'in_progress' ? 'جاري التنفيذ' : 'قيد الانتظار';
        
        notificationList.push({
          id: `task-${task.id}`,
          date: task.dueDate || today.toISOString().split('T')[0],
          title: `مهمة مستعجلة: ${task.title}`,
          message: `الحالة: ${statusText} - ${task.description || 'لا يوجد وصف'}`,
          caseNumber: relatedCase?.caseNumber,
          clientName: relatedCase?.clientName,
          caseId: task.relatedCaseId,
          taskId: task.id,
          type: 'task',
          urgency,
          assignedTo: assignedUser?.name
        });
      }
    });

    // 4. POA Expiry Notifications (Existing)
    const poaWarningDate = new Date(today);
    poaWarningDate.setDate(today.getDate() + 30); 

    clients.forEach(c => {
      if (!c.poaExpiry) return;
      const expiryDate = parseDate(c.poaExpiry);
      
      if (expiryDate < today) {
        notificationList.push({
          id: `poa-expired-${c.id}`,
          date: c.poaExpiry,
          title: `توكيل منتهي: ${c.name}`,
          message: 'يرجى تجديد التوكيل فوراً',
          clientName: c.name,
          clientId: c.id,
          type: 'poa_expiry',
          urgency: 'critical'
        });
      } else if (expiryDate <= poaWarningDate) {
        const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        notificationList.push({
          id: `poa-soon-${c.id}`,
          date: c.poaExpiry,
          title: `قرب انتهاء توكيل: ${c.name}`,
          message: `باقي ${daysLeft} يوم على الانتهاء`,
          clientName: c.name,
          clientId: c.id,
          type: 'poa_expiry',
          urgency: 'high'
        });
      }
    });

    return notificationList.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (urgencyOrder[a.urgency as keyof typeof urgencyOrder] !== urgencyOrder[b.urgency as keyof typeof urgencyOrder]) {
        return urgencyOrder[a.urgency as keyof typeof urgencyOrder] - urgencyOrder[b.urgency as keyof typeof urgencyOrder];
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [hearings, cases, clients, appointments, tasks, users]);

  const handleNotificationClick = (id: string, type: 'hearing' | 'poa_expiry' | 'task' | 'appointment') => {
    if (type === 'poa_expiry') {
      setSelectedClientId(id);
      setCurrentPage('client-details');
    } else if (type === 'appointment') {
      // For appointments, navigate to appointments page
      setCurrentPage('appointments');
    } else if (type === 'task') {
      // For tasks, navigate to tasks page
      setCurrentPage('tasks');
    } else {
      // For hearings, navigate to case details
      setSelectedCaseId(id); 
      setCurrentPage('case-details');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  if (isAuthenticated && (!currentUser || !currentUser.firmId || currentUser.firmId === '')) {
    return <Onboarding />;
  }

  // Check subscription status
  const isSuperAdmin = currentUser?.email?.toLowerCase() === 'elswa770@gmail.com';
  
  // Check if user is actually in trial period
  const isInTrialPeriod = currentFirm?.trialEndDate && new Date(currentFirm.trialEndDate) >= new Date();
  
  // Check if subscription is expired - only if NOT in trial period
  const isSubscriptionExpired = currentFirm && !isSuperAdmin && !isInTrialPeriod && (
    currentFirm.subscriptionStatus === 'inactive' || 
    (currentFirm.subscriptionEndDate && new Date(currentFirm.subscriptionEndDate) < new Date())
  );

  console.log('🔍 Subscription check:', {
    isSuperAdmin,
    isInTrialPeriod,
    trialEndDate: currentFirm?.trialEndDate,
    subscriptionStatus: currentFirm?.subscriptionStatus,
    isSubscriptionExpired
  });

  // Force redirect to subscription page if expired, unless they are super admin
  if (isSubscriptionExpired && currentPage !== 'subscription') {
    setCurrentPage('subscription');
  }

  // --- Permission Helpers ---
  const getPermission = (moduleId: string): SimplePermissionLevel => {
    if (!currentUser) return 'none';
    const perm = currentUser.permissions.find(p => p.moduleId === moduleId);
    return perm ? perm.access : 'none';
  };

  const hasAccess = (moduleId: string): boolean => {
    return getPermission(moduleId) !== 'none';
  };

  const isReadOnly = (moduleId: string): boolean => {
    return getPermission(moduleId) === 'read';
  };

  // --- App Logic ---

  const handleCaseClick = (caseId: string) => {
    setSelectedCaseId(caseId);
    setCurrentPage('case-details');
  };

  const handleBackToCases = () => {
    setSelectedCaseId(null);
    setCurrentPage('cases'); 
  };

  const handleClientClick = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentPage('client-details');
  };

  const handleBackToClients = () => {
    setSelectedClientId(null);
    setCurrentPage('clients');
  };

  const handleLawyerClick = (lawyerId: string) => {
    setSelectedLawyerId(lawyerId);
    setCurrentPage('lawyer-details');
  };

  const handleBackToLawyers = () => {
    setSelectedLawyerId(null);
    setCurrentPage('lawyers');
  };

  const handleAddCase = async (newCase: Case) => {
    if (!currentUser?.firmId) {
      console.error('❌ Cannot add case: currentUser or firmId is missing');
      return;
    }
    
    // Check if we're offline - if so, don't try to add to Firebase
    // The offline manager will handle this during sync
    if (!navigator.onLine) {
      console.log('📴 Offline detected in handleAddCase - skipping Firebase direct add');
      return;
    }
    
    const docRef = doc(collection(db, 'cases'));
    await setDoc(docRef, sanitizeData({ ...newCase, id: docRef.id, firmId: currentUser.firmId }));
    
    // Log activity
    await logActivity(
      currentUser.firmId, 
      currentUser.name || 'مستخدم', 
      'قام بإنشاء', 
      `قضية: ${newCase.title} - ${newCase.caseNumber}`,
      `رقم القضية: ${newCase.caseNumber}`
    );
  };

  // Separate function for updating local state only (used in offline mode)
  const handleAddCaseLocal = (newCase: Case) => {
    console.log('🔄 Adding case to local state only (offline mode):', {
      caseId: newCase.id,
      caseTitle: newCase.title
    });
    
    // Update local cases array without Firebase interaction
    setCases(prev => [...prev, newCase]);
  };

  const handleUpdateCase = async (updatedCase: Case) => {
    await updateDoc(doc(db, 'cases', updatedCase.id), sanitizeData({ ...updatedCase }));
    
    // Log activity
    await logActivity(
      currentUser?.firmId || 'default', 
      currentUser?.name || 'مستخدم', 
      'قام بتحديث', 
      `قضية: ${updatedCase.title} - ${updatedCase.caseNumber}`,
      `رقم القضية: ${updatedCase.caseNumber}`
    );
  };

  const handleAddHearing = async (newHearing: Hearing) => {
    const docRef = doc(collection(db, 'hearings'));
    await setDoc(docRef, sanitizeData({ ...newHearing, id: docRef.id, firmId: currentUser?.firmId || 'default' }));
    
    // Log activity
    await logActivity(
      currentUser?.firmId || 'default', 
      currentUser?.name || 'مستخدم', 
      'قام بإضافة', 
      `جلسة: ${newHearing.type} - ${newHearing.date}`,
      `نوع الجلسة: ${newHearing.type}`
    );
  };

  const handleUpdateHearing = async (updatedHearing: Hearing) => {
    await updateDoc(doc(db, 'hearings', updatedHearing.id), sanitizeData({ ...updatedHearing }));
    
    // Log activity
    await logActivity(
      currentUser?.firmId || 'default', 
      currentUser?.name || 'مستخدم', 
      'قام بتحديث', 
      `جلسة: ${updatedHearing.type} - ${updatedHearing.date}`,
      `نوع الجلسة: ${updatedHearing.type}`
    );
  };

  const handleAddClient = async (newClient: Client) => {
    console.log('🔍 handleAddClient called with:', { 
      clientId: newClient.id, 
      clientName: newClient.name,
      clientFirmId: newClient.firmId,
      currentUserFirmId: currentUser?.firmId,
      currentUserExists: !!currentUser
    });
    
    if (!currentUser?.firmId) {
      console.error('❌ Cannot add client: currentUser or firmId is missing');
      return;
    }
    
    // Check if we're offline - if so, don't try to add to Firebase
    // The offline manager will handle this during sync
    if (!navigator.onLine) {
      console.log('📴 Offline detected in handleAddClient - skipping Firebase direct add');
      return;
    }
    
    const docRef = doc(collection(db, 'clients'));
    const finalData = sanitizeData({ ...newClient, id: docRef.id, firmId: currentUser.firmId });
    
    console.log('📝 Adding client to Firebase with:', {
      docId: docRef.id,
      finalFirmId: currentUser.firmId
    });
    
    await setDoc(docRef, finalData);
    console.log('✅ Client added successfully to Firebase');
    
    // Log activity
    await logActivity(
      currentUser.firmId, 
      currentUser.name || 'مستخدم', 
      'قام بإضافة', 
      `موكل: ${newClient.name}`,
      `رقم الهاتف: ${newClient.phone || 'غير محدد'}`
    );
  };

  // Separate function for updating local state only (used in offline mode)
  const handleAddClientLocal = (newClient: Client) => {
    console.log('🔄 Adding client to local state only (offline mode):', {
      clientId: newClient.id,
      clientName: newClient.name
    });
    
    // Update local clients array without Firebase interaction
    setClients(prev => [...prev, newClient]);
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    await updateDoc(doc(db, 'clients', updatedClient.id), sanitizeData({ ...updatedClient }));
    
    // Log activity
    await logActivity(
      currentUser?.firmId || 'default', 
      currentUser?.name || 'مستخدم', 
      'قام بتحديث', 
      `موكل: ${updatedClient.name}`,
      `رقم الهاتف: ${updatedClient.phone || 'غير محدد'}`
    );
  };

  const handleAddLawyer = async (newLawyer: Lawyer) => {
    if (!currentUser?.firmId) return;
    const docRef = doc(collection(db, 'lawyers'));
    await setDoc(docRef, sanitizeData({ ...newLawyer, id: docRef.id, firmId: currentUser.firmId }));
  };

  const handleUpdateLawyer = async (updatedLawyer: Lawyer) => {
    await updateDoc(doc(db, 'lawyers', updatedLawyer.id), sanitizeData({ ...updatedLawyer }));
  };

  const handleDeleteLawyer = async (lawyerId: string) => {
    await deleteDoc(doc(db, 'lawyers', lawyerId));
  };

  const handleAddTask = async (newTask: Task) => {
    if (!currentUser?.firmId) return;
    const docRef = doc(collection(db, 'tasks'));
    await setDoc(docRef, sanitizeData({ ...newTask, id: docRef.id, firmId: currentUser.firmId }));
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    await updateDoc(doc(db, 'tasks', updatedTask.id), sanitizeData({ ...updatedTask }));
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteDoc(doc(db, 'tasks', taskId));
  };

  const handleAddAppointment = async (newAppointment: Appointment) => {
    if (!currentUser?.firmId) return;
    const docRef = doc(collection(db, 'appointments'));
    await setDoc(docRef, sanitizeData({ ...newAppointment, id: docRef.id, firmId: currentUser.firmId }));
  };

  const handleUpdateAppointment = async (updatedAppointment: Appointment) => {
    await updateDoc(doc(db, 'appointments', updatedAppointment.id), sanitizeData({ ...updatedAppointment }));
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    await deleteDoc(doc(db, 'appointments', appointmentId));
  };

  const handleAddUser = async (newUser: AppUser) => {
    if (!currentUser?.firmId) return;
    
    try {
      let uid = newUser.id;
      
      // If a password is provided, create the user in Firebase Auth
      if (newUser.password) {
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
        uid = userCredential.user.uid;
        // The secondary auth instance will now be logged in as the new user, 
        // but it won't affect the main auth instance. We can sign it out just to be clean.
        const { signOut } = await import('firebase/auth');
        await signOut(secondaryAuth);
      } else {
        // If no password, we still need a unique ID for Firestore
        const docRef = doc(collection(db, 'users'));
        uid = docRef.id;
        
        // Create the user document immediately to reserve the ID
        await setDoc(docRef, {
          id: uid,
          email: newUser.email,
          name: newUser.name,
          firmId: currentUser.firmId,
          createdAt: new Date().toISOString(),
          isActive: newUser.isActive || true,
          roleLabel: newUser.roleLabel || 'موظف',
          permissions: newUser.permissions || []
        });
      }

      // Save to Firestore using the generated UID or the Auth UID
      const userToSave = { ...newUser, id: uid, firmId: currentUser.firmId };
      // Remove password before saving to Firestore for security
      delete userToSave.password;
      
      // Save to both main collection and subcollection for consistency
      await setDoc(doc(db, 'users', uid), sanitizeData(userToSave));
      await setDoc(doc(db, 'firms', currentUser.firmId, 'users', uid), sanitizeData(userToSave));
      
      console.log('✅ User added to both collections:', uid);
      alert('تم إضافة المستخدم بنجاح');
    } catch (error: any) {
      console.error('Error adding user:', error);
      alert('حدث خطأ أثناء إضافة المستخدم: ' + error.message);
    }
  };

  const handleUpdateUser = async (updatedUser: AppUser) => {
    await updateDoc(doc(db, 'users', updatedUser.id), sanitizeData({ ...updatedUser }));
    // Also update in subcollection if it exists
    if (updatedUser.firmId) {
      try {
        await updateDoc(doc(db, 'firms', updatedUser.firmId, 'users', updatedUser.id), sanitizeData({ ...updatedUser }));
      } catch (error) {
        // Subcollection might not exist, that's okay
        console.log('Subcollection update skipped:', error);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteDoc(doc(db, 'users', userId));
    // Also delete from subcollection if it exists
    if (currentUser?.firmId) {
      try {
        await deleteDoc(doc(db, 'firms', currentUser.firmId, 'users', userId));
      } catch (error) {
        // Subcollection might not exist, that's okay
        console.log('Subcollection delete skipped:', error);
      }
    }
  };

  const handleAddReference = async (newRef: LegalReference) => {
    if (!currentUser?.firmId) return;
    const docRef = doc(collection(db, 'references'));
    await setDoc(docRef, sanitizeData({ ...newRef, id: docRef.id, firmId: currentUser.firmId }));
  };

  const handleRestoreData = (data: any) => {
    if (!data) return;
    if (data.cases) setCases(data.cases);
    if (data.clients) setClients(data.clients);
    if (data.hearings) setHearings(data.hearings);
    if (data.tasks) setTasks(data.tasks);
    if (data.users) setUsers(data.users); 
    if (data.references) setReferences(data.references);
    alert('تم استعادة البيانات بنجاح! سيتم تحديث الصفحة.');
  };

  const renderPage = () => {
    if (currentPage === 'super-admin') {
      return <SuperAdminDashboard currentUser={currentUser} />;
    }

    if (currentPage === 'office-admin') {
      if (!hasAccess('office-admin')) return <AccessDenied />;
      return (
        <Suspense fallback={<PageLoader />}>
          <OfficeAdminDashboard 
            cases={cases} 
            clients={clients} 
            hearings={hearings} 
            tasks={tasks}
            currentUser={currentUser}
            firmId={currentUser?.firmId}
            onUpdateHearing={handleUpdateHearing}
            onAddHearing={handleAddHearing}
          />
        </Suspense>
      );
    }

    if (currentPage === 'subscription' && currentFirm) {
      return <Subscription currentFirm={currentFirm} currentUser={currentUser} />;
    }

    // Determine the permission module ID for the current page
    let moduleId = currentPage;
    
    // Map detail pages to their parent module
    if (currentPage === 'case-details') moduleId = 'cases';
    if (currentPage === 'client-details') moduleId = 'clients';
    if (currentPage === 'lawyer-details') moduleId = 'lawyers';
    if (currentPage === 'advanced-settings') moduleId = 'settings'; // Use settings permissions
    
    // Special handling for shared modules
    if (currentPage === 'fees') {
       const hasFees = hasAccess('fees');
       const hasExpenses = hasAccess('expenses');
       if (!hasFees && !hasExpenses) {
          return <AccessDenied />;
       }
    } else if (!hasAccess(moduleId)) {
       return <AccessDenied />;
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <Suspense fallback={<PageLoader />}>
            <Dashboard 
              cases={cases} 
              clients={clients}
              hearings={hearings}
              appointments={appointments}
              tasks={tasks}
              activities={activities}
              currentUser={currentUser}
              onUpdateTask={handleUpdateTask}
              onNavigate={setCurrentPage}
              onCaseClick={handleCaseClick}
              onUpdateCase={handleUpdateCase}
              onUpdateClient={handleUpdateClient}
              onUpdateHearing={handleUpdateHearing}
              onAddHearing={handleAddHearing}
              readOnly={isReadOnly('dashboard')}
            />
          </Suspense>
        );
      case 'cases':
        return (
          <Suspense fallback={<PageLoader />}>
            <Cases 
              cases={cases} 
              clients={clients} 
              lawyers={lawyers}
              currentUser={currentUser}
              onCaseClick={handleCaseClick}
              onAddCase={handleAddCase}
              onAddCaseLocal={handleAddCaseLocal}
              readOnly={isReadOnly('cases')}
            />
          </Suspense>
        );
      case 'clients':
        return (
          <Suspense fallback={<PageLoader />}>
            <Clients 
              clients={clients} 
              cases={cases}
              hearings={hearings}
              currentUser={currentUser}
              onClientClick={handleClientClick}
              onAddClient={handleAddClient}
              onAddClientLocal={handleAddClientLocal}
              onUpdateClient={handleUpdateClient}
              readOnly={isReadOnly('clients')}
            />
          </Suspense>
        );
      case 'lawyers':
        return (
          <Suspense fallback={<PageLoader />}>
            <Lawyers 
              lawyers={lawyers}
              onAddLawyer={handleAddLawyer}
              onUpdateLawyer={handleUpdateLawyer}
              onDeleteLawyer={handleDeleteLawyer}
              onLawyerClick={handleLawyerClick}
              readOnly={isReadOnly('lawyers')}
            />
          </Suspense>
        );
      case 'hearings':
        return (
          <Suspense fallback={<PageLoader />}>
            <Hearings 
              hearings={hearings} 
              cases={cases} 
              onCaseClick={handleCaseClick}
              onAddHearing={handleAddHearing}
              onUpdateHearing={handleUpdateHearing}
              readOnly={isReadOnly('hearings')}
            />
          </Suspense>
        );
      case 'appointments':
        return (
          <Suspense fallback={<PageLoader />}>
            <Appointments 
              appointments={appointments}
              cases={cases}
              clients={clients}
              users={users}
              onAddAppointment={handleAddAppointment}
              onUpdateAppointment={handleUpdateAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onCaseClick={handleCaseClick}
              readOnly={isReadOnly('appointments')}
            />
          </Suspense>
        );
      case 'documents':
        return (
          <Suspense fallback={<PageLoader />}>
            <Documents 
              cases={cases} 
              clients={clients} 
              lawyers={lawyers}
              onCaseClick={handleCaseClick}
              onClientClick={handleClientClick}
              readOnly={isReadOnly('documents')}
            />
          </Suspense>
        );
      case 'archive':
        return (
          <Suspense fallback={<PageLoader />}>
            <ArchivePage 
              cases={cases}
              clients={clients}
              onUpdateCase={handleUpdateCase}
            />
          </Suspense>
        );
      case 'fees':
        return (
          <Suspense fallback={<PageLoader />}>
            <Fees 
              cases={cases} 
              clients={clients}
              hearings={hearings}
              onUpdateCase={handleUpdateCase}
              canViewIncome={hasAccess('fees')}
              canViewExpenses={hasAccess('expenses')}
              readOnly={isReadOnly('fees')}
            />
          </Suspense>
        );
      case 'reports':
        return <Reports 
          cases={cases} 
          clients={clients} 
          hearings={hearings} 
          tasks={tasks} 
        />;
      case 'ai-assistant':
        return <AIAssistant 
          cases={cases}
          references={references}
          hearings={hearings}
          onUpdateCase={handleUpdateCase}
        />;
      case 'tasks':
        return (
          <Suspense fallback={<PageLoader />}>
            <Tasks 
              tasks={tasks}
              cases={cases}
              users={users}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCaseClick={handleCaseClick}
              readOnly={isReadOnly('tasks')}
            />
          </Suspense>
        );
      case 'locations':
        return <Locations readOnly={isReadOnly('locations')} />;
      case 'calculators':
        return <Calculators onAddTask={handleAddTask} />; 
      case 'generator':
        return <DocumentGenerator cases={cases} clients={clients} />;
      case 'settings':
        return <Settings 
          firmId={currentUser?.firmId}
          currentUser={currentUser}
          users={users}
          onAddUser={handleAddUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          roles={roles}
          onAddRole={handleAddRole}
          onUpdateRole={handleUpdateRole}
          onDeleteRole={handleDeleteRole}
          currentTheme={theme}
          onThemeChange={setTheme}
          cases={cases}
          clients={clients}
          hearings={hearings}
          tasks={tasks}
          references={references}
          onRestoreData={handleRestoreData}
          readOnly={isReadOnly('settings')}
        />;
      case 'advanced-settings':
        return (
          <Suspense fallback={<PageLoader />}>
            <AdvancedSettings 
              firmId={currentUser?.firmId || 'default'}
              currentUser={currentUser}
            />
          </Suspense>
        );
      case 'references':
        return <LegalReferences 
          references={references}
          onAddReference={handleAddReference}
          readOnly={isReadOnly('references')}
        />;
      case 'case-details':
        if (!selectedCaseId) return <Dashboard cases={cases} clients={clients} hearings={hearings} onUpdateHearing={handleUpdateHearing} onAddHearing={handleAddHearing} />;
        return <CaseDetails 
          caseId={selectedCaseId} 
          cases={cases} 
          clients={clients} 
          hearings={hearings} 
          lawyers={lawyers}
          currentUser={currentUser}
          onBack={handleBackToCases}
          onUpdateCase={handleUpdateCase}
          onAddHearing={handleAddHearing}
          onAddTask={handleAddTask}
          onClientClick={handleClientClick}
          readOnly={isReadOnly('cases')}
        />;
      case 'client-details':
        if (!selectedClientId) return <Clients clients={clients} cases={cases} hearings={hearings} currentUser={currentUser} onClientClick={handleClientClick} onAddClient={handleAddClient} onAddClientLocal={handleAddClientLocal} onUpdateClient={handleUpdateClient} readOnly={isReadOnly('clients')} />;
        return <ClientDetails 
          clientId={selectedClientId} 
          clients={clients} 
          cases={cases} 
          hearings={hearings}
          currentUser={currentUser}
          onBack={handleBackToClients}
          onCaseClick={handleCaseClick}
          onUpdateClient={handleUpdateClient}
          readOnly={isReadOnly('clients')}
        />;
      case 'lawyer-details':
        if (!selectedLawyerId) return <Lawyers lawyers={lawyers} onAddLawyer={handleAddLawyer} onUpdateLawyer={handleUpdateLawyer} onDeleteLawyer={handleDeleteLawyer} onLawyerClick={handleLawyerClick} />;
        return <LawyerDetails 
          lawyerId={selectedLawyerId}
          lawyers={lawyers}
          cases={cases}
          onBack={handleBackToLawyers}
          onUpdateLawyer={handleUpdateLawyer}
        />;
      default:
        return <Dashboard 
          cases={cases} 
          clients={clients} 
          hearings={hearings} 
          onUpdateHearing={handleUpdateHearing}
          onAddHearing={handleAddHearing}
        />;
    }
  };

  const AccessDenied = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in">
      <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-slate-800 mb-2 dark:text-slate-100">عفواً، لا تملك صلاحية للوصول</h2>
      <p className="text-slate-500 dark:text-slate-400">يرجى التواصل مع المدير لمنحك الصلاحيات اللازمة</p>
      <button onClick={() => setCurrentPage('dashboard')} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">العودة للرئيسية</button>
    </div>
  );

  return (
    <Layout 
      activePage={currentPage} 
      onNavigate={setCurrentPage}
      notifications={notifications}
      onNotificationClick={handleNotificationClick}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
