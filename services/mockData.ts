
import { Case, Client, Hearing, Task, ActivityLog, AppUser, CaseStatus, HearingStatus, ClientType, ClientStatus, LegalReference, Lawyer, Role, CaseStageType } from '../types';

export const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    firmId: '1',
    name: 'أحمد محمد علي',
    type: ClientType.INDIVIDUAL,
    status: ClientStatus.ACTIVE,
    nationalId: '29001011234567',
    phone: '01012345678',
    address: '15 شارع التحرير، الدقي',
    poaExpiry: '2024-12-31',
  },
  {
    id: '2',
    firmId: '1',
    name: 'شركة النور للمقاولات',
    type: ClientType.COMPANY,
    status: ClientStatus.ACTIVE,
    nationalId: '123456', // Commercial Register
    phone: '01123456789',
    companyRepresentative: 'م. محمود حسن',
    address: 'التجمع الخامس',
  }
];

export const MOCK_LAWYERS: Lawyer[] = [
  {
    id: '1',
    firmId: '1',
    name: 'أحمد محمد علي',
    phone: '01012345678',
    whatsapp: '01012345678',
    email: 'ahmed.ali@law.com',
    governorate: 'القاهرة',
    office: 'المكتب الرئيسي',
    barLevel: 'appeal',
    salary: 15000,
    specialization: 'جنائي',
    joinDate: '2020-01-15',
    status: 'active',
    notes: 'متخصص في قضايا الجنايات الكبرى'
  },
  {
    id: '2',
    firmId: '1',
    name: 'سارة محمود حسن',
    phone: '01123456789',
    whatsapp: '01123456789',
    email: 'sara.hassan@law.com',
    governorate: 'الجيزة',
    office: 'فرع الدقي',
    barLevel: 'primary',
    salary: 8000,
    specialization: 'أسرة',
    joinDate: '2022-03-01',
    status: 'active',
    notes: 'خبرة ممتازة في قضايا الأحوال الشخصية'
  },
  {
    id: '3',
    firmId: '1',
    name: 'خالد إبراهيم يوسف',
    phone: '01234567890',
    whatsapp: '01234567890',
    email: 'khaled.youssef@law.com',
    governorate: 'الإسكندرية',
    office: 'فرع سموحة',
    barLevel: 'cassation',
    salary: 25000,
    specialization: 'مدني وتجاري',
    joinDate: '2015-06-10',
    status: 'active',
    notes: 'مستشار قانوني أول'
  }
];

export const MOCK_CASES: Case[] = [
  {
    id: '101',
    firmId: '1',
    title: 'دعوى صحة توقيع',
    caseNumber: '5678',
    year: 2023,
    court: 'محكمة جنوب القاهرة',
    courtBranch: 'محكمة جنوب القاهرة الابتدائية',
    circle: 'الدائرة 5 مدني',
    judgeName: 'المستشار/ محمد حسين',
    stage: 'primary',
    status: CaseStatus.OPEN,
    clientId: '1',
    clientName: 'أحمد محمد علي',
    clientRole: 'مدعي',
    finance: {
      agreedFees: 5000,
      paidAmount: 2000,
      expenses: 500,
      history: [
        { id: 't1', date: '2023-01-01', amount: 2000, type: 'payment', method: 'cash', recordedBy: 'Admin' },
        { id: 't2', date: '2023-01-15', amount: 500, type: 'expense', category: 'رسوم', description: 'رسم دعوى', recordedBy: 'Admin' }
      ]
    },
    stages: [
      {
        type: CaseStageType.POLICE_REPORT,
        status: 'completed',
        date: '2023-01-01',
        referenceNumber: '123/2023 إداري',
        location: 'قسم شرطة الدقي',
        notes: 'تم تحرير المحضر وإثبات الحالة'
      },
      {
        type: CaseStageType.PROSECUTION,
        status: 'completed',
        date: '2023-01-05',
        referenceNumber: '456/2023 نيابة',
        location: 'نيابة الدقي الجزئية',
        notes: 'تم الاستماع للأقوال وإحالة القضية للمحكمة'
      },
      {
        type: CaseStageType.COURT_FILING,
        status: 'completed',
        date: '2023-01-15',
        referenceNumber: '5678/2023 مدني',
        location: 'محكمة جنوب القاهرة',
        notes: 'تم قيد الدعوى وتحديد جلسة'
      },
      {
        type: CaseStageType.TRIAL,
        status: 'in_progress',
        date: '2023-02-01',
        notes: 'تم تأجيل الجلسة للإعلان'
      },
      {
        type: CaseStageType.JUDGMENT,
        status: 'pending'
      },
      {
        type: CaseStageType.APPEAL,
        status: 'pending'
      },
      {
        type: CaseStageType.CASSATION,
        status: 'pending'
      },
      {
        type: CaseStageType.ENFORCEMENT,
        status: 'pending'
      }
    ],
    strategy: {
      strengthPoints: 'وجود عقد أصلي وتوكيل ساري',
      weaknessPoints: 'تأخر في رفع الدعوى',
      plan: 'التركيز على صحة التوقيع فقط دون التطرق للموضوع'
    },
    assignedLawyerId: 'u1',
    caseType: 'civil',
    filingDate: '2023-01-10'
  },
  {
    id: '102',
    title: 'جنحة شيك بدون رصيد',
    caseNumber: '9900',
    year: 2024,
    court: 'جنح الدقي',
    stage: 'primary',
    status: CaseStatus.OPEN,
    clientId: '2',
    clientName: 'شركة النور للمقاولات',
    clientRole: 'مجني عليه',
    finance: {
      agreedFees: 15000,
      paidAmount: 15000,
      expenses: 1200,
      history: []
    },
    assignedLawyerId: 'u1',
    caseType: 'criminal',
    filingDate: '2024-02-15'
  }
];

export const MOCK_HEARINGS: Hearing[] = [
  {
    id: 'h1',
    firmId: '1',
    caseId: '101',
    date: new Date().toISOString().split('T')[0], // Today
    time: '09:00',
    type: 'session',
    status: HearingStatus.SCHEDULED,
    requirements: 'تقديم أصل العقد'
  },
  {
    id: 'h2',
    firmId: '1',
    caseId: '102',
    date: '2023-11-20',
    time: '10:00',
    type: 'session',
    status: HearingStatus.COMPLETED,
    decision: 'تأجيل للإعلان',
    isCompleted: true
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    firmId: '1',
    title: 'كتابة مذكرة دفاع للقضية 5678',
    dueDate: '2023-10-25',
    priority: 'high',
    status: 'pending',
    relatedCaseId: '101'
  }
];

export const MOCK_ACTIVITIES: ActivityLog[] = [
  {
    id: 'a1',
    firmId: '1',
    user: 'محمد المحامي',
    action: 'إضافة جلسة',
    target: 'دعوى صحة توقيع',
    timestamp: new Date().toISOString()
  }
];

export const MOCK_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'مدير النظام',
    description: 'صلاحيات كاملة للوصول لجميع أقسام النظام',
    isSystem: true,
    permissions: [
      { moduleId: 'dashboard', access: 'write' },
      { moduleId: 'cases', access: 'write' },
      { moduleId: 'clients', access: 'write' },
      { moduleId: 'lawyers', access: 'write' },
      { moduleId: 'hearings', access: 'write' },
      { moduleId: 'tasks', access: 'write' },
      { moduleId: 'documents', access: 'write' },
      { moduleId: 'archive', access: 'write' },
      { moduleId: 'fees', access: 'write' },
      { moduleId: 'expenses', access: 'write' },
      { moduleId: 'reports', access: 'write' },
      { moduleId: 'settings', access: 'write' },
      { moduleId: 'ai-assistant', access: 'write' },
      { moduleId: 'references', access: 'write' },
      { moduleId: 'generator', access: 'write' },
      { moduleId: 'locations', access: 'write' },
      { moduleId: 'calculators', access: 'write' }
    ]
  },
  {
    id: 'lawyer',
    name: 'محامي',
    description: 'صلاحيات لإدارة القضايا والجلسات والموكلين',
    isSystem: false,
    permissions: [
      { moduleId: 'dashboard', access: 'read' },
      { moduleId: 'cases', access: 'write' },
      { moduleId: 'clients', access: 'write' },
      { moduleId: 'lawyers', access: 'read' },
      { moduleId: 'hearings', access: 'write' },
      { moduleId: 'tasks', access: 'write' },
      { moduleId: 'documents', access: 'write' },
      { moduleId: 'archive', access: 'read' },
      { moduleId: 'fees', access: 'read' },
      { moduleId: 'expenses', access: 'write' },
      { moduleId: 'reports', access: 'read' },
      { moduleId: 'settings', access: 'none' },
      { moduleId: 'ai-assistant', access: 'write' },
      { moduleId: 'references', access: 'read' },
      { moduleId: 'generator', access: 'write' },
      { moduleId: 'locations', access: 'read' },
      { moduleId: 'calculators', access: 'write' }
    ]
  },
  {
    id: 'secretary',
    name: 'سكرتارية',
    description: 'صلاحيات محدودة لإدخال البيانات والمواعيد',
    isSystem: false,
    permissions: [
      { moduleId: 'dashboard', access: 'read' },
      { moduleId: 'cases', access: 'read' },
      { moduleId: 'clients', access: 'write' },
      { moduleId: 'lawyers', access: 'none' },
      { moduleId: 'hearings', access: 'write' },
      { moduleId: 'tasks', access: 'write' },
      { moduleId: 'documents', access: 'write' },
      { moduleId: 'archive', access: 'write' },
      { moduleId: 'fees', access: 'none' },
      { moduleId: 'expenses', access: 'write' },
      { moduleId: 'reports', access: 'none' },
      { moduleId: 'settings', access: 'none' },
      { moduleId: 'ai-assistant', access: 'none' },
      { moduleId: 'references', access: 'none' },
      { moduleId: 'generator', access: 'read' },
      { moduleId: 'locations', access: 'read' },
      { moduleId: 'calculators', access: 'none' }
    ]
  }
];

export const MOCK_USERS: AppUser[] = [
  {
    id: 'u1',
    firmId: '1',
    name: 'أستاذ أحمد',
    email: 'admin@law.com',
    username: 'admin',
    password: 'admin',
    roleLabel: 'مدير النظام',
    roleId: 'admin',
    isActive: true,
    permissions: [
      { moduleId: 'dashboard', access: 'write' },
      { moduleId: 'cases', access: 'write' },
      { moduleId: 'clients', access: 'write' },
      { moduleId: 'lawyers', access: 'write' }, // Added lawyers permission
      { moduleId: 'hearings', access: 'write' },
      { moduleId: 'tasks', access: 'write' }, // Added tasks permission
      { moduleId: 'documents', access: 'write' },
      { moduleId: 'archive', access: 'write' }, // Added archive permission
      { moduleId: 'fees', access: 'write' },
      { moduleId: 'expenses', access: 'write' },
      { moduleId: 'reports', access: 'write' },
      { moduleId: 'settings', access: 'write' },
      { moduleId: 'ai-assistant', access: 'write' },
      { moduleId: 'references', access: 'write' },
      { moduleId: 'generator', access: 'write' },
      { moduleId: 'locations', access: 'write' },
      { moduleId: 'calculators', access: 'write' }
    ]
  }
];

export const MOCK_REFERENCES: LegalReference[] = [
  {
    id: 'ref1',
    title: 'القانون المدني المصري',
    type: 'law',
    branch: 'civil',
    description: 'النص الكامل للقانون المدني رقم 131 لسنة 1948',
    year: 1948,
    tags: ['عقود', 'التزامات', 'ملكية']
  },
  {
    id: 'ref2',
    title: 'حكم نقض في بطلان القبض',
    type: 'ruling',
    branch: 'criminal',
    description: 'مبدأ هام: بطلان القبض والتفتيش لانتفاء حالة التلبس وما يترتب عليه من أدلة',
    courtName: 'محكمة النقض',
    year: 2020,
    tags: ['جنائي', 'تلبس', 'إجراءات']
  }
];
