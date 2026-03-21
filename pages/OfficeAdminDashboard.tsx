import React, { useState, useMemo, useEffect } from 'react';
import { Case, Client, Hearing, Task, CaseStatus, ActivityLog } from '../types';
import { DollarSign, Briefcase, Users, FileText, Download, ShieldAlert, Activity, Clock, User, Search, Filter, Calendar, Edit, Plus, Trash2, DollarSignIcon, ChevronDown, ChevronUp, Users as EmployeesIcon, Settings, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { getFirmActivities } from '../services/activityService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import EmployeeManagement from './EmployeeManagement';

interface OfficeAdminDashboardProps {
  cases: Case[];
  clients: Client[];
  hearings: Hearing[];
  tasks: Task[];
  currentUser: any; // Assuming you have a way to check roles
  onUpdateHearing?: (hearing: Hearing) => void;
  onAddHearing?: (hearing: Hearing) => void;
  firmId?: string; // Add firmId prop
}

const OfficeAdminDashboard: React.FC<OfficeAdminDashboardProps> = ({ cases, clients, hearings, tasks, currentUser, onUpdateHearing, onAddHearing, firmId }) => {
  console.log('🏢 OfficeAdminDashboard received firmId:', firmId);
  console.log('👤 Current user:', currentUser?.name, 'firmId:', currentUser?.firmId);
  
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [firmUsers, setFirmUsers] = useState<FirmUser[]>([]); // Users from users collection with proper type
  const [usersLoading, setUsersLoading] = useState(true);

  // Define user type for better type safety
  interface FirmUser {
    id: string;
    name?: string;
    email?: string;
    firmId?: string;
    [key: string]: any; // Allow other properties
  }
  
  // Advanced search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedOperation, setSelectedOperation] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<keyof ActivityLog>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'reports' | 'settings'>('dashboard');

  // --- Data Aggregation ---
  const stats = useMemo(() => {
    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status !== CaseStatus.CLOSED && c.status !== CaseStatus.ARCHIVED).length;
    const totalRevenue = cases.reduce((acc, c) => acc + (c.finance?.paidAmount || 0), 0);
    const totalPendingFees = cases.reduce((acc, c) => acc + (c.finance ? (c.finance.agreedFees - c.finance.paidAmount) : 0), 0);
    const totalClients = clients.length;

    return { totalCases, activeCases, totalRevenue, totalPendingFees, totalClients };
  }, [cases, clients]);

  // --- Load Activities ---
  useEffect(() => {
    const loadActivities = async () => {
      if (!firmId) {
        console.log('🔍 No firmId provided, skipping activities load');
        return;
      }
      
      try {
        setActivitiesLoading(true);
        console.log('🔍 Loading activities for firmId:', firmId);
        const activitiesData = await getFirmActivities(firmId, 50); // Increased limit
        console.log('📊 Loaded activities:', activitiesData.length);
        
        if (activitiesData.length > 0) {
          console.log('📋 First activity sample:', activitiesData[0]);
          console.log('📋 Activities structure check:', {
            hasUser: activitiesData.every(a => a.user),
            hasAction: activitiesData.every(a => a.action),
            hasTarget: activitiesData.every(a => a.target),
            hasTimestamp: activitiesData.every(a => a.timestamp)
          });
        }
        
        setActivities(activitiesData);
      } catch (error) {
        console.error('❌ Error loading activities:', error);
        setActivities([]); // Set empty array on error
      } finally {
        setActivitiesLoading(false);
      }
    };

    loadActivities();
  }, [firmId]);

  // --- Load Firm Users ---
  useEffect(() => {
    const loadFirmUsers = async () => {
      if (!firmId) return;
      
      try {
        setUsersLoading(true);
        console.log('👥 Loading users for firmId:', firmId);
        
        const usersQuery = query(
          collection(db, 'users'),
          where('firmId', '==', firmId)
        );
        
        const snapshot = await getDocs(usersQuery);
        const usersData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as FirmUser));
        
        console.log('📊 Loaded users:', usersData.length);
        console.log('👥 Users details:', usersData.map(u => ({ 
          name: u.name, 
          email: u.email, 
          firmId: u.firmId 
        })));
        
        setFirmUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setUsersLoading(false);
      }
    };

    loadFirmUsers();
  }, [firmId]);

  // --- Advanced filtering logic ---
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];
    
    console.log('🔍 Filtering activities...', {
      totalActivities: activities.length,
      searchTerm,
      selectedUser,
      selectedAction,
      selectedTarget,
      selectedOperation,
      dateRange
    });

    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.user.toLowerCase().includes(term) ||
        activity.action.toLowerCase().includes(term) ||
        activity.target.toLowerCase().includes(term) ||
        (activity.details && activity.details.toLowerCase().includes(term))
      );
    }

    // Apply user filter
    if (selectedUser) {
      filtered = filtered.filter(activity => activity.user === selectedUser);
    }

    // Apply action filter
    if (selectedAction) {
      filtered = filtered.filter(activity => activity.action === selectedAction);
    }

    // Apply target filter
    if (selectedTarget) {
      filtered = filtered.filter(activity => activity.target === selectedTarget);
    }

    // Apply operation filter
    if (selectedOperation) {
      filtered = filtered.filter(activity => 
        activity.action.includes(selectedOperation)
      );
    }

    // Apply date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(activity => 
        new Date(activity.timestamp) >= startDate
      );
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(activity => 
        new Date(activity.timestamp) <= endDate
      );
    }

    console.log('✅ Filtered activities:', filtered.length);
    return filtered;
  }, [activities, searchTerm, selectedUser, selectedAction, selectedTarget, selectedOperation, dateRange]);

  // --- Sorting logic ---
  const sortedActivities = useMemo(() => {
    const sorted = [...filteredActivities].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // Handle date comparison
      if (sortField === 'timestamp') {
        const aDate = new Date(aValue as string);
        const bDate = new Date(bValue as string);
        return sortDirection === 'asc' 
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }
      
      // Default comparison
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [filteredActivities, sortField, sortDirection]);

  // --- Handle sorting ---
  const handleSort = (field: keyof ActivityLog) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Get unique users for filter dropdown (from users collection, not activities)
  const uniqueUsers = useMemo(() => {
    if (!firmUsers || firmUsers.length === 0) {
      console.log('🔍 No firm users available');
      return [];
    }
    
    const users = firmUsers.map(user => user.name).sort();
    console.log('👥 Unique users from collection:', users);
    return users;
  }, [firmUsers]);

  const uniqueActions = useMemo(() => {
    const actions = [...new Set(activities.map(activity => activity.action))].sort();
    console.log('⚡ Unique actions found:', actions);
    return actions;
  }, [activities]);

  const uniqueTargets = useMemo(() => {
    const targets = [...new Set(activities.map(activity => activity.target))].sort();
    console.log('🎯 Unique targets found:', targets);
    return targets;
  }, [activities]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedUser('');
    setSelectedAction('');
    setSelectedTarget('');
    setSelectedOperation('');
    setDateRange({ start: '', end: '' });
  };

  // --- Export Functions ---
  const exportToPDF = async () => {
    const input = document.getElementById('dashboard-content');
    if (!input) return;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    pdf.save('office-report.pdf');
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet([stats]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Office Stats');
    XLSX.writeFile(wb, 'office-report.xlsx');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900" id="dashboard-content">
      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white dark:bg-slate-800 shadow-sm border-l border-slate-200 dark:border-slate-700 min-h-screen">
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              لوحة التحكم
            </h2>
            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                لوحة التحكم
              </button>
              
              <button
                onClick={() => setActiveTab('employees')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                  activeTab === 'employees'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <EmployeesIcon className="w-5 h-5" />
                الموظفون
              </button>
              
              <button
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-5 h-5" />
                التقارير
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Settings className="w-5 h-5" />
                الإعدادات
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'dashboard' && (
            <div className="p-6">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  لوحة تحكم إدارة المكتب
                </h1>
                <p className="text-slate-600 dark:text-slate-300">
                  نظرة عامة على أداء المكتب ونشاطات المستخدمين
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">إجمالي القضايا</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{cases.length}</p>
                    </div>
                    <Briefcase className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">إجمالي الإيرادات</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {cases.reduce((sum, c) => sum + (c.finance?.agreedFees || 0), 0).toLocaleString('ar-EG')}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">الرسوم المستحقة</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {cases.reduce((sum, c) => sum + (c.finance?.agreedFees - (c.finance?.paidAmount || 0) || 0), 0).toLocaleString('ar-EG')}
                      </p>
                    </div>
                    <DollarSignIcon className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-bold">إجمالي الموكلين</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">{clients.length}</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* User Activities Section */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                {/* Section Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white">نشاطات المستخدمين</h2>
                      {activitiesLoading && (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <Filter className="w-4 h-4" />
                      {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
                    </button>
                  </div>
                </div>

                {/* Advanced Search and Filters */}
                {showFilters && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Search Input */}
                      <div className="lg:col-span-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <Search className="w-4 h-4 inline-block ml-2" />
                          البحث العام
                        </label>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="ابحث في المستخدم، الإجراء، الهدف، أو التفاصيل..."
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="البحث العام"
                          title="اكتب كلمات مفتاحية للبحث"
                        />
                      </div>

                      {/* User Filter */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <User className="w-4 h-4 inline-block ml-2" />
                          المستخدم
                        </label>
                        <select
                          value={selectedUser}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="اختر المستخدم"
                          title="اختر المستخدم للتصفية"
                        >
                          <option value="">جميع المستخدمين</option>
                          {uniqueUsers.map(user => (
                            <option key={user} value={user}>{user}</option>
                          ))}
                        </select>
                      </div>

                      {/* Action Filter */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <Edit className="w-4 h-4 inline-block ml-2" />
                          الإجراء
                        </label>
                        <select
                          value={selectedAction}
                          onChange={(e) => setSelectedAction(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="اختر الإجراء"
                          title="اختر الإجراء للتصفية"
                        >
                          <option value="">جميع الإجراءات</option>
                          {uniqueActions.map(action => (
                            <option key={action} value={action}>{action}</option>
                          ))}
                        </select>
                      </div>

                      {/* Target Filter */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <FileText className="w-4 h-4 inline-block ml-2" />
                          النوع
                        </label>
                        <select
                          value={selectedTarget}
                          onChange={(e) => setSelectedTarget(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="اختر النوع"
                          title="اختر نوع النشاط للتصفية"
                        >
                          <option value="">جميع الأنواع</option>
                          {uniqueTargets.map(target => (
                            <option key={target} value={target}>{target}</option>
                          ))}
                        </select>
                      </div>

                      {/* Operation Filter */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <Plus className="w-4 h-4 inline-block ml-2" />
                          العملية
                        </label>
                        <select
                          value={selectedOperation}
                          onChange={(e) => setSelectedOperation(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="اختر العملية"
                          title="اختر نوع العملية للتصفية"
                        >
                          <option value="">جميع العمليات</option>
                          <option value="إنشاء">إنشاء</option>
                          <option value="تعديل">تعديل</option>
                          <option value="حذف">حذف</option>
                          <option value="عرض">عرض</option>
                        </select>
                      </div>

                      {/* Date Range Start */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <Calendar className="w-4 h-4 inline-block ml-2" />
                          من تاريخ
                        </label>
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="من تاريخ"
                          title="اختر تاريخ البداية للتصفية"
                          placeholder="حدد تاريخ البداية"
                        />
                      </div>

                      {/* Date Range End */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          <Calendar className="w-4 h-4 inline-block ml-2" />
                          إلى تاريخ
                        </label>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="إلى تاريخ"
                          title="اختر تاريخ النهاية للتصفية"
                          placeholder="حدد تاريخ النهاية"
                        />
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        مسح الفلاتر
                      </button>
                    </div>
                  </div>
                )}

                {/* Activities Table */}
                <div className="p-6">
                  {activitiesLoading ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">جاري تحميل النشاطات...</p>
                    </div>
                  ) : sortedActivities.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                      <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">
                        {activities.length === 0 ? 'لا توجد نشاطات حالياً' : 'لا توجد نتائج مطابقة للبحث'}
                      </p>
                      {activities.length > 0 && sortedActivities.length === 0 && (
                        <button
                          onClick={clearFilters}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          مسح الفلاتر
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      {/* Results Summary */}
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          تم العثور على <span className="font-bold text-blue-800 dark:text-blue-200">{sortedActivities.length}</span> نشاط
                          {sortedActivities.length !== activities.length && 
                            <span className="text-blue-800 dark:text-blue-200"> من أصل ${activities.length} نشاط</span>
                          }
                        </p>
                      </div>

                      {/* Activities Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-slate-800 dark:text-slate-200">
                          <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                            <tr>
                              <th scope="col" className="px-6 py-3">
                                <button
                                  onClick={() => handleSort('user')}
                                  className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  المستخدم
                                  {sortField === 'user' && (
                                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </th>
                              <th scope="col" className="px-6 py-3">
                                <button
                                  onClick={() => handleSort('action')}
                                  className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  الإجراء
                                  {sortField === 'action' && (
                                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </th>
                              <th scope="col" className="px-6 py-3">
                                <button
                                  onClick={() => handleSort('target')}
                                  className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  الهدف
                                  {sortField === 'target' && (
                                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </th>
                              <th scope="col" className="px-6 py-3">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">التفاصيل</span>
                              </th>
                              <th scope="col" className="px-6 py-3">
                                <button
                                  onClick={() => handleSort('timestamp')}
                                  className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                  التاريخ والوقت
                                  {sortField === 'timestamp' && (
                                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {sortedActivities.map((activity, index) => (
                              <tr 
                                key={activity.id} 
                                className={`border-b border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                                  index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-700/50'
                                }`}
                              >
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <span className="text-slate-900 dark:text-white">{activity.user}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-medium text-blue-600 dark:text-blue-400">
                                    {activity.action}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="font-medium text-primary-600 dark:text-primary-400">
                                    {activity.target}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                  {activity.details || '-'}
                                </td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                  <div className="space-y-1">
                                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                      {new Date(activity.timestamp).toLocaleTimeString('ar-EG', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </div>
                                    <div className="text-xs text-slate-600 dark:text-slate-300">
                                      {new Date(activity.timestamp).toLocaleDateString('ar-EG', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'employees' && (
            <EmployeeManagement firmId={firmId || ''} currentUser={currentUser} />
          )}

          {activeTab === 'reports' && (
            <div className="p-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  قسم التقارير
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  قريباً: تقارير متقدمة وتحليلات شاملة
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <div className="text-center py-12">
                <Settings className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  قسم الإعدادات
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  قريباً: إعدادات المكتب والصلاحيات
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficeAdminDashboard;
