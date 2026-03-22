
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Case, Client, Hearing, PaymentMethod, FinancialTransaction } from '../types';
import { Wallet, TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, ArrowDownLeft, Filter, Search, Plus, CreditCard, Calendar, FileText, AlertCircle, CheckCircle, Calculator, User, Receipt, X, Building, Smartphone, Banknote, ScrollText, Printer, Share2, Download } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { db, collection, getDocs, doc, setDoc, getDoc } from '../firebase';
import { auth } from '../firebase'; // Import auth to get current user

interface FeesProps {
  cases: Case[];
  clients: Client[];
  hearings: Hearing[];
  onUpdateCase?: (updatedCase: Case) => void;
  canViewIncome?: boolean; // New prop
  canViewExpenses?: boolean; // New prop
  readOnly?: boolean;
}

const Fees: React.FC<FeesProps> = ({ cases, clients, hearings, onUpdateCase, canViewIncome = true, canViewExpenses = true, readOnly = false }) => {
  // --- State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses'>('overview');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'debt'>('all');

  // Modal State
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedCaseForDetails, setSelectedCaseForDetails] = useState<string | null>(null); // For View History Modal
  const [detailsTab, setDetailsTab] = useState<'payments' | 'expenses'>('payments');

  // Invoice Generation State
  const [printingTrans, setPrintingTrans] = useState<{ trans: FinancialTransaction, caseData: Case, clientName: string } | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Get current user and firmId
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentFirmId, setCurrentFirmId] = useState<string>('');

  // Load current user and firmId
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Get user document to retrieve firmId
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setCurrentFirmId(userData?.firmId || 'default-firm');
          } else {
            setCurrentFirmId('default-firm');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentFirmId('default-firm');
        }
      } else {
        setCurrentUser(null);
        setCurrentFirmId('');
      }
    });

    return () => unsubscribe();
  }, []);

  // Add Transaction Form Data
  const [transactionData, setTransactionData] = useState({
    caseId: '',
    amount: 0,
    type: 'payment' as 'payment' | 'expense',
    description: '',
    method: 'cash' as PaymentMethod,
    category: ''
  });

  // Auto-complete state
  const [caseSearchTerm, setCaseSearchTerm] = useState('');
  const [showCaseSuggestions, setShowCaseSuggestions] = useState(false);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  
  // Quick templates for common transactions
  const quickTemplates = [
    { type: 'payment' as const, description: 'دفعة مقدمة', amount: 1000 },
    { type: 'payment' as const, description: 'دفعة من حساب الأتعاب', amount: 500 },
    { type: 'payment' as const, description: 'تسوية نهائية', amount: 2000 },
    { type: 'expense' as const, description: 'رسوم قضائية', amount: 100, category: 'رسوم' },
    { type: 'expense' as const, description: 'انتقالات', amount: 50, category: 'انتقالات' },
    { type: 'expense' as const, description: 'إدارية / نثريات', amount: 30, category: 'إدارية' },
  ];

  // Advanced expense categories with budgets
  const [expenseCategories, setExpenseCategories] = useState([
    { id: 'رسوم', name: 'رسوم قضائية', icon: '⚖️', budget: 500, color: 'blue' },
    { id: 'انتقالات', name: 'انتقالات ومواصلات', icon: '🚗', budget: 300, color: 'green' },
    { id: 'إدارية', name: 'إدارية ونثريات', icon: '📋', budget: 200, color: 'orange' },
    { id: 'تصوير', name: 'تصوير وطباعة', icon: '📷', budget: 150, color: 'purple' },
    { id: 'ضيافة', name: 'ضيافة ومأكولات', icon: '☕', budget: 100, color: 'red' },
    { id: 'أبحاث', name: 'أبحاث ودراسات', icon: '📚', budget: 250, color: 'indigo' },
    { id: 'اتصالات', name: 'اتصالات وانترنت', icon: '📞', budget: 100, color: 'pink' },
    { id: 'صيانة', name: 'صيانة وتجهيزات', icon: '🔧', budget: 150, color: 'yellow' },
    { id: 'تدريب', name: 'تدريب وتطوير', icon: '🎓', budget: 300, color: 'teal' },
    { id: 'أخرى', name: 'مصروفات أخرى', icon: '📦', budget: 100, color: 'gray' }
  ]);

  // Load saved budgets from Firebase on component mount
  useEffect(() => {
    const loadBudgets = async () => {
      try {
        console.log('Loading budgets from Firebase...');
        // Load budgets from Firebase 'budgets' collection
        const budgetsSnapshot = await getDocs(collection(db, 'budgets'));
        const savedBudgets = budgetsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Loaded budgets from Firebase:', savedBudgets);
        
        // Filter budgets by current firmId
        const firmBudgets = savedBudgets.filter((b: any) => b.firmId === currentFirmId);
        
        if (firmBudgets.length > 0) {
          // Update expenseCategories with saved budgets from Firebase
          setExpenseCategories(prevCategories => 
            prevCategories.map(cat => {
              const savedBudget = firmBudgets.find((b: any) => b.categoryId === cat.id);
              if (savedBudget && (savedBudget as any).budget) {
                console.log(`Updating budget for ${cat.name}: ${cat.budget} -> ${(savedBudget as any).budget}`);
                return { ...cat, budget: (savedBudget as any).budget };
              }
              return cat;
            })
          );
          
          // Clear localStorage to prioritize Firebase data
          localStorage.removeItem('expenseBudgets');
          console.log('Cleared localStorage to prioritize Firebase data');
        } else {
          console.log('No budgets found in Firebase for firm:', currentFirmId);
        }
      } catch (error) {
        console.error('Error loading budgets from Firebase:', error);
        console.log('Falling back to localStorage...');
        
        // Fallback to localStorage only if Firebase fails completely
        // AND only if there's no Firebase data for this firm
        try {
          const savedBudgets = localStorage.getItem('expenseBudgets');
          if (savedBudgets) {
            const budgets = JSON.parse(savedBudgets);
            console.log('Loaded budgets from localStorage (fallback):', budgets);
            
            setExpenseCategories(prevCategories => 
              prevCategories.map(cat => {
                const savedBudget = budgets.find((b: any) => b.categoryId === cat.id);
                if (savedBudget && savedBudget.budget) {
                  console.log(`Updating budget for ${cat.name} from localStorage: ${cat.budget} -> ${savedBudget.budget}`);
                  return { ...cat, budget: savedBudget.budget };
                }
                return cat;
              })
            );
          }
        } catch (localError) {
          console.error('Error loading from localStorage:', localError);
        }
      }
    };
    
    // Only load budgets if we have a current firm
    if (currentFirmId) {
      loadBudgets();
    } else {
      console.log('Waiting for firmId to load budgets...');
    }
  }, []);

  // Reload budgets when currentFirmId changes
  useEffect(() => {
    if (currentFirmId) {
      console.log('FirmId changed, reloading budgets for firm:', currentFirmId);
      const loadBudgets = async () => {
        try {
          console.log('Loading budgets from Firebase for firm:', currentFirmId);
          // Load budgets from Firebase 'budgets' collection
          const budgetsSnapshot = await getDocs(collection(db, 'budgets'));
          const savedBudgets = budgetsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log('Loaded budgets for firm:', savedBudgets);
          
          // Filter budgets by current firmId
          const firmBudgets = savedBudgets.filter((b: any) => b.firmId === currentFirmId);
          
          if (firmBudgets.length > 0) {
            // Update expenseCategories with saved budgets from Firebase
            setExpenseCategories(prevCategories => 
              prevCategories.map(cat => {
                const savedBudget = firmBudgets.find((b: any) => b.categoryId === cat.id);
                if (savedBudget && (savedBudget as any).budget) {
                  console.log(`Updating budget for ${cat.name}: ${cat.budget} -> ${(savedBudget as any).budget}`);
                  return { ...cat, budget: (savedBudget as any).budget };
                }
                return cat;
              })
            );
            
            // Clear localStorage to prioritize Firebase data
            localStorage.removeItem('expenseBudgets');
            console.log('Cleared localStorage to prioritize Firebase data');
          } else {
            console.log('No budgets found in Firebase for firm:', currentFirmId);
          }
        } catch (error) {
          console.error('Error loading budgets from Firebase:', error);
        }
      };
      
      loadBudgets();
    }
  }, [currentFirmId]);

  // State for budget editing
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [tempBudgets, setTempBudgets] = useState<{ [key: string]: number }>({});
  const [budgetUpdateKey, setBudgetUpdateKey] = useState(0); // Key to force re-render

  // Budget editing handlers
  const startEditingBudget = (categoryId: string) => {
    setEditingBudget(categoryId);
    setTempBudgets({
      ...tempBudgets,
      [categoryId]: monthlyExpenses.find(cat => cat.id === categoryId)?.budget || 0
    });
  };

  const saveBudget = async (categoryId: string) => {
    const newBudget = tempBudgets[categoryId];
    if (newBudget && newBudget > 0) {
      // Update the budget in the categories array
      const updatedCategories = expenseCategories.map(cat => 
        cat.id === categoryId ? { ...cat, budget: newBudget } : cat
      );
      
      // Update the expenseCategories state with new budget
      // In a real app, this would save to backend
      console.log('Updating budget for category', categoryId, 'to', newBudget);
      
      // Update the state to reflect the change immediately
      setEditingBudget(null);
      setTempBudgets({});
      
      // Update expenseCategories with new budget
      setExpenseCategories(prevCategories => 
        prevCategories.map(cat => 
          cat.id === categoryId ? { ...cat, budget: newBudget } : cat
        )
      );
      
      // Save to Firebase for persistence
      try {
        console.log('Saving budget to Firebase...', { categoryId, newBudget });
        
  // Save budget to a 'budgets' collection in Firebase
        const budgetData = {
          categoryId,
          budget: newBudget,
          firmId: currentFirmId, // Use actual firmId - each user has their own budgets
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.email || 'current-user'
        };
        
        // Generate unique document ID using timestamp and category
        const docId = `${categoryId}_${Date.now()}`;
        
        // Save to Firebase
        await setDoc(doc(db, 'budgets', docId), budgetData, { merge: true });
        
        console.log('Budget saved successfully to Firebase with ID:', docId, budgetData);
        // alert('تم حفظ الميزانية بنجاح في Firebase!'); // Removed - using only one alert
      } catch (firebaseError) {
        console.error('Error saving budget to Firebase:', firebaseError);
        console.log('Falling back to localStorage...');
        
        // Fallback to localStorage if Firebase fails
        try {
          const savedBudgets = localStorage.getItem('expenseBudgets');
          const budgets = savedBudgets ? JSON.parse(savedBudgets) : [];
          
          const budgetData = {
            categoryId,
            budget: newBudget,
            firmId: currentFirmId || 'default-firm', // Use actual firmId from auth context
            updatedAt: new Date().toISOString(),
            updatedBy: currentUser?.email || 'current-user'
          };
          
          // Update or add the budget
          const existingIndex = budgets.findIndex((b: any) => b.categoryId === categoryId);
          if (existingIndex >= 0) {
            budgets[existingIndex] = budgetData;
          } else {
            budgets.push(budgetData);
          }
          
          // Save to localStorage as fallback
          localStorage.setItem('expenseBudgets', JSON.stringify(budgets));
          
          console.log('Budget saved to localStorage (fallback):', budgetData);
        } catch (localError) {
          console.error('Error saving to localStorage:', localError);
          alert('حدث خطأ في حفظ الميزانية: ' + localError.message);
        }
      }
      
      // Force re-render by updating a dummy state or using a key
      // In React, component will re-render with the new budget values
      setBudgetUpdateKey(prev => prev + 1);
    }
  };

  const cancelEditing = () => {
    setEditingBudget(null);
    setTempBudgets({});
  };

  // Monthly budget tracking
  const monthlyExpenses = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const allExpenses = [];
    
    // Get all expenses from cases
    if (cases && Array.isArray(cases)) {
      cases.forEach(c => {
        if (c.finance?.history) {
           c.finance.history.filter(t => t.type === 'expense').forEach(t => {
              allExpenses.push({
                 ...t,
                 caseTitle: c.title,
                 clientName: clients && Array.isArray(clients) ? clients.find(cl => cl.id === c.clientId)?.name : undefined
              });
           });
        }
      });
    }
    
    // Get hearing expenses
    if (hearings && Array.isArray(hearings)) {
      hearings.forEach(h => {
        if (h.expenses && h.expenses.amount > 0) {
          const c = cases && Array.isArray(cases) ? cases.find(x => x.id === h.caseId) : null;
          allExpenses.push({
            id: `h-${h.id}`,
            date: h.date,
            category: 'رسوم',
            description: h.expenses.description || 'مصروفات متنوعة',
            amount: h.expenses.amount,
            caseTitle: c?.title,
            clientName: clients && Array.isArray(clients) ? clients.find(cl => cl.id === c?.clientId)?.name : undefined,
            paidBy: h.expenses.paidBy === 'lawyer' ? 'المكتب' : 'الموكل'
          });
        }
      });
    }
    
    return expenseCategories.map(category => {
      const categoryExpenses = allExpenses.filter(exp => {
        const expDate = new Date(exp.date);
        return exp.category === category.id && 
               expDate.getMonth() === currentMonth && 
               expDate.getFullYear() === currentYear;
      });
      
      const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const budgetRemaining = category.budget - totalSpent;
      const budgetPercentage = (totalSpent / category.budget) * 100;
      
      return {
        ...category,
        spent: totalSpent,
        remaining: budgetRemaining,
        percentage: budgetPercentage,
        count: categoryExpenses.length,
        isOverBudget: budgetRemaining < 0
      };
    });
  }, [cases, hearings, clients, expenseCategories, budgetUpdateKey]);

  const applyTemplate = (template: typeof quickTemplates[0]) => {
    setTransactionData(prev => ({
      ...prev,
      type: template.type,
      description: template.description,
      amount: template.amount,
      category: template.category || ''
    }));
  };

  // Handle Tab Logic based on Permissions
  useEffect(() => {
    if (!canViewIncome && canViewExpenses) {
      setActiveTab('expenses');
    } else if (canViewIncome) {
      setActiveTab('overview');
    }
  }, [canViewIncome, canViewExpenses]);

  // --- Data Aggregation & Logic ---

  // Auto-complete logic
  const filteredCases = useMemo(() => {
    if (!caseSearchTerm) return [];
    return cases.filter(c => {
      const client = clients.find(cl => cl.id === c.clientId);
      const searchText = caseSearchTerm.toLowerCase();
      return (
        c.title.toLowerCase().includes(searchText) ||
        c.caseNumber.toLowerCase().includes(searchText) ||
        (client?.name.toLowerCase().includes(searchText) || false)
      );
    }).slice(0, 5); // Limit to 5 suggestions
  }, [cases, clients, caseSearchTerm]);

  const getDescriptionSuggestions = useMemo(() => {
    const allDescriptions = cases.flatMap(c => 
      c.finance?.history?.map(h => h.description).filter(Boolean) || []
    );
    const uniqueDescriptions = [...new Set(allDescriptions)];
    return uniqueDescriptions.filter(desc => 
      desc.toLowerCase().includes(transactionData.description.toLowerCase())
    ).slice(0, 3);
  }, [cases, transactionData.description]);

  // Update description suggestions when description changes
  useEffect(() => {
    if (transactionData.description.length > 0) {
      setDescriptionSuggestions(getDescriptionSuggestions);
    } else {
      setDescriptionSuggestions([]);
    }
  }, [transactionData.description, getDescriptionSuggestions]);

  // 1. Financial Stats
  const stats = useMemo(() => {
    let totalAgreed = 0;
    let totalCollected = 0;
    let totalCaseExpenses = 0;
    let totalHearingExpenses = 0;

    // Add defensive checks with default values
    const safeCases = cases || [];
    const safeHearings = hearings || [];
    
    // Add null checks to prevent errors
    if (safeCases && Array.isArray(safeCases)) {
      safeCases.forEach(c => {
        if (c.finance) {
          totalAgreed += c.finance.agreedFees || 0;
          totalCollected += c.finance.paidAmount || 0;
          totalCaseExpenses += c.finance.expenses || 0;
        }
      });
    }

    if (safeHearings && Array.isArray(safeHearings)) {
      safeHearings.forEach(h => {
        if (h.expenses && h.expenses.paidBy === 'lawyer') {
          totalHearingExpenses += h.expenses.amount;
        }
      });
    }

    const totalExpenses = totalCaseExpenses + totalHearingExpenses;
    const totalPending = totalAgreed - totalCollected;
    const netIncome = totalCollected - totalExpenses;
    const collectionRate = totalAgreed > 0 ? Math.round((totalCollected / totalAgreed) * 100) : 0;

    return { totalAgreed, totalCollected, totalPending, totalExpenses, netIncome, collectionRate };
  }, [cases, hearings]);

  // 2. Cases Financial List
  const casesFinancials = useMemo(() => {
    return cases.map(c => {
      const client = clients.find(cl => cl.id === c.clientId);
      const agreed = c.finance?.agreedFees || 0;
      const paid = c.finance?.paidAmount || 0;
      const remaining = agreed - paid;
      const percentage = agreed > 0 ? (paid / agreed) * 100 : 0;
      
      let status: 'completed' | 'partial' | 'unpaid' = 'partial';
      if (paid >= agreed && agreed > 0) status = 'completed';
      else if (paid === 0) status = 'unpaid';

      return {
        ...c,
        clientName: client?.name || 'غير معروف',
        financials: { agreed, paid, remaining, percentage, status }
      };
    }).filter(c => {
      const matchesSearch = c.title.includes(searchTerm) || c.clientName.includes(searchTerm) || c.caseNumber.includes(searchTerm);
      if (!matchesSearch) return false;

      if (filterStatus === 'completed') return c.financials.status === 'completed';
      if (filterStatus === 'pending') return c.financials.status !== 'completed';
      if (filterStatus === 'debt') return c.financials.remaining > 0;
      
      return true;
    });
  }, [cases, clients, searchTerm, filterStatus]);

  // 3. Expenses List (Aggregated)
  const expensesList = useMemo(() => {
    const list: any[] = [];
    
    // A. Hearing Expenses
    if (hearings && Array.isArray(hearings)) {
      hearings.forEach(h => {
        if (h.expenses && h.expenses.amount > 0) {
          const c = cases && Array.isArray(cases) ? cases.find(x => x.id === h.caseId) : null;
          list.push({
            id: `h-${h.id}`,
            date: h.date,
            category: 'مصروفات جلسة',
            description: h.expenses.description || 'مصروفات متنوعة',
            amount: h.expenses.amount,
            caseTitle: c?.title,
            clientName: clients && Array.isArray(clients) ? clients.find(cl => cl.id === c?.clientId)?.name : undefined,
            paidBy: h.expenses.paidBy === 'lawyer' ? 'المكتب' : 'الموكل'
          });
        }
      });
    }

    // B. Case Admin Expenses (from Transactions Log if available, else fallback)
    if (cases && Array.isArray(cases)) {
      cases.forEach(c => {
        if (c.finance?.history) {
           c.finance.history.filter(t => t.type === 'expense').forEach(t => {
              list.push({
                 id: t.id,
               date: t.date,
               category: t.category || 'إدارية',
               description: t.description || 'مصروفات',
               amount: t.amount,
               caseTitle: c.title,
               clientName: clients && Array.isArray(clients) ? clients.find(cl => cl.id === c.clientId)?.name : undefined,
               paidBy: 'المكتب'
            });
         });
        }
      });
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cases, hearings, clients]);

  // --- Handlers ---

  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Enhanced validation
    if (!onUpdateCase) {
      alert('لا يمكن إضافة معاملة. وظيفة التحديث غير متاحة.');
      return;
    }
    
    if (!transactionData.caseId) {
      alert('يرجى اختيار القضية أولاً.');
      return;
    }
    
    if (!transactionData.amount || transactionData.amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من صفر.');
      return;
    }

    const targetCase = cases.find(c => c.id === transactionData.caseId);
    if (!targetCase) {
      alert('القضية المختارة غير موجودة.');
      return;
    }

    // For expenses, require category
    if (transactionData.type === 'expense' && !transactionData.category) {
      alert('يرجى اختيار بند المصروف.');
      return;
    }

    const currentFinance = targetCase.finance || { agreedFees: 0, paidAmount: 0, expenses: 0, history: [] };
    
    const newTransaction: FinancialTransaction = {
       id: Math.random().toString(36).substring(2, 9),
       date: new Date().toISOString().split('T')[0],
       amount: Number(transactionData.amount),
       type: transactionData.type,
       method: transactionData.type === 'payment' ? transactionData.method : undefined,
       category: transactionData.type === 'expense' ? (transactionData.category || 'نثريات') : undefined,
       description: transactionData.description || (transactionData.type === 'payment' ? 'دفعة من حساب الأتعاب' : 'مصروفات'),
       recordedBy: 'المحامي' // In real app, use current user name
    };

    let newFinance = { 
       ...currentFinance,
       history: [...(currentFinance.history || []), newTransaction]
    };

    if (transactionData.type === 'payment') {
      newFinance.paidAmount += Number(transactionData.amount);
    } else {
      newFinance.expenses += Number(transactionData.amount);
    }

    try {
      onUpdateCase({
        ...targetCase,
        finance: newFinance
      });

      setIsTransactionModalOpen(false);
      setTransactionData({ caseId: '', amount: 0, type: 'payment', description: '', method: 'cash', category: '' });
      setCaseSearchTerm('');
      setDescriptionSuggestions([]);
      setShowCaseSuggestions(false);
      
      // Show success message
      const successMsg = transactionData.type === 'payment' ? 'تم إضافة الدفعة بنجاح!' : 'تم تسجيل المصروف بنجاح!';
      alert(successMsg);
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('حدث خطأ أثناء حفظ المعاملة. يرجى المحاولة مرة أخرى.');
    }
  };

  const openTransactionModal = (caseId?: string) => {
    if (caseId) {
       setTransactionData(prev => ({ ...prev, caseId }));
       // Set case search term to show selected case
       const selectedCase = cases.find(c => c.id === caseId);
       const client = selectedCase ? clients.find(cl => cl.id === selectedCase.clientId) : null;
       if (selectedCase && client) {
         setCaseSearchTerm(`${selectedCase.title} - ${client.name}`);
       }
    }
    // Default to 'expense' if user has no income permission
    if (!canViewIncome) {
       setTransactionData(prev => ({ ...prev, type: 'expense' }));
    }
    setIsTransactionModalOpen(true);
  };

  const handleCaseSelect = (caseId: string, caseTitle: string, clientName: string) => {
    setTransactionData(prev => ({ ...prev, caseId }));
    setCaseSearchTerm(`${caseTitle} - ${clientName}`);
    setShowCaseSuggestions(false);
  };

  const handleDescriptionSelect = (description: string) => {
    setTransactionData(prev => ({ ...prev, description }));
    setDescriptionSuggestions([]);
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

  // --- Invoice Generation Logic ---
  const handlePrintReceipt = async (trans: FinancialTransaction, caseData: Case) => {
     const client = clients.find(c => c.id === caseData.clientId);
     setPrintingTrans({ trans, caseData, clientName: client?.name || 'غير معروف' });
     
     // Allow state to update and DOM to render
     setTimeout(async () => {
        if (!invoiceRef.current) return;
        
        try {
           const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
           const imgData = canvas.toDataURL('image/png');
           const pdf = new jsPDF('p', 'mm', 'a4');
           const pdfWidth = pdf.internal.pageSize.getWidth();
           const imgProps = pdf.getImageProperties(imgData);
           const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
           
           pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
           pdf.save(`Receipt_${trans.id}.pdf`);
           
           // Clean up
           setPrintingTrans(null);
        } catch (err) {
           console.error('Invoice Print Error:', err);
           alert('حدث خطأ أثناء طباعة الإيصال');
        }
     }, 500);
  };

  const handleShareWhatsApp = (trans: FinancialTransaction, caseData: Case) => {
     const client = clients.find(c => c.id === caseData.clientId);
     if (!client) return;

     const typeLabel = trans.type === 'payment' ? 'إيصال استلام دفعة' : 'بيان مصروفات';
     const msg = `
*مكتب الميزان للمحاماة*
${typeLabel}

👤 الموكل: ${client.name}
⚖️ القضية: ${caseData.title} (${caseData.caseNumber})
💰 المبلغ: ${trans.amount.toLocaleString()} ج.م
📅 التاريخ: ${trans.date}
📝 البيان: ${trans.description || '-'}

تم تسجيل المعاملة بنجاح.
     `;
     
     const url = `https://wa.me/2${client.phone}?text=${encodeURIComponent(msg)}`;
     window.open(url, '_blank');
  };

  // --- Render Components ---

  const renderStatCard = (title: string, value: number, icon: any, colorClass: string, subValue?: string, trend?: { value: number, isPositive: boolean }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:shadow-md transition-all group">
      <div className="flex-1">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass} group-hover:scale-105 transition-transform`}>{value.toLocaleString()} <span className="text-xs text-slate-400">ج.م</span></h3>
        {subValue && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subValue}</p>}
        {trend && (
           <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
           }`}>
              {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend.value > 0 ? '+' : ''}{trend.value}%
           </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${colorClass.replace('text-', 'bg-').replace('700', '100').replace('600', '100')} ${colorClass} group-hover:scale-110 transition-transform`}>
        {React.createElement(icon, { className: "w-6 h-6" })}
      </div>
    </div>
  );

  const renderCaseFinancialDetails = () => {
     if (!selectedCaseForDetails) return null;
     const c = cases.find(x => x.id === selectedCaseForDetails);
     if (!c) return null;
     
     const transactions = c.finance?.history || [];
     const payments = transactions.filter(t => t.type === 'payment').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
     const expenses = transactions.filter(t => t.type === 'expense').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

     // Calculate Net Income for this specific case
     const totalPaid = c.finance?.paidAmount || 0;
     const totalExpenses = c.finance?.expenses || 0;
     const netIncome = totalPaid - totalExpenses;

     return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-start">
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{c.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                       <User className="w-4 h-4" /> {c.clientName} | <FileText className="w-4 h-4" /> {c.caseNumber}
                    </p>
                 </div>
                 <button onClick={() => setSelectedCaseForDetails(null)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-red-500">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              {/* Summary Cards inside Modal - Show only if income permission exists */}
              {canViewIncome && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                   <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">إجمالي الأتعاب</p>
                      <p className="text-base sm:text-lg font-bold text-blue-900 dark:text-blue-200">{c.finance?.agreedFees.toLocaleString()}</p>
                   </div>
                   <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-xl border border-green-100 dark:border-green-800 text-center">
                      <p className="text-xs text-green-600 dark:text-green-400 font-bold mb-1">المدفوع</p>
                      <p className="text-base sm:text-lg font-bold text-green-900 dark:text-green-200">{totalPaid.toLocaleString()}</p>
                   </div>
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 sm:p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-2 h-2 bg-indigo-500 rounded-bl-full"></div>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mb-1">صافي الدخل</p>
                      <p className="text-base sm:text-lg font-bold text-indigo-900 dark:text-indigo-200">{netIncome.toLocaleString()}</p>
                      <p className="text-[10px] text-indigo-400 mt-1 hidden sm:block">بعد خصم المصروفات ({totalExpenses.toLocaleString()})</p>
                   </div>
                   <div className="bg-red-50 dark:bg-red-900/20 p-3 sm:p-4 rounded-xl border border-red-100 dark:border-red-800 text-center">
                      <p className="text-xs text-red-600 dark:text-red-400 font-bold mb-1">المتبقي</p>
                      <p className="text-base sm:text-lg font-bold text-red-900 dark:text-red-200">{((c.finance?.agreedFees||0) - totalPaid).toLocaleString()}</p>
                   </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                 {canViewIncome && (
                   <button 
                      onClick={() => setDetailsTab('payments')}
                      className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${detailsTab === 'payments' ? 'border-b-2 border-green-500 text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                   >
                      <ArrowDownLeft className="w-4 h-4" /> سجل الدفعات (الوارد)
                   </button>
                 )}
                 {canViewExpenses && (
                   <button 
                      onClick={() => setDetailsTab('expenses')}
                      className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${detailsTab === 'expenses' ? 'border-b-2 border-red-500 text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                   >
                      <ArrowUpRight className="w-4 h-4" /> سجل المصروفات (الصادر)
                   </button>
                 )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-0">
                 {detailsTab === 'payments' && canViewIncome ? (
                    <table className="w-full text-right text-sm">
                       <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0">
                          <tr>
                             <th className="p-4">التاريخ</th>
                             <th className="p-4">المبلغ</th>
                             <th className="p-4">طريقة الدفع</th>
                             <th className="p-4">البيان</th>
                             <th className="p-4 text-center">إيصال</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                          {payments.map(p => (
                             <tr key={p.id} className="hover:bg-green-50/30 dark:hover:bg-green-900/10">
                                <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{p.date}</td>
                                <td className="p-4 font-bold text-green-700 dark:text-green-400">{p.amount.toLocaleString()} ج.م</td>
                                <td className="p-4">
                                   <div className="flex items-center gap-2">
                                      {getMethodIcon(p.method || 'cash')}
                                      <span>{getMethodLabel(p.method || 'cash')}</span>
                                   </div>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{p.description}</td>
                                <td className="p-4 text-center flex justify-center gap-2">
                                   <button 
                                     onClick={() => handlePrintReceipt(p, c)}
                                     className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                     title="طباعة إيصال"
                                   >
                                      <Printer className="w-4 h-4" />
                                   </button>
                                   <button 
                                     onClick={() => handleShareWhatsApp(p, c)}
                                     className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/30 rounded transition-colors"
                                     title="مشاركة واتساب"
                                   >
                                      <Share2 className="w-4 h-4" />
                                   </button>
                                </td>
                             </tr>
                          ))}
                          {payments.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">لا توجد دفعات مسجلة</td></tr>}
                       </tbody>
                    </table>
                 ) : (
                    <table className="w-full text-right text-sm">
                       <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0">
                          <tr>
                             <th className="p-4">التاريخ</th>
                             <th className="p-4">المبلغ</th>
                             <th className="p-4">البند</th>
                             <th className="p-4">البيان</th>
                             <th className="p-4 text-center">طباعة</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                          {expenses.map(ex => (
                             <tr key={ex.id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10">
                                <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{ex.date}</td>
                                <td className="p-4 font-bold text-red-700 dark:text-red-400">-{ex.amount.toLocaleString()} ج.م</td>
                                <td className="p-4"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{ex.category}</span></td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{ex.description}</td>
                                <td className="p-4 text-center">
                                   <button 
                                     onClick={() => handlePrintReceipt(ex, c)}
                                     className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                   >
                                      <Printer className="w-4 h-4" />
                                   </button>
                                </td>
                             </tr>
                          ))}
                          {expenses.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">لا توجد مصروفات مسجلة</td></tr>}
                       </tbody>
                    </table>
                 )}
              </div>
              
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
                 <button onClick={() => setSelectedCaseForDetails(null)} className="px-6 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-100 dark:hover:bg-slate-600">إغلاق</button>
              </div>
           </div>
        </div>
     );
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in">
      
      {/* Hidden Invoice Template */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
         {printingTrans && (
            <div 
               ref={invoiceRef} 
               className="bg-white text-black p-12 flex flex-col font-serif"
               style={{ width: '210mm', minHeight: '148mm', direction: 'rtl' }}
            >
               {/* Header */}
               <div className="border-b-2 border-black pb-4 mb-8 flex justify-between items-start">
                  <div>
                     <h1 className="text-2xl font-bold mb-2">مكتب الميزان للمحاماة</h1>
                     <p className="text-sm text-gray-600">للاستشارات القانونية وأعمال المحاماة</p>
                  </div>
                  <div className="text-left">
                     <h2 className="text-xl font-bold bg-gray-100 px-4 py-1 rounded border border-gray-300">
                        {printingTrans.trans.type === 'payment' ? 'إيصال استلام نقدية' : 'إذن صرف نقدية'}
                     </h2>
                     <p className="text-sm mt-2">رقم: {printingTrans.trans.id.toUpperCase()}</p>
                     <p className="text-sm">التاريخ: {printingTrans.trans.date}</p>
                  </div>
               </div>

               {/* Body */}
               <div className="flex-1 space-y-6 text-lg leading-loose">
                  <div className="flex gap-4">
                     <span className="font-bold min-w-[100px]">استلمنا من السيد/</span>
                     <span className="border-b border-dotted border-gray-400 flex-1 px-2">{printingTrans.clientName}</span>
                  </div>
                  <div className="flex gap-4">
                     <span className="font-bold min-w-[100px]">مبلغ وقدره/</span>
                     <span className="border-b border-dotted border-gray-400 flex-1 px-2 bg-gray-50 font-mono font-bold text-xl">{printingTrans.trans.amount.toLocaleString()} ج.م (فقط وقدره ................................)</span>
                  </div>
                  <div className="flex gap-4">
                     <span className="font-bold min-w-[100px]">وذلك مقابل/</span>
                     <span className="border-b border-dotted border-gray-400 flex-1 px-2">
                        {printingTrans.trans.description || 'أتعاب محاماة'} - قضية: {printingTrans.caseData.title} ({printingTrans.caseData.caseNumber})
                     </span>
                  </div>
                  <div className="flex gap-4">
                     <span className="font-bold min-w-[100px]">طريقة الدفع/</span>
                     <span className="border-b border-dotted border-gray-400 flex-1 px-2">{getMethodLabel(printingTrans.trans.method || 'cash')}</span>
                  </div>
               </div>

               {/* Footer */}
               <div className="mt-12 pt-8 flex justify-between items-center border-t border-gray-200">
                  <div className="text-center">
                     <p className="font-bold mb-8">المستلم (المحاسب)</p>
                     <p className="text-gray-400">.......................</p>
                  </div>
                  <div className="text-center">
                     <p className="font-bold mb-8">اعتماد المحامي</p>
                     <p className="text-gray-400">.......................</p>
                  </div>
                  <div className="text-center">
                     <div className="w-24 h-24 border-2 border-gray-300 rounded-full flex items-center justify-center text-gray-300 font-bold transform -rotate-12">
                        ختم المكتب
                     </div>
                  </div>
               </div>
               
               <div className="mt-8 text-center text-xs text-gray-500">
                  العنوان: المهندسين، الجيزة - هاتف: 01000000000
               </div>
            </div>
         )}
      </div>

      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            الإدارة المالية
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">متابعة دقيقة للأتعاب، المدفوعات، ومصروفات القضايا</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => openTransactionModal()}
             className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
           >
             <Plus className="w-4 h-4" /> تسجيل معاملة
           </button>
           {canViewIncome && (
             <button className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
               تصدير تقرير
             </button>
           )}
           {canViewExpenses && (
             <button 
               onClick={() => {
                 // Generate expense report
                 const reportData: any = {
                   month: new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }),
                   categories: monthlyExpenses,
                   totalBudget: monthlyExpenses.reduce((sum, cat) => sum + cat.budget, 0),
                   totalSpent: monthlyExpenses.reduce((sum, cat) => sum + cat.spent, 0),
                   totalRemaining: monthlyExpenses.reduce((sum, cat) => sum + cat.remaining, 0)
                 };
                 
                 const reportText = `
📊 تقرير المصروفات الشهرية\n\n📅 الشهر: ${reportData.month}\n\n💰 إجمالي الميزانية: ${reportData.totalBudget.toLocaleString()} ج.م\n💸 إجمالي المصروف: ${reportData.totalSpent.toLocaleString()} ج.م\n💎 صافي المتبقي: ${reportData.totalRemaining.toLocaleString()} ج.م\n\n📋 تفصيل المصروفات:\n${reportData.categories.map(cat => 
   `  ${cat.icon} ${cat.name}: ${cat.spent.toLocaleString()} ج.م (من ${cat.budget.toLocaleString()}) - ${cat.percentage.toFixed(1)}%`
 ).join('\n')}\n\n⚠️ ${reportData.categories.filter(cat => cat.isOverBudget).length > 0 ? 'تنبيه: هناك مصروفات تتجاوز الميزانية المحددة!' : 'جميع المصروفات ضمن الميزانية'}\n                 `;
                 
                 // Copy to clipboard
                 navigator.clipboard.writeText(reportText);
                 alert('تم نسخ تقرير المصروفات إلى الحافظة!');
               }}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
               title="نسخ تقرير المصروفات"
             >
               <FileText className="w-4 h-4" /> تقرير المصروفات
             </button>
           )}
        </div>
      </div>

      {/* 2. Dashboard Stats (Hide completely if only Expenses) */}
      {canViewIncome ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {renderStatCard('إجمالي الأتعاب المتفق عليها', stats.totalAgreed, TrendingUp, 'text-slate-700 dark:text-slate-300', 'قيمة العقود المسجلة', { value: 12, isPositive: true })}
          {renderStatCard('إجمالي المحصل', stats.totalCollected, ArrowDownLeft, 'text-emerald-600', `نسبة التحصيل: ${stats.collectionRate}%`, { value: 8, isPositive: true })}
          {renderStatCard('مستحقات (ديون)', stats.totalPending, AlertCircle, 'text-red-600 dark:text-red-400', 'أتعاب لم يتم تحصيلها', { value: -5, isPositive: false })}
          {renderStatCard('صافي الدخل', stats.netIncome, Calculator, 'text-indigo-600 dark:text-indigo-400', `بعد خصم المصروفات (${stats.totalExpenses.toLocaleString()})`, { value: 15, isPositive: true })}
        </div>
      ) : (
        /* Only Expense Stats */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {renderStatCard('إجمالي المصروفات', stats.totalExpenses, ArrowUpRight, 'text-red-600 dark:text-red-400', 'نثريات، انتقالات، ورسوم', { value: 3, isPositive: false })}
        </div>
      )}

      {/* 3. Main Content (Tabs) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[500px]">
        {/* Tabs Header */}
        <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
           {canViewIncome && (
             <button 
               onClick={() => setActiveTab('overview')} 
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-600 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}
             >
                <FileText className="w-4 h-4" /> سجل أتعاب القضايا
             </button>
           )}
           {canViewExpenses && (
             <button 
               onClick={() => setActiveTab('expenses')} 
               className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'expenses' ? 'bg-white dark:bg-slate-600 text-red-700 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-600/50'}`}
             >
                <ArrowUpRight className="w-4 h-4" /> سجل المصروفات
             </button>
           )}
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="relative w-full sm:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                 type="text" 
                 placeholder={activeTab === 'overview' ? "بحث باسم القضية أو الموكل..." : "بحث في المصروفات..."}
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pr-9 pl-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
              />
           </div>
           
           {activeTab === 'overview' && (
              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                 <Filter className="w-4 h-4 text-slate-400" />
                 <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm rounded-lg p-2 focus:outline-none focus:border-emerald-500"
                 >
                    <option value="all">جميع الحالات</option>
                    <option value="completed">خالص السداد</option>
                    <option value="debt">علية مديونية</option>
                 </select>
              </div>
           )}
        </div>

        {/* Tab Content: Cases Financials - Mobile Cards */}
        {activeTab === 'overview' && canViewIncome && (
           <div className="p-4 space-y-4">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                 <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                       <tr>
                          <th className="p-4">القضية / الموكل</th>
                          <th className="p-4">إجمالي الأتعاب</th>
                          <th className="p-4 w-1/4">موقف السداد</th>
                          <th className="p-4">المدفوع</th>
                          <th className="p-4">المتبقي</th>
                          <th className="p-4">الإجراءات</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                       {casesFinancials.map(c => (
                          <tr key={c.id} onClick={() => setSelectedCaseForDetails(c.id)} className="hover:bg-slate-50 dark:hover:bg-slate-700 group cursor-pointer transition-colors">
                             <td className="p-4">
                                <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{c.title}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                   <User className="w-3 h-3" /> {c.clientName}
                                </div>
                             </td>
                             <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{c.financials.agreed.toLocaleString()}</td>
                             <td className="p-4">
                                <div className="w-full bg-slate-200 dark:bg-slate-600 h-2.5 rounded-full overflow-hidden mb-1">
                                   <div 
                                      className={`h-full rounded-full ${c.financials.status === 'completed' ? 'bg-emerald-500' : c.financials.percentage < 50 ? 'bg-red-500' : 'bg-amber-500'}`} 
                                      style={{ width: `${c.financials.percentage}%` }}
                                   ></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                                   <span>{Math.round(c.financials.percentage)}%</span>
                                   <span>{c.financials.status === 'completed' ? 'مكتمل' : 'جاري'}</span>
                                </div>
                             </td>
                             <td className="p-4 text-emerald-700 dark:text-emerald-400 font-bold">{c.financials.paid.toLocaleString()}</td>
                             <td className={`p-4 font-bold ${c.financials.remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>
                                {c.financials.remaining > 0 ? c.financials.remaining.toLocaleString() : '0'}
                             </td>
                             <td className="p-4">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openTransactionModal(c.id); }}
                                  className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 p-2 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
                                >
                                   <Plus className="w-3 h-3" /> إضافة دفعة
                                </button>
                             </td>
                          </tr>
                       ))}
                       {casesFinancials.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">لا توجد سجلات مطابقة</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>

              {/* Mobile Cards View */}
              <div className="lg:hidden space-y-3">
                 {casesFinancials.map(c => (
                    <div 
                       key={c.id} 
                       onClick={() => setSelectedCaseForDetails(c.id)}
                       className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                    >
                       {/* Header */}
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                             <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-base">
                                {c.title}
                             </h3>
                             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> {c.clientName}
                             </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                             <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                c.financials.status === 'completed' 
                                   ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                   : c.financials.percentage < 50 
                                   ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                   : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                             }`}>
                                {c.financials.status === 'completed' ? '✅ مكتمل' : c.financials.percentage < 50 ? '🔴 متأخر' : '⏳ جاري'}
                             </span>
                             <span className="text-xs text-slate-400">{Math.round(c.financials.percentage)}%</span>
                          </div>
                       </div>

                       {/* Progress Bar */}
                       <div className="mb-3">
                          <div className="w-full bg-slate-200 dark:bg-slate-600 h-2 rounded-full overflow-hidden">
                             <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                   c.financials.status === 'completed' ? 'bg-emerald-500' : 
                                   c.financials.percentage < 50 ? 'bg-red-500' : 'bg-amber-500'
                                }`} 
                                style={{ width: `${c.financials.percentage}%` }}
                             ></div>
                          </div>
                       </div>

                       {/* Financial Details Grid */}
                       <div className="grid grid-cols-3 gap-3 mb-3">
                          <div className="text-center p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                             <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">الأتعاب</p>
                             <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{c.financials.agreed.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                             <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">المدفوع</p>
                             <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{c.financials.paid.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                             <p className="text-xs text-red-600 dark:text-red-400 font-bold">المتبقي</p>
                             <p className="text-sm font-bold text-red-700 dark:text-red-400">
                                {c.financials.remaining > 0 ? c.financials.remaining.toLocaleString() : '0'}
                             </p>
                          </div>
                       </div>

                       {/* Action Button */}
                       <button 
                          onClick={(e) => { e.stopPropagation(); openTransactionModal(c.id); }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                       >
                          <Plus className="w-4 h-4" /> إضافة دفعة جديدة
                       </button>
                    </div>
                 ))}
                 {casesFinancials.length === 0 && (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                       <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                       <p>لا توجد سجلات مطابقة</p>
                    </div>
                 )}
              </div>
           </div>
        )}

        {/* Tab Content: Expenses - Mobile Cards with Budget Tracking */}
        {activeTab === 'expenses' && canViewExpenses && (
           <div className="p-4 space-y-4">
              {/* Monthly Budget Overview */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-4 border border-indigo-200 dark:border-indigo-800" key={budgetUpdateKey}>
                 <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-indigo-800 dark:text-indigo-200 flex items-center gap-2">
                       <Calculator className="w-5 h-5" /> 
                       الميزانية الشهرية
                    </h3>
                    <span className="text-sm text-indigo-600 dark:text-indigo-400">
                       {new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                    </span>
                 </div>
                 
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {monthlyExpenses.map(category => (
                       <div 
                          key={category.id}
                          className={`p-3 rounded-lg border ${
                             category.isOverBudget 
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                : category.percentage > 80
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                       >
                          <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-1">
                                <span className="text-lg">{category.icon}</span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{category.name}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                {category.isOverBudget && (
                                   <AlertCircle className="w-4 h-4 text-red-500" />
                                )}
                                <button
                                   onClick={() => startEditingBudget(category.id)}
                                   className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-bold flex items-center gap-1"
                                   title={`تعديل ميزانية ${category.name}`}
                                >
                                   <Calculator className="w-3 h-3" />
                                   تعديل
                                </button>
                             </div>
                          </div>
                          
                          <div className="space-y-1">
                             <div className="flex justify-between text-xs">
                                <span className="text-slate-500">الميزانية:</span>
                                {editingBudget === category.id ? (
                                   <input
                                      type="number"
                                      value={tempBudgets[category.id] || category.budget}
                                      onChange={(e) => setTempBudgets({...tempBudgets, [category.id]: Number(e.target.value)})}
                                      className="w-20 px-1 py-0.5 text-xs font-bold text-indigo-600 bg-white border border-indigo-300 rounded"
                                      min="0"
                                      step="10"
                                   />
                                ) : (
                                   <span className="font-bold">{category.budget.toLocaleString()}</span>
                                )}
                             </div>
                             <div className="flex justify-between text-xs">
                                <span className="text-slate-500">المصروف:</span>
                                <span className={`font-bold ${
                                   category.isOverBudget ? 'text-red-600' : 'text-slate-700'
                                }`}>{category.spent.toLocaleString()}</span>
                             </div>
                             <div className="flex justify-between text-xs">
                                <span className="text-slate-500">المتبقي:</span>
                                <span className={`font-bold ${
                                   category.isOverBudget ? 'text-red-600' : 'text-emerald-600'
                                }`}>{category.remaining.toLocaleString()}</span>
                             </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-2">
                             <div className="w-full bg-slate-200 dark:bg-slate-600 h-1.5 rounded-full overflow-hidden">
                                <div 
                                   className={`h-full rounded-full transition-all duration-500 ${
                                      category.isOverBudget ? 'bg-red-500' : 
                                      category.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                   }`} 
                                   style={{ width: `${Math.min(category.percentage, 100)}%` }}
                                ></div>
                             </div>
                             <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                <span>{Math.round(category.percentage)}%</span>
                                <span>{category.count} معاملة</span>
                                {editingBudget === category.id && (
                                   <div className="flex gap-1">
                                      <button
                                         onClick={() => saveBudget(category.id)}
                                         className="text-emerald-600 hover:text-emerald-700 text-xs font-bold"
                                         title="حفظ الميزانية"
                                      >
                                         حفظ
                                      </button>
                                      <button
                                         onClick={cancelEditing}
                                         className="text-slate-500 hover:text-slate-700 text-xs font-bold"
                                         title="إلغاء"
                                      >
                                         إلغاء
                                      </button>
                                   </div>
                                )}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
                 
                 {/* Budget Summary */}
                 <div className="mt-4 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                    <div className="grid grid-cols-3 gap-4 text-center">
                       <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي الميزانية</p>
                          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                             {monthlyExpenses.reduce((sum, cat) => sum + cat.budget, 0).toLocaleString()}
                          </p>
                       </div>
                       <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي المصروف</p>
                          <p className="text-lg font-bold text-red-600 dark:text-red-400">
                             {monthlyExpenses.reduce((sum, cat) => sum + cat.spent, 0).toLocaleString()}
                          </p>
                       </div>
                       <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">صافي المتبقي</p>
                          <p className={`text-lg font-bold ${
                             monthlyExpenses.reduce((sum, cat) => sum + cat.remaining, 0) < 0 
                                ? 'text-red-600' : 'text-emerald-600'
                          }`}>
                             {monthlyExpenses.reduce((sum, cat) => sum + cat.remaining, 0).toLocaleString()}
                          </p>
                       </div>
                    </div>
                    
                    {/* Simple Bar Chart */}
                    <div className="mt-4">
                       <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">مؤشر أداء المصروفات</p>
                       <div className="flex items-end gap-1 h-20">
                          {monthlyExpenses.map((category, index) => (
                             <div key={category.id} className="flex-1 flex flex-col items-center">
                                <div 
                                   className={`w-full rounded-t transition-all duration-500 ${
                                      category.isOverBudget ? 'bg-red-500' : 
                                      category.percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                   }`}
                                   style={{ height: `${Math.min(category.percentage, 100)}%` }}
                                ></div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                                   <span className="text-lg">{category.icon}</span>
                                   <div className="text-[10px]">{Math.round(category.percentage)}%</div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                 <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                       <tr>
                          <th className="p-4">التاريخ</th>
                          <th className="p-4">البند / الوصف</th>
                          <th className="p-4">نوع المصروف</th>
                          <th className="p-4">خاص بقضية</th>
                          <th className="p-4">القيمة</th>
                          <th className="p-4">جهة الدفع</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-800 dark:text-slate-200">
                       {expensesList.map((exp: any) => (
                          <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                             <td className="p-4 font-mono text-slate-600 dark:text-slate-400">{exp.date}</td>
                             <td className="p-4 text-slate-800 dark:text-white">{exp.description}</td>
                             <td className="p-4"><span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{exp.category}</span></td>
                             <td className="p-4">
                                {exp.caseTitle ? (
                                   <div>
                                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{exp.caseTitle}</div>
                                      <div className="text-[10px] text-slate-400">{exp.clientName}</div>
                                   </div>
                                ) : '-'}
                             </td>
                             <td className="p-4 font-bold text-red-600 dark:text-red-400">-{exp.amount.toLocaleString()}</td>
                             <td className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400">{exp.paidBy}</td>
                          </tr>
                       ))}
                       {expensesList.length === 0 && (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">لا توجد مصروفات مسجلة</td></tr>
                       )}
                    </tbody>
                 </table>
              </div>

              {/* Mobile Cards View */}
              <div className="lg:hidden space-y-3">
                 {expensesList.map((exp: any) => (
                    <div 
                       key={exp.id}
                       className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition-all"
                    >
                       {/* Header */}
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded text-xs font-bold">
                                   {exp.category}
                                </span>
                                <span className="text-xs text-slate-400">{exp.date}</span>
                             </div>
                             <h4 className="font-bold text-slate-800 dark:text-white text-base">{exp.description}</h4>
                          </div>
                          <div className="text-left">
                             <p className="text-lg font-bold text-red-600 dark:text-red-400">-{exp.amount.toLocaleString()}</p>
                             <p className="text-xs text-slate-400">ج.م</p>
                          </div>
                       </div>

                       {/* Case Info */}
                       {exp.caseTitle && (
                          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 mb-3">
                             <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">القضية المرتبطة</p>
                             <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{exp.caseTitle}</p>
                             {exp.clientName && (
                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                   <User className="w-3 h-3" /> {exp.clientName}
                                </p>
                             )}
                          </div>
                       )}

                       {/* Footer */}
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                             <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{exp.paidBy}</span>
                          </div>
                          <button 
                             onClick={() => handlePrintReceipt(exp, { id: exp.id, title: exp.caseTitle || 'مصروفات عامة', clientId: '', clientName: exp.clientName || 'المكتب' } as Case)}
                             className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 p-2 rounded-lg transition-colors"
                             title="طباعة الإيصال"
                          >
                             <Printer className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                 ))}
                 {expensesList.length === 0 && (
                    <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                       <ArrowUpRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
                       <p>لا توجد مصروفات مسجلة</p>
                    </div>
                 )}
              </div>
           </div>
        )}
      </div>

      {/* Transaction Modal (Add New) - Mobile Optimized */}
      {isTransactionModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">تسجيل معاملة مالية</h3>
                  <button 
                     onClick={() => {
                        setIsTransactionModalOpen(false);
                        setTransactionData({ caseId: '', amount: 0, type: 'payment', description: '', method: 'cash', category: '' });
                        setCaseSearchTerm('');
                        setDescriptionSuggestions([]);
                        setShowCaseSuggestions(false);
                     }}
                     className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-red-500"
                     title="إغلاق"
                  >
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto">
                  <form onSubmit={handleTransactionSubmit} className="p-4 space-y-4">
                     {/* Transaction Type */}
                     <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                        {canViewIncome && (
                          <button 
                             type="button" 
                             onClick={() => setTransactionData({...transactionData, type: 'payment'})}
                             className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${transactionData.type === 'payment' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                          >
                             <ArrowDownLeft className="w-4 h-4" /> استلام دفعة
                          </button>
                        )}
                        {canViewExpenses && (
                          <button 
                             type="button" 
                             onClick={() => setTransactionData({...transactionData, type: 'expense'})}
                             className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${transactionData.type === 'expense' ? 'bg-white dark:bg-slate-600 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                          >
                             <ArrowUpRight className="w-4 h-4" /> تسجيل مصروف
                          </button>
                        )}
                     </div>

                     {/* Quick Templates - Separated by Type */}
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                           قوالب سريعة - {transactionData.type === 'payment' ? 'المدفوعات' : 'المصروفات'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                           {quickTemplates
                              .filter(template => template.type === transactionData.type)
                              .map((template, index) => (
                                 <button
                                    key={index}
                                    type="button"
                                    onClick={() => applyTemplate(template)}
                                    className={`p-2 rounded-lg text-xs font-bold transition-all ${
                                       template.type === 'payment' 
                                          ? 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                          : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                    }`}
                                 >
                                    <div className="font-bold">{template.description}</div>
                                    <div className="text-xs opacity-75">{template.amount.toLocaleString()} ج.م</div>
                                 </button>
                              ))}
                        </div>
                     </div>

                  {/* Case Selection with Auto-complete */}
                  <div className="relative">
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">القضية الخاصة بالمعاملة *</label>
                     <input 
                        type="text"
                        required
                        className="w-full border border-slate-300 dark:border-slate-600 p-3 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={caseSearchTerm}
                        onChange={(e) => {
                          setCaseSearchTerm(e.target.value);
                          setShowCaseSuggestions(true);
                          // Clear caseId if user is typing
                          if (!e.target.value) {
                            setTransactionData(prev => ({ ...prev, caseId: '' }));
                          }
                        }}
                        onFocus={() => setShowCaseSuggestions(true)}
                        placeholder="ابحث عن القضية بالاسم أو رقم القضية أو اسم الموكل..."
                     />
                     
                     {/* Case Suggestions Dropdown */}
                     {showCaseSuggestions && filteredCases.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                           {filteredCases.map(c => {
                             const client = clients.find(cl => cl.id === c.clientId);
                             return (
                                <button
                                   key={c.id}
                                   type="button"
                                   onClick={() => handleCaseSelect(c.id, c.title, client?.name || '')}
                                   className="w-full text-right p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                                >
                                   <div className="font-bold text-slate-800 dark:text-white text-sm">{c.title}</div>
                                   <div className="text-xs text-slate-500 dark:text-slate-400">
                                      {c.caseNumber} - {client?.name}
                                   </div>
                                </button>
                             );
                           })}
                        </div>
                     )}
                  </div>

                  {/* Amount */}
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المبلغ (ج.م) *</label>
                     <input 
                        type="number" 
                        required
                        min="1"
                        step="0.01"
                        className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:border-emerald-500"
                        value={transactionData.amount || ''}
                        onChange={e => setTransactionData({...transactionData, amount: Number(e.target.value)})}
                        placeholder="أدخل المبلغ"
                     />
                  </div>

                  {/* Payment Method (If Payment) */}
                  {transactionData.type === 'payment' && (
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">طريقة الدفع</label>
                        <div className="grid grid-cols-2 gap-2">
                           {['cash', 'check', 'instapay', 'wallet', 'bank_transfer'].map(method => (
                              <button
                                 key={method}
                                 type="button"
                                 onClick={() => setTransactionData({...transactionData, method: method as PaymentMethod})}
                                 className={`p-2 rounded border text-xs font-bold flex items-center justify-center gap-2 ${transactionData.method === method ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                              >
                                 {getMethodIcon(method)}
                                 {getMethodLabel(method)}
                              </button>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Category (If Expense) - Advanced Categories */}
                  {transactionData.type === 'expense' && (
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">بند المصروف *</label>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                           {expenseCategories.map(category => (
                              <button
                                 key={category.id}
                                 type="button"
                                 onClick={() => setTransactionData({...transactionData, category: category.id})}
                                 className={`p-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                                    transactionData.category === category.id
                                       ? 'bg-slate-100 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500'
                                       : 'border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                                 }`}
                                 title={`${category.name} - الميزانية: ${category.budget.toLocaleString()} ج.م`}
                              >
                                 <span className="text-lg">{category.icon}</span>
                                 <div className="flex-1 text-right">
                                    <div className="font-bold">{category.name}</div>
                                    <div className="text-xs opacity-60">{category.budget.toLocaleString()} ج.م</div>
                                 </div>
                              </button>
                           ))}
                        </div>
                     </div>
                  )}

                  {/* Description with Auto-complete */}
                  <div className="relative">
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">ملاحظات / بيان</label>
                     <input 
                        type="text" 
                        className="w-full border border-slate-300 dark:border-slate-600 p-3 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                        placeholder={transactionData.type === 'payment' ? 'دفعة من حساب الأتعاب' : 'تفاصيل المصروف'}
                        value={transactionData.description}
                        onChange={e => setTransactionData({...transactionData, description: e.target.value})}
                     />
                     
                     {/* Description Suggestions */}
                     {descriptionSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-50">
                           {descriptionSuggestions.map((desc, index) => (
                              <button
                                 key={index}
                                 type="button"
                                 onClick={() => handleDescriptionSelect(desc)}
                                 className="w-full text-right p-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 text-sm"
                              >
                                 {desc}
                              </button>
                           ))}
                        </div>
                     )}
                  </div>

                  <button 
                     type="submit" 
                     className={`w-full py-3 rounded-lg text-white font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 mt-4 ${transactionData.type === 'payment' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none' : 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none'}`}
                  >
                     {transactionData.type === 'payment' ? <Plus className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                     {transactionData.type === 'payment' ? 'إضافة الدفعة' : 'تسجيل المصروف'}
                  </button>
               </form>
               </div>
            </div>
         </div>
      )}

      {/* Details View Modal */}
      {renderCaseFinancialDetails()}
    </div>
  );
};

export default Fees;
