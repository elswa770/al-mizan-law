import React, { useState } from 'react';
import { Case, FinancialTransaction, PaymentMethod } from '../types';
import { X, DollarSign, Plus, Building, Smartphone, Banknote, ScrollText, Wallet } from 'lucide-react';

interface AddFeeModalProps {
  show: boolean;
  onHide: () => void;
  onSave: (fee: Omit<FinancialTransaction, 'id' | 'recordedBy' | 'type'>) => void;
  cases: Case[];
  clients: { id: string, name: string }[];
}

const AddFeeModal: React.FC<AddFeeModalProps> = ({ show, onHide, onSave, cases = [], clients = [] }) => {
  const [caseId, setCaseId] = useState('');
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  if (!show) {
    return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || amount <= 0) {
        alert('Please select a case and enter a valid amount.');
        return;
    }

    onSave({
      date,
      amount,
      method,
      description,
      // The parent component should fill in the rest
    });
    
    // Reset form and close modal
    setCaseId('');
    setAmount(0);
    setDescription('');
    setMethod('cash');
    onHide();
  };
  
  const getMethodIcon = (method: string) => {
     switch(method) {
        case 'cash': return <Banknote className="w-4 h-4 text-green-600" />;
        case 'instapay': return <Smartphone className="w-4 h-4 text-purple-600" />;
        case 'check': return <ScrollText className="w-4 h-4 text-blue-600" />;
        case 'wallet': return <Wallet className="w-4 h-4 text-amber-600" />;
        case 'bank_transfer': return <Building className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
        default: return <DollarSign className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
     }
  };

  const getMethodLabel = (method: string) => {
     switch(method) {
        case 'cash': return 'نقدي (Cash)';
        case 'instapay': return 'InstaPay';
        case 'check': return 'شيك بنكي';
        case 'wallet': return 'محفظة إلكترونية';
        case 'bank_transfer': return 'تحويل بنكي';
        default: return 'أخرى';
     }
  };


  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" /> إضافة دفعة جديدة
          </h3>
          <button onClick={onHide}><X className="w-5 h-5 text-slate-400 hover:text-red-500" /></button>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">القضية</label>
            <select 
              required
              className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              value={caseId}
              onChange={e => setCaseId(e.target.value)}
            >
              <option value="">اختر القضية...</option>
              {cases.map(c => (
                <option key={c.id} value={c.id}>{c.title} - {clients.find(cl=>cl.id===c.clientId)?.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المبلغ (ج.م)</label>
            <input 
              type="number" 
              required
              min="0.01"
              step="0.01"
              className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">تاريخ الدفعة</label>
            <input 
              type="date" 
              required
              className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">طريقة الدفع</label>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'check', 'instapay', 'wallet', 'bank_transfer'].map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setMethod(method as PaymentMethod)}
                  className={`p-2 rounded border text-xs font-bold flex items-center justify-center gap-2 ${method === method ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  {getMethodIcon(method)}
                  {getMethodLabel(method)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ملاحظات</label>
            <input 
              type="text" 
              className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
              placeholder="مثال: دفعة من حساب الأتعاب"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 rounded-lg text-white font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none"
          >
            <Plus className="w-5 h-5" />
            حفظ الدفعة
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddFeeModal;
