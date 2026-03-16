import React, { useState, useRef } from 'react';
import { Lawyer, Case, BarLevelLabels, ClientDocument } from '../types';
import { googleDriveService } from '../src/services/googleDriveService';
import { 
  User, Phone, Mail, MapPin, Briefcase, Award, DollarSign, Calendar, 
  ArrowRight, FileText, CheckCircle, Clock, AlertCircle, Plus, Upload, X, FileCheck, File, Cloud, LogIn, Eye, Trash2
} from 'lucide-react';

interface LawyerDetailsProps {
  lawyerId: string;
  lawyers: Lawyer[];
  cases: Case[];
  onBack: () => void;
  onUpdateLawyer: (lawyer: Lawyer) => void;
}

const LawyerDetails: React.FC<LawyerDetailsProps> = ({ 
  lawyerId, lawyers, cases, onBack, onUpdateLawyer 
}) => {
  const lawyer = lawyers.find(l => l.id === lawyerId);
  
  // Doc Upload State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [useGoogleDrive, setUseGoogleDrive] = useState(false);
  const [newDocData, setNewDocData] = useState<Partial<ClientDocument>>({ type: 'other', name: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!lawyer) return <div>Lawyer not found</div>;

  const assignedCases = cases.filter(c => c.assignedLawyerId === lawyer.id);
  const activeCasesCount = assignedCases.filter(c => c.status !== 'مغلقة').length;
  const closedCasesCount = assignedCases.filter(c => c.status === 'مغلقة').length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       setSelectedFile(e.target.files[0]);
       if (!newDocData.name) setNewDocData({ ...newDocData, name: e.target.files[0].name });
    }
  };

  const handleSaveDocument = async () => {
    if (onUpdateLawyer && selectedFile && newDocData.name) {
       let fileUrl = URL.createObjectURL(selectedFile);
       
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
           const folderName = `المحامي - ${lawyer.name}`;
           const response = await googleDriveService.uploadFile(selectedFile, folderName);
           fileUrl = response.webViewLink;
         } catch (err: any) {
           alert('فشل الرفع إلى Google Drive: ' + err.message);
           setIsUploadingToDrive(false);
           return;
         }
         setIsUploadingToDrive(false);
       }

       const newDoc: ClientDocument = {
          id: Math.random().toString(36).substring(2, 9),
          type: newDocData.type as any,
          name: newDocData.name,
          url: fileUrl,
          uploadDate: new Date().toISOString().split('T')[0],
          notes: newDocData.notes
       };

       onUpdateLawyer({ ...lawyer, documents: [...(lawyer.documents || []), newDoc] });
       setIsDocModalOpen(false);
       setNewDocData({ type: 'other', name: '' });
       setSelectedFile(null);
       setUseGoogleDrive(false);
    }
  };

  const handleDeleteDocument = (docId: string) => {
    if (onUpdateLawyer) {
      onUpdateLawyer({
        ...lawyer,
        documents: lawyer.documents?.filter(d => d.id !== docId)
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        >
          <ArrowRight className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{lawyer.name}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${lawyer.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`}></span>
            {lawyer.status === 'active' ? 'نشط' : 'غير نشط'} • {BarLevelLabels[lawyer.barLevel]}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-3xl mb-4">
                {lawyer.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{lawyer.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{lawyer.specialization}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Phone className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">رقم الهاتف</p>
                  <p className="font-bold text-slate-800 dark:text-white">{lawyer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <Mail className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">البريد الإلكتروني</p>
                  <p className="font-bold text-slate-800 dark:text-white">{lawyer.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <MapPin className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">الموقع</p>
                  <p className="font-bold text-slate-800 dark:text-white">{lawyer.governorate} - {lawyer.office}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <DollarSign className="w-5 h-5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">الراتب الشهري</p>
                  <p className="font-bold text-slate-800 dark:text-white">{lawyer.salary.toLocaleString()} EGP</p>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> المستندات
              </h3>
              <button 
                onClick={() => setIsDocModalOpen(true)}
                className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {lawyer.documents && lawyer.documents.length > 0 ? (
                lawyer.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl group border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                        <File className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1">{doc.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{doc.uploadDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      <button 
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl">
                  <FileText className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">لا توجد مستندات</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats & Cases */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي القضايا</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{assignedCases.length}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">قضايا نشطة</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{activeCasesCount}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 rounded-full">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">قضايا مغلقة</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white">{closedCasesCount}</p>
              </div>
            </div>
          </div>

          {/* Assigned Cases List */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-slate-500" /> القضايا المسندة
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {assignedCases.length > 0 ? assignedCases.map(c => (
                <div key={c.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{c.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{c.caseNumber} • {c.court}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    c.status === 'مغلقة' ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' : 
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {c.status}
                  </span>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-400">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">لا توجد قضايا مسندة حالياً</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Doc Modal */}
      {isDocModalOpen && (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
               <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white">إضافة مستند جديد</h3>
               <div className="space-y-3">
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

                  <select value={newDocData.type} onChange={e => setNewDocData({...newDocData, type: e.target.value as any})} className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                     <option value="national_id">بطاقة رقم قومي</option>
                     <option value="contract">عقد</option>
                     <option value="other">أخرى</option>
                  </select>
                  
                  <input 
                    type="text" 
                    placeholder="اسم المستند" 
                    className="w-full border p-2 rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    value={newDocData.name}
                    onChange={e => setNewDocData({...newDocData, name: e.target.value})}
                  />

                  <div 
                     onClick={() => fileInputRef.current?.click()}
                     className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${selectedFile ? 'border-indigo-300 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                     <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                     {selectedFile ? (
                        <div className="flex flex-col items-center gap-2">
                           <FileCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                           <p className="text-sm font-bold text-slate-800 dark:text-white">{selectedFile.name}</p>
                        </div>
                     ) : (
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                           <Upload className="w-8 h-8 opacity-50" />
                           <p className="text-sm font-medium">اضغط لاختيار ملف</p>
                        </div>
                     )}
                  </div>

                  <div className="flex gap-2 pt-2">
                     <button 
                        onClick={() => {
                          setIsDocModalOpen(false);
                          setSelectedFile(null);
                          setNewDocData({ type: 'other', name: '' });
                        }} 
                        className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 p-2 rounded-lg"
                        disabled={isUploadingToDrive}
                     >
                        إلغاء
                     </button>
                     <button 
                        onClick={handleSaveDocument} 
                        className="flex-1 bg-indigo-600 text-white p-2 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                        disabled={!selectedFile || !newDocData.name || isUploadingToDrive}
                     >
                        {isUploadingToDrive ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            جاري الرفع...
                          </>
                        ) : (
                          'حفظ'
                        )}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default LawyerDetails;
