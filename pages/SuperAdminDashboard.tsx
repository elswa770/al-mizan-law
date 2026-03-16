import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Firm, AppUser, ActivityLog } from '../types';
import { ShieldAlert, Users, Building, Activity, CheckCircle, XCircle, Search, DollarSign, Cpu, Terminal, Server, History } from 'lucide-react';
import { logActivity, getActivityLogs } from '../services/activityService';

interface SuperAdminDashboardProps {
  currentUser: AppUser | null;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ currentUser }) => {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      if (currentUser?.email !== 'elswa770@gmail.com') return;
      
      try {
        const [firmsSnapshot, usersSnapshot, fetchedLogs] = await Promise.all([
          getDocs(collection(db, 'firms')),
          getDocs(collection(db, 'users')),
          getActivityLogs(5)
        ]);
        
        setFirms(firmsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Firm)));
        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser)));
        setLogs(fetchedLogs);
      } catch (error) {
        console.error("Error fetching super admin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [currentUser]);

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
        // Refresh logs
        const updatedLogs = await getActivityLogs(5);
        setLogs(updatedLogs);
      }
    } catch (error) {
      console.error("Error updating firm status:", error);
      alert("حدث خطأ أثناء تحديث حالة المكتب");
    }
  };

  if (currentUser?.email !== 'elswa770@gmail.com') {
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
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" /> استهلاك الموارد
          </h2>
          <div className="space-y-4">
            {[
              { label: 'المعالج (CPU)', value: 12 },
              { label: 'الذاكرة (RAM)', value: 45 },
              { label: 'التخزين', value: 68 },
            ].map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-bold">{item.label}</span>
                  <span className="font-bold text-indigo-600">{item.value}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${item.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Firms List */}
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
                return (
                  <tr key={firm.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800 dark:text-white">{firm.name}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold uppercase">
                        {firm.subscriptionPlan}
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
                         firm.subscriptionStatus === 'trial' ? 'تجريبي' : 'موقوف'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {firm.subscriptionEndDate ? new Date(firm.subscriptionEndDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{firmUsers} مستخدم</td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(firm.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleToggleFirmStatus(firm.id, firm.subscriptionStatus, firm.name)}
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          firm.subscriptionStatus === 'active' 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {firm.subscriptionStatus === 'active' ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredFirms.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">لا توجد مكاتب مطابقة للبحث</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Activity Logs */}
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
    </div>
  );
};

export default SuperAdminDashboard;
