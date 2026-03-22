
import React, { useState, useMemo, useRef } from 'react';
import { Case, Client, CaseDocument, ClientDocument, CaseRuling } from '../types';
import { googleDriveService } from '../src/services/googleDriveService';
import { FileText, Search, Filter, FolderOpen, User, Briefcase, File, Gavel, FileCheck, Shield, Download, Eye, ExternalLink, Calendar, Grid, List, Building2, Upload, X, Check, Cloud, LogIn } from 'lucide-react';

interface DocumentsProps {
  cases: Case[];
  clients: Client[];
  onCaseClick?: (caseId: string) => void;
  onClientClick?: (clientId: string) => void;
  onUpdateCase?: (updatedCase: Case) => void;
  onUpdateClient?: (updatedClient: Client) => void;
  readOnly?: boolean;
}

// Unified Document Interface for View
interface UnifiedDoc {
  id: string;
  uniqueKey: string; // Composite key
  title: string;
  type: string; // pdf, image, etc.
  category: 'legal' | 'admin' | 'evidence' | 'ruling' | 'contract' | 'other';
  categoryLabel: string;
  date: string;
  url?: string;
  sourceType: 'case' | 'client';
  sourceId: string;
  sourceName: string;
  isOriginal?: boolean;
}

const Documents: React.FC<DocumentsProps> = ({ cases, clients, onCaseClick, onClientClick, onUpdateCase, onUpdateClient, readOnly = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'case' | 'client'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // --- Upload Modal State ---
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [useGoogleDrive, setUseGoogleDrive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadData, setUploadData] = useState({
    targetType: 'case' as 'case' | 'client',
    targetId: '',
    name: '',
    type: 'pdf' as string, // For file type (pdf, image, word)
    docType: '' as string, // For specific doc type (contract, poa, etc.)
    isOriginal: false,
    file: null as File | null
  });

  // --- 1. Data Aggregation Engine ---
  const allDocuments = useMemo(() => {
    const docs: UnifiedDoc[] = [];

    // A. Process Client Documents
    clients.forEach(client => {
      // 1. Generic Documents
      client.documents?.forEach(d => {
        let cat: UnifiedDoc['category'] = 'other';
        let label = 'مستندات عامة';
        
        if (['national_id', 'commercial_register', 'tax_card'].includes(d.type)) { cat = 'admin'; label = 'مستندات هوية'; }
        else if (['poa'].includes(d.type)) { cat = 'legal'; label = 'توكيلات'; }
        else if (['contract'].includes(d.type)) { cat = 'contract'; label = 'عقود'; }

        docs.push({
          id: d.id,
          uniqueKey: `client-${client.id}-${d.id}`,
          title: d.name,
          type: 'file',
          category: cat,
          categoryLabel: label,
          date: d.uploadDate,
          url: d.url,
          sourceType: 'client',
          sourceId: client.id,
          sourceName: client.name,
        });
      });

      // 2. Legacy POAs (if any in mock data)
      client.poaFiles?.forEach(p => {
        docs.push({
          id: p.id,
          uniqueKey: `client-poa-${client.id}-${p.id}`,
          title: p.name,
          type: 'pdf',
          category: 'legal',
          categoryLabel: 'توكيلات',
          date: p.uploadDate,
          url: p.url,
          sourceType: 'client',
          sourceId: client.id,
          sourceName: client.name,
        });
      });
    });

    // B. Process Case Documents
    cases.forEach(c => {
      // 1. Standard Case Documents
      c.documents?.forEach(d => {
        let cat: UnifiedDoc['category'] = 'other';
        let label = 'مستندات القضية';

        if (d.category === 'contract') { cat = 'contract'; label = 'عقود'; }
        else if (d.category === 'ruling') { cat = 'ruling'; label = 'أحكام'; }
        else if (d.category === 'notice') { cat = 'legal'; label = 'إعلانات وإنذارات'; }
        else if (d.category === 'minutes') { cat = 'evidence'; label = 'محاضر'; }

        docs.push({
          id: d.id,
          uniqueKey: `case-${c.id}-${d.id}`,
          title: d.name,
          type: d.type,
          category: cat,
          categoryLabel: label,
          date: d.uploadDate,
          url: d.url,
          sourceType: 'case',
          sourceId: c.id,
          sourceName: c.title, // Or client name if preferred
          isOriginal: d.isOriginal
        });
      });

      // 2. Rulings (that have files)
      c.rulings?.forEach(r => {
        if (r.url) {
          docs.push({
            id: r.id,
            uniqueKey: `case-ruling-${c.id}-${r.id}`,
            title: r.documentName || `ملف حكم: ${r.summary.substring(0, 20)}...`,
            type: 'pdf',
            category: 'ruling',
            categoryLabel: 'أحكام قضائية',
            date: r.date,
            url: r.url,
            sourceType: 'case',
            sourceId: c.id,
            sourceName: c.title,
            isOriginal: true
          });
        }
      });
      
      // 3. Memos (that have files)
      c.memos?.forEach(m => {
        if (m.url) {
          docs.push({
            id: m.id,
            uniqueKey: `case-memo-${c.id}-${m.id}`,
            title: `مذكرة: ${m.title}`,
            type: 'pdf',
            category: 'legal',
            categoryLabel: 'مذكرات دفاع',
            date: m.submissionDate,
            url: m.url,
            sourceType: 'case',
            sourceId: c.id,
            sourceName: c.title,
          });
        }
      });
    });

    return docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cases, clients]);

  // --- 2. Filtering Logic ---
  const filteredDocs = allDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.sourceName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
    const matchesSource = sourceFilter === 'all' || doc.sourceType === sourceFilter;
    
    return matchesSearch && matchesCategory && matchesSource;
  });

  // Debug: Log data for mobile debugging
  console.log('📱 Mobile Documents Debug:', {
    totalDocs: allDocuments.length,
    filteredDocs: filteredDocs.length,
    searchTerm,
    activeCategory,
    sourceFilter,
    viewMode,
    sampleDoc: allDocuments[0]
  });

  // --- 3. Categories Config ---
  const categories = [
    { id: 'all', label: 'الكل', icon: FolderOpen, count: allDocuments.length },
    { id: 'legal', label: 'أوراق قانونية', icon: Shield, count: allDocuments.filter(d => d.category === 'legal').length },
    { id: 'ruling', label: 'أحكام', icon: Gavel, count: allDocuments.filter(d => d.category === 'ruling').length },
    { id: 'contract', label: 'عقود واتفاقات', icon: FileText, count: allDocuments.filter(d => d.category === 'contract').length },
    { id: 'admin', label: 'مستندات هوية', icon: User, count: allDocuments.filter(d => d.category === 'admin').length },
    { id: 'evidence', label: 'أدلة ومحاضر', icon: FileCheck, count: allDocuments.filter(d => d.category === 'evidence').length },
  ];

  // --- 4. Render Helpers ---
  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />;
    if (type.includes('image')) return <File className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />;
    if (type.includes('word')) return <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />;
    return <File className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --- 5. Upload Handlers ---
  const handleOpenUpload = () => {
    setUploadData({
      targetType: 'case',
      targetId: '',
      name: '',
      type: 'pdf',
      docType: 'other',
      isOriginal: false,
      file: null
    });
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Auto detect type
      let type = 'other';
      if (file.type.includes('pdf')) type = 'pdf';
      else if (file.type.includes('image')) type = 'image';
      else if (file.type.includes('word') || file.type.includes('document')) type = 'word';

      setUploadData(prev => ({
        ...prev,
        file: file,
        name: prev.name || file.name,
        type: type
      }));
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.name || !uploadData.targetId) return;

    let fileUrl = URL.createObjectURL(uploadData.file);
    
    if (useGoogleDrive) {
      if (!googleDriveService.isSignedIn()) {
        try {
          await googleDriveService.signIn();
        } catch (err: any) {
          alert(err.message || 'فشل تسجيل الدخول إلى Google Drive');
          return;
        }
      }

      setIsUploadingToDrive(true);
      try {
        let folderName = '';
        if (uploadData.targetType === 'case') {
          const targetCase = cases.find(c => c.id === uploadData.targetId);
          folderName = targetCase ? `القضية - ${targetCase.title} - ${targetCase.caseNumber}` : 'القضايا';
        } else {
          const targetClient = clients.find(c => c.id === uploadData.targetId);
          folderName = targetClient ? `الموكل - ${targetClient.name}` : 'الموكلين';
        }
        
        const response = await googleDriveService.uploadFile(uploadData.file, folderName);
        fileUrl = response.webViewLink;
      } catch (err: any) {
        alert('فشل الرفع إلى Google Drive: ' + err.message);
        setIsUploadingToDrive(false);
        return;
      }
      setIsUploadingToDrive(false);
    }

    const date = new Date().toISOString().split('T')[0];
    const size = formatFileSize(uploadData.file.size);

    if (uploadData.targetType === 'case' && onUpdateCase) {
       const targetCase = cases.find(c => c.id === uploadData.targetId);
       if (targetCase) {
          const newDoc: CaseDocument = {
             id: Math.random().toString(36).substring(2, 9),
             name: uploadData.name,
             type: uploadData.type as any,
             category: uploadData.docType as any,
             url: fileUrl,
             size: size,
             uploadDate: date,
             isOriginal: uploadData.isOriginal
          };
          onUpdateCase({ ...targetCase, documents: [...(targetCase.documents || []), newDoc] });
       }
    } else if (uploadData.targetType === 'client' && onUpdateClient) {
       const targetClient = clients.find(c => c.id === uploadData.targetId);
       if (targetClient) {
          const newDoc: ClientDocument = {
             id: Math.random().toString(36).substring(2, 9),
             name: uploadData.name,
             type: uploadData.docType as any,
             url: fileUrl,
             uploadDate: date,
          };
          onUpdateClient({ ...targetClient, documents: [...(targetClient.documents || []), newDoc] });
       }
    }

    setIsUploadModalOpen(false);
    setUseGoogleDrive(false);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-[calc(100vh-140px)] md:h-[calc(100vh-140px)]">
      
      {/* Sidebar Filters */}
      <div className="w-full md:w-64 shrink-0 space-y-4 md:overflow-y-auto md:h-full">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" /> تصنيف المستندات
           </h3>
           <div className="space-y-1">
              {categories.map(cat => (
                 <button
                   key={cat.id}
                   onClick={() => setActiveCategory(cat.id)}
                   className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
                     activeCategory === cat.id 
                       ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-bold' 
                       : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                   }`}
                 >
                    <div className="flex items-center gap-3">
                       <cat.icon className={`w-4 h-4 ${activeCategory === cat.id ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`} />
                       <span>{cat.label}</span>
                    </div>
                    <span className="bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-300 text-xs px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-600">
                       {cat.count}
                    </span>
                 </button>
              ))}
           </div>
        </div>

        {/* Source Filter */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
           <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm">حسب المصدر</h3>
           <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                 <input type="radio" name="source" checked={sourceFilter === 'all'} onChange={() => setSourceFilter('all')} className="text-primary-600 dark:text-primary-400" />
                 <span>جميع المصادر</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                 <input type="radio" name="source" checked={sourceFilter === 'client'} onChange={() => setSourceFilter('client')} className="text-primary-600 dark:text-primary-400" />
                 <span>العملاء فقط</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                 <input type="radio" name="source" checked={sourceFilter === 'case'} onChange={() => setSourceFilter('case')} className="text-primary-600 dark:text-primary-400" />
                 <span>القضايا فقط</span>
              </label>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[500px] md:h-full">
         {/* Top Bar - Fixed */}
         <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-slate-50 dark:bg-slate-800 shrink-0">
            <div className="relative w-full sm:w-96">
               <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
               <input 
                 type="text" 
                 placeholder="بحث باسم المستند، الموكل، أو القضية..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pr-10 pl-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-primary-500 text-slate-900 dark:text-white text-sm"
               />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <div className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg flex overflow-hidden">
                  <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-slate-100 dark:bg-slate-600 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                     <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <div className="w-px bg-slate-300 dark:bg-slate-600"></div>
                  <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-slate-100 dark:bg-slate-600 text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                     <List className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
               </div>
               
               <button 
                  onClick={handleOpenUpload}
                  className="flex items-center gap-2 bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-700 shadow-sm transition-colors" 
                  title="رفع مستند جديد"
               >
                  <Upload className="w-4 h-4" /> 
                  <span className="hidden sm:inline">رفع جديد</span>
                  <span className="sm:hidden">رفع</span>
               </button>
            </div>
         </div>

         {/* Content Area - Scrollable */}
         <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 bg-slate-50/50 dark:bg-slate-900/50 min-h-[400px]">
            {filteredDocs.length > 0 ? (
               viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                     {filteredDocs.map(doc => (
                        <div key={doc.uniqueKey} className="group bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all relative flex flex-col h-full min-h-[250px] sm:min-h-[280px] md:min-h-[320px]">
                           {doc.isOriginal && (
                              <div className="absolute top-2 left-2 text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-bold z-10">
                                 أصل
                              </div>
                           )}
                           
                           <div className="flex items-start gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
                              <div className="bg-slate-50 dark:bg-slate-700 p-2 sm:p-3 md:p-4 rounded-lg group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors flex-shrink-0">
                                 {getFileIcon(doc.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm md:text-base truncate mb-1 sm:mb-2" title={doc.title}>
                                    {doc.title}
                                 </h4>
                                 <span className="text-[10px] sm:text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded inline-block truncate max-w-full">
                                    {doc.categoryLabel}
                                 </span>
                              </div>
                           </div>

                           <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 space-y-1 sm:space-y-2 mb-2 sm:mb-3 md:mb-4 pt-2 sm:pt-3 border-t border-slate-50 dark:border-slate-700 flex-grow">
                              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 truncate">
                                 {doc.sourceType === 'case' ? <Briefcase className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-indigo-500 flex-shrink-0" /> : <User className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-green-500 flex-shrink-0" />}
                                 <span 
                                    className="cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 hover:underline truncate text-xs sm:text-xs md:text-sm"
                                    onClick={() => doc.sourceType === 'case' ? onCaseClick && onCaseClick(doc.sourceId) : onClientClick && onClientClick(doc.sourceId)}
                                 >
                                    {doc.sourceName}
                                 </span>
                              </div>
                              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2">
                                 <Calendar className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4 text-slate-400 flex-shrink-0" />
                                 <span className="truncate text-xs sm:text-xs md:text-sm">{doc.date}</span>
                              </div>
                           </div>

                           <div className="flex gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0 mt-auto">
                              {doc.url && (
                                 <a 
                                    href={doc.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs sm:text-xs md:text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                 >
                                    <Eye className="w-3 h-3 sm:w-3 sm:h-3 md:w-4 md:h-4" /> 
                                    <span className="hidden sm:inline">معاينة</span>
                                    <span className="sm:hidden">عرض</span>
                                 </a>
                              )}
                              {/* Placeholder for actions like Delete/Edit (would require more prop plumbing) */}
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                     <table className="w-full text-right text-xs sm:text-sm min-w-[500px] sm:min-w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                           <tr>
                              <th className="p-2 sm:p-3 text-right min-w-[120px]">المستند</th>
                              <th className="p-2 sm:p-3 text-right hidden sm:table-cell min-w-[80px]">النوع</th>
                              <th className="p-2 sm:p-3 text-right hidden md:table-cell min-w-[100px]">المصدر</th>
                              <th className="p-2 sm:p-3 text-right min-w-[80px]">التاريخ</th>
                              <th className="p-2 sm:p-3 text-right min-w-[80px]">الإجراءات</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                           {filteredDocs.map(doc => (
                              <tr key={doc.uniqueKey} className="hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200">
                                 <td className="p-2 sm:p-3">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                       {getFileIcon(doc.type)}
                                       <div className="min-w-0 flex-1">
                                          <p className="font-bold text-xs sm:text-sm truncate">{doc.title}</p>
                                          <div className="flex flex-col sm:hidden text-xs text-slate-400 mt-1">
                                             <div>النوع: {doc.categoryLabel}</div>
                                             <div>المصدر: {doc.sourceName}</div>
                                             {doc.isOriginal && <div className="text-amber-600 dark:text-amber-400 font-bold">نسخة أصلية</div>}
                                          </div>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="p-2 sm:p-3 hidden sm:table-cell">
                                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{doc.categoryLabel}</span>
                                 </td>
                                 <td className="p-2 sm:p-3 hidden md:table-cell">
                                     <div className="flex items-center gap-2">
                                       {doc.sourceType === 'case' ? <Briefcase className="w-3 h-3 text-indigo-500" /> : <User className="w-3 h-3 text-green-500" />}
                                       <span 
                                          className="cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 hover:underline font-medium truncate"
                                          onClick={() => doc.sourceType === 'case' ? onCaseClick && onCaseClick(doc.sourceId) : onClientClick && onClientClick(doc.sourceId)}
                                       >
                                          {doc.sourceName}
                                       </span>
                                    </div>
                                 </td>
                                 <td className="p-2 sm:p-3 font-mono text-slate-500 dark:text-slate-400 text-xs">{doc.date}</td>
                                 <td className="p-2 sm:p-3">
                                    {doc.url && (
                                       <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                                          <ExternalLink className="w-3 h-3" /> فتح
                                       </a>
                                    )}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )
            ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8">
                  <FolderOpen className="w-16 h-16 sm:w-20 sm:h-20 opacity-20 mb-4" />
                  <p className="text-base sm:text-lg font-medium mb-2">
                    {allDocuments.length === 0 ? 'لا توجد مستندات حالياً' : 'لا توجد مستندات تطابق البحث'}
                  </p>
                  <p className="text-sm text-center">
                    {allDocuments.length === 0 
                      ? 'ابدأ بإضافة مستندات جديدة من خلال زر "رفع جديد"' 
                      : 'جرب تغيير الفلاتر أو البحث بكلمات أخرى'
                    }
                  </p>
                  {allDocuments.length > 0 && (
                    <button 
                      onClick={() => {
                        setSearchTerm('');
                        setActiveCategory('all');
                        setSourceFilter('all');
                      }}
                      className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors"
                    >
                      إعادة تعيين الفلاتر
                    </button>
                  )}
               </div>
            )}
         </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
               <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">رفع مستند جديد</h3>
                  <button onClick={() => setIsUploadModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
               </div>
               
               <form onSubmit={handleSaveDocument} className="p-6 space-y-4">
                  {/* Target Selection */}
                  <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                     <button
                        type="button"
                        onClick={() => { setUploadData({ ...uploadData, targetType: 'case', targetId: '', docType: 'contract' }); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${uploadData.targetType === 'case' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                     >
                        <Briefcase className="w-4 h-4 inline-block ml-2" /> خاص بقضية
                     </button>
                     <button
                        type="button"
                        onClick={() => { setUploadData({ ...uploadData, targetType: 'client', targetId: '', docType: 'national_id' }); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${uploadData.targetType === 'client' ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                     >
                        <User className="w-4 h-4 inline-block ml-2" /> خاص بموكل
                     </button>
                  </div>

                  {/* Google Drive Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">رفع إلى Google Drive</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">سيتم حفظ الملف في سحابة جوجل</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUseGoogleDrive(!useGoogleDrive)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${useGoogleDrive ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${useGoogleDrive ? 'right-1' : 'right-7'}`}></div>
                    </button>
                  </div>

                  {useGoogleDrive && !googleDriveService.isSignedIn() && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await googleDriveService.signIn();
                        } catch (err: any) {
                          alert(err.message || 'فشل تسجيل الدخول إلى Google Drive');
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <LogIn className="w-4 h-4" />
                      تسجيل الدخول إلى Google Drive
                    </button>
                  )}

                  {/* Target Dropdown */}
                  <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {uploadData.targetType === 'case' ? 'اختر القضية' : 'اختر الموكل'} <span className="text-red-500">*</span>
                     </label>
                     <select
                        required
                        className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                        value={uploadData.targetId}
                        onChange={e => setUploadData({ ...uploadData, targetId: e.target.value })}
                     >
                        <option value="">-- اختر --</option>
                        {uploadData.targetType === 'case' 
                           ? cases.map(c => <option key={c.id} value={c.id}>{c.title} - {c.caseNumber}</option>)
                           : clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                        }
                     </select>
                  </div>

                  {/* File Upload Area */}
                  <div 
                     onClick={() => fileInputRef.current?.click()}
                     className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${uploadData.file ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                     <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                     {uploadData.file ? (
                        <div className="flex flex-col items-center gap-2">
                           <FileCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                           <p className="text-sm font-bold text-slate-800 dark:text-white">{uploadData.file.name}</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">{formatFileSize(uploadData.file.size)}</p>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                           <Upload className="w-8 h-8 opacity-50" />
                           <p className="text-sm font-medium">اضغط لاختيار ملف من جهازك</p>
                           <p className="text-xs">PDF, Word, Images</p>
                        </div>
                     )}
                  </div>

                  {/* Document Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">اسم المستند</label>
                        <input 
                           type="text" 
                           required
                           className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                           value={uploadData.name}
                           onChange={e => setUploadData({ ...uploadData, name: e.target.value })}
                           placeholder="مثال: عقد بيع ابتدائي"
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">التصنيف</label>
                        <select
                           className="w-full border border-slate-300 dark:border-slate-600 p-2 rounded-lg bg-white dark:bg-slate-700 dark:text-white"
                           value={uploadData.docType}
                           onChange={e => setUploadData({ ...uploadData, docType: e.target.value })}
                        >
                           {uploadData.targetType === 'case' ? (
                              <>
                                 <option value="contract">عقد</option>
                                 <option value="ruling">حكم</option>
                                 <option value="notice">إعلان/إنذار</option>
                                 <option value="minutes">محضر</option>
                                 <option value="other">عام</option>
                              </>
                           ) : (
                              <>
                                 <option value="national_id">بطاقة هوية</option>
                                 <option value="poa">توكيل</option>
                                 <option value="commercial_register">سجل تجاري</option>
                                 <option value="contract">عقد</option>
                                 <option value="other">أخرى</option>
                              </>
                           )}
                        </select>
                     </div>
                  </div>

                  {uploadData.targetType === 'case' && (
                     <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer p-2 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <input type="checkbox" checked={uploadData.isOriginal} onChange={e => setUploadData({ ...uploadData, isOriginal: e.target.checked })} className="rounded text-primary-600 focus:ring-primary-500" />
                        نسخة أصلية
                     </label>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-2 flex gap-3">
                     <button type="button" onClick={() => setIsUploadModalOpen(false)} className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold">إلغاء</button>
                     <button 
                        type="submit" 
                        disabled={!uploadData.file || !uploadData.name || !uploadData.targetId} 
                        className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                     >
                        <Check className="w-4 h-4" /> حفظ المستند
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Documents;
