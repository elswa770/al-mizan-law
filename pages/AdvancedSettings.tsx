import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { 
  Settings as SettingsIcon, 
  Users, 
  Lock, 
  Shield, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  EyeOff,
  Save, 
  AlertCircle, 
  Ban, 
  Pencil, 
  Key,
  Bell,
  Database,
  Building,
  Mail,
  Smartphone,
  Globe,
  FileText,
  Archive,
  Clock,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  UserMinus,
  RefreshCw,
  HardDrive,
  Wifi,
  Activity,
  TrendingUp,
  Zap,
  Wrench,
  ShieldAlert,
  Fingerprint,
  Globe2,
  Server,
  Cpu,
  Monitor,
  Cloud,
  BarChart3,
  PieChart,
  LineChart,
  Calendar,
  MapPin,
  Phone,
  CreditCard,
  Package,
  Star,
  Award,
  Target,
  Flag,
  Compass,
  Navigation,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Info,
  Loader2,
  CheckCircle2,
  MessageSquare,
  Send,
  Paperclip,
  Link,
  Code,
  Terminal,
  KeyRound,
  LockKeyhole,
  UserCheck,
  UserX,
  Copy,
  Users2,
  Crown,
  ShieldCheck,
  ShieldX,
  ShieldPlus,
  ShieldMinus,
  ShieldOff,
  ShieldQuestion,
  ShieldAlert as ShieldAlertIcon,
  LogIn,
  LogOut,
  CalendarClock,
  BookOpen,
  Bot,
  Calculator,
  User,
  Edit
} from 'lucide-react';

interface AdvancedSettingsState {
  general: {
    firmName: string;
    firmAddress: string;
    firmPhone: string;
    firmEmail: string;
    website: string;
    timezone: string;
    language: string;
    currency: string;
    logo: string;
    taxId: string;
    commercialRegister: string;
    establishedDate: string;
    branches: Branch[];
    // Contact information fields
    mobilePhone?: string;
    alternativeEmail?: string;
    socialMedia?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    workDays?: string;
    workHours?: string;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordComplexity: 'low' | 'medium' | 'high';
    twoFactorAuth: boolean;
    ipWhitelist: string[];
    allowedEmails: string[];
    encryptionLevel: 'standard' | 'enhanced' | 'maximum';
    auditLog: boolean;
    biometricAuth: boolean;
    singleSignOn: boolean;
    apiKeys: ApiKey[];
  };
  notifications: {
    emailNotifications: boolean;
    systemNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    caseReminders: boolean;
    hearingReminders: boolean;
    deadlineReminders: boolean;
    weeklyReports: boolean;
    monthlyReports: boolean;
    customNotifications: CustomNotification[];
    smtp: {
      host: string;
      port: number;
      username: string;
      password: string;
      fromEmail: string;
      fromName: string;
      encryption: 'none' | 'ssl' | 'tls';
    };
    sms: {
      provider: string;
      apiKey: string;
      senderId: string;
    };
  };
  data: {
    autoBackup: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    dataRetention: number;
    maxFileSize: number;
    allowedFileTypes: string[];
    encryptionEnabled: boolean;
    exportFormat: 'json' | 'csv' | 'excel' | 'pdf';
    cloudStorage: CloudStorage;
    dataArchiving: DataArchiving;
    gdprCompliance: boolean;
  };
  users: {
    defaultRole: string;
    requireEmailVerification: boolean;
    allowSelfRegistration: boolean;
    maxUsersPerPlan: number;
    userPermissions: {
      canCreateCases: boolean;
      canDeleteCases: boolean;
      canManageClients: boolean;
      canViewReports: boolean;
      canManageSettings: boolean;
      canManageUsers: boolean;
      canAccessBilling: boolean;
      canExportData: boolean;
    };
    passwordPolicy: PasswordPolicy;
    sessionManagement: SessionManagement;
  };
  integrations: {
    accountingSoftware: AccountingIntegration;
    documentManagement: DocumentIntegration;
    communicationTools: CommunicationIntegration;
    paymentGateways: PaymentGateway[];
    customApis: CustomApi[];
  };
  analytics: {
    trackingEnabled: boolean;
    googleAnalytics: GoogleAnalytics;
    customMetrics: CustomMetric[];
    dashboardWidgets: DashboardWidget[];
    reportScheduling: ReportScheduling;
  };
  billing: {
    subscriptionPlan: string;
    billingCycle: 'monthly' | 'yearly';
    paymentMethod: PaymentMethod;
    invoices: Invoice[];
    expenses: Expense[];
    budgetLimits: BudgetLimit[];
  };
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  isActive: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  expiresAt: string;
  lastUsed: string;
  createdAt: string;
  isActive: boolean;
}

interface CustomNotification {
  id: string;
  name: string;
  trigger: string;
  message: string;
  channels: string[];
  isActive: boolean;
}

interface CloudStorage {
  provider: 'aws' | 'google' | 'azure' | 'local';
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
}

interface DataArchiving {
  enabled: boolean;
  archiveAfter: number;
  archiveLocation: string;
  compressionEnabled: boolean;
}

interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  expiryDays: number;
}

interface SessionManagement {
  maxConcurrentSessions: number;
  forceLogoutOnNewDevice: boolean;
  sessionTimeoutWarning: boolean;
  rememberDevice: boolean;
}

interface AccountingIntegration {
  provider: string;
  apiKey: string;
  companyId: string;
  syncFrequency: string;
  autoSync: boolean;
}

interface DocumentIntegration {
  provider: string;
  apiKey: string;
  folderId: string;
  autoBackup: boolean;
}

interface CommunicationIntegration {
  emailProvider: string;
  smsProvider: string;
  whatsappProvider: string;
  slackWebhook: string;
}

interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  secretKey: string;
  isActive: boolean;
  currencies: string[];
}

interface CustomApi {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  isActive: boolean;
}

interface GoogleAnalytics {
  trackingId: string;
  enabled: boolean;
  anonymizeIp: boolean;
  respectDoNotTrack: boolean;
}

interface CustomMetric {
  id: string;
  name: string;
  type: string;
  calculation: string;
  isActive: boolean;
}

interface DashboardWidget {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
  isVisible: boolean;
}

interface ReportScheduling {
  enabled: boolean;
  frequency: string;
  recipients: string[];
  format: string;
  customReports: string[];
}

interface PaymentMethod {
  type: string;
  provider: string;
  lastFour: string;
  expiryDate: string;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: string;
  dueDate: string;
  paidDate?: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  approved: boolean;
}

interface BudgetLimit {
  category: string;
  limit: number;
  current: number;
  warningThreshold: number;
}

interface AdvancedSettingsProps {
  firmId?: string;
  currentUser?: any;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ 
  firmId = 'default',
  currentUser = null
}) => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchFormData, setBranchFormData] = useState<Partial<Branch>>({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    isActive: true
  });
  
  // API Key Management
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null);
  const [apiKeyFormData, setApiKeyFormData] = useState<Partial<ApiKey>>({
    name: '',
    key: '',
    permissions: [],
    isActive: true,
    expiresAt: '',
    lastUsed: '',
    createdAt: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [settings, setSettings] = useState<AdvancedSettingsState>({
    general: {
      firmName: '',
      firmAddress: '',
      firmPhone: '',
      firmEmail: '',
      website: '',
      timezone: 'Africa/Cairo',
      language: 'ar',
      currency: 'EGP',
      logo: '',
      taxId: '',
      commercialRegister: '',
      establishedDate: '',
      branches: []
    },
    security: {
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordComplexity: 'medium',
      twoFactorAuth: false,
      ipWhitelist: [],
      allowedEmails: [],
      encryptionLevel: 'standard',
      auditLog: true,
      biometricAuth: false,
      singleSignOn: false,
      apiKeys: []
    },
    notifications: {
      emailNotifications: true,
      systemNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      caseReminders: true,
      hearingReminders: true,
      deadlineReminders: true,
      weeklyReports: false,
      monthlyReports: true,
      customNotifications: [],
      smtp: {
        host: '',
        port: 587,
        username: '',
        password: '',
        fromEmail: '',
        fromName: '',
        encryption: 'tls'
      },
      sms: {
        provider: '',
        apiKey: '',
        senderId: ''
      }
    },
    data: {
      autoBackup: true,
      backupFrequency: 'daily',
      dataRetention: 365,
      maxFileSize: 10,
      allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.png'],
      encryptionEnabled: true,
      exportFormat: 'json',
      cloudStorage: {
        provider: 'local',
        bucket: '',
        region: '',
        accessKey: '',
        secretKey: ''
      },
      dataArchiving: {
        enabled: false,
        archiveAfter: 365,
        archiveLocation: '',
        compressionEnabled: true
      },
      gdprCompliance: false
    },
    users: {
      defaultRole: 'assistant',
      requireEmailVerification: true,
      allowSelfRegistration: false,
      maxUsersPerPlan: 10,
      userPermissions: {
        canCreateCases: true,
        canDeleteCases: false,
        canManageClients: true,
        canViewReports: false,
        canManageSettings: false,
        canManageUsers: false,
        canAccessBilling: false,
        canExportData: false
      },
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        preventReuse: 3,
        expiryDays: 90
      },
      sessionManagement: {
        maxConcurrentSessions: 3,
        forceLogoutOnNewDevice: false,
        sessionTimeoutWarning: true,
        rememberDevice: true
      }
    },
    integrations: {
      accountingSoftware: {
        provider: '',
        apiKey: '',
        companyId: '',
        syncFrequency: 'daily',
        autoSync: false
      },
      documentManagement: {
        provider: '',
        apiKey: '',
        folderId: '',
        autoBackup: false
      },
      communicationTools: {
        emailProvider: '',
        smsProvider: '',
        whatsappProvider: '',
        slackWebhook: ''
      },
      paymentGateways: [],
      customApis: []
    },
    analytics: {
      trackingEnabled: false,
      googleAnalytics: {
        trackingId: '',
        enabled: false,
        anonymizeIp: true,
        respectDoNotTrack: true
      },
      customMetrics: [],
      dashboardWidgets: [],
      reportScheduling: {
        enabled: false,
        frequency: 'weekly',
        recipients: [],
        format: 'pdf',
        customReports: []
      }
    },
    billing: {
      subscriptionPlan: 'basic',
      billingCycle: 'monthly',
      paymentMethod: {
        type: '',
        provider: '',
        lastFour: '',
        expiryDate: '',
        isDefault: false
      },
      invoices: [],
      expenses: [],
      budgetLimits: []
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Branch management functions
  const handleAddBranch = () => {
    setEditingBranch(null);
    setBranchFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      manager: '',
      isActive: true
    });
    setIsBranchModalOpen(true);
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchFormData(branch);
    setIsBranchModalOpen(true);
  };

  const handleDeleteBranch = (branchId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفرع؟')) {
      setSettings(prev => ({
        ...prev,
        general: {
          ...prev.general,
          branches: prev.general.branches.filter(branch => branch.id !== branchId)
        }
      }));
      setMessage({ type: 'success', text: 'تم حذف الفرع بنجاح' });
    }
  };

  const handleSaveBranch = () => {
    if (!branchFormData.name || !branchFormData.address) {
      setMessage({ type: 'error', text: 'يرجى ملء الحقول المطلوبة' });
      return;
    }

    if (editingBranch) {
      // Update existing branch
      setSettings(prev => ({
        ...prev,
        general: {
          ...prev.general,
          branches: prev.general.branches.map(branch =>
            branch.id === editingBranch.id
              ? { ...branchFormData as Branch }
              : branch
          )
        }
      }));
      setMessage({ type: 'success', text: 'تم تحديث الفرع بنجاح' });
    } else {
      // Add new branch
      const newBranch: Branch = {
        id: Date.now().toString(),
        ...branchFormData as Branch
      };
      setSettings(prev => ({
        ...prev,
        general: {
          ...prev.general,
          branches: [...prev.general.branches, newBranch]
        }
      }));
      setMessage({ type: 'success', text: 'تم إضافة الفرع بنجاح' });
    }

    setIsBranchModalOpen(false);
    setEditingBranch(null);
  };

  // API Key Management Functions
  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAddApiKey = () => {
    const newKey = generateApiKey();
    setEditingApiKey(null);
    setApiKeyFormData({
      name: '',
      key: newKey,
      permissions: [],
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsed: '',
      createdAt: new Date().toISOString()
    });
    setShowApiKey(true);
    setIsApiKeyModalOpen(true);
  };

  const handleEditApiKey = (apiKey: ApiKey) => {
    setEditingApiKey(apiKey);
    setApiKeyFormData(apiKey);
    setShowApiKey(false);
    setIsApiKeyModalOpen(true);
  };

  const handleDeleteApiKey = (apiKeyId: string) => {
    if (window.confirm('هل أنت متأكد من حذف مفتاح API؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      setSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          apiKeys: prev.security.apiKeys.filter(key => key.id !== apiKeyId)
        }
      }));
      setMessage({ type: 'success', text: 'تم حذف مفتاح API بنجاح' });
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKeyFormData.name || !apiKeyFormData.key) {
      setMessage({ type: 'error', text: 'يرجى ملء الحقول المطلوبة' });
      return;
    }

    if (editingApiKey) {
      // Update existing API key
      setSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          apiKeys: prev.security.apiKeys.map(key =>
            key.id === editingApiKey.id
              ? { ...apiKeyFormData as ApiKey }
              : key
          )
        }
      }));
      setMessage({ type: 'success', text: 'تم تحديث مفتاح API بنجاح' });
    } else {
      // Add new API key
      const newApiKey: ApiKey = {
        id: Date.now().toString(),
        ...apiKeyFormData as ApiKey
      };
      setSettings(prev => ({
        ...prev,
        security: {
          ...prev.security,
          apiKeys: [...prev.security.apiKeys, newApiKey]
        }
      }));
      setMessage({ type: 'success', text: 'تم إنشاء مفتاح API بنجاح' });
    }

    setIsApiKeyModalOpen(false);
    setEditingApiKey(null);
    setShowApiKey(false);
  };

  const handleToggleApiKeyStatus = (apiKeyId: string) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        apiKeys: prev.security.apiKeys.map(key =>
          key.id === apiKeyId
            ? { ...key, isActive: !key.isActive }
            : key
        )
      }
    }));
  };

  const handlePermissionToggle = (permission: string) => {
    const currentPermissions = apiKeyFormData.permissions || [];
    if (currentPermissions.includes(permission)) {
      setApiKeyFormData(prev => ({
        ...prev,
        permissions: currentPermissions.filter(p => p !== permission)
      }));
    } else {
      setApiKeyFormData(prev => ({
        ...prev,
        permissions: [...currentPermissions, permission]
      }));
    }
  };

  // Helper function for audit log icon colors
  const getAuditIconColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'data_read':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'data_write':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      case 'data_delete':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'admin':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'security':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
    }
  };

  const tabs = [
    { 
      id: 'general', 
      name: 'الإعدادات العامة', 
      icon: Building,
      subTabs: [
        { id: 'overview', name: 'نظرة عامة' },
        { id: 'branches', name: 'الفروع' },
        { id: 'contact', name: 'معلومات الاتصال' }
      ]
    },
    { 
      id: 'security', 
      name: 'الأمان والخصوصية', 
      icon: Shield,
      subTabs: [
        { id: 'overview', name: 'نظرة عامة' },
        { id: 'authentication', name: 'المصادقة' },
        { id: 'api', name: 'مفاتيح API' },
        { id: 'audit', name: 'سجل التدقيق' }
      ]
    },
    { 
      id: 'notifications', 
      name: 'الإشعارات', 
      icon: Bell,
      subTabs: [
        { id: 'overview', name: 'نظرة عامة' },
        { id: 'email', name: 'البريد الإلكتروني' },
        { id: 'sms', name: 'الرسائل النصية' },
        { id: 'custom', name: 'إشعارات مخصصة' }
      ]
    },
    { 
      id: 'data', 
      name: 'إدارة البيانات', 
      icon: Database,
      subTabs: [
        { id: 'overview', name: 'نظرة عامة' },
        { id: 'backup', name: 'النسخ الاحتياطي' },
        { id: 'storage', name: 'التخزين السحابي' },
        { id: 'archiving', name: 'الأرشفة' }
      ]
    },
    { 
      id: 'users', 
      name: 'إدارة المستخدمين', 
      icon: Users,
      subTabs: [
        { id: 'overview', name: 'نظرة عامة' },
        { id: 'users', name: 'المستخدمين' },
        { id: 'roles', name: 'الأدوار' },
        { id: 'permissions', name: 'الصلاحيات' },
        { id: 'password', name: 'سياسة كلمة المرور' },
        { id: 'sessions', name: 'إدارة الجلسات' }
      ]
    },
    { 
      id: 'integrations', 
      name: 'التكاملات', 
      icon: Link,
      subTabs: [
        { id: 'overview', name: 'نظرة عامة' },
        { id: 'accounting', name: 'المحاسبة' },
        { id: 'documents', name: 'إدارة المستندات' },
        { id: 'payment', name: 'بوابات الدفع' }
      ]
    },
    { 
      id: 'analytics', 
      name: 'التحليلات', 
      icon: BarChart3,
      subTabs: [
        { id: 'overview', name: 'نظرة عامة' },
        { id: 'tracking', name: 'التتبع' },
        { id: 'metrics', name: 'مقاييس مخصصة' },
        { id: 'reports', name: 'التقارير' }
      ]
    },
    { 
      id: 'maintenance', 
      name: 'الصيانة والدعم', 
      icon: Wrench,
      subTabs: [
        { id: 'overview', name: 'نظرة عامة' },
        { id: 'system-health', name: 'صحة النظام' },
        { id: 'logs', name: 'السجلات' },
        { id: 'updates', name: 'التحديثات' }
      ]
    },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'advanced'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as AdvancedSettingsState);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      // Save to localStorage for persistence
      localStorage.setItem(`advanced_settings_${firmId}`, JSON.stringify(settings));
      
      // Debug information
      console.log('Save Debug:', {
        currentUser: !!currentUser,
        currentUserEmail: currentUser?.email,
        firmId: firmId,
        isDefaultFirm: firmId === 'default'
      });
      
      // Check if user has permission to save to Firestore
      if (currentUser && firmId && firmId !== 'default') {
        console.log('Attempting to save to Firestore...');
        try {
          const docRef = doc(db, 'settings', firmId);
          await setDoc(docRef, {
            firmId,
            advancedSettings: JSON.stringify(settings),
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.email || 'unknown'
          }, { merge: true });
          
          console.log(`Advanced settings saved to Firestore for firm: ${firmId}`);
          setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' });
        } catch (firebaseError: any) {
          if (firebaseError.code === 'permission-denied') {
            console.warn('Permission denied for Firestore save, settings saved locally only');
            // Don't show error to user, just save locally
            setMessage({ type: 'success', text: 'تم حفظ الإعدادات محلياً بنجاح' });
          } else {
            throw firebaseError; // Re-throw other Firebase errors
          }
        }
      } else {
        console.log('Skipping Firestore save - conditions not met');
        setMessage({ type: 'success', text: 'تم حفظ الإعدادات محلياً بنجاح' });
      }
      
      console.log('Advanced settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ الإعدادات' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section: keyof AdvancedSettingsState, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleNestedInputChange = (section: keyof AdvancedSettingsState, nestedField: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedField]: {
          ...(prev[section][nestedField as keyof typeof prev[section]] as Record<string, any>),
          [field]: value
        }
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    
    try {
      // Save to localStorage for persistence
      localStorage.setItem(`advanced_settings_${firmId}`, JSON.stringify(settings));
      
      // Debug information
      console.log('Save Debug:', {
        currentUser: !!currentUser,
        currentUserEmail: currentUser?.email,
        firmId: firmId,
        isDefaultFirm: firmId === 'default'
      });
      
      // Check if user has permission to save to Firestore
      if (currentUser && firmId && firmId !== 'default') {
        console.log('Attempting to save to Firestore...');
        try {
          const docRef = doc(db, 'settings', firmId);
          await setDoc(docRef, {
            firmId,
            advancedSettings: JSON.stringify(settings),
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser.email || 'unknown'
          }, { merge: true });
          
          console.log(`Advanced settings saved to Firestore for firm: ${firmId}`);
        } catch (firebaseError: any) {
          if (firebaseError.code === 'permission-denied') {
            console.warn('Permission denied for Firestore save, settings saved locally only');
            // Don't show error to user, just save locally
          } else {
            throw firebaseError; // Re-throw other Firebase errors
          }
        }
      } else {
        console.log('Skipping Firestore save - conditions not met');
      }
      
      console.log('Advanced settings saved successfully');
    } catch (error) {
      console.error("Error saving advanced settings:", error);
      alert("حدث خطأ أثناء حفظ الإعدادات المتقدمة");
    } finally {
      setSaving(false);
    }
  };

  // Load settings from localStorage or Firestore on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try to load from localStorage first
        const saved = localStorage.getItem(`advanced_settings_${firmId}`);
        if (saved) {
          setSettings(JSON.parse(saved));
        } else {
          // Try to load from Firestore if not in localStorage
          if (firmId && firmId !== 'default') {
            const docRef = doc(db, 'settings', firmId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().advancedSettings) {
              setSettings(JSON.parse(docSnap.data().advancedSettings));
            }
          }
        }
      } catch (error) {
        console.error('Error loading advanced settings:', error);
      }
    };
    
    loadSettings();
  }, [firmId]);

  const renderGeneralSettings = () => {
    const currentTab = tabs.find(tab => tab.id === 'general');
    const currentSubTab = currentTab?.subTabs.find(sub => sub.id === activeSubTab);

    switch (activeSubTab) {
      case 'contact':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">معلومات الاتصال المتقدمة</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">إدارة شاملة لجميع قنوات التواصل والمعلومات الجغرافية</p>
              </div>
              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Primary Contact */}
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <Phone className="w-5 h-5 text-indigo-600" /> معلومات الاتصال الرئيسية
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <Phone className="w-3 h-3"/> الهاتف الرئيسي
                      </label>
                      <input 
                        type="text" 
                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        dir="ltr"
                        placeholder="+20 123 456 7890"
                        value={settings.general.firmPhone || ''}
                        onChange={(e) => handleInputChange('general', 'firmPhone', e.target.value)}
                        aria-label="الهاتف الرئيسي"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <Mail className="w-3 h-3"/> البريد الإلكتروني الرئيسي
                      </label>
                      <input 
                        type="email" 
                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        dir="ltr"
                        placeholder="office@firm.com"
                        value={settings.general.firmEmail || ''}
                        onChange={(e) => handleInputChange('general', 'firmEmail', e.target.value)}
                        aria-label="البريد الإلكتروني الرئيسي"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <Globe className="w-3 h-3"/> الموقع الإلكتروني
                      </label>
                      <input 
                        type="text" 
                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        dir="ltr"
                        placeholder="https://www.firm.com"
                        value={settings.general.website || ''}
                        onChange={(e) => handleInputChange('general', 'website', e.target.value)}
                        aria-label="الموقع الإلكتروني"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Contact */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <Smartphone className="w-5 h-5 text-blue-600" /> معلومات الاتصال البديلة
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <Smartphone className="w-3 h-3"/> الهاتف المحمول
                      </label>
                      <input 
                        type="text" 
                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        dir="ltr"
                        placeholder="+20 123 456 7890"
                        value={settings.general.mobilePhone || ''}
                        onChange={(e) => handleInputChange('general', 'mobilePhone', e.target.value)}
                        aria-label="الهاتف المحمول"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <Mail className="w-3 h-3"/> البريد الإلكتروني البديل
                      </label>
                      <input 
                        type="email" 
                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        dir="ltr"
                        placeholder="support@firm.com"
                        value={settings.general.alternativeEmail || ''}
                        onChange={(e) => handleInputChange('general', 'alternativeEmail', e.target.value)}
                        aria-label="البريد الإلكتروني البديل"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <Globe2 className="w-3 h-3"/> وسائل التواصل الاجتماعي
                      </label>
                      <input 
                        type="text" 
                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                        dir="ltr"
                        placeholder="@firm_handle"
                        value={settings.general.socialMedia || ''}
                        onChange={(e) => handleInputChange('general', 'socialMedia', e.target.value)}
                        aria-label="وسائل التواصل الاجتماعي"
                      />
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <Building className="w-5 h-5 text-green-600" /> معلومات الموقع الجغرافي
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <Building className="w-3 h-3"/> العنوان التفصيلي
                      </label>
                      <textarea 
                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white resize-none"
                        rows={3}
                        placeholder="أدخل العنوان الكامل..."
                        value={settings.general.address || ''}
                        onChange={(e) => handleInputChange('general', 'address', e.target.value)}
                        aria-label="العنوان التفصيلي"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المدينة</label>
                      <input 
                        type="text" 
                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        placeholder="القاهرة"
                        value={settings.general.city || ''}
                        onChange={(e) => handleInputChange('general', 'city', e.target.value)}
                        aria-label="المدينة"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الرمز البريدي</label>
                      <input 
                        type="text" 
                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        placeholder="12345"
                        value={settings.general.postalCode || ''}
                        onChange={(e) => handleInputChange('general', 'postalCode', e.target.value)}
                        aria-label="الرمز البريدي"
                      />
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <Clock className="w-5 h-5 text-amber-600" /> ساعات العمل
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <Clock className="w-3 h-3"/> أيام العمل
                      </label>
                      <input 
                        type="text" 
                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        placeholder="الأحد - الخميس"
                        value={settings.general.workDays || ''}
                        onChange={(e) => handleInputChange('general', 'workDays', e.target.value)}
                        aria-label="أيام العمل"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                        <Clock className="w-3 h-3"/> مواعيد العمل
                      </label>
                      <input 
                        type="text" 
                        className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        placeholder="9:00 ص - 5:00 م"
                        value={settings.general.workHours || ''}
                        onChange={(e) => handleInputChange('general', 'workHours', e.target.value)}
                        aria-label="مواعيد العمل"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Panel - Quick Actions */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" /> الإجراءات السريعة
                  </h4>
                  <div className="space-y-3">
                    <button className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm font-medium">اختبار الهاتف</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm font-medium">إرسال بريد تجريبي</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                      <Globe className="w-4 h-4" />
                      <span className="text-sm font-medium">فحص الموقع</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" /> حالة الاتصال
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">الهاتف الرئيسي</span>
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">البريد الإلكتروني</span>
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-400">الموقع الإلكتروني</span>
                      <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  اسم المكتب
                </label>
                <input
                  type="text"
                  value={settings.general.firmName}
                  onChange={(e) => handleInputChange('general', 'firmName', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="أدخل اسم المكتب"
                  aria-label="اسم المكتب"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  البريد الإلكتروني للمكتب
                </label>
                <input
                  type="email"
                  value={settings.general.firmEmail}
                  onChange={(e) => handleInputChange('general', 'firmEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="office@example.com"
                  aria-label="البريد الإلكتروني للمكتب"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={settings.general.firmPhone}
                  onChange={(e) => handleInputChange('general', 'firmPhone', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="+20 123 456 7890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  الموقع الإلكتروني
                </label>
                <input
                  type="url"
                  value={settings.general.website}
                  onChange={(e) => handleInputChange('general', 'website', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="https://example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  الرقم الضريبي
                </label>
                <input
                  type="text"
                  value={settings.general.taxId}
                  onChange={(e) => handleInputChange('general', 'taxId', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="123-456-789"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  السجل التجاري
                </label>
                <input
                  type="text"
                  value={settings.general.commercialRegister}
                  onChange={(e) => handleInputChange('general', 'commercialRegister', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="123456"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                عنوان المكتب
              </label>
              <textarea
                value={settings.general.firmAddress}
                onChange={(e) => handleInputChange('general', 'firmAddress', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="أدخل عنوان المكتب الكامل"
              />
            </div>
          </div>
        );
      
      case 'branches':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">إدارة الفروع المتقدمة</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">إضافة وتعديل وحذف فروع المكتب</p>
              </div>
              <button 
                onClick={handleAddBranch}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all"
              >
                <Plus className="w-4 h-4" />
                إضافة فرع جديد
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Branches List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {settings.general.branches.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Building className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">لا توجد فروع مضافة</h4>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">ابدأ بإضافة أول فرع للمكتب</p>
                  <button 
                    onClick={handleAddBranch}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة فرع
                  </button>
                </div>
              ) : (
                settings.general.branches.map((branch) => (
                  <div key={branch.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Branch Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{branch.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              branch.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {branch.isActive ? 'نشط' : 'غير نشط'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleEditBranch(branch)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="تعديل الفرع"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteBranch(branch.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="حذف الفرع"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Branch Details */}
                    <div className="p-6 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">{branch.address}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">{branch.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">{branch.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <UserCheck className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-700 dark:text-slate-300">المدير: {branch.manager}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Branch Modal */}
            {isBranchModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {editingBranch ? 'تعديل فرع' : 'إضافة فرع جديد'}
                    </h3>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        اسم الفرع *
                      </label>
                      <input
                        type="text"
                        value={branchFormData.name}
                        onChange={(e) => setBranchFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="أدخل اسم الفرع"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        العنوان *
                      </label>
                      <textarea
                        value={branchFormData.address}
                        onChange={(e) => setBranchFormData(prev => ({ ...prev, address: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                        rows={3}
                        placeholder="أدخل العنوان الكامل"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        رقم الهاتف
                      </label>
                      <input
                        type="tel"
                        value={branchFormData.phone}
                        onChange={(e) => setBranchFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="أدخل رقم الهاتف"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        البريد الإلكتروني
                      </label>
                      <input
                        type="email"
                        value={branchFormData.email}
                        onChange={(e) => setBranchFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="أدخل البريد الإلكتروني"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        اسم المدير
                      </label>
                      <input
                        type="text"
                        value={branchFormData.manager}
                        onChange={(e) => setBranchFormData(prev => ({ ...prev, manager: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="أدخل اسم المدير"
                      />
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="branch-active"
                        checked={branchFormData.isActive}
                        onChange={(e) => setBranchFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <label htmlFor="branch-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        الفرع نشط
                      </label>
                    </div>
                  </div>
                  
                  <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button
                      onClick={() => setIsBranchModalOpen(false)}
                      className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveBranch}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      {editingBranch ? 'تحديث' : 'إضافة'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return <div>قيد التطوير...</div>;
    }
  };

  const renderNotificationsSettings = () => {
    switch (activeSubTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">نظرة عامة على الإشعارات</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">إدارة وتخصيص جميع أنواع الإشعارات في النظام</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Notification Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">الإشعارات النشطة</h4>
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.notifications.customNotifications?.length || 0}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">إشعار مخصص</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">البريد الإلكتروني</h4>
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.notifications.emailNotifications ? 'مفعل' : 'معطل'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">حالة الخدمة</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">الرسائل النصية</h4>
                  <Smartphone className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.notifications.smsNotifications ? 'مفعل' : 'معطل'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">حالة الخدمة</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">الإشعارات الفورية</h4>
                  <Bell className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.notifications.pushNotifications ? 'مفعل' : 'معطل'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">حالة الخدمة</div>
              </div>
            </div>

            {/* General Notification Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <SettingsIcon className="w-5 h-5 text-indigo-600" /> إعدادات الإشعارات العامة
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">البريد الإلكتروني</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">إشعارات عبر البريد الإلكتروني</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.notifications.emailNotifications} 
                          onChange={(e) => handleInputChange('notifications', 'emailNotifications', e.target.checked)}
                          aria-label="تفعيل إشعارات البريد الإلكتروني"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <Bell className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">الإشعارات النظامية</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">إشعارات النظام الداخلية</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.notifications.systemNotifications} 
                          onChange={(e) => handleInputChange('notifications', 'systemNotifications', e.target.checked)}
                          aria-label="تفعيل الإشعارات النظامية"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">الرسائل النصية</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">إشعارات عبر الرسائل النصية</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.notifications.smsNotifications} 
                          onChange={(e) => handleInputChange('notifications', 'smsNotifications', e.target.checked)}
                          aria-label="تفعيل إشعارات الرسائل النصية"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">الإشعارات الفورية</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">إشعارات فورية في المتصفح</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.notifications.pushNotifications} 
                          onChange={(e) => handleInputChange('notifications', 'pushNotifications', e.target.checked)}
                          aria-label="تفعيل الإشعارات الفورية"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <CalendarClock className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">تذكيرات القضايا</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">تذكيرات بالقضايا والمواعيد</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.notifications.caseReminders} 
                          onChange={(e) => handleInputChange('notifications', 'caseReminders', e.target.checked)}
                          aria-label="تفعيل تذكيرات القضايا"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                          <CalendarClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">تذكيرات الجلسات</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">تذكيرات بالجلسات والمواعيد</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.notifications.hearingReminders} 
                          onChange={(e) => handleInputChange('notifications', 'hearingReminders', e.target.checked)}
                          aria-label="تفعيل تذكيرات الجلسات"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Reports Settings */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h5 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">إعدادات التقارير</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">التقارير الأسبوعية</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">تلخيص أسبوعي للأنشطة</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.notifications.weeklyReports} 
                          onChange={(e) => handleInputChange('notifications', 'weeklyReports', e.target.checked)}
                          aria-label="تفعيل التقارير الأسبوعية"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">التقارير الشهرية</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">تلخيص شهري للأنشطة</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.notifications.monthlyReports} 
                          onChange={(e) => handleInputChange('notifications', 'monthlyReports', e.target.checked)}
                          aria-label="تفعيل التقارير الشهرية"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'email':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات البريد الإلكتروني</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">تكوين خادم البريد الإلكتروني لإرسال الإشعارات</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Mail className="w-5 h-5 text-blue-600" /> إعدادات SMTP
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      خادم SMTP
                    </label>
                    <input
                      type="text"
                      value={settings.notifications.smtp.host}
                      onChange={(e) => handleInputChange('notifications', 'smtp.host', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      المنفذ (Port)
                    </label>
                    <input
                      type="number"
                      value={settings.notifications.smtp.port}
                      onChange={(e) => handleInputChange('notifications', 'smtp.port', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      اسم المستخدم
                    </label>
                    <input
                      type="text"
                      value={settings.notifications.smtp.username}
                      onChange={(e) => handleInputChange('notifications', 'smtp.username', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      value={settings.notifications.smtp.password}
                      onChange={(e) => handleInputChange('notifications', 'smtp.password', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="كلمة المرور"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    البريد الإلكتروني المرسل
                  </label>
                  <input
                    type="email"
                    value={settings.notifications.smtp.fromEmail}
                    onChange={(e) => handleInputChange('notifications', 'smtp.fromEmail', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="noreply@yourdomain.com"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="smtp-secure"
                    checked={settings.notifications.smtp.encryption === 'tls'}
                    onChange={(e) => handleInputChange('notifications', 'smtp.encryption', e.target.checked ? 'tls' : 'none')}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="smtp-secure" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    استخدام SSL/TLS
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    اختبار إرسال بريد
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'sms':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات الرسائل النصية</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">تكوين خدمة الرسائل النصية لإرسال الإشعارات</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Smartphone className="w-5 h-5 text-amber-600" /> إعدادات SMS Gateway
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    مزود الخدمة
                  </label>
                  <select
                    value={settings.notifications.sms.provider}
                    onChange={(e) => handleInputChange('notifications', 'sms.provider', e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">اختر مزود الخدمة</option>
                    <option value="twilio">Twilio</option>
                    <option value="nexmo">Nexmo</option>
                    <option value="messagebird">MessageBird</option>
                    <option value="custom">مخصص</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      مفتاح API
                    </label>
                    <input
                      type="text"
                      value={settings.notifications.sms.apiKey}
                      onChange={(e) => handleInputChange('notifications', 'sms.apiKey', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="مفتاح API الخاص بالمزود"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      معرف المرسل (Sender ID)
                    </label>
                    <input
                      type="text"
                      value={settings.notifications.sms.senderId}
                      onChange={(e) => handleInputChange('notifications', 'sms.senderId', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="اسم المرسل"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    اختبار إرسال رسالة
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'custom':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">الإشعارات المخصصة</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">إنشاء وإدارة الإشعارات المخصصة</p>
              </div>
              <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all">
                <Plus className="w-4 h-4" />
                إنشاء إشعار مخصص
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Bell className="w-5 h-5 text-purple-600" /> قائمة الإشعارات المخصصة
                </h4>
              </div>
              
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {settings.notifications.customNotifications?.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">لا توجد إشعارات مخصصة</h4>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">ابدأ بإنشاء أول إشعار مخصص</p>
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 mx-auto">
                      <Plus className="w-4 h-4" />
                      إنشاء إشعار مخصص
                    </button>
                  </div>
                ) : (
                  settings.notifications.customNotifications?.map((notification) => (
                    <div key={notification.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold text-slate-900 dark:text-white">{notification.name}</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              notification.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {notification.isActive ? 'نشط' : 'غير نشط'}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              الزناد: {notification.trigger}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>قيد التطوير...</div>;
    }
  };

  const renderSecuritySettings = () => {
    switch (activeSubTab) {
      case 'authentication':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات المصادقة المتقدمة</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">تكوين طرق المصادقة والأمان</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Authentication Methods */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <Fingerprint className="w-5 h-5 text-purple-600" /> طرق المصادقة
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Two-Factor Authentication */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Fingerprint className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">المصادقة الثنائية (2FA)</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Google Authenticator</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.security.twoFactorAuth} 
                          onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
                          aria-label="تفعيل المصادقة الثنائية (2FA)"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    {/* Biometric Authentication */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Fingerprint className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">المصادقة البيومترية</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">بصمة الوجه / بصمة الإصبع</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.security.biometricAuth} 
                          onChange={(e) => handleInputChange('security', 'biometricAuth', e.target.checked)}
                          aria-label="تفعيل المصادقة البيومترية"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Single Sign-On */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">تسجيل الدخول الموحد (SSO)</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">LDAP / Active Directory</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.security.singleSignOn} 
                          onChange={(e) => handleInputChange('security', 'singleSignOn', e.target.checked)}
                          aria-label="تفعيل تسجيل الدخول الموحد"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Session Security */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <Clock className="w-5 h-5 text-amber-600" /> أمان الجلسات
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        مدة الجلسة (دقائق)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="5"
                          max="480"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="w-16 text-center font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {settings.security.sessionTimeout}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        تلقائي تسجيل الخروج بعد انتهاء المدة
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        الحد الأقصى لمحاولات الدخول
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="3"
                          max="10"
                          value={settings.security.maxLoginAttempts}
                          onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="w-16 text-center font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {settings.security.maxLoginAttempts}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        قفل الحساب بعد عدد المحاولات الفاشلة
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Policy */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <LockKeyhole className="w-5 h-5 text-red-600" /> سياسة كلمات المرور
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        مستوى تعقيد كلمة المرور
                      </label>
                      <select
                        value={settings.security.passwordComplexity}
                        onChange={(e) => handleInputChange('security', 'passwordComplexity', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        aria-label="مستوى تعقيد كلمة المرور"
                      >
                        <option value="low">منخفض - 6 أحرف</option>
                        <option value="medium">متوسط - 8 أحرف + أرقام</option>
                        <option value="high">عالي - 12 أحرف + رموز</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-slate-700 dark:text-slate-300">تاريخ انتهاء كلمة المرور</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">90 يوم</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-slate-700 dark:text-slate-300">عدد كلمات المرور السابقة</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">5</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-slate-700 dark:text-slate-300">إعادة تعيين كلمة المرور</span>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">مطلوب</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Encryption Settings */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <ShieldAlert className="w-5 h-5 text-indigo-600" /> إعدادات التشفير
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        مستوى التشفير
                      </label>
                      <select
                        value={settings.security.encryptionLevel}
                        onChange={(e) => handleInputChange('security', 'encryptionLevel', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        aria-label="مستوى التشفير"
                      >
                        <option value="standard">قياسي (AES-256)</option>
                        <option value="enhanced">محسّن (AES-256 + Salt)</option>
                        <option value="maximum">أقصى (AES-512 + Salt + Hash)</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-slate-700 dark:text-slate-300">تشفير البيانات المخزنة</span>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-slate-700 dark:text-slate-300">تشفير الاتصالات</span>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-slate-700 dark:text-slate-300">تشفير الملفات</span>
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  مدة الجلسة (دقائق)
                </label>
                <input
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  min="5"
                  max="480"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  الحد الأقصى لمحاولات الدخول
                </label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  min="3"
                  max="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  مستوى التشفير
                </label>
                <select
                  value={settings.security.encryptionLevel}
                  onChange={(e) => handleInputChange('security', 'encryptionLevel', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  aria-label="مستوى التشفير"
                >
                  <option value="standard">قياسي</option>
                  <option value="enhanced">محسّن</option>
                  <option value="maximum">أقصى</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  تعقيد كلمة المرور
                </label>
                <select
                  value={settings.security.passwordComplexity}
                  onChange={(e) => handleInputChange('security', 'passwordComplexity', e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  aria-label="تعقيد كلمة المرور"
                >
                  <option value="low">منخفض</option>
                  <option value="medium">متوسط</option>
                  <option value="high">عالي</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="twoFactor"
                  checked={settings.security.twoFactorAuth}
                  onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="twoFactor" className="mr-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  تفعيل المصادقة الثنائية
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auditLog"
                  checked={settings.security.auditLog}
                  onChange={(e) => handleInputChange('security', 'auditLog', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="auditLog" className="mr-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  تفعيل سجل التدقيق
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="biometric"
                  checked={settings.security.biometricAuth}
                  onChange={(e) => handleInputChange('security', 'biometricAuth', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="biometric" className="mr-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  تفعيل المصادقة البيومترية
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sso"
                  checked={settings.security.singleSignOn}
                  onChange={(e) => handleInputChange('security', 'singleSignOn', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="sso" className="mr-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  تفعيل تسجيل الدخول الموحد (SSO)
                </label>
              </div>
            </div>
          </div>
        );
      
      case 'api':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">مفاتيح API المتقدمة</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">إدارة ومصادقة وصول API</p>
              </div>
              <button 
                onClick={handleAddApiKey}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all"
              >
                <Key className="w-4 h-4" />
                إنشاء مفتاح جديد
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* API Keys List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {settings.security.apiKeys.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Key className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                  <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">لا توجد مفاتيح API</h4>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">ابدأ بإنشاء أول مفتاح API للوصول إلى النظام</p>
                  <button 
                    onClick={handleAddApiKey}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Key className="w-4 h-4" />
                    إنشاء مفتاح API
                  </button>
                </div>
              ) : (
                settings.security.apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                    {/* API Key Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{apiKey.name}</h4>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                              apiKey.isActive 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {apiKey.isActive ? 'نشط' : 'غير نشط'}
                            </span>
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                              {apiKey.permissions.length} صلاحية
                            </span>
                          </div>
                          <div className="font-mono text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 p-2 rounded">
                            {apiKey.key.substring(0, 20)}...{apiKey.key.substring(apiKey.key.length - 4)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleEditApiKey(apiKey)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="تعديل مفتاح API"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleApiKeyStatus(apiKey.id)}
                            className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            title={apiKey.isActive ? 'إلغاء تفعيل' : 'تفعيل'}
                          >
                            {apiKey.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="حذف مفتاح API"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* API Key Details */}
                    <div className="p-6 space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">الصلاحيات:</span>
                          <div className="flex flex-wrap gap-1">
                            {apiKey.permissions.map((permission, index) => (
                              <span key={index} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                                {permission}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">إنشاء:</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {new Date(apiKey.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">انتهاء:</span>
                          <span className={`font-medium ${
                            new Date(apiKey.expiresAt) > new Date()
                              ? 'text-slate-700 dark:text-slate-300'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {new Date(apiKey.expiresAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">آخر استخدام:</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString('ar-EG') : 'لم يستخدم بعد'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* API Key Modal */}
            {isApiKeyModalOpen && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {editingApiKey ? 'تعديل مفتاح API' : 'إنشاء مفتاح API جديد'}
                    </h3>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          اسم المفتاح *
                        </label>
                        <input
                          type="text"
                          value={apiKeyFormData.name}
                          onChange={(e) => setApiKeyFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          placeholder="أدخل اسم المفتاح"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          مفتاح API *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKeyFormData.key}
                            onChange={(e) => setApiKeyFormData(prev => ({ ...prev, key: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                            placeholder="مفتاح API"
                            readOnly={!editingApiKey}
                          />
                          {!editingApiKey && (
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                          {!editingApiKey && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(apiKeyFormData.key || '');
                                setMessage({ type: 'success', text: 'تم نسخ المفتاح إلى الحافظة' });
                              }}
                              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        {!editingApiKey && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            احفظ المفتاح في مكان آمن. لن يتم عرضه مرة أخرى.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        الصلاحيات
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['read', 'write', 'delete', 'admin', 'api', 'webhook', 'reports', 'settings'].map((permission) => (
                          <label key={permission} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(apiKeyFormData.permissions || []).includes(permission)}
                              onChange={() => handlePermissionToggle(permission)}
                              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">{permission}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          تاريخ الانتهاء
                        </label>
                        <input
                          type="date"
                          value={apiKeyFormData.expiresAt ? new Date(apiKeyFormData.expiresAt).toISOString().split('T')[0] : ''}
                          onChange={(e) => setApiKeyFormData(prev => ({ ...prev, expiresAt: new Date(e.target.value).toISOString() }))}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="api-key-active"
                          checked={apiKeyFormData.isActive}
                          onChange={(e) => setApiKeyFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="api-key-active" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          المفتاح نشط
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <button
                      onClick={() => setIsApiKeyModalOpen(false)}
                      className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                    >
                      إلغاء
                    </button>
                    <button
                      onClick={handleSaveApiKey}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      {editingApiKey ? 'تحديث' : 'إنشاء'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'audit':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">سجل التدقيق المتقدم</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">مراقبة وتسجيل جميع الأنشطة في النظام</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Audit Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">إجمالي الأنشطة</h4>
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">12,453</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">آخر 30 يوم</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">تسجلات الدخول</h4>
                  <LogIn className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">892</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">آخر 7 أيام</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">تعديل البيانات</h4>
                  <Edit3 className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">456</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">آخر 24 ساعة</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">حذف البيانات</h4>
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">23</div>
                <div className="text-sm text-slate-600 dark:text-slate-400">آخر ساعة</div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                    <FileText className="w-5 h-5 text-indigo-600" /> سجل الأنشطة
                  </h4>
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Download className="w-4 h-4" />
                      تصدير السجل
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">
                      <RefreshCw className="w-4 h-4" />
                      تحديث
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                      <Trash2 className="w-4 h-4" />
                      مسحف السجل
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="البحث في السجل..."
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    aria-label="البحث في سجل التدقيق"
                  />
                  <select className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" aria-label="فلترة البحث">
                    <option value="all">جميع الفترات</option>
                    <option value="today">اليوم</option>
                    <option value="week">هذا الأسبوع</option>
                    <option value="month">هذا الشهر</option>
                  </select>
                  <select className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" aria-label="نوع النشاط">
                    <option value="all">جميع الأنشطة</option>
                    <option value="login">تسجيل الدخول</option>
                    <option value="data_read">قراءة البيانات</option>
                    <option value="data_write">تعديل البيانات</option>
                    <option value="data_delete">حذف البيانات</option>
                    <option value="admin">إدارة النظام</option>
                    <option value="security">إعدادات الأمان</option>
                  </select>
                </div>
              </div>
              
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {/* Sample Audit Log Entries */}
                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        getAuditIconColor('login')
                      }`}>
                        <LogIn className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">تسجيل دخول المستخدم</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">admin@example.com قام بتسجيل الدخول من 192.168.1.1</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-600 dark:text-slate-400">قبل 5 دقائق</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        getAuditIconColor('data_read')
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">قراءة ملف القضية</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">lawyer@example.com قرأف ملف القضية رقم 2024/001</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-600 dark:text-slate-400">قبل 15 دقيقة</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        getAuditIconColor('data_write')
                      }`}>
                        <Edit3 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">تعديل بيانات العميل</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">lawyer@example.com حدثث بيانات العميل أحمد محمد</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-600 dark:text-slate-400">قبل 1 ساعة</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        getAuditIconColor('admin')
                      }`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">تعديل إعدادات الأمان</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">admin@example.com قام بتعديل مدة الجلسة إلى 60 دقيقة</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-600 dark:text-slate-400">قبل 2 ساعة</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        getAuditIconColor('security')
                      }`}>
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">تغيير كلمة مرور المسؤول</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">admin@example.com قام بتغيير كلمة المرور</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-600 dark:text-slate-400">قبل 3 ساعات</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                        <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">حذف مستند</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">lawyer@example.com قام بحذف ملف القضية رقم 2024/002</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-slate-600 dark:text-slate-400">قبل يوم واحد</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>قيد التطوير...</div>;
    }
  };

  const renderDataSettings = () => {
    switch (activeSubTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">نظرة عامة على إدارة البيانات</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">إدارة وحماية بيانات النظام</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Data Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">النسخ الاحتياطي</h4>
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.data.autoBackup ? 'مفعل' : 'معطل'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">حالة النسخ</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">التشفير</h4>
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.data.encryptionEnabled ? 'مفعل' : 'معطل'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">حالة التشفير</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">الأرشفة</h4>
                  <Archive className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.data.dataArchiving.enabled ? 'مفعل' : 'معطل'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">حالة الأرشفة</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">GDPR</h4>
                  <ShieldCheck className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.data.gdprCompliance ? 'مفعل' : 'معطل'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">الامتثال</div>
              </div>
            </div>

            {/* Data Management Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Database className="w-5 h-5 text-indigo-600" /> إعدادات إدارة البيانات
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">النسخ الاحتياطي التلقائي</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">نسخ احتياطي منتظم للبيانات</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.data.autoBackup} 
                          onChange={(e) => handleInputChange('data', 'autoBackup', e.target.checked)}
                          aria-label="تفعيل النسخ الاحتياطي التلقائي"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">تشفير البيانات</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">تشفير البيانات الحساسة</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.data.encryptionEnabled} 
                          onChange={(e) => handleInputChange('data', 'encryptionEnabled', e.target.checked)}
                          aria-label="تفعيل تشفير البيانات"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                          <Archive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">الأرشفة التلقائية</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">أرشفة البيانات القديمة</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.data.dataArchiving.enabled} 
                          onChange={(e) => handleNestedInputChange('data', 'dataArchiving', 'enabled', e.target.checked)}
                          aria-label="تفعيل الأرشفة التلقائية"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">الامتثال لـ GDPR</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">حماية البيانات الشخصية</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.data.gdprCompliance} 
                          onChange={(e) => handleInputChange('data', 'gdprCompliance', e.target.checked)}
                          aria-label="تفعيل الامتثال لـ GDPR"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">حذف البيانات القديمة</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">حذف تلقائي للبيانات المنتهية</p>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">
                        حذف الآن
                      </button>
                    </div>
                  </div>
                </div>

                {/* Data Retention and File Settings */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <h5 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">إعدادات الاحتفاظ بالبيانات</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        فترة الاحتفاظ بالبيانات (أيام)
                      </label>
                      <input
                        type="number"
                        value={settings.data.dataRetention}
                        onChange={(e) => handleInputChange('data', 'dataRetention', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        min="30"
                        max="3650"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        أقصى حجم للملف (ميجابايت)
                      </label>
                      <input
                        type="number"
                        value={settings.data.maxFileSize}
                        onChange={(e) => handleInputChange('data', 'maxFileSize', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'backup':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">النسخ الاحتياطي</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">إدارة النسخ الاحتياطي للبيانات</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Database className="w-5 h-5 text-blue-600" /> إعدادات النسخ الاحتياطي
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      تكرار النسخ
                    </label>
                    <select
                      value={settings.data.backupFrequency}
                      onChange={(e) => handleInputChange('data', 'backupFrequency', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="daily">يومي</option>
                      <option value="weekly">أسبوعي</option>
                      <option value="monthly">شهري</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      تنسيق التصدير
                    </label>
                    <select
                      value={settings.data.exportFormat}
                      onChange={(e) => handleInputChange('data', 'exportFormat', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="excel">Excel</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      نسخ احتياطي يدوي
                    </button>
                    <button className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      استعادة من نسخة احتياطية
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'storage':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">التخزين السحابي</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">تكوين التخزين السحابي للبيانات</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Cloud className="w-5 h-5 text-green-600" /> إعدادات التخزين السحابي
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      مزود التخزين
                    </label>
                    <select
                      value={settings.data.cloudStorage.provider}
                      onChange={(e) => handleNestedInputChange('data', 'cloudStorage', 'provider', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="aws-s3">Amazon S3</option>
                      <option value="google-drive">Google Drive</option>
                      <option value="onedrive">OneDrive</option>
                      <option value="dropbox">Dropbox</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      اسم الحاوية/المجلد
                    </label>
                    <input
                      type="text"
                      value={settings.data.cloudStorage.bucketName || ''}
                      onChange={(e) => handleNestedInputChange('data', 'cloudStorage', 'bucketName', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="my-backup-bucket"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Access Key
                    </label>
                    <input
                      type="text"
                      value={settings.data.cloudStorage.accessKey || ''}
                      onChange={(e) => handleNestedInputChange('data', 'cloudStorage', 'accessKey', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Access Key"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Secret Key
                    </label>
                    <input
                      type="password"
                      value={settings.data.cloudStorage.secretKey || ''}
                      onChange={(e) => handleNestedInputChange('data', 'cloudStorage', 'secretKey', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Secret Key"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    اختبار الاتصال بالتخزين
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'archiving':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">الأرشفة</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">إدارة أرشفة البيانات القديمة</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Archive className="w-5 h-5 text-amber-600" /> إعدادات الأرشفة
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      أرشفة بعد (أيام)
                    </label>
                    <input
                      type="number"
                      value={settings.data.dataArchiving.archiveAfter || 365}
                      onChange={(e) => handleNestedInputChange('data', 'dataArchiving', 'archiveAfter', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      min="30"
                      max="3650"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      موقع الأرشيف
                    </label>
                    <input
                      type="text"
                      value={settings.data.dataArchiving.archiveLocation || ''}
                      onChange={(e) => handleNestedInputChange('data', 'dataArchiving', 'archiveLocation', e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="/path/to/archive"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-4">
                    <button className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      بدء الأرشفة الآن
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      استعادة من الأرشيف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>قيد التطوير...</div>;
    }
  };

  const renderUsersSettings = () => {
    switch (activeSubTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">نظرة عامة على إدارة المستخدمين</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">إدارة صلاحيات وإعدادات المستخدمين</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">الحد الأقصى للمستخدمين</h4>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.users.maxUsersPerPlan}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">مستخدمين</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">التحقق من البريد</h4>
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.users.requireEmailVerification ? 'مفعل' : 'معطل'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">حالة التحقق</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">التسجيل الذاتي</h4>
                  <UserPlus className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.users.allowSelfRegistration ? 'مفعل' : 'معطل'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">حالة التسجيل</div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300">الدور الافتراضي</h4>
                  <Crown className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {settings.users.defaultRole === 'admin' ? 'مدير' : 
                   settings.users.defaultRole === 'lawyer' ? 'محامي' : 
                   settings.users.defaultRole === 'assistant' ? 'مساعد' : 'موظف'}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">الدور الافتراضي</div>
              </div>
            </div>

            {/* User Management Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Users className="w-5 h-5 text-indigo-600" /> إعدادات إدارة المستخدمين
                </h4>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">الحد الأقصى للمستخدمين</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">عدد المستخدمين المسموح به</p>
                        </div>
                      </div>
                      <input
                        type="number"
                        value={settings.users.maxUsersPerPlan}
                        onChange={(e) => handleInputChange('users', 'maxUsersPerPlan', parseInt(e.target.value))}
                        className="w-20 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center"
                        min="1"
                        max="100"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">التحقق من البريد الإلكتروني</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">إجبار المستخدمين على التحقق من البريد</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.users.requireEmailVerification} 
                          onChange={(e) => handleInputChange('users', 'requireEmailVerification', e.target.checked)}
                          aria-label="تفعيل التحقق من البريد الإلكتروني"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">التسجيل الذاتي</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">السماح للمستخدمين بالتسجيل بأنفسهم</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.users.allowSelfRegistration} 
                          onChange={(e) => handleInputChange('users', 'allowSelfRegistration', e.target.checked)}
                          aria-label="تفعيل التسجيل الذاتي"
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">الدور الافتراضي للمستخدمين الجدد</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">يتم تعيينه تلقائياً للمستخدمين الجدد</p>
                        </div>
                      </div>
                      <select
                        value={settings.users.defaultRole}
                        onChange={(e) => handleInputChange('users', 'defaultRole', e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="admin">مدير</option>
                        <option value="lawyer">محامي</option>
                        <option value="assistant">مساعد</option>
                        <option value="employee">موظف</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <ShieldX className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800 dark:text-white">حظر المستخدمين</h5>
                          <p className="text-sm text-slate-600 dark:text-slate-400">إدارة حظر المستخدمين</p>
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700">
                        إدارة الحظر
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'users':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">المستخدمين</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">إدارة حسابات المستخدمين في النظام</p>
              </div>
              <button 
                onClick={() => {
                  // TODO: Open add user modal
                  setMessage({ type: 'success', text: 'سيتم فتح نافذة إضافة مستخدم جديد' });
                }}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all"
              >
                <Plus className="w-4 h-4" /> مستخدم جديد
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Users List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Users className="w-5 h-5 text-blue-600" /> قائمة المستخدمين
                </h4>
              </div>
              
              <div className="p-6">
                {/* Search and Filter */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="البحث عن مستخدم..."
                      className="w-full pr-10 pl-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                  <select className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="">جميع الأدوار</option>
                    <option value="admin">مدير</option>
                    <option value="lawyer">محامي</option>
                    <option value="assistant">مساعد</option>
                    <option value="employee">موظف</option>
                  </select>
                  <select className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option value="">جميع الحالات</option>
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="suspended">معلق</option>
                  </select>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">المستخدم</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">البريد الإلكتروني</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">الدور</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">الحالة</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">آخر تسجيل دخول</th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Sample Users Data */}
                      <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-white">أحمد محمد</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">ID: 001</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">ahmed@example.com</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-semibold">
                            مدير
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold">
                            نشط
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">منذ ساعتين</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded">
                              <ShieldX className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-white">سارة أحمد</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">ID: 002</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">sara@example.com</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold">
                            محامي
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold">
                            نشط
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">منذ 5 دقائق</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded">
                              <ShieldX className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    عرض 1-2 من 10 مستخدمين
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      السابق
                    </button>
                    <button className="px-3 py-1 bg-indigo-600 text-white rounded-lg">1</button>
                    <button className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400">2</button>
                    <button className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                      التالي
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'roles':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">الأدوار</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">إدارة أدوار وصلاحيات المستخدمين</p>
              </div>
              <button 
                onClick={() => {
                  // TODO: Open add role modal
                  setMessage({ type: 'success', text: 'سيتم فتح نافذة إضافة دور جديد' });
                }}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all"
              >
                <Plus className="w-4 h-4" /> دور جديد
              </button>
            </div>

            {/* Message Display */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                  : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Admin Role */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">مدير</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">صلاحيات كاملة</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-semibold">
                    3 مستخدمين
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>الوصول الكامل للنظام</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>إدارة المستخدمين والأدوار</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>جميع الصلاحيات</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
                    تعديل
                  </button>
                  <button className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
                    عرض
                  </button>
                </div>
              </div>

              {/* Lawyer Role */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Crown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">محامي</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">صلاحيات محدودة</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold">
                    5 مستخدمين
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>إدارة القضايا</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>إدارة الموكلين</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>الجلسات والمواعيد</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
                    تعديل
                  </button>
                  <button className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
                    عرض
                  </button>
                </div>
              </div>

              {/* Assistant Role */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <Crown className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">مساعد</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">صلاحيات أساسية</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold">
                    2 مستخدمين
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>عرض القضايا</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>إدارة المهام</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>المستندات</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">
                    تعديل
                  </button>
                  <button className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
                    عرض
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'permissions':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">صلاحيات المستخدمين</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">تحديد صلاحيات المستخدمين الافتراضية</p>
              </div>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                   <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
                ) : (
                   <><Save className="w-4 h-4" /> حفظ التغييرات</>
                )}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <ShieldCheck className="w-5 h-5 text-green-600" /> الصلاحيات الافتراضية للمستخدمين الجدد
                </h4>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { id: 'dashboard', label: 'لوحة التحكم', icon: PieChart },
                    { id: 'cases', label: 'إدارة القضايا', icon: FileText },
                    { id: 'clients', label: 'إدارة الموكلين', icon: Users2 },
                    { id: 'lawyers', label: 'إدارة المحامين', icon: Crown },
                    { id: 'hearings', label: 'الجلسات والمواعيد', icon: Calendar },
                    { id: 'appointments', label: 'جدول المواعيد والأعمال', icon: CalendarClock },
                    { id: 'tasks', label: 'إدارة المهام', icon: CheckCircle2 },
                    { id: 'documents', label: 'الأرشيف والمستندات', icon: FileText },
                    { id: 'archive', label: 'إدارة الأرشيف', icon: Archive },
                    { id: 'generator', label: 'منشئ العقود', icon: FileText },
                    { id: 'fees', label: 'الحسابات (الإيرادات)', icon: CreditCard },
                    { id: 'expenses', label: 'المصروفات الإدارية', icon: CreditCard },
                    { id: 'reports', label: 'التقارير', icon: BarChart3 },
                    { id: 'references', label: 'المراجع القانونية', icon: BookOpen },
                    { id: 'ai-assistant', label: 'المساعد الذكي', icon: Bot },
                    { id: 'office-admin', label: 'الإدارة العليا', icon: Crown },
                    { id: 'locations', label: 'دليل المحاكم', icon: MapPin },
                    { id: 'calculators', label: 'الحاسبات القانونية', icon: Calculator },
                    { id: 'settings', label: 'الإعدادات والمستخدمين', icon: SettingsIcon },
                    { id: 'advanced-settings', label: 'الإعدادات المتقدمة', icon: SettingsIcon }
                  ].map(module => {
                    const IconComponent = module.icon;
                    return (
                      <div key={module.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h5 className="font-semibold text-slate-800 dark:text-white">{module.label}</h5>
                            <p className="text-xs text-slate-600 dark:text-slate-400">الوصول لـ {module.label}</p>
                          </div>
                        </div>
                        <select
                          value={settings.users.userPermissions[`can${module.id.charAt(0).toUpperCase() + module.id.slice(1)}` as keyof typeof settings.users.userPermissions] ? 'full' : 'none'}
                          onChange={(e) => {
                            const fieldName = `can${module.id.charAt(0).toUpperCase() + module.id.slice(1)}` as keyof typeof settings.users.userPermissions;
                            handleNestedInputChange('users', 'userPermissions', fieldName, e.target.value === 'full');
                          }}
                          className="w-20 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                        >
                          <option value="none">لا</option>
                          <option value="full">نعم</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>قيد التطوير...</div>;
    }
  };

  const renderMaintenanceSettings = () => {
    switch (activeSubTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">صيانة النظام</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">مراقبة الأداء، السجلات، وتحديثات النظام</p>
              </div>
              <div className="flex gap-2">
                <button className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2 transition-all">
                  <RefreshCw className="w-4 h-4" /> تحديث النظام
                </button>
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all">
                  <Activity className="w-4 h-4" /> فحص شامل
                </button>
              </div>
            </div>

            {/* System Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">حالة النظام</p>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white">ممتازة</h4>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">المعالج (CPU)</p>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white">45%</h4>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">الذاكرة (RAM)</p>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white">62%</h4>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold">وقت التشغيل</p>
                  <h4 className="text-lg font-bold text-slate-800 dark:text-white">15 يوم</h4>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'system-health':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">صحة النظام</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <RefreshCw className="w-4 h-4" />
                تحديث البيانات
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <Server className="w-5 h-5 text-indigo-600" /> حالة الخدمات
                </h4>
                <div className="space-y-3">
                  {['Database', 'API Server', 'Authentication', 'File Storage', 'Email Service'].map((service) => (
                    <div key={service} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <span className="font-bold text-slate-700 dark:text-slate-300">{service}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 bg-green-100 text-green-700">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        يعمل
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                  <HardDrive className="w-5 h-5 text-amber-600" /> استخدام الموارد
                </h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">مساحة التخزين</span>
                      <span className="text-slate-800 dark:text-white">75%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-amber-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">الذاكرة</span>
                      <span className="text-slate-800 dark:text-white">62%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '62%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">المعالج</span>
                      <span className="text-slate-800 dark:text-white">45%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'logs':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">سجلات النظام</h3>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                  <Filter className="w-4 h-4" />
                  فلترة
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  تصدير
                </button>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    placeholder="البحث في السجلات..."
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                  <select className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                    <option>جميع المستويات</option>
                    <option>خطأ</option>
                    <option>تحذير</option>
                    <option>معلومات</option>
                  </select>
                </div>
              </div>
              
              <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-green-100 text-green-600 rounded">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">تم تسجيل الدخول بنجاح</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">المستخدم admin@example.com قام بتسجيل الدخول</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">قبل 5 دقائق</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-amber-100 text-amber-600 rounded">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">استخدام عالي للذاكرة</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">استخدام الذاكرة تجاوز 80%</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">قبل 15 دقيقة</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'updates':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">التحديثات</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <Download className="w-4 h-4" />
                التحقق من التحديثات
              </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-green-100 text-green-600 rounded-full">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">النظام محدث</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">أنت تستخدم أحدث إصدار 2.1.0</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-slate-900 dark:text-white">الإصدار 2.1.0</h5>
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">مثبت</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    تحسينات في الأداء وإصلاح أخطاء الأمان
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">تاريخ التثبيت: 15 مارس 2025</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>قيد التطوير...</div>;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationsSettings();
      case 'data':
        return renderDataSettings();
      case 'users':
        return renderUsersSettings();
      case 'maintenance':
        return renderMaintenanceSettings();
      default:
        return <div>قيد التطوير...</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-300">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" dir="rtl">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            الإعدادات المتقدمة
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            إدارة وتخصيص جميع جوانب النظام
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="flex gap-6">
          {/* Main Sidebar */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="بحث في الإعدادات..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <div key={tab.id}>
                      <button
                        onClick={() => {
                          setActiveTab(tab.id);
                          setActiveSubTab(tab.subTabs[0].id);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="flex-1">{tab.name}</span>
                        {isActive ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      
                      {isActive && (
                        <div className="bg-slate-50 dark:bg-slate-700/50">
                          {tab.subTabs.map((subTab) => (
                            <button
                              key={subTab.id}
                              onClick={() => setActiveSubTab(subTab.id)}
                              className={`w-full flex items-center gap-3 px-12 py-2 text-right text-sm transition-colors ${
                                activeSubTab === subTab.id
                                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                              }`}
                            >
                              {subTab.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {tabs.find(tab => tab.id === activeTab)?.name}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {tabs.find(tab => tab.id === activeTab)?.subTabs.find(sub => sub.id === activeSubTab)?.name}
                    </p>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                  </button>
                </div>

                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
