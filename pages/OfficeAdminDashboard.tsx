import React, { useState, useMemo } from 'react';
import { Case, Client, Hearing, Task, CaseStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Briefcase, Users, FileText, Download, ShieldAlert } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

interface OfficeAdminDashboardProps {
  cases: Case[];
  clients: Client[];
  hearings: Hearing[];
  tasks: Task[];
  currentUser: any; // Assuming you have a way to check roles
  onUpdateHearing?: (hearing: Hearing) => void;
  onAddHearing?: (hearing: Hearing) => void;
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#8b5cf6'];

const OfficeAdminDashboard: React.FC<OfficeAdminDashboardProps> = ({ cases, clients, hearings, tasks, currentUser, onUpdateHearing, onAddHearing }) => {
  const [loading, setLoading] = useState(false);

  // --- Data Aggregation ---
  const stats = useMemo(() => {
    const totalCases = cases.length;
    const activeCases = cases.filter(c => c.status !== CaseStatus.CLOSED && c.status !== CaseStatus.ARCHIVED).length;
    const totalRevenue = cases.reduce((acc, c) => acc + (c.finance?.paidAmount || 0), 0);
    const totalPendingFees = cases.reduce((acc, c) => acc + (c.finance ? (c.finance.agreedFees - c.finance.paidAmount) : 0), 0);
    const totalClients = clients.length;

    return { totalCases, activeCases, totalRevenue, totalPendingFees, totalClients };
  }, [cases, clients]);

  const caseStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => counts[c.status] = (counts[c.status] || 0) + 1);
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [cases]);

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
    <div id="dashboard-content" className="space-y-6 p-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">لوحة تحكم الإدارة العليا (Office Admin)</h1>
        <div className="flex gap-2">
          <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            <Download className="w-4 h-4" /> تصدير PDF
          </button>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
            <Download className="w-4 h-4" /> تصدير Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-bold">إجمالي القضايا</p>
          <h3 className="text-2xl font-bold">{stats.totalCases}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-bold">إجمالي الإيرادات</p>
          <h3 className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-bold">الرسوم المستحقة</p>
          <h3 className="text-2xl font-bold">{stats.totalPendingFees.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-bold">إجمالي الموكلين</p>
          <h3 className="text-2xl font-bold">{stats.totalClients}</h3>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-96">
        <h2 className="text-lg font-bold mb-4">توزيع القضايا حسب الحالة</h2>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={caseStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {caseStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OfficeAdminDashboard;
