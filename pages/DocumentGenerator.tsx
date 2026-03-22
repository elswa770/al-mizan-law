import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PenTool, FileText, Download, Printer, User, Briefcase, ChevronDown, Check, RefreshCw, Upload, Plus, Sparkles, Eye, Edit3, Save, Trash2, Copy, Share2, Lock, Unlock, Zap, Clock, Star, TrendingUp, Filter, Search, X, Menu, ArrowRight, ArrowLeft, MoreVertical, Settings, HelpCircle, ChevronLeft, ChevronRight, FolderOpen, Shield, Users, Building, File } from 'lucide-react';
import { Case, Client } from '../types';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import mammoth from "mammoth";
import '../styles/document-generator.css';
import { DEFAULT_TEMPLATES, Template, MultiPageTemplate } from '../components/LegalTemplates';

// Animation components
const fadeIn = "animate-in fade-in duration-200";
const slideUp = "animate-in slide-in-from-bottom-4 duration-300";
const scaleIn = "animate-in zoom-in-95 duration-200";
const shimmer = "bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] animate-shimmer";

interface DocumentGeneratorProps {
  cases: Case[];
  clients: Client[];
  url: string;
}

const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ cases, clients, url }) => {
  // Enhanced State Management
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [selectedContext, setSelectedContext] = useState<{type: 'client' | 'case', id: string} | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [previewContent, setPreviewContent] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1); // For multi-page templates
  const [savedPages, setSavedPages] = useState<Record<string, string>>({}); // Saved pages data
  
  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Refs
  const printRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Combine Default and Custom Templates
  const allTemplates = useMemo(() => [...DEFAULT_TEMPLATES, ...customTemplates], [customTemplates]);
  
  // Filter templates based on search and category
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter(template => {
      const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = activeCategory === 'all' || template.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allTemplates, searchTerm, activeCategory]);
  
  // Template categories
  const categories = [
    { id: 'all', label: 'الكل', icon: FolderOpen, color: 'bg-slate-500' },
    { id: 'civil', label: 'مدني', icon: FileText, color: 'bg-blue-500' },
    { id: 'criminal', label: 'جنائي', icon: Shield, color: 'bg-red-500' },
    { id: 'family', label: 'أسري', icon: Users, color: 'bg-pink-500' },
    { id: 'commercial', label: 'تجاري', icon: Briefcase, color: 'bg-green-500' },
    { id: 'administrative', label: 'إداري', icon: Building, color: 'bg-purple-500' },
    { id: 'general', label: 'عام', icon: File, color: 'bg-orange-500' }
  ];

  // --- Handlers ---
  useEffect(() => {
    const template = allTemplates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    let newData: Record<string, string> = { ...formData };
    
    // Fill based on context
    if (selectedContext) {
       if (selectedContext.type === 'client') {
          const client = clients.find(c => c.id === selectedContext.id);
          if (client) {
             newData['CLIENT_NAME'] = client.name;
             newData['CLIENT_ID'] = client.nationalId;
             newData['CLIENT_ADDRESS'] = client.address || '';
          }
       } else if (selectedContext.type === 'case') {
          const kase = cases.find(c => c.id === selectedContext.id);
          if (kase) {
             newData['CLIENT_NAME'] = kase.clientName;
             const client = clients.find(c => c.id === kase.clientId);
             if (client) {
                newData['CLIENT_ID'] = client.nationalId;
                newData['CLIENT_ADDRESS'] = client.address || '';
             }
             if (kase.opponents && kase.opponents.length > 0) {
                newData['SECOND_PARTY_NAME'] = kase.opponents[0].name;
                newData['OPPONENT_NAME'] = kase.opponents[0].name;
             }
          }
       }
    }
    
    // Set Defaults
    if (!newData['DATE']) newData['DATE'] = new Date().toLocaleDateString('ar-EG');
    if (!newData['LAWYER_NAME']) newData['LAWYER_NAME'] = 'اسم المحامي (تلقائي)'; 

    setFormData(newData);
  }, [selectedTemplateId, selectedContext, clients, cases, allTemplates]);

  // 2. Generate Preview
  useEffect(() => {
    const template = allTemplates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    let html = template.content;
    
    // Replace all placeholders found in formData
    Object.keys(formData).forEach(key => {
       const value = formData[key] || '................';
       const regex = new RegExp(`{{${key}}}`, 'g');
       html = html.replace(regex, value);
    });

    // Replace remaining placeholders with dots/highlight
    template.placeholders.forEach(key => {
       if (!formData[key]) {
          const regex = new RegExp(`{{${key}}}`, 'g');
          html = html.replace(regex, `<span style="color:red; background:#fee;">[${key}]</span>`);
       }
    });

    setPreviewContent(html);
  }, [formData, selectedTemplateId, allTemplates]);

  const handleInputChange = (key: string, value: string) => {
     setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImportWord = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Convert Word to HTML
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      // Extract placeholders {{KEY}}
      const matches: string[] = html.match(/{{(.*?)}}/g) || [];
      // Clean up placeholders (remove brackets and duplicates)
      const placeholders: string[] = Array.from(new Set(matches.map((m: string) => m.replace(/{{|}}/g, '').trim())));

      // Check if this might be a multi-page template (has page breaks or multiple page indicators)
      const hasPageBreaks = html.includes('صفحة') || html.includes('Page') || placeholders.length > 15;

      const newTemplate: Template = {
        id: `custom_${Date.now()}`,
        title: file.name.replace('.docx', ''),
        type: 'other',
        content: html,
        placeholders: placeholders,
        category: 'general',
        difficulty: 'intermediate',
        tags: hasPageBreaks ? ['مخصص', 'متعدد الصفحات'] : ['مخصص'],
        usageCount: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
        ...(hasPageBreaks && {
          isMultiPage: true,
          pages: [
            {
              id: 'page_1',
              title: 'صفحة 1',
              pageNumber: 1,
              content: html,
              placeholders: placeholders
            }
          ]
        })
      };

      setCustomTemplates(prev => [...prev, newTemplate]);
      setSelectedTemplateId(newTemplate.id);
      setFormData({});
      
      // If it's a multi-page template, set to page 1
      if (hasPageBreaks) {
        setCurrentPage(1);
      }
      
      alert(`تم استيراد النموذج بنجاح!`);
    } catch (error) {
      console.error("Error importing docx:", error);
      alert('حدث خطأ أثناء قراءة ملف Word. تأكد أنه ملف .docx صالح.');
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handlePrint = () => {
     if (printRef.current) {
        const win = window.open('', '', 'height=700,width=900');
        if (win) {
           win.document.write('<html><head><title>طباعة مستند</title>');
           win.document.write('<style>body { font-family: "Cairo", sans-serif; direction: rtl; padding: 40px; } </style>');
           win.document.write('<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap" rel="stylesheet">');
           win.document.write('</head><body>');
           win.document.write(printRef.current.innerHTML);
           win.document.write('</body></html>');
           win.document.close();
           win.focus();
           setTimeout(() => {
              win.print();
              win.close();
           }, 500);
        }
     }
  };

  const handleDownloadPDF = async () => {
     if (!printRef.current) return;
     try {
        const canvas = await html2canvas(printRef.current, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        pdf.save('document.pdf');
     } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء تحميل الملف');
     }
  };

  const handleDownloadWord = () => {
     if (!previewContent) return;
     
     const header = `
       <html xmlns:o='urn:schemas-microsoft-com:office:office' 
             xmlns:w='urn:schemas-microsoft-com:office:word' 
             xmlns='http://www.w3.org/TR/REC-html40'>
       <head>
         <meta charset='utf-8'>
         <style>
           body { font-family: Arial, sans-serif; direction: rtl; text-align: right; line-height: 1.5; }
           h2, h3 { text-align: center; }
           p { margin-bottom: 10px; }
         </style>
       </head>
       <body>`;
     const footer = "</body></html>";
     const html = header + previewContent + footer;

     const blob = new Blob(['\ufeff', html], {
       type: 'application/msword'
     });
     
     const link = document.createElement('a');
     link.href = URL.createObjectURL(blob);
     link.download = `${currentTemplate?.title || 'document'}.doc`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
     URL.revokeObjectURL(link.href);
  };

  const currentTemplate = allTemplates.find(t => t.id === selectedTemplateId);
  
  // Get current page content for multi-page templates
  const getCurrentPageContent = () => {
    if (!currentTemplate) return '';
    
    if (currentTemplate.isMultiPage && currentTemplate.pages) {
      const page = currentTemplate.pages.find(p => p.pageNumber === currentPage);
      return page ? page.content : currentTemplate.pages[0]?.content || '';
    }
    
    return currentTemplate.content;
  };
  
  // Get current page placeholders
  const getCurrentPagePlaceholders = () => {
    if (!currentTemplate) return [];
    
    if (currentTemplate.isMultiPage && currentTemplate.pages) {
      const page = currentTemplate.pages.find(p => p.pageNumber === currentPage);
      return page ? page.placeholders : currentTemplate.pages[0]?.placeholders || [];
    }
    
    return currentTemplate.placeholders;
  };
  
  // Save current page data
  const saveCurrentPage = () => {
    if (!currentTemplate) return;
    
    const pageKey = `${selectedTemplateId}_page_${currentPage}`;
    setSavedPages(prev => ({
      ...prev,
      [pageKey]: JSON.stringify(formData)
    }));
    
    // Show success message
    alert(`تم حفظ الصفحة ${currentPage} بنجاح!`);
  };
  
  // Load saved page data
  const loadSavedPage = (pageNumber: number) => {
    if (!currentTemplate) return;
    
    const pageKey = `${selectedTemplateId}_page_${pageNumber}`;
    const savedData = savedPages[pageKey];
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
        setCurrentPage(pageNumber);
      } catch (error) {
        console.error('Error loading saved page:', error);
      }
    } else {
      setCurrentPage(pageNumber);
    }
  };
  
  // Import multi-page template
  const handleImportMultiPage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Convert Word to HTML
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      // Extract placeholders {{KEY}}
      const matches: string[] = html.match(/{{(.*?)}}/g) || [];
      // Clean up placeholders (remove brackets and duplicates)
      const placeholders: string[] = Array.from(new Set(matches.map((m: string) => m.replace(/{{|}}/g, '').trim())));

      const newTemplate: Template = {
        id: `custom_multipage_${Date.now()}`,
        title: file.name.replace('.docx', ''),
        type: 'other',
        content: '',
        placeholders: placeholders,
        category: 'general',
        difficulty: 'intermediate',
        tags: ['مخصص', 'متعدد الصفحات'],
        usageCount: 0,
        lastUpdated: new Date().toISOString().split('T')[0],
        isMultiPage: true,
        pages: [
          {
            id: 'page_1',
            title: 'صفحة 1',
            pageNumber: 1,
            content: html,
            placeholders: placeholders
          }
        ]
      };

      setCustomTemplates(prev => [...prev, newTemplate]);
      setSelectedTemplateId(newTemplate.id);
      setCurrentPage(1);
      setFormData({});
      alert('تم استيراد النموذج متعدد الصفحات بنجاح!');
    } catch (error) {
      console.error('Error importing multi-page template:', error);
      alert('حدث خطأ أثناء استيراد النموذج');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-24 lg:pt-0">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 mt-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-md"
            aria-label="فتح القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <PenTool className="w-5 h-5 text-primary-600" />
            إدارة العقود
          </h1>
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            aria-label="تبديل وضع المعاينة"
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen">
        {/* Sidebar - Templates Selection */}
        <div className={`${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 right-0 z-[60] w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 transition-transform duration-300 overflow-y-auto lg:max-h-screen lg:z-auto`}>
          <div className="p-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث عن نموذج..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="البحث في النماذج"
                className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-800 dark:text-white transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">التصنيف</h3>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm font-bold transition-all ${
                      activeCategory === cat.id
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500'
                        : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates List */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3">النماذج المتاحة</h3>
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md hover-lift ${
                    selectedTemplateId === template.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
                      <FileText className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate mb-1">
                        {template.title}
                      </h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                          template.difficulty === 'basic' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          template.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {template.difficulty === 'basic' ? 'أساسي' :
                           template.difficulty === 'intermediate' ? 'متوسط' : 'متقدم'}
                        </span>
                        {template.usageCount && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {template.usageCount}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 2 && (
                          <span className="text-xs text-slate-400">+{template.tags.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden lg:block bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                  <PenTool className="w-6 h-6 text-primary-600" />
                  إدارة العقود والمحررات
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  صياغة قانونية آلية دقيقة وسريعة
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all hover-lift"
                  title="خيارات متقدمة"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDownloadWord}
                  className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all hover-lift"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Word</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all hover-lift"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-primary-700 transition-all hover-lift shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">طباعة</span>
                </button>
              </div>
            </div>
          </div>

       {/* Advanced Options Bar */}
          {showAdvancedOptions && (
            <div className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">مصدر البيانات (اختياري)</label>
                  <select 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                    aria-label="اختيار مصدر البيانات"
                    onChange={(e) => {
                      const [type, id] = e.target.value.split(':');
                      if (type && id) setSelectedContext({ type: type as any, id });
                      else setSelectedContext(null);
                    }}
                  >
                    <option value="">-- ملء يدوي --</option>
                    <optgroup label="الموكلين">
                      {clients.map(c => <option key={c.id} value={`client:${c.id}`}>{c.name}</option>)}
                    </optgroup>
                    <optgroup label="القضايا">
                      {cases.map(c => <option key={c.id} value={`case:${c.id}`}>{c.title}</option>)}
                    </optgroup>
                  </select>
                </div>
                
                <div className="flex items-end gap-2">
                  <input 
                    type="file" 
                    ref={importInputRef} 
                    accept=".docx" 
                    className="hidden" 
                    onChange={handleImportWord}
                    aria-label="استيراد ملف Word"
                  />
                  <button 
                    onClick={() => importInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-all hover-lift whitespace-nowrap"
                    title="استيراد ملف Word (.docx) وتحديد المتغيرات تلقائياً {{KEY}}"
                  >
                    <Upload className="w-4 h-4" /> استيراد Word
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-screen lg:min-h-0 overflow-hidden p-4 lg:p-6">
            
            {/* Left: Input Form */}
            <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden max-h-[70vh] lg:max-h-full">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" /> البيانات المطلوبة
                </h3>
                <button 
                  onClick={() => setFormData({})} 
                  className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1"
                  title="مسح جميع الحقول"
                >
                  <RefreshCw className="w-3 h-3" /> إعادة تعيين
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {currentTemplate?.placeholders && currentTemplate.placeholders.length > 0 ? (
                  currentTemplate.placeholders.map(field => (
                    <div key={field} className="space-y-2">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400">
                        {field.replace(/_/g, ' ')}
                      </label>
                      <input 
                        type="text" 
                        value={formData[field] || ''}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-600 p-3 rounded-lg bg-slate-50 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all text-sm"
                        placeholder={`أدخل ${field.toLowerCase()}...`}
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-400 py-8">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">لا توجد حقول متغيرة في هذا النموذج</p>
                    <p className="text-xs mt-2">لاستيراد نموذج، استخدم صيغة {'{{KEY}}'} داخل ملف Word</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Preview */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-y-auto p-2 sm:p-4 lg:p-8 flex justify-center shadow-inner">
              <div 
                ref={printRef}
                className="bg-white text-black shadow-xl rounded-lg p-4 sm:p-8 lg:p-12 w-full max-w-[210mm] min-h-[200px] lg:min-h-[297mm] transition-all font-arabic custom-scrollbar"
                dir="rtl"
              >
                <div dangerouslySetInnerHTML={{ __html: previewContent }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DocumentGenerator;