import React, { useState, useMemo, useEffect } from 'react';
import { Appointment, Case, Client } from '../types';
import { 
  Calendar, Plus, Search, Filter, Clock, MapPin, Video, Phone, 
  Briefcase, User, Edit3, Trash2, CheckCircle, XCircle, AlertCircle,
  CalendarClock, LayoutGrid, List, ChevronLeft, ChevronRight,
  BarChart3, TrendingUp, Activity, Bell, Wifi, WifiOff, Users
} from 'lucide-react';
import MonthlyCalendar from '../components/MonthlyCalendar';
import EnhancedSearch from '../components/EnhancedSearch';
import RecurrenceManager from '../components/RecurrenceManager';
import notificationService from '../services/notificationService';
import calendarSyncService from '../services/calendarSyncService';

// Enhanced Search Interface (compatible with EnhancedSearch component)
interface AppointmentsSearchSuggestion {
  id: string;
  text: string;
  type: 'case' | 'client' | 'hearing' | 'document' | 'appointment';
  metadata?: string;
}

// Statistics Interface
export interface AppointmentStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
}

// Calendar View Types
type CalendarView = 'month' | 'week' | 'day';
type ViewMode = 'list' | 'calendar' | 'stats';

interface AppointmentsProps {
  appointments: Appointment[];
  cases: Case[];
  clients: Client[];
  onAddAppointment: (appointment: Appointment) => void;
  onUpdateAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onCaseClick: (caseId: string) => void;
  onClientClick: (clientId: string) => void;
  readOnly?: boolean;
}

const Appointments: React.FC<AppointmentsProps> = ({ 
  appointments, cases, clients, onAddAppointment, onUpdateAppointment, onDeleteAppointment, onCaseClick, onClientClick, readOnly = false 
}) => {
  // Enhanced State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [cardDate, setCardDate] = useState<Date>(new Date());
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<Partial<Appointment>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    type: 'meeting',
    priority: 'medium',
    status: 'scheduled',
    description: '',
    location: '',
    onlineMeetingUrl: '',
    phoneNumber: '',
    relatedCaseId: '',
    relatedClientId: '',
    notes: ''
  });

  // --- Filtering ---
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            a.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || a.type === filterType;
      const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    }).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.startTime}`);
      const dateB = new Date(`${b.date}T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [appointments, searchTerm, filterType, filterStatus]);

  // --- Enhanced Helper Functions ---
  const getAppointmentStats = useMemo((): AppointmentStats => {
    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats: AppointmentStats = {
      total: appointments.length,
      today: appointments.filter(a => a.date === today.toISOString().split('T')[0]).length,
      thisWeek: appointments.filter(a => new Date(a.date) >= thisWeekStart).length,
      thisMonth: appointments.filter(a => new Date(a.date) >= thisMonthStart).length,
      upcoming: appointments.filter(a => new Date(a.date) > today).length,
      completed: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      byType: {},
      byPriority: {}
    };

    appointments.forEach(appointment => {
      stats.byType[appointment.type] = (stats.byType[appointment.type] || 0) + 1;
      stats.byPriority[appointment.priority] = (stats.byPriority[appointment.priority] || 0) + 1;
    });

    return stats;
  }, [appointments]);

  const getSearchSuggestions = useMemo((): AppointmentsSearchSuggestion[] => {
    const suggestions: AppointmentsSearchSuggestion[] = [];
    
    // Add appointment suggestions
    appointments.forEach(appointment => {
      suggestions.push({
        id: appointment.id,
        text: appointment.title,
        type: 'appointment',
        metadata: `${appointment.date} - ${appointment.startTime}`
      });
    });

    // Add case suggestions
    cases.forEach(case_ => {
      suggestions.push({
        id: case_.id,
        text: case_.title,
        type: 'case',
        metadata: case_.caseNumber
      });
    });

    // Add client suggestions
    clients.forEach(client => {
      suggestions.push({
        id: client.id,
        text: client.name,
        type: 'client',
        metadata: client.phone || ''
      });
    });

    return suggestions.slice(0, 10);
  }, [appointments, cases, clients]);

  // --- Enhanced Handlers ---
  const handleOpenModal = (appointment?: Appointment) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setFormData({ ...appointment });
    } else {
      setEditingAppointment(null);
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        type: 'meeting',
        priority: 'medium',
        status: 'scheduled',
        description: '',
        location: '',
        onlineMeetingUrl: '',
        phoneNumber: '',
        relatedCaseId: '',
        relatedClientId: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    // Open modal with pre-selected date
    handleOpenModal();
    setFormData(prev => ({
      ...prev,
      date: date.toISOString().split('T')[0]
    }));
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    handleOpenModal(appointment);
  };

  const handleCardDateChange = (direction: number) => {
    const newDate = new Date(cardDate);
    newDate.setDate(newDate.getDate() + direction);
    setCardDate(newDate);
  };

  const getAppointmentsForCardDate = () => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate.toDateString() === cardDate.toDateString();
    }).sort((a, b) => {
      const timeA = a.startTime;
      const timeB = b.startTime;
      return timeA.localeCompare(timeB);
    });
  };

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime) return;

    if (editingAppointment) {
      onUpdateAppointment({ ...editingAppointment, ...formData } as Appointment);
    } else {
      onAddAppointment({
        ...formData,
        id: Math.random().toString(36).substring(2, 9),
      } as Appointment);
    }
    setIsModalOpen(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'court': return <Briefcase className="w-5 h-5 text-amber-500" />;
      case 'client': return <User className="w-5 h-5 text-indigo-500" />;
      case 'video_call': return <Video className="w-5 h-5 text-emerald-500" />;
      case 'phone_call': return <Phone className="w-5 h-5 text-purple-500" />;
      default: return <CalendarClock className="w-5 h-5 text-slate-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'meeting': return 'اجتماع';
      case 'court': return 'جلسة محكمة';
      case 'client': return 'مقابلة موكل';
      case 'video_call': return 'مكالمة فيديو';
      case 'phone_call': return 'مكالمة هاتفية';
      case 'internal': return 'عمل داخلي';
      default: return 'أخرى';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">مجدول</span>;
      case 'in_progress': return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">قيد التنفيذ</span>;
      case 'completed': return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">مكتمل</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">ملغى</span>;
      case 'postponed': return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-medium">مؤجل</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <CalendarClock className="w-8 h-8 text-indigo-600" />
            جدول المواعيد والأعمال
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">إدارة المواعيد، الاجتماعات، والمهام المجدولة</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Online Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">متصل</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-orange-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">غير متصل</span>
              </div>
            )}
          </div>

          {/* Notifications */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Enhanced View Mode Toggle */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('stats')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'stats' 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar View Toggle */}
          {viewMode === 'calendar' && (
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1">
              <button
                onClick={() => setCalendarView('month')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  calendarView === 'month' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                شهر
              </button>
              <button
                onClick={() => setCalendarView('week')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  calendarView === 'week' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                أسبوع
              </button>
              <button
                onClick={() => setCalendarView('day')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  calendarView === 'day' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                يوم
              </button>
            </div>
          )}
          
          {!readOnly && (
            <button 
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 dark:shadow-none"
            >
              <Plus className="w-5 h-5" />
              موعد جديد
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'stats' ? (
        /* Statistics View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">إجمالي المواعيد</h3>
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{getAppointmentStats.total}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">جميع المواعيد المسجلة</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">مواعيد اليوم</h3>
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{getAppointmentStats.today}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">مواعيد لهذا اليوم</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">هذا الأسبوع</h3>
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{getAppointmentStats.thisWeek}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">مواعيد هذا الأسبوع</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">مكتملة</h3>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{getAppointmentStats.completed}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">مواعيد مكتملة</p>
          </div>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar - takes 2 columns */}
          <div className="lg:col-span-2">
            <MonthlyCalendar
              appointments={filteredAppointments}
              onAppointmentClick={handleAppointmentClick}
              onDateClick={handleDateClick}
              selectedDate={selectedDate}
            />
          </div>
          
          {/* Daily Appointments Card - takes 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              {/* Card Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleCardDateChange(-1)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                  <div className="text-center">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {cardDate.toLocaleDateString('ar-EG', { weekday: 'long' })}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {cardDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCardDateChange(1)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => {
                      setSelectedDate(cardDate);
                      handleDateClick(cardDate);
                    }}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* Card Content */}
              <div className="p-4 max-h-96 overflow-y-auto">
                {getAppointmentsForCardDate().length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">لا توجد مواعيد في هذا اليوم</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getAppointmentsForCardDate().map(appointment => {
                      const relatedCase = cases.find(c => c.id === appointment.relatedCaseId);
                      const relatedClient = clients.find(c => c.id === appointment.relatedClientId);
                      
                      return (
                        <div
                          key={appointment.id}
                          onClick={() => handleAppointmentClick(appointment)}
                          className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                                {appointment.title}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>{appointment.startTime} - {appointment.endTime}</span>
                              </div>
                              {appointment.location && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{appointment.location}</span>
                                </div>
                              )}
                            </div>
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${
                              appointment.type === 'meeting' ? 'bg-blue-500' :
                              appointment.type === 'court' ? 'bg-red-500' :
                              appointment.type === 'client' ? 'bg-green-500' :
                              appointment.type === 'video_call' ? 'bg-indigo-500' :
                              appointment.type === 'phone_call' ? 'bg-yellow-500' :
                              appointment.type === 'internal' ? 'bg-purple-500' :
                              'bg-gray-500'
                            }`}></div>
                          </div>
                          
                          {(relatedCase || relatedClient) && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {relatedCase && (
                                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                                  {relatedCase.title}
                                </span>
                              )}
                              {relatedClient && (
                                <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded">
                                  {relatedClient.name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Enhanced Filters */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <EnhancedSearch
                suggestions={getSearchSuggestions}
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={setSearchTerm}
                onSelect={(suggestion) => {
                  if (suggestion.type === 'appointment') {
                    const appointment = appointments.find(a => a.id === suggestion.id);
                    if (appointment) handleAppointmentClick(appointment);
                  } else if (suggestion.type === 'case') {
                    onCaseClick(suggestion.id);
                  } else if (suggestion.type === 'client') {
                    onClientClick(suggestion.id);
                  }
                }}
                placeholder="بحث في المواعيد، القضايا، أو العملاء..."
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pr-9 pl-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none dark:text-white"
                >
                  <option value="all">جميع الأنواع</option>
                  <option value="meeting">اجتماع</option>
                  <option value="court">جلسة محكمة</option>
                  <option value="client">مقابلة موكل</option>
                  <option value="video_call">مكالمة فيديو</option>
                  <option value="phone_call">مكالمة هاتفية</option>
                  <option value="internal">عمل داخلي</option>
                </select>
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pr-9 pl-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none dark:text-white"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="scheduled">مجدول</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغى</option>
                  <option value="postponed">مؤجل</option>
                </select>
              </div>
            </div>
          </div>

          {/* Appointments List */}
          <div className="space-y-4">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">لا توجد مواعيد</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-1">لم يتم العثور على مواعيد تطابق بحثك</p>
              </div>
            ) : (
          filteredAppointments.map(appointment => {
            const relatedCase = cases.find(c => c.id === appointment.relatedCaseId);
            const relatedClient = clients.find(c => c.id === appointment.relatedClientId);

            return (
              <div key={appointment.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 md:items-center">
                <div className="flex-shrink-0 w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-xl flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{new Date(appointment.date).toLocaleDateString('ar-EG', { month: 'short' })}</span>
                  <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{new Date(appointment.date).getDate()}</span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{appointment.title}</h3>
                    {getStatusBadge(appointment.status)}
                    {appointment.priority === 'high' && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> هام</span>}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{appointment.startTime} - {appointment.endTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getTypeIcon(appointment.type)}
                      <span>{getTypeLabel(appointment.type)}</span>
                    </div>
                    {appointment.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{appointment.location}</span>
                      </div>
                    )}
                    {relatedCase && (
                      <button onClick={() => onCaseClick(relatedCase.id)} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                        <Briefcase className="w-4 h-4" />
                        <span>{relatedCase.title}</span>
                      </button>
                    )}
                    {relatedClient && (
                      <button onClick={() => onClientClick(relatedClient.id)} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                        <User className="w-4 h-4" />
                        <span>{relatedClient.name}</span>
                      </button>
                    )}
                  </div>
                </div>

                {!readOnly && (
                  <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <button 
                      onClick={() => handleOpenModal(appointment)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => {
                        if (window.confirm('هل أنت متأكد من حذف هذا الموعد؟')) {
                          onDeleteAppointment(appointment.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingAppointment ? 'تعديل موعد' : 'إضافة موعد جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveAppointment} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">عنوان الموعد *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">التاريخ *</label>
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">من الساعة *</label>
                    <input 
                      type="time" 
                      required
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">إلى الساعة *</label>
                    <input 
                      type="time" 
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">النوع</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  >
                    <option value="meeting">اجتماع</option>
                    <option value="court">جلسة محكمة</option>
                    <option value="client">مقابلة موكل</option>
                    <option value="video_call">مكالمة فيديو</option>
                    <option value="phone_call">مكالمة هاتفية</option>
                    <option value="internal">عمل داخلي</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الأهمية</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  >
                    <option value="low">عادية</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الحالة</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  >
                    <option value="scheduled">مجدول</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغى</option>
                    <option value="postponed">مؤجل</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">المكان</label>
                  <input 
                    type="text" 
                    value={formData.location || ''}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">القضية المرتبطة</label>
                  <select 
                    value={formData.relatedCaseId || ''}
                    onChange={(e) => setFormData({...formData, relatedCaseId: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  >
                    <option value="">بدون قضية</option>
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">الموكل المرتبط</label>
                  <select 
                    value={formData.relatedClientId || ''}
                    onChange={(e) => setFormData({...formData, relatedClientId: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                  >
                    <option value="">بدون موكل</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">ملاحظات</label>
                  <textarea 
                    rows={3}
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  {editingAppointment ? 'حفظ التعديلات' : 'إضافة الموعد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default Appointments;
