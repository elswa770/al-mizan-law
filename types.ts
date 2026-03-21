
export enum CaseStatus {
  OPEN = 'مفتوحة',
  CLOSED = 'مغلقة',
  ARCHIVED = 'مؤرشفة',
  JUDGMENT = 'حكم نهائي',
  EXECUTION = 'قيد التنفيذ'
}

export enum HearingStatus {
  SCHEDULED = 'محددة',
  COMPLETED = 'تمت',
  POSTPONED = 'مؤجلة',
  CANCELLED = 'ملغاة',
  RESERVED_FOR_JUDGMENT = 'حجز للحكم'
}

export enum ClientType {
  INDIVIDUAL = 'فرد',
  COMPANY = 'شركة'
}

export enum ClientStatus {
  ACTIVE = 'نشط',
  INACTIVE = 'غير نشط'
}

export enum CourtType {
  FAMILY = 'أسرة',
  CRIMINAL = 'جنايات',
  MISDEMEANOR = 'جنح',
  CIVIL = 'مدني',
  ADMINISTRATIVE = 'مجلس دولة',
  ECONOMIC = 'اقتصادية',
  LABOR = 'عمالي'
}

export enum ArchiveLocationType {
  ROOM = 'room',
  CABINET = 'cabinet',
  SHELF = 'shelf',
  BOX = 'box'
}

export enum ArchiveStatus {
  DIGITAL = 'رقمي',
  PHYSICAL = 'فيزيائي',
  BOTH = 'رقمي وفيزيائي'
}

// Employee related enums
export enum EmployeeRole {
  ADMIN = 'admin',
  LAWYER = 'lawyer',
  ASSISTANT = 'assistant',
  ACCOUNTANT = 'accountant',
  RECEPTIONIST = 'receptionist',
  PARALEGAL = 'paralegal'
}

export enum EmployeeStatus {
  ACTIVE = 'نشط',
  INACTIVE = 'غير نشط',
  ON_LEAVE = 'في إجازة',
  TERMINATED = 'منتهي الخدمة'
}

export enum EmployeeDepartment {
  LEGAL = 'قانوني',
  ADMINISTRATION = 'إدارة',
  ACCOUNTING = 'محاسبة',
  RECEPTION = 'استقبال'
}

export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  ADMIN = 'admin'
}

export enum ArchiveRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned',
  ARCHIVED_RETURNED = 'archived_returned'
}

export type SimplePermissionLevel = 'none' | 'read' | 'write';
export type PaymentMethod = 'cash' | 'check' | 'instapay' | 'wallet' | 'bank_transfer';
export type ReferenceType = 'law' | 'ruling' | 'encyclopedia' | 'regulation';
export type LawBranch = 'civil' | 'criminal' | 'administrative' | 'commercial' | 'family' | 'labor' | 'other';

export interface Permission {
  moduleId: string;
  access: SimplePermissionLevel;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billingCycle: 'daily' | 'monthly' | 'yearly';
  features: string[];
  maxUsers: number;
  maxCases: number;
  maxClients: number;
  maxLawyers: number;
  maxStorageGB: number;
  isActive: boolean;
  sortOrder?: number; // New field for admin-defined ordering
}

export interface Firm {
  id: string;
  name: string;
  logo?: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  subscriptionPlan: string;
  subscriptionEndDate?: string;
  billingCycle?: 'monthly' | 'yearly'; // Billing cycle for the subscription
  trialStartDate?: string;
  trialEndDate?: string;
  hasUsedTrial?: boolean; // Track if trial has been used before
  createdAt: string;
  email?: string; // Firm email
  ownerId?: string; // Owner ID
  isActive?: boolean; // Active status
  updatedAt?: string; // Last update timestamp
}

export interface AppUser {
  id: string;
  firmId: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  roleLabel: string;
  roleId?: string; // Added
  isActive: boolean;
  permissions: Permission[];
  avatar?: string;
  lastLogin?: string;
  // Subscription fields
  subscriptionStatus?: 'active' | 'inactive' | 'trial';
  subscriptionPlan?: string | null;
  trialStartDate?: string;
  trialEndDate?: string;
  hasUsedTrial?: boolean;
  subscriptionEndDate?: string;
}

export interface ClientDocument {
  id: string;
  type: 'national_id' | 'poa' | 'commercial_register' | 'contract' | 'other';
  name: string;
  url: string;
  uploadDate: string;
  expiryDate?: string;
  issueDate?: string;
  notes?: string;
}

export interface POAFile extends ClientDocument {}

export interface Client {
  id: string;
  firmId: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  nationalId: string;
  phone: string;
  secondaryPhone?: string;
  address?: string;
  email?: string;
  notes?: string;
  nationality?: string;
  dateOfBirth?: string;
  companyRepresentative?: string;
  documents?: ClientDocument[];
  poaFiles?: POAFile[];
  poaExpiry?: string;
}

export interface Opponent {
  name: string;
  role: string;
  lawyer?: string;
  phone?: string;
}

export interface CaseDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'word' | 'other';
  category: 'contract' | 'ruling' | 'notice' | 'minutes' | 'other';
  url: string;
  size?: string;
  uploadDate: string;
  isOriginal?: boolean;
}

export interface CaseRuling {
  id: string;
  date: string;
  summary: string;
  documentName?: string;
  url?: string;
}

export interface CaseMemo {
  id: string;
  title: string;
  type: 'defense' | 'appeal' | 'other';
  submissionDate: string;
  url?: string;
}

export interface DailyNote {
  id: string;
  date: string;
  content: string;
  author: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'payment' | 'expense';
  method?: PaymentMethod;
  category?: string;
  description?: string;
  recordedBy: string;
}

export interface CaseFinance {
  agreedFees: number;
  paidAmount: number;
  expenses: number;
  history: FinancialTransaction[];
}

export interface CaseStrategy {
  strengthPoints?: string;
  weaknessPoints?: string;
  plan?: string;
  privateNotes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export enum CaseStageType {
  POLICE_REPORT = 'محضر الشرطة',
  PROSECUTION = 'النيابة العامة',
  COURT_FILING = 'رفع الدعوى',
  TRIAL = 'تداول الدعوى',
  JUDGMENT = 'الحكم الابتدائي',
  APPEAL = 'الاستئناف',
  CASSATION = 'النقض',
  ENFORCEMENT = 'تنفيذ الحكم'
}

export interface CaseStage {
  type: CaseStageType;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  date?: string;
  notes?: string;
  location?: string;
  referenceNumber?: string;
  officer?: string;
  details?: string;
}

export interface Case {
  id: string;
  firmId: string;
  title: string;
  caseNumber: string;
  year: number;
  court: string;
  courtBranch?: string;
  circle?: string;
  judgeName?: string;
  stage?: 'primary' | 'appeal' | 'cassation';
  status: CaseStatus;
  clientId: string;
  clientName: string;
  clientRole?: string;
  opponents?: Opponent[];
  documents?: CaseDocument[];
  rulings?: CaseRuling[];
  memos?: CaseMemo[];
  notes?: DailyNote[];
  finance?: CaseFinance;
  strategy?: CaseStrategy;
  aiChatHistory?: ChatMessage[];
  description?: string;
  startDate?: string;
  
  // New Fields
  assignedLawyerId?: string;
  caseType?: LawBranch; // Using LawBranch as Case Type
  filingDate?: string;
  
  // Case Stages Tracking
  stages?: CaseStage[];

  // Archive Data
  archiveData?: {
    boxNumber: string;
    shelfLocation: string;
    archivedBy: string;
    archivedAt: string;
    physicalStatus: 'in_archive' | 'checked_out';
    checkedOutTo?: string;
    checkedOutDate?: string;
  };
}

export interface ArchiveLocation {
  id: string;
  name: string;
  type: 'room' | 'cabinet' | 'shelf' | 'box';
  fullPath: string;
  capacity: number;
  occupied: number;
}

export interface Lawyer {
  id: string;
  firmId: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  governorate: string;
  office?: string; // e.g., Main Office, Branch X
  barLevel: 'general' | 'primary' | 'appeal' | 'cassation';
  salary: number;
  specialization?: string;
  joinDate: string;
  status: 'active' | 'inactive';
  notes?: string;
  documents?: ClientDocument[];
}

export const BarLevelLabels: Record<string, string> = {
  general: 'جدول عام',
  primary: 'محاكم ابتدائية',
  appeal: 'استئناف عالي ومجلس دولة',
  cassation: 'نقض'
};

export interface ArchiveRequest {
  id: string;
  caseId: string;
  requesterId: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  notes?: string;
}

export interface HearingExpenses {
  amount: number;
  description: string;
  paidBy: 'lawyer' | 'client';
}

export interface Hearing {
  id: string;
  firmId: string;
  caseId: string;
  date: string;
  time?: string;
  type: 'session' | 'procedure';
  status: HearingStatus;
  decision?: string;
  requirements?: string;
  clientRequirements?: string;
  isCompleted?: boolean;
  rulingUrl?: string;
  expenses?: HearingExpenses;
}

export interface Task {
  id: string;
  firmId: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  relatedCaseId?: string;
  assignedTo?: string; // User ID
}

export interface ActivityLog {
  id: string;
  firmId: string;
  user: string;
  action: string;
  target: string;
  details?: string; // Optional details field
  timestamp: string;
}

export interface LegalReference {
  id: string;
  firmId?: string; // Optional because some might be global
  title: string;
  type: ReferenceType;
  branch: LawBranch;
  description?: string;
  articleNumber?: string;
  year?: number;
  courtName?: string;
  author?: string;
  url?: string;
  tags?: string[];
}

export interface Appointment {
  id: string;
  firmId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'meeting' | 'court' | 'client' | 'video_call' | 'phone_call' | 'internal' | 'other';
  priority: 'high' | 'medium' | 'low';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
  description?: string;
  location?: string;
  onlineMeetingUrl?: string;
  phoneNumber?: string;
  relatedCaseId?: string;
  relatedClientId?: string;
  notes?: string;
}

export interface WorkLocation {
  id: string;
  firmId?: string; // Optional because some might be global
  name: string;
  type: 'court' | 'police_station' | 'notary' | 'expert' | 'other';
  address: string;
  governorate: string;
  googleMapLink?: string;
  notes?: string;
  phone?: string;
}

export interface SMTPSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  fromEmail: string;
  fromName: string;
}

export interface WhatsAppSettings {
  apiKey: string;
  phoneNumberId: string;
  businessAccountId?: string;
  enabled: boolean;
}

export interface AlertPreferences {
  email: boolean;
  whatsapp: boolean;
  system: boolean;
  
  // Specific Toggles
  hearings: boolean;
  tasks: boolean;
  deadlines: boolean;
  systemUpdates: boolean;
  
  // Timing
  hearingReminderDays: number; // Days before hearing
  taskReminderDays: number; // Days before deadline
}

export interface NotificationSettings {
  smtp: SMTPSettings;
  whatsapp: WhatsAppSettings;
  preferences: AlertPreferences;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'financial' | 'operational' | 'case' | 'client' | 'custom';
  sections: string[]; // IDs of sections to include
  filters?: Record<string, any>;
  createdBy: string;
  createdAt: string;
}

export interface ScheduledReport {
  id: string;
  templateId: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[]; // Email addresses
  format: 'pdf' | 'excel' | 'word';
  nextRun: string;
  lastRun?: string;
  active: boolean;
}

export interface ReportSignature {
  id: string;
  userId: string;
  imageUrl: string; // Base64 or URL
  uploadedAt: string;
}

export interface LoginAttempt {
  id: string;
  ip: string;
  timestamp: string;
  success: boolean;
  username: string;
  userAgent: string;
}

export interface ActiveSession {
  id: string;
  userId: string;
  ip: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  passwordPolicy: {
    minLength: number;
    requireNumbers: boolean;
    requireSymbols: boolean;
    requireUppercase: boolean;
    expiryDays: number;
  };
  ipWhitelist: string[];
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
}

export interface DataManagementSettings {
  autoBackupFrequency: 'daily' | 'weekly' | 'monthly' | 'off';
  autoBackupTime: string;
  retainBackupsCount: number;
  archiveClosedCasesAfterDays: number;
  deleteArchivedAfterYears: number;
  enableAutoArchive: boolean;
}

export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  lastCheck: string;
  components: {
    database: 'operational' | 'degraded' | 'down';
    api: 'operational' | 'degraded' | 'down';
    storage: 'operational' | 'degraded' | 'down';
    backup: 'operational' | 'degraded' | 'down';
  };
}

export interface SystemError {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  resolved: boolean;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
  timestamp: string;
}

export interface MaintenanceSettings {
  autoUpdate: boolean;
  errorReporting: boolean;
  performanceMonitoring: boolean;
  maintenanceWindow: string; // e.g., "03:00"
}

// Employee interfaces
export interface Employee {
  id: string;
  firmId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationalId: string;
    dateOfBirth: string;
    address: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  employment: {
    employeeId: string;
    role: EmployeeRole;
    department: EmployeeDepartment;
    status: EmployeeStatus;
    hireDate: string;
    salary: number;
    workSchedule: {
      days: string[];
      hours: {
        start: string;
        end: string;
      };
    };
  };
  permissions: {
    [key: string]: PermissionLevel;
  };
  performance: {
    casesHandled: number;
    revenueGenerated: number;
    clientSatisfaction: number;
    lastReviewDate: string;
    nextReviewDate: string;
  };
  documents: {
    cv?: string;
    contract?: string;
    idCard?: string;
    qualifications?: string[];
  };
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface EmployeePerformance {
  id: string;
  employeeId: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    casesHandled: number;
    casesWon: number;
    revenueGenerated: number;
    hoursWorked: number;
    clientSatisfaction: number;
    teamCollaboration: number;
    deadlineCompliance: number;
  };
  goals: {
    [key: string]: {
      target: number;
      achieved: number;
      percentage: number;
    };
  };
  notes: string;
  reviewer: string;
  reviewDate: string;
}

export interface EmployeePermission {
  id: string;
  name: string;
  description: string;
  module: string;
  level: PermissionLevel;
}

export interface EmployeeRoleData {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}
