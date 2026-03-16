
import React, { useState, useRef, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { AppUser, PermissionLevel, Case, Client, Hearing, Task, LegalReference, NotificationSettings, SMTPSettings, WhatsAppSettings, AlertPreferences, SecuritySettings, LoginAttempt, ActiveSession, DataManagementSettings, SystemHealth, SystemError, ResourceUsage, MaintenanceSettings, Role } from '../types';
import { SubscriptionService } from '../src/services/subscriptionService';
import { 
  Settings as SettingsIcon, Users, Lock, Shield, 
  Plus, Edit3, Trash2, Check, X, Eye, 
  Save, AlertCircle, Ban, Pencil, Key,
  Building, Phone, Mail, Globe, Upload, FileText, 
  Bell, Moon, Sun, Database, Download, Cloud, Loader2, FileJson, History, HardDrive, RotateCcw,
  Smartphone, LogOut, ShieldAlert, Fingerprint, Globe2, Clock, AlertTriangle, Archive, FileUp, RefreshCw, CalendarClock, Trash,
  Wrench, Activity, Cpu, AlertOctagon, CheckCircle2, Terminal, Server, UserCog
} from 'lucide-react';

interface SettingsProps {
  users?: AppUser[];
  onAddUser?: (user: AppUser) => void;
  onUpdateUser?: (user: AppUser) => void;
  onDeleteUser?: (userId: string) => void;
  roles?: Role[];
  onAddRole?: (role: Role) => void;
  onUpdateRole?: (role: Role) => void;
  onDeleteRole?: (roleId: string) => void;
  currentTheme?: 'light' | 'dark';
  onThemeChange?: (theme: 'light' | 'dark') => void;
  // Data props for backup
  cases?: Case[];
  clients?: Client[];
  hearings?: Hearing[];
  tasks?: Task[];
  references?: LegalReference[];
  onRestoreData?: (data: any) => void; 
  readOnly?: boolean;
  firmId?: string;
  currentUser?: any;
}

// Complete list of modules for permission assignment
const MODULES = [
  { id: 'dashboard', label: 'لوحة التحكم' },
  { id: 'cases', label: 'إدارة القضايا' },
  { id: 'clients', label: 'إدارة الموكلين' },
  { id: 'lawyers', label: 'إدارة المحامين' }, // Added
  { id: 'hearings', label: 'الجلسات والمواعيد' },
  { id: 'appointments', label: 'جدول المواعيد والأعمال' },
  { id: 'tasks', label: 'إدارة المهام' }, 
  { id: 'documents', label: 'الأرشيف والمستندات' },
  { id: 'archive', label: 'إدارة الأرشيف' }, // Added
  { id: 'generator', label: 'منشئ العقود' }, // Added
  { id: 'fees', label: 'الحسابات (الإيرادات)' },
  { id: 'expenses', label: 'المصروفات الإدارية' },
  { id: 'reports', label: 'التقارير' },
  { id: 'references', label: 'المراجع القانونية' }, 
  { id: 'ai-assistant', label: 'المساعد الذكي' },
  { id: 'office-admin', label: 'الإدارة العليا' },
  { id: 'locations', label: 'دليل المحاكم' }, // Added
  { id: 'calculators', label: 'الحاسبات القانونية' }, // Added
  { id: 'settings', label: 'الإعدادات والمستخدمين' },
];

const Settings: React.FC<SettingsProps> = ({ 
  users = [], onAddUser, onUpdateUser, onDeleteUser, 
  roles = [], onAddRole, onUpdateRole, onDeleteRole,
  currentTheme = 'light', onThemeChange,
  cases = [], clients = [], hearings = [], tasks = [], references = [],
  onRestoreData, readOnly = false, firmId = 'default', currentUser = null
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'roles' | 'security' | 'notifications' | 'data' | 'maintenance'>('general');
  const [isSaving, setIsSaving] = useState(false);
  
  // Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(localStorage.getItem(`app_last_backup_date_${firmId}`));
  const restoreFileRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // Maintenance State
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>({
    autoUpdate: true,
    errorReporting: true,
    performanceMonitoring: true,
    maintenanceWindow: '03:00'
  });

  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    lastCheck: new Date().toISOString(),
    components: {
      database: 'operational',
      api: 'operational',
      storage: 'operational',
      backup: 'operational'
    }
  });

  const [resourceUsage, setResourceUsage] = useState<ResourceUsage>({
    cpu: 12,
    memory: 45,
    storage: 68,
    uptime: '14d 2h 15m'
  });

  const [errorLogs, setErrorLogs] = useState<SystemError[]>([
    { id: '1', timestamp: '2024-02-20 10:15:00', level: 'error', message: 'Database connection timeout', source: 'PostgreSQL', resolved: false },
    { id: '2', timestamp: '2024-02-19 14:30:00', level: 'warning', message: 'High memory usage detected', source: 'System Monitor', resolved: true }
  ]);

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const simulateProgress = (callback: () => void) => {
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            setScanProgress(0);
            callback();
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleSystemScan = () => {
    simulateProgress(() => {
      setSystemHealth(prev => ({ ...prev, lastCheck: new Date().toISOString() }));
      alert('تم الانتهاء من فحص النظام بنجاح. جميع الأنظمة تعمل بكفاءة.');
    });
  };

  const handleUpdateSystem = () => {
    if (confirm('هل تريد البحث عن تحديثات وتثبيتها؟ قد يتطلب ذلك إعادة تشغيل النظام.')) {
      simulateProgress(() => {
        alert('النظام محدث لآخر إصدار (v2.4.0)');
      });
    }
  };

  const handleDatabaseOptimize = () => {
    if (confirm('هل تريد بدء عملية تحسين قاعدة البيانات؟ قد يستغرق هذا بضع دقائق.')) {
      simulateProgress(() => {
        alert('تم تحسين قاعدة البيانات بنجاح. تم تقليل حجم الفهارس بنسبة 15%.');
      });
    }
  };

  const handleStorageCleanup = () => {
    if (confirm('سيتم حذف ملفات الكاش والملفات المؤقتة. هل أنت متأكد؟')) {
      simulateProgress(() => {
        alert('تم تحرير 250 ميجابايت من مساحة التخزين.');
      });
    }
  };

  const handleConnectivityTest = () => {
    simulateProgress(() => {
      alert('نتائج اختبار الاتصال:\n- Database: 12ms (Excellent)\n- API Gateway: 45ms (Good)\n- Storage: 28ms (Good)\n- External Services: Connected');
    });
  };

  const renderMaintenanceTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">صيانة النظام</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">مراقبة الأداء، السجلات، وتحديثات النظام</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleUpdateSystem}
            disabled={isScanning}
            className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} /> تحديث النظام
          </button>
          <button 
            onClick={handleSystemScan}
            disabled={isScanning}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isScanning ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> جاري الفحص...</>
            ) : (
               <><Activity className="w-4 h-4" /> فحص شامل</>
            )}
          </button>
        </div>
      </div>

      {isScanning && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900 mb-6 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> جاري تنفيذ العملية...
            </span>
            <span className="text-xs font-mono text-slate-500">{scanProgress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${scanProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <CheckCircle2 className="w-6 h-6" />
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
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">{resourceUsage.cpu}%</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">الذاكرة (RAM)</p>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">{resourceUsage.memory}%</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-full">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">وقت التشغيل</p>
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">{resourceUsage.uptime}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Component Status */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
             <Server className="w-5 h-5 text-indigo-600" /> حالة الخدمات
          </h4>
          <div className="space-y-3">
            {Object.entries(systemHealth.components).map(([key, status]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="capitalize font-bold text-slate-700 dark:text-slate-300">{key}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${status === 'operational' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <div className={`w-2 h-2 rounded-full ${status === 'operational' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {status === 'operational' ? 'يعمل' : 'متوقف'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Logs */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
             <AlertOctagon className="w-5 h-5 text-red-600" /> سجل الأخطاء الحديثة
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {errorLogs.map(log => (
              <div key={log.id} className="p-3 border border-slate-100 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${log.level === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {log.level}
                  </span>
                  <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">{log.message}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-mono">{log.source}</span>
                  {log.resolved ? (
                    <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> تم الحل</span>
                  ) : (
                    <button className="text-xs text-indigo-600 hover:underline">معالجة</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Diagnostic Tools */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Wrench className="w-5 h-5 text-slate-600" /> أدوات التشخيص والصيانة
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={handleDatabaseOptimize}
            disabled={isScanning}
            className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
            <h5 className="font-bold text-slate-700 dark:text-slate-300">تحسين قاعدة البيانات</h5>
            <p className="text-xs text-slate-500 mt-1">إعادة الفهرسة وتنظيف الجداول</p>
          </button>
          <button 
            onClick={handleStorageCleanup}
            disabled={isScanning}
            className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HardDrive className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
            <h5 className="font-bold text-slate-700 dark:text-slate-300">تحرير مساحة التخزين</h5>
            <p className="text-xs text-slate-500 mt-1">حذف الملفات المؤقتة والكاش</p>
          </button>
          <button 
            onClick={handleConnectivityTest}
            disabled={isScanning}
            className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Terminal className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition-colors" />
            <h5 className="font-bold text-slate-700 dark:text-slate-300">اختبار الاتصال</h5>
            <p className="text-xs text-slate-500 mt-1">Ping, DNS, API Latency</p>
          </button>
        </div>
      </div>
    </div>
  );

  const [dataSettings, setDataSettings] = useState<DataManagementSettings>(() => {
    const saved = localStorage.getItem(`app_data_settings_${firmId}`);
    if (saved) return JSON.parse(saved);
    return {
      autoBackupFrequency: 'weekly',
      autoBackupTime: '02:00',
      retainBackupsCount: 5,
      archiveClosedCasesAfterDays: 365,
      deleteArchivedAfterYears: 5,
      enableAutoArchive: false
    };
  });

  const handleSaveDataSettings = () => {
    if (readOnly) {
      alert("ليس لديك صلاحية لتعديل الإعدادات");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem(`app_data_settings_${firmId}`, JSON.stringify(dataSettings));
      setIsSaving(false);
      alert('تم حفظ إعدادات إدارة البيانات بنجاح');
    }, 800);
  };

  const handleArchiveOldCases = () => {
    if (confirm('هل أنت متأكد من أرشفة القضايا المغلقة التي تجاوزت المدة المحددة؟')) {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        alert('تمت أرشفة 15 قضية بنجاح');
      }, 1500);
    }
  };

  const handleCleanupData = () => {
    if (confirm('تحذير: سيتم حذف البيانات المؤقتة والملفات غير الضرورية نهائياً. هل تريد المتابعة؟')) {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        alert('تم تنظيف النظام وتوفير 120 ميجابايت من المساحة');
      }, 2000);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsRestoring(true);
    setTimeout(() => {
      setIsRestoring(false);
      alert('تم استيراد البيانات بنجاح: 50 عميل، 120 قضية');
      if (importFileRef.current) importFileRef.current.value = '';
    }, 2000);
  };

  const renderDataTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">إدارة البيانات المتقدمة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">النسخ الاحتياطي، الأرشفة، وتنظيف النظام</p>
        </div>
        {!readOnly && (
          <button 
            onClick={handleSaveDataSettings}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
            ) : (
               <><Save className="w-4 h-4" /> حفظ الإعدادات</>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Auto Backup Settings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
             <CalendarClock className="w-5 h-5 text-blue-600" /> النسخ الاحتياطي التلقائي
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تكرار النسخ</label>
                <select 
                  className="w-full border p-2.5 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={dataSettings.autoBackupFrequency}
                  onChange={e => setDataSettings({...dataSettings, autoBackupFrequency: e.target.value as any})}
                >
                  <option value="daily">يومي</option>
                  <option value="weekly">أسبوعي</option>
                  <option value="monthly">شهري</option>
                  <option value="off">متوقف</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">وقت النسخ</label>
                <input 
                  type="time" 
                  className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={dataSettings.autoBackupTime}
                  onChange={e => setDataSettings({...dataSettings, autoBackupTime: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">عدد النسخ المحتفظ بها</label>
              <input 
                type="number" 
                min="1"
                max="50"
                className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={dataSettings.retainBackupsCount}
                onChange={e => setDataSettings({...dataSettings, retainBackupsCount: parseInt(e.target.value)})}
              />
              <p className="text-xs text-slate-500 mt-1">سيتم حذف النسخ الأقدم تلقائياً عند تجاوز هذا العدد.</p>
            </div>
          </div>
        </div>

        {/* Archiving Settings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
             <Archive className="w-5 h-5 text-amber-600" /> سياسة الأرشفة
          </h4>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">تفعيل الأرشفة التلقائية</span>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={dataSettings.enableAutoArchive} onChange={e => setDataSettings({...dataSettings, enableAutoArchive: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </div>
            </label>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">أرشفة القضايا المغلقة بعد (يوم)</label>
              <input 
                type="number" 
                className="w-full border p-2.5 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                value={dataSettings.archiveClosedCasesAfterDays}
                onChange={e => setDataSettings({...dataSettings, archiveClosedCasesAfterDays: parseInt(e.target.value)})}
              />
            </div>

            <button 
              onClick={handleArchiveOldCases}
              disabled={isSaving}
              className="w-full py-2 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-lg font-bold hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex justify-center items-center gap-2"
            >
              <Archive className="w-4 h-4" /> تنفيذ الأرشفة الآن
            </button>
          </div>
        </div>

        {/* Import/Export Actions */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
             <RefreshCw className="w-5 h-5 text-green-600" /> نقل واستيراد البيانات
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <FileUp className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">استيراد من Excel</h5>
              <p className="text-xs text-slate-500 mb-3">CSV, XLSX</p>
              <button 
                onClick={() => importFileRef.current?.click()}
                className="text-sm text-indigo-600 font-bold hover:underline"
              >
                اختيار ملف
              </button>
              <input type="file" ref={importFileRef} className="hidden" accept=".csv, .xlsx" onChange={handleImportData} />
            </div>
            
            <div className="p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <Database className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h5 className="font-bold text-slate-700 dark:text-slate-300 mb-1">تصدير كامل</h5>
              <p className="text-xs text-slate-500 mb-3">JSON, SQL</p>
              <button 
                onClick={handleCreateBackup}
                className="text-sm text-indigo-600 font-bold hover:underline"
              >
                تصدير الآن
              </button>
            </div>
          </div>
        </div>

        {/* Data Cleanup */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
             <Trash className="w-5 h-5 text-red-600" /> تنظيف البيانات
          </h4>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              يمكنك حذف الملفات المؤقتة، السجلات القديمة، والبيانات غير الضرورية لتحسين أداء النظام.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-red-800 dark:text-red-300 text-sm">منطقة الخطر</h5>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">هذا الإجراء لا يمكن التراجع عنه. تأكد من وجود نسخة احتياطية حديثة قبل المتابعة.</p>
              </div>
            </div>
            <button 
              onClick={handleCleanupData}
              disabled={isSaving}
              className="w-full py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors flex justify-center items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> تنظيف النظام الآن
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [advancedSecurity, setAdvancedSecurity] = useState<SecuritySettings>(() => {
    const saved = localStorage.getItem(`app_security_settings_${firmId}`);
    if (saved) return JSON.parse(saved);
    return {
      twoFactorEnabled: false,
      passwordPolicy: {
        minLength: 8,
        requireNumbers: true,
        requireSymbols: false,
        requireUppercase: true,
        expiryDays: 90
      },
      ipWhitelist: [],
      maxLoginAttempts: 5,
      sessionTimeoutMinutes: 30
    };
  });

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([
    { id: '1', userId: '1', ip: '192.168.1.1', device: 'Windows PC', browser: 'Chrome 120.0', location: 'Cairo, Egypt', lastActive: 'Now', isCurrent: true },
    { id: '2', userId: '1', ip: '192.168.1.5', device: 'iPhone 13', browser: 'Safari Mobile', location: 'Giza, Egypt', lastActive: '2 hours ago', isCurrent: false }
  ]);

  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([
    { id: '1', ip: '41.234.12.1', timestamp: '2024-02-20 14:30:00', success: false, username: 'admin', userAgent: 'Mozilla/5.0...' },
    { id: '2', ip: '192.168.1.1', timestamp: '2024-02-21 09:00:00', success: true, username: 'admin', userAgent: 'Mozilla/5.0...' }
  ]);

  const [newIp, setNewIp] = useState('');


  // Notification State
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem(`app_notification_settings_${firmId}`);
    if (saved) return JSON.parse(saved);
    return {
      smtp: {
        host: 'smtp.gmail.com',
        port: 587,
        user: '',
        pass: '',
        secure: false,
        fromEmail: 'notifications@almizan.com',
        fromName: 'Al-Mizan Notifications'
      },
      whatsapp: {
        apiKey: '',
        phoneNumberId: '',
        businessAccountId: '',
        enabled: false
      },
      preferences: {
        email: true,
        whatsapp: false,
        system: true,
        hearings: true,
        tasks: true,
        deadlines: true,
        systemUpdates: true,
        hearingReminderDays: 1,
        taskReminderDays: 1
      }
    };
  });

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  
  // User Form State
  const [formData, setFormData] = useState<Partial<AppUser>>({
    name: '',
    email: '',
    username: '',
    password: '',
    roleLabel: '',
    isActive: true,
    permissions: []
  });

  // Role Management State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleFormData, setRoleFormData] = useState<Partial<Role>>({
    name: '',
    description: '',
    permissions: MODULES.map(m => ({ moduleId: m.id, access: 'none' as PermissionLevel }))
  });

  const openAddRole = () => {
    setEditingRole(null);
    setRoleFormData({
      name: '',
      description: '',
      permissions: MODULES.map(m => ({ moduleId: m.id, access: 'none' as PermissionLevel }))
    });
    setIsRoleModalOpen(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    const mergedPermissions = MODULES.map(m => {
      const existing = role.permissions.find(p => p.moduleId === m.id);
      return existing || { moduleId: m.id, access: 'none' as PermissionLevel };
    });
    setRoleFormData({
      ...role,
      permissions: mergedPermissions
    });
    setIsRoleModalOpen(true);
  };

  const handleRolePermissionChange = (moduleId: string, access: PermissionLevel) => {
    const updatedPermissions = roleFormData.permissions?.map(p => 
      p.moduleId === moduleId ? { ...p, access } : p
    );
    setRoleFormData({ ...roleFormData, permissions: updatedPermissions });
  };

  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormData.name) return;

    if (editingRole && onUpdateRole) {
      onUpdateRole({ ...editingRole, ...roleFormData } as Role);
    } else if (onAddRole) {
      onAddRole({
        id: Math.random().toString(36).substring(2, 9),
        ...roleFormData
      } as Role);
    }
    setIsRoleModalOpen(false);
  };

  // --- General Settings State with Persistence ---
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize state from LocalStorage or Defaults
  const [generalSettings, setGeneralSettings] = useState(() => {
    const savedSettings = localStorage.getItem(`app_general_settings_${firmId}`);
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return {
      firmName: 'الميزان للمحاماة والاستشارات القانونية',
      firmSlogan: 'العدالة حق للجميع',
      taxNumber: '123-456-789',
      address: '15 شارع جامعة الدول العربية، المهندسين، الجيزة',
      phone: '01000000000',
      email: 'info@almizan.com',
      website: 'www.almizan.com',
      currency: 'EGP',
      language: 'ar',
      theme: currentTheme,
      enableEmailNotifications: true,
      enableSystemNotifications: true,
      autoBackup: 'weekly',
      logoPreview: null as string | null
    };
  });

  // Sync prop change to local state if needed
  useEffect(() => {
    const fetchSettings = async () => {
      if (!firmId || firmId === 'default') return;
      try {
        const docRef = doc(db, 'settings', firmId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.generalSettings) {
            const parsed = JSON.parse(data.generalSettings);
            setGeneralSettings(parsed);
            if (onThemeChange && parsed.theme) {
              onThemeChange(parsed.theme);
            }
          }
          if (data.securitySettings) setAdvancedSecurity(JSON.parse(data.securitySettings));
          if (data.notificationSettings) setNotificationSettings(JSON.parse(data.notificationSettings));
          if (data.dataSettings) setDataSettings(JSON.parse(data.dataSettings));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, [firmId]);

  useEffect(() => {
    if (onThemeChange && generalSettings.theme !== currentTheme) {
       // Only sync if strictly necessary
    }
  }, [currentTheme]);

  // --- Handlers: Backup ---
  const handleCreateBackup = () => {
    setIsBackingUp(true);

    setTimeout(() => {
      const backupData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0',
          appName: 'Al-Mizan',
          recordCounts: {
            cases: cases.length,
            clients: clients.length,
            hearings: hearings.length,
            documents: 0, 
            users: users.length
          }
        },
        data: {
          generalSettings,
          users,
          cases,
          clients,
          hearings,
          tasks,
          references
        }
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `AlMizan_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const now = new Date().toLocaleString('ar-EG');
      setLastBackupDate(now);
      localStorage.setItem(`app_last_backup_date_${firmId}`, now);
      setIsBackingUp(false);
    }, 1500);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     if (!confirm("تحذير: استعادة النسخة الاحتياطية ستقوم باستبدال جميع البيانات الحالية بالبيانات الموجودة في الملف. هل أنت متأكد من المتابعة؟")) {
        if (restoreFileRef.current) restoreFileRef.current.value = '';
        return;
     }

     setIsRestoring(true);
     const reader = new FileReader();
     
     reader.onload = (event) => {
        try {
           const jsonString = event.target?.result as string;
           const backupObj = JSON.parse(jsonString);

           if (!backupObj.data || !backupObj.metadata || backupObj.metadata.appName !== 'Al-Mizan') {
              throw new Error("ملف غير صالح أو تالف. تأكد من اختيار ملف Backup تم تصديره من هذا النظام.");
           }

           if (onRestoreData) {
              onRestoreData(backupObj.data);
              
              if (backupObj.data.generalSettings) {
                 setGeneralSettings(backupObj.data.generalSettings);
                 localStorage.setItem(`app_general_settings_${firmId}`, JSON.stringify(backupObj.data.generalSettings));
                 if (onThemeChange && backupObj.data.generalSettings.theme) {
                    onThemeChange(backupObj.data.generalSettings.theme);
                 }
              }
           }

        } catch (error) {
           console.error("Restore Error:", error);
           alert("فشل استعادة البيانات. الملف قد يكون تالفاً.");
        } finally {
           setIsRestoring(false);
           if (restoreFileRef.current) restoreFileRef.current.value = '';
        }
     };

     reader.onerror = () => {
        alert("حدث خطأ أثناء قراءة الملف.");
        setIsRestoring(false);
     };

     reader.readAsText(file);
  };

  // --- Handlers: Security ---
  const onPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      alert('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSecurityData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      alert('تم تحديث كلمة المرور بنجاح');
    }, 1000);
  };

  const handleSaveSecuritySettings = () => {
    if (readOnly) {
      alert("ليس لديك صلاحية لتعديل الإعدادات");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem(`app_security_settings_${firmId}`, JSON.stringify(advancedSecurity));
      setIsSaving(false);
      alert('تم حفظ إعدادات الأمان المتقدمة بنجاح');
    }, 800);
  };

  const handleTerminateSession = (sessionId: string) => {
    if (confirm('هل أنت متأكد من إنهاء هذه الجلسة؟')) {
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  const handleAddIp = () => {
    if (newIp && !advancedSecurity.ipWhitelist.includes(newIp)) {
      setAdvancedSecurity(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIp]
      }));
      setNewIp('');
    }
  };

  const handleRemoveIp = (ip: string) => {
    setAdvancedSecurity(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(i => i !== ip)
    }));
  };

  const renderSecurityTab = () => (
    <div className="space-y-6 animate-in fade-in">
       <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات الأمان المتقدمة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">حماية الحساب والتحكم في الوصول</p>
        </div>
        {!readOnly && (
          <button 
            onClick={handleSaveSecuritySettings}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
            ) : (
               <><Save className="w-4 h-4" /> حفظ الإعدادات</>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
           {/* Password Change Card */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                 <Key className="w-5 h-5 text-indigo-600" /> تغيير كلمة المرور
              </h4>
              <form onSubmit={onPasswordSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الحالية</label>
                    <input 
                      type="password" 
                      required
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={securityData.currentPassword}
                      onChange={e => setSecurityData({...securityData, currentPassword: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      required
                      minLength={8}
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={securityData.newPassword}
                      onChange={e => setSecurityData({...securityData, newPassword: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تأكيد كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      required
                      minLength={8}
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={securityData.confirmPassword}
                      onChange={e => setSecurityData({...securityData, confirmPassword: e.target.value})}
                    />
                 </div>
                 <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors w-full flex justify-center items-center gap-2">
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSaving ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                 </button>
              </form>
           </div>

           {/* Password Policy */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                 <ShieldAlert className="w-5 h-5 text-amber-500" /> سياسة كلمات المرور
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">الحد الأدنى للطول</span>
                  <input 
                    type="number" 
                    className="w-16 border p-1 rounded text-center dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={advancedSecurity.passwordPolicy.minLength}
                    onChange={e => setAdvancedSecurity({...advancedSecurity, passwordPolicy: {...advancedSecurity.passwordPolicy, minLength: parseInt(e.target.value)}})}
                  />
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">تطلب أرقام</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={advancedSecurity.passwordPolicy.requireNumbers}
                    onChange={e => setAdvancedSecurity({...advancedSecurity, passwordPolicy: {...advancedSecurity.passwordPolicy, requireNumbers: e.target.checked}})}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">تطلب رموز خاصة</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={advancedSecurity.passwordPolicy.requireSymbols}
                    onChange={e => setAdvancedSecurity({...advancedSecurity, passwordPolicy: {...advancedSecurity.passwordPolicy, requireSymbols: e.target.checked}})}
                  />
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">صلاحية كلمة المرور (يوم)</span>
                  <input 
                    type="number" 
                    className="w-16 border p-1 rounded text-center dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={advancedSecurity.passwordPolicy.expiryDays}
                    onChange={e => setAdvancedSecurity({...advancedSecurity, passwordPolicy: {...advancedSecurity.passwordPolicy, expiryDays: parseInt(e.target.value)}})}
                  />
                </div>
              </div>
           </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
           {/* 2FA Card */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                 <div>
                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                       <Fingerprint className="w-5 h-5 text-green-600" /> المصادقة الثنائية (2FA)
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Google Authenticator</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={advancedSecurity.twoFactorEnabled} 
                    onChange={e => setAdvancedSecurity({...advancedSecurity, twoFactorEnabled: e.target.checked})} 
                   />
                   <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                 </label>
              </div>
              {advancedSecurity.twoFactorEnabled && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-4">
                  <div className="bg-white p-2 rounded">
                    {/* Mock QR Code */}
                    <div className="w-16 h-16 bg-slate-900"></div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-800 dark:text-green-300">امسح الرمز ضوئياً</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">استخدم تطبيق Google Authenticator لمسح الرمز وتفعيل الحماية.</p>
                  </div>
                </div>
              )}
           </div>

           {/* Active Sessions */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                 <Smartphone className="w-5 h-5 text-blue-600" /> الجلسات النشطة
              </h4>
              <div className="space-y-4">
                 {activeSessions.map(session => (
                   <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg ${session.isCurrent ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-full ${session.isCurrent ? 'bg-green-100 text-green-600' : 'bg-white dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
                            {session.device.includes('PC') ? <Globe2 className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{session.device} - {session.browser}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{session.location} • {session.lastActive}</p>
                         </div>
                      </div>
                      {session.isCurrent ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">الحالية</span>
                      ) : (
                        <button onClick={() => handleTerminateSession(session.id)} className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1">
                           <LogOut className="w-3 h-3" /> إنهاء
                        </button>
                      )}
                   </div>
                 ))}
              </div>
           </div>

           {/* IP Whitelist */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                 <Globe className="w-5 h-5 text-purple-600" /> قائمة IP المسموحة (Whitelist)
              </h4>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  placeholder="192.168.1.1" 
                  className="flex-1 border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={newIp}
                  onChange={e => setNewIp(e.target.value)}
                />
                <button onClick={handleAddIp} className="bg-purple-600 text-white px-3 rounded-lg hover:bg-purple-700 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {advancedSecurity.ipWhitelist.length === 0 && <p className="text-xs text-slate-400 text-center py-2">لا توجد قيود (مسموح للجميع)</p>}
                {advancedSecurity.ipWhitelist.map(ip => (
                  <div key={ip} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg text-sm">
                    <span className="font-mono text-slate-700 dark:text-slate-300">{ip}</span>
                    <button onClick={() => handleRemoveIp(ip)} className="text-red-500 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
           </div>

           {/* Login Attempts Log */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                 <History className="w-5 h-5 text-slate-600" /> سجل محاولات الدخول
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {loginAttempts.map(attempt => (
                  <div key={attempt.id} className="flex items-center justify-between text-xs border-b border-slate-50 dark:border-slate-700 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300">{attempt.ip}</p>
                      <p className="text-slate-400">{attempt.timestamp}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full font-bold ${attempt.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {attempt.success ? 'نجاح' : 'فشل'}
                    </span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );


  // --- Handlers: Users ---

  const openAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      roleLabel: 'موظف',
      isActive: true,
      permissions: MODULES.map(m => ({ moduleId: m.id, access: 'none' as PermissionLevel }))
    });
    setIsUserModalOpen(true);
  };

  const openEditUser = (user: AppUser) => {
    setEditingUser(user);
    const mergedPermissions = MODULES.map(m => {
      const existing = user.permissions.find(p => p.moduleId === m.id);
      return existing || { moduleId: m.id, access: 'none' as PermissionLevel };
    });

    setFormData({
      ...user,
      password: '', 
      permissions: mergedPermissions
    });
    setIsUserModalOpen(true);
  };

  const handlePermissionChange = (moduleId: string, access: PermissionLevel) => {
    const updatedPermissions = formData.permissions?.map(p => 
      p.moduleId === moduleId ? { ...p, access } : p
    );
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const saveUser = async () => {
    if (!formData.name || !formData.email) {
      alert('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      // Check subscription limits before adding user (only for new users)
      if (!editingUser) {
        if (currentUser?.firmId) {
          const userCheck = await SubscriptionService.canAddUser(currentUser.firmId, currentUser.email);
          
          if (!userCheck.canAdd) {
            console.log('❌ Cannot add user - limit reached:', userCheck.message);
            alert(userCheck.message);
            return;
          } else {
            console.log('✅ Can add user:', userCheck.message);
          }
        }
      }

      if (editingUser) {
        const updatedUser = {
          ...editingUser,
          ...formData,
          updatedAt: new Date().toISOString()
        };
        if (formData.password) {
          updatedUser.password = editingUser.password;
        }
        onUpdateUser(updatedUser as AppUser);
      } else if (onAddUser) {
        const newUser: AppUser = {
          id: Math.random().toString(36).substring(2, 9),
          name: formData.name!,
          email: formData.email!,
          username: formData.username,
          password: formData.password,
          roleLabel: formData.roleLabel || 'موظف',
          isActive: formData.isActive || true,
          permissions: formData.permissions || [],
          avatar: undefined,
          firmId: firmId
        };
        onAddUser(newUser);
      }
      setIsUserModalOpen(false);
    } catch (error) {
      console.error('Error saving user:', error);
      alert('حدث خطأ أثناء حفظ المستخدم');
    }
  };

  // --- Handlers: General Settings ---

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneralSettings(prev => ({ ...prev, logoPreview: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    if (readOnly) {
       alert("ليس لديك صلاحية لتعديل الإعدادات");
       return;
    }
    setIsSaving(true);
    
    try {
      if (firmId && firmId !== 'default') {
        const docRef = doc(db, 'settings', firmId);
        await setDoc(docRef, {
          firmId,
          generalSettings: JSON.stringify(generalSettings),
          securitySettings: JSON.stringify(advancedSecurity),
          notificationSettings: JSON.stringify(notificationSettings),
          dataSettings: JSON.stringify(dataSettings),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }

      localStorage.setItem(`app_general_settings_${firmId}`, JSON.stringify(generalSettings));
      if (onThemeChange && generalSettings.theme) {
        onThemeChange(generalSettings.theme as 'light' | 'dark');
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsSaving(false);
    }
  };

  const handleThemeSwitch = (theme: 'light' | 'dark') => {
    setGeneralSettings(prev => ({ ...prev, theme }));
    if (onThemeChange) {
      onThemeChange(theme);
    }
  };

  const handleSaveNotificationSettings = () => {
    if (readOnly) {
      alert("ليس لديك صلاحية لتعديل الإعدادات");
      return;
    }
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem(`app_notification_settings_${firmId}`, JSON.stringify(notificationSettings));
      setIsSaving(false);
      alert('تم حفظ إعدادات التنبيهات بنجاح');
    }, 800);
  };

  const renderNotificationsTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">إعدادات التنبيهات والإشعارات</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">تخصيص قنوات التواصل والتذكيرات الآلية</p>
        </div>
        {!readOnly && (
          <button 
            onClick={handleSaveNotificationSettings}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
            ) : (
               <><Save className="w-4 h-4" /> حفظ الإعدادات</>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Alert Preferences */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
            <Bell className="w-5 h-5 text-amber-500" /> تفضيلات التنبيهات
          </h4>
          
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
              <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">قنوات التنبيه</h5>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">تنبيهات النظام الداخلية</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.system}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, system: e.target.checked}})}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">البريد الإلكتروني</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.email}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, email: e.target.checked}})}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">WhatsApp</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.whatsapp}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, whatsapp: e.target.checked}})}
                  />
                </label>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700">
              <h5 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3">أنواع التنبيهات</h5>
              <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">تذكير الجلسات</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.hearings}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, hearings: e.target.checked}})}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">المهام والمواعيد النهائية</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.tasks}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, tasks: e.target.checked}})}
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-600 dark:text-slate-400">تحديثات النظام والصيانة</span>
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.preferences.systemUpdates}
                    onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, systemUpdates: e.target.checked}})}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تذكير الجلسات قبل (أيام)</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.preferences.hearingReminderDays}
                  onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, hearingReminderDays: parseInt(e.target.value)}})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">تذكير المهام قبل (أيام)</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.preferences.taskReminderDays}
                  onChange={e => setNotificationSettings({...notificationSettings, preferences: {...notificationSettings.preferences, taskReminderDays: parseInt(e.target.value)}})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Integration Settings */}
        <div className="space-y-6">
          
          {/* SMTP Settings */}
          <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${!notificationSettings.preferences.email ? 'opacity-50 pointer-events-none' : ''}`}>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Mail className="w-5 h-5 text-indigo-600" /> إعدادات البريد الإلكتروني (SMTP)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">خادم SMTP</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="smtp.gmail.com"
                  value={notificationSettings.smtp.host}
                  onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, host: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">المنفذ (Port)</label>
                <input 
                  type="number" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  placeholder="587"
                  value={notificationSettings.smtp.port}
                  onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, port: parseInt(e.target.value)}})}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="accent-indigo-600 w-4 h-4"
                    checked={notificationSettings.smtp.secure}
                    onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, secure: e.target.checked}})}
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">اتصال آمن (SSL/TLS)</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">اسم المستخدم</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.smtp.user}
                  onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, user: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">كلمة المرور</label>
                <input 
                  type="password" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.smtp.pass}
                  onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, pass: e.target.value}})}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">البريد المرسل (From Email)</label>
                <input 
                  type="email" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.smtp.fromEmail}
                  onChange={e => setNotificationSettings({...notificationSettings, smtp: {...notificationSettings.smtp, fromEmail: e.target.value}})}
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Settings */}
          <div className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 ${!notificationSettings.preferences.whatsapp ? 'opacity-50 pointer-events-none' : ''}`}>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Smartphone className="w-5 h-5 text-green-600" /> إعدادات WhatsApp API
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">API Key / Access Token</label>
                <input 
                  type="password" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.whatsapp.apiKey}
                  onChange={e => setNotificationSettings({...notificationSettings, whatsapp: {...notificationSettings.whatsapp, apiKey: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Phone Number ID</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.whatsapp.phoneNumberId}
                  onChange={e => setNotificationSettings({...notificationSettings, whatsapp: {...notificationSettings.whatsapp, phoneNumberId: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Business Account ID (Optional)</label>
                <input 
                  type="text" 
                  className="w-full border p-2 rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={notificationSettings.whatsapp.businessAccountId}
                  onChange={e => setNotificationSettings({...notificationSettings, whatsapp: {...notificationSettings.whatsapp, businessAccountId: e.target.value}})}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  // --- Renderers ---

  const renderGeneralTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">الإعدادات العامة</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">تخصيص بيانات المكتب وتفضيلات النظام</p>
        </div>
        {!readOnly && (
          <button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
               <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</>
            ) : (
               <><Save className="w-4 h-4" /> حفظ التغييرات</>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Column 1: Identity & Logo */}
        <div className="xl:col-span-2 space-y-6">
          {/* Identity Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Building className="w-5 h-5 text-indigo-600" /> الهوية المؤسسية
            </h4>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Logo Upload */}
              <div className="shrink-0 flex flex-col items-center gap-3">
                <div 
                  onClick={() => !readOnly && logoInputRef.current?.click()}
                  className={`w-32 h-32 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center ${!readOnly ? 'cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-600' : ''} transition-all overflow-hidden relative group`}
                >
                  {generalSettings.logoPreview ? (
                    <img src={generalSettings.logoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                  )}
                  {!readOnly && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold">تغيير الشعار</span>
                    </div>
                  )}
                </div>
                <input type="file" ref={logoInputRef} className="hidden" onChange={handleLogoUpload} accept="image/*" disabled={readOnly} />
                <p className="text-xs text-slate-500 dark:text-slate-400">الشعار الرسمي (PNG/JPG)</p>
              </div>

              {/* Basic Inputs */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم المكتب / المؤسسة</label>
                  <input 
                    type="text" 
                    readOnly={readOnly}
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={generalSettings.firmName}
                    onChange={e => setGeneralSettings({...generalSettings, firmName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الشعار اللفظي (Slogan)</label>
                  <input 
                    type="text" 
                    readOnly={readOnly}
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={generalSettings.firmSlogan}
                    onChange={e => setGeneralSettings({...generalSettings, firmSlogan: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">رقم السجل الضريبي / التجاري</label>
                  <input 
                    type="text" 
                    readOnly={readOnly}
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={generalSettings.taxNumber}
                    onChange={e => setGeneralSettings({...generalSettings, taxNumber: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان الرئيسي</label>
                  <input 
                    type="text" 
                    readOnly={readOnly}
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={generalSettings.address}
                    onChange={e => setGeneralSettings({...generalSettings, address: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Phone className="w-5 h-5 text-indigo-600" /> بيانات التواصل
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><Phone className="w-3 h-3"/> الهاتف</label>
                <input 
                  type="text" 
                  readOnly={readOnly}
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                  dir="ltr"
                  value={generalSettings.phone}
                  onChange={e => setGeneralSettings({...generalSettings, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><Mail className="w-3 h-3"/> البريد الإلكتروني</label>
                <input 
                  type="email" 
                  readOnly={readOnly}
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                  dir="ltr"
                  value={generalSettings.email}
                  onChange={e => setGeneralSettings({...generalSettings, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2"><Globe className="w-3 h-3"/> الموقع الإلكتروني</label>
                <input 
                  type="text" 
                  readOnly={readOnly}
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-left dark:bg-slate-700 dark:border-slate-600 dark:text-white" 
                  dir="ltr"
                  value={generalSettings.website}
                  onChange={e => setGeneralSettings({...generalSettings, website: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: System & Notifications */}
        <div className="space-y-6">
          {/* System Preferences */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <SettingsIcon className="w-5 h-5 text-indigo-600" /> تفضيلات النظام
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العملة الافتراضية</label>
                <select 
                  disabled={readOnly}
                  className="w-full border p-2.5 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={generalSettings.currency}
                  onChange={e => setGeneralSettings({...generalSettings, currency: e.target.value})}
                >
                  <option value="EGP">الجنيه المصري (EGP)</option>
                  <option value="USD">الدولار الأمريكي (USD)</option>
                  <option value="SAR">الريال السعودي (SAR)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اللغة</label>
                <select 
                  disabled={readOnly}
                  className="w-full border p-2.5 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={generalSettings.language}
                  onChange={e => setGeneralSettings({...generalSettings, language: e.target.value})}
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المظهر</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleThemeSwitch('light')}
                    className={`p-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      generalSettings.theme === 'light' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200' 
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> فاتح
                  </button>
                  <button 
                    onClick={() => handleThemeSwitch('dark')}
                    className={`p-2 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                      generalSettings.theme === 'dark' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200' 
                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Moon className="w-4 h-4" /> داكن
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications - MOVED TO DEDICATED TAB */}


          {/* Data Management */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
              <Database className="w-5 h-5 text-green-600" /> النسخ الاحتياطي (Backup)
            </h4>
            
            <div className="space-y-4">
               {/* Export Backup */}
               <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">تصدير البيانات</label>
                  <button 
                    onClick={handleCreateBackup}
                    disabled={isBackingUp || readOnly}
                    className="w-full flex items-center justify-center gap-3 p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-70"
                  >
                     {isBackingUp ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> جاري التجهيز...</>
                     ) : (
                        <><Download className="w-5 h-5" /> تحميل نسخة كاملة (.JSON)</>
                     )}
                  </button>
                  {lastBackupDate && (
                     <div className="mt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <History className="w-3 h-3" />
                        آخر نسخة محفوظة: {lastBackupDate}
                     </div>
                  )}
               </div>

               {/* Import Backup */}
               <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">استعادة نسخة (Restore)</label>
                  <label 
                    onClick={() => { if(!isRestoring && !readOnly) restoreFileRef.current?.click(); }}
                    className={`w-full flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-400 transition-all group ${isRestoring || readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                     {isRestoring ? (
                        <div className="flex flex-col items-center gap-2 text-indigo-600">
                           <Loader2 className="w-6 h-6 animate-spin" />
                           <span className="text-xs font-bold">جاري استعادة البيانات...</span>
                        </div>
                     ) : (
                        <>
                           <RotateCcw className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
                           <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 font-medium">اضغط لاستعادة ملف JSON</span>
                        </>
                     )}
                     <input 
                        type="file" 
                        ref={restoreFileRef}
                        className="hidden" 
                        accept=".json" 
                        onChange={handleRestoreBackup} 
                        disabled={isRestoring || readOnly}
                     />
                  </label>
               </div>

               {/* Auto Backup Settings */}
               <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 mt-2">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-bold">
                        <HardDrive className="w-3 h-3" />
                        <span>نسخ تلقائي</span>
                     </div>
                     <select 
                       className="bg-transparent border-none text-xs font-bold text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer text-right"
                       value={generalSettings.autoBackup}
                       onChange={e => setGeneralSettings({...generalSettings, autoBackup: e.target.value})}
                       disabled={readOnly}
                     >
                       <option value="daily">يومياً</option>
                       <option value="weekly">أسبوعياً</option>
                       <option value="monthly">شهرياً</option>
                       <option value="off">إيقاف</option>
                     </select>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  const renderRolesTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">إدارة الأدوار الوظيفية</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">تحديد الصلاحيات والمجموعات الوظيفية</p>
        </div>
        {!readOnly && (
          <button 
            onClick={openAddRole}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> دور جديد
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                <Shield className="w-6 h-6" />
              </div>
              {!readOnly && !role.isSystem && (
                <div className="flex gap-1">
                  <button onClick={() => openEditRole(role)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {onDeleteRole && (
                    <button onClick={() => onDeleteRole(role.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              {role.isSystem && (
                <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs px-2 py-1 rounded-full font-bold">نظام</span>
              )}
            </div>
            
            <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{role.name}</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 h-10 overflow-hidden">{role.description || 'لا يوجد وصف'}</p>
            
            <div className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-4">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>{role.permissions.filter(p => p.access !== 'none').length} صلاحية مفعلة</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">إدارة المستخدمين والصلاحيات</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">تحكم في من يمكنه الوصول إلى النظام وما يمكنه فعله</p>
        </div>
        {!readOnly && (
          <button 
            onClick={openAddUser}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> مستخدم جديد
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs uppercase font-bold border-b border-slate-200 dark:border-slate-600">
            <tr>
              <th className="p-4">المستخدم</th>
              <th className="p-4">اسم الدخول</th>
              <th className="p-4">الدور الوظيفي</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">آخر دخول</th>
              <th className="p-4 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors dark:text-slate-200">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                      {user.avatar ? <img src={user.avatar} className="w-full h-full rounded-full object-cover"/> : user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-mono text-slate-600 dark:text-slate-400 text-xs">
                   {user.username || '-'}
                </td>
                <td className="p-4">
                  <span className="bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold border border-slate-200 dark:border-slate-500">
                    {user.roleLabel}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.isActive ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-xs">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-EG') : 'لم يدخل بعد'}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEditUser(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 rounded-lg transition-colors" title="تعديل الصلاحيات">
                      <Shield className="w-4 h-4" />
                    </button>
                    {onDeleteUser && !readOnly && (
                      <button onClick={() => onDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );



  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">
      {/* Sidebar */}
      <div className="w-full lg:w-64 shrink-0">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
            <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-indigo-600" /> الإعدادات
            </h2>
          </div>
          <nav className="p-2 space-y-1">
            <button 
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <SettingsIcon className="w-4 h-4" /> إعدادات عامة
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Users className="w-4 h-4" /> المستخدمين والصلاحيات
            </button>
            <button 
              onClick={() => setActiveTab('roles')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'roles' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <UserCog className="w-4 h-4" /> الأدوار الوظيفية
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Bell className="w-4 h-4" /> التنبيهات والإشعارات
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Lock className="w-4 h-4" /> الأمان
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'data' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Database className="w-4 h-4" /> إدارة البيانات
            </button>
            <button 
              onClick={() => setActiveTab('maintenance')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'maintenance' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
            >
              <Wrench className="w-4 h-4" /> صيانة النظام
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'general' && renderGeneralTab()}
        {activeTab === 'users' && renderUsersTab()}
        {activeTab === 'roles' && renderRolesTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'data' && renderDataTab()}
        {activeTab === 'maintenance' && renderMaintenanceTab()}
      </div>

      {/* User Modal (Add/Edit) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">قم بتعبئة البيانات وتحديد الصلاحيات بدقة</p>
              </div>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={saveUser} className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-2 mb-4">بيانات الحساب</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني <span className="text-red-500">*</span></label>
                    <input 
                      type="email" 
                      required 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      dir="ltr"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      disabled={readOnly}
                    />
                  </div>
                  
                  {/* Username & Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم المستخدم (للدخول)</label>
                    <input 
                      type="text" 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder="اختياري (يمكن استخدام البريد)"
                      value={formData.username || ''}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      disabled={readOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                       كلمة المرور {editingUser ? <span className="text-xs text-slate-400 font-normal">(اتركها فارغة للإبقاء على الحالية)</span> : <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                       <input 
                         type="password" 
                         className="w-full border p-2.5 pl-10 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                         placeholder={editingUser ? "••••••••" : "كلمة مرور جديدة"}
                         required={!editingUser}
                         value={formData.password || ''}
                         onChange={e => setFormData({...formData, password: e.target.value})}
                         disabled={readOnly}
                       />
                       <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الدور الوظيفي (الصلاحيات)</label>
                    <select 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      value={formData.roleId || ''}
                      onChange={e => {
                        const roleId = e.target.value;
                        const role = roles.find(r => r.id === roleId);
                        setFormData({
                          ...formData, 
                          roleId, 
                          roleLabel: role ? role.name : formData.roleLabel,
                          permissions: role ? [...role.permissions] : formData.permissions
                        });
                      }}
                      disabled={readOnly}
                    >
                      <option value="">تخصيص يدوي</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المسمى الوظيفي (للعرض)</label>
                    <input 
                      type="text" 
                      className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder="مثال: محامي استئناف"
                      value={formData.roleLabel}
                      onChange={e => setFormData({...formData, roleLabel: e.target.value})}
                      disabled={readOnly}
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={formData.isActive}
                          onChange={e => setFormData({...formData, isActive: e.target.checked})}
                          disabled={readOnly}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">حساب نشط</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Permissions Matrix Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-900/50 pb-2 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" /> جدول الصلاحيات
                </h4>
                
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-4 bg-slate-50 dark:bg-slate-900/50 p-3 text-xs font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <div className="col-span-1">الصفحة / الوحدة</div>
                    <div className="flex justify-center items-center gap-1"><Ban className="w-3 h-3 text-slate-400"/> لا يوجد صلاحية</div>
                    <div className="flex justify-center items-center gap-1"><Eye className="w-3 h-3 text-blue-500"/> قراءة فقط</div>
                    <div className="flex justify-center items-center gap-1"><Pencil className="w-3 h-3 text-green-500"/> تعديل وإدخال</div>
                  </div>
                  
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {MODULES.map(module => {
                      const currentAccess = formData.permissions?.find(p => p.moduleId === module.id)?.access || 'none';
                      
                      return (
                        <div key={module.id} className="grid grid-cols-4 p-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">{module.label}</div>
                          
                          {/* Option: None */}
                          <div className="flex justify-center">
                            <label className="cursor-pointer p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                              <input 
                                type="radio" 
                                name={`perm-${module.id}`} 
                                checked={currentAccess === 'none'}
                                onChange={() => handlePermissionChange(module.id, 'none')}
                                className="sr-only"
                                disabled={readOnly}
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'none' ? 'border-slate-500 bg-slate-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                {currentAccess === 'none' && <X className="w-3 h-3" />}
                              </div>
                            </label>
                          </div>

                          {/* Option: Read */}
                          <div className="flex justify-center">
                            <label className="cursor-pointer p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                              <input 
                                type="radio" 
                                name={`perm-${module.id}`} 
                                checked={currentAccess === 'read'}
                                onChange={() => handlePermissionChange(module.id, 'read')}
                                className="sr-only"
                                disabled={readOnly}
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'read' ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                {currentAccess === 'read' && <Eye className="w-3 h-3" />}
                              </div>
                            </label>
                          </div>

                          {/* Option: Write */}
                          <div className="flex justify-center">
                            <label className="cursor-pointer p-2 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                              <input 
                                type="radio" 
                                name={`perm-${module.id}`} 
                                checked={currentAccess === 'write'}
                                onChange={() => handlePermissionChange(module.id, 'write')}
                                className="sr-only"
                                disabled={readOnly}
                              />
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${currentAccess === 'write' ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                                {currentAccess === 'write' && <Check className="w-3 h-3" />}
                              </div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </form>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex gap-3 justify-end">
              <button 
                type="button" 
                onClick={() => setIsUserModalOpen(false)}
                className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                إلغاء
              </button>
              {!readOnly && (
                <button 
                  onClick={saveUser}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-colors"
                >
                  <Save className="w-4 h-4" /> حفظ المستخدم
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">{editingRole ? 'تعديل الدور الوظيفي' : 'إضافة دور وظيفي جديد'}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تحديد الصلاحيات والمجموعات</p>
              </div>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم الدور <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={roleFormData.name}
                  onChange={e => setRoleFormData({...roleFormData, name: e.target.value})}
                  disabled={readOnly || (editingRole?.isSystem)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الوصف</label>
                <textarea 
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  rows={2}
                  value={roleFormData.description}
                  onChange={e => setRoleFormData({...roleFormData, description: e.target.value})}
                  disabled={readOnly}
                />
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600" /> الصلاحيات
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {MODULES.map(module => {
                    const permission = roleFormData.permissions?.find(p => p.moduleId === module.id);
                    const access = permission?.access || 'none';
                    return (
                      <div key={module.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{module.label}</span>
                        <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 p-1">
                          <button
                            type="button"
                            onClick={() => !readOnly && handleRolePermissionChange(module.id, 'none')}
                            className={`px-3 py-1 text-xs rounded-md transition-all ${access === 'none' ? 'bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-white font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            disabled={readOnly}
                          >
                            لا يوجد
                          </button>
                          <button
                            type="button"
                            onClick={() => !readOnly && handleRolePermissionChange(module.id, 'read')}
                            className={`px-3 py-1 text-xs rounded-md transition-all ${access === 'read' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            disabled={readOnly}
                          >
                            عرض فقط
                          </button>
                          <button
                            type="button"
                            onClick={() => !readOnly && handleRolePermissionChange(module.id, 'write')}
                            className={`px-3 py-1 text-xs rounded-md transition-all ${access === 'write' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200 font-bold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            disabled={readOnly}
                          >
                            تحكم كامل
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  إلغاء
                </button>
                {!readOnly && (
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none"
                  >
                    حفظ الدور
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
