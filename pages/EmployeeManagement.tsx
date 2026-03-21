import React, { useState, useMemo, useEffect } from 'react';
import { 
  Employee, 
  EmployeeRole, 
  EmployeeStatus, 
  EmployeeDepartment,
  PermissionLevel 
} from '../types';
import { 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Users, 
  Briefcase, 
  Building, 
  TrendingUp,
  Calendar,
  Phone,
  User as UserIcon,
  DollarSign,
  Clock,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  Save
} from 'lucide-react';
import { 
  getFirmEmployees, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee, 
  searchEmployees,
  getEmployeeStats 
} from '../services/employeeService';

interface EmployeeManagementProps {
  firmId: string;
  currentUser: any;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ firmId, currentUser }) => {
  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [stats, setStats] = useState<any>(null);
  
  // Filter states
  const [selectedRole, setSelectedRole] = useState<EmployeeRole | ''>('');
  const [selectedDepartment, setSelectedDepartment] = useState<EmployeeDepartment | ''>('');
  const [filterStatus, setFilterStatus] = useState<EmployeeStatus | ''>('');
  
  // Sorting states
  const [sortField, setSortField] = useState<string>('personalInfo.firstName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Form states
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationalId: '',
      dateOfBirth: '',
      address: '',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    },
    employment: {
      employeeId: '',
      role: EmployeeRole.ASSISTANT,
      department: EmployeeDepartment.ADMINISTRATION,
      status: EmployeeStatus.ACTIVE,
      hireDate: '',
      salary: 0,
      workSchedule: {
        days: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء'],
        hours: {
          start: '09:00',
          end: '17:00'
        }
      }
    }
  });

  // Load employees and stats
  useEffect(() => {
    loadEmployees();
    loadStats();
  }, [firmId]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeesData = await getFirmEmployees(firmId);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getEmployeeStats(firmId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Filter and sort employees
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = [...employees];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(emp => 
        emp.personalInfo.firstName.toLowerCase().includes(term) ||
        emp.personalInfo.lastName.toLowerCase().includes(term) ||
        emp.personalInfo.email.toLowerCase().includes(term) ||
        emp.employment.employeeId.toLowerCase().includes(term)
      );
    }

    // Apply filters
    if (selectedRole) {
      filtered = filtered.filter(emp => emp.employment.role === selectedRole);
    }
    if (selectedDepartment) {
      filtered = filtered.filter(emp => emp.employment.department === selectedDepartment);
    }
    if (filterStatus) {
      filtered = filtered.filter(emp => emp.employment.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle nested properties
      if (sortField.includes('.')) {
        const keys = sortField.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [employees, searchTerm, selectedRole, selectedDepartment, filterStatus, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('🔍 Submitting employee form...', {
        firmId,
        currentUser: {
          id: currentUser?.id,
          email: currentUser?.email,
          roleLabel: currentUser?.roleLabel,
          firmId: currentUser?.firmId
        }
      });

      if (!firmId) {
        throw new Error('No firmId provided');
      }

      if (selectedEmployee) {
        // Update existing employee
        console.log('📝 Updating existing employee:', selectedEmployee.id);
        await updateEmployee(selectedEmployee.id, formData as any);
      } else {
        // Create new employee
        console.log('➕ Creating new employee...');
        const employeeData = {
          ...formData,
          firmId,
          permissions: getDefaultPermissions(formData.employment.role),
          performance: {
            casesHandled: 0,
            revenueGenerated: 0,
            clientSatisfaction: 0,
            lastReviewDate: '',
            nextReviewDate: ''
          },
          documents: {},
          createdBy: currentUser?.id || 'unknown'
        } as any;

        await createEmployee(employeeData);
      }
      
      // Reset form and reload data
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedEmployee(null);
      resetForm();
      loadEmployees();
      loadStats();
    } catch (error) {
      console.error('❌ Error saving employee:', error);
      // Show user-friendly error message
      alert('حدث خطأ أثناء حفظ بيانات الموظف: ' + (error as Error).message);
    }
  };

  // Handle delete employee
  const handleDelete = async (employeeId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      try {
        await deleteEmployee(employeeId);
        loadEmployees();
        loadStats();
      } catch (error) {
        console.error('Error deleting employee:', error);
      }
    }
  };

  // Handle edit employee
  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      personalInfo: employee.personalInfo,
      employment: employee.employment
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        nationalId: '',
        dateOfBirth: '',
        address: '',
        emergencyContact: {
          name: '',
          phone: '',
          relationship: ''
        }
      },
      employment: {
        employeeId: '',
        role: EmployeeRole.ASSISTANT,
        department: EmployeeDepartment.ADMINISTRATION,
        status: EmployeeStatus.ACTIVE,
        hireDate: '',
        salary: 0,
        workSchedule: {
          days: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء'],
          hours: {
            start: '09:00',
            end: '17:00'
          }
        }
      }
    });
  };

  // Get default permissions based on role
  const getDefaultPermissions = (role: EmployeeRole): Record<string, PermissionLevel> => {
    const basePermissions = {
      cases: PermissionLevel.READ,
      clients: PermissionLevel.READ,
      hearings: PermissionLevel.READ,
      tasks: PermissionLevel.READ,
      documents: PermissionLevel.READ,
      reports: PermissionLevel.READ
    };

    switch (role) {
      case EmployeeRole.ADMIN:
        return {
          ...basePermissions,
          cases: PermissionLevel.ADMIN,
          clients: PermissionLevel.ADMIN,
          hearings: PermissionLevel.ADMIN,
          tasks: PermissionLevel.ADMIN,
          documents: PermissionLevel.ADMIN,
          reports: PermissionLevel.ADMIN,
          employees: PermissionLevel.ADMIN,
          settings: PermissionLevel.ADMIN
        };
      case EmployeeRole.LAWYER:
        return {
          ...basePermissions,
          cases: PermissionLevel.WRITE,
          clients: PermissionLevel.WRITE,
          hearings: PermissionLevel.WRITE,
          tasks: PermissionLevel.WRITE,
          documents: PermissionLevel.WRITE
        };
      case EmployeeRole.ASSISTANT:
        return {
          ...basePermissions,
          cases: PermissionLevel.WRITE,
          clients: PermissionLevel.READ,
          hearings: PermissionLevel.WRITE,
          tasks: PermissionLevel.WRITE,
          documents: PermissionLevel.WRITE
        };
      default:
        return basePermissions;
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: EmployeeRole): string => {
    const roleNames = {
      [EmployeeRole.ADMIN]: 'مدير النظام',
      [EmployeeRole.LAWYER]: 'محامي',
      [EmployeeRole.ASSISTANT]: 'مساعد',
      [EmployeeRole.ACCOUNTANT]: 'محاسب',
      [EmployeeRole.RECEPTIONIST]: 'موظف استقبال',
      [EmployeeRole.PARALEGAL]: 'مساعد قانوني'
    };
    return roleNames[role] || role;
  };

  // Get department display name
  const getDepartmentDisplayName = (department: EmployeeDepartment): string => {
    const deptNames = {
      [EmployeeDepartment.LEGAL]: 'قانوني',
      [EmployeeDepartment.ADMINISTRATION]: 'إدارة',
      [EmployeeDepartment.ACCOUNTING]: 'محاسبة',
      [EmployeeDepartment.RECEPTION]: 'استقبال'
    };
    return deptNames[department] || department;
  };

  // Get status color
  const getStatusColor = (status: EmployeeStatus): string => {
    const colors = {
      [EmployeeStatus.ACTIVE]: 'text-green-600 bg-green-100',
      [EmployeeStatus.INACTIVE]: 'text-gray-600 bg-gray-100',
      [EmployeeStatus.ON_LEAVE]: 'text-yellow-600 bg-yellow-100',
      [EmployeeStatus.TERMINATED]: 'text-red-600 bg-red-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          إدارة الموظفين
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          إدارة بيانات ومعلومات موظفي المكتب
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">إجمالي الموظفين</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">الموظفون النشطون</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">الموظفون الجدد</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.newThisMonth}</p>
              </div>
              <UserPlus className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">الأقسام</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.departments}</p>
              </div>
              <Building className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}
          {/* Add Employee Button */}
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            إضافة موظف
          </button>
        
      {/* Actions Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Search className="w-4 h-4 inline-block ml-2" />
                البحث عن موظف
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم، البريد الإلكتروني، أو القسم..."
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="البحث عن موظف"
                title="اكتب كلمات مفتاحية للبحث"
              />
            </div>
            
            {/* Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Filter className="w-4 h-4 inline-block ml-2" />
                فلترة حسب الحالة
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as EmployeeStatus)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="فلترة حسب الحالة"
                title="اختر الحالة للفلترة"
              >
                <option value="">جميع الحالات</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
                <option value="on_leave">في إجازة</option>
              </select>
            </div>
        </div>
        
        {/* Add Employee Button */}
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          إضافة موظف
        </button>
        </div>
        
        {/* Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as EmployeeRole)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="اختر المنصب"
              title="اختر منصب الموظف"
            >
              <option value="">جميع الأدوار</option>
              {Object.values(EmployeeRole).map(role => (
                <option key={role} value={role}>{getRoleDisplayName(role)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right text-slate-800 dark:text-slate-200">
            <thead className="text-xs text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    الاسم
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    البريد الإلكتروني
                    {sortField === 'email' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('department')}
                    className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    القسم
                    {sortField === 'department' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('role')}
                    className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    المنصب
                    {sortField === 'role' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    الحالة
                    {sortField === 'status' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <button
                    onClick={() => handleSort('hireDate')}
                    className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    تاريخ التعيين
                    {sortField === 'hireDate' && (
                      sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th scope="col" className="px-6 py-3">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">الإجراءات</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    جاري التحميل...
                  </td>
                </tr>
              ) : filteredAndSortedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    {searchTerm || selectedRole || selectedDepartment || filterStatus
                      ? 'لا توجد نتائج مطابقة للبحث'
                      : 'لا يوجد موظفون حالياً'
                    }
                  </td>
                </tr>
              ) : (
                filteredAndSortedEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-slate-100 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-slate-200">
                            {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {employee.personalInfo.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 dark:text-slate-300" />
                        {employee.personalInfo.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                        {getDepartmentDisplayName(employee.employment.department)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {getRoleDisplayName(employee.employment.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(employee.employment.status)}`}>
                        {employee.employment.status === EmployeeStatus.ACTIVE ? 'نشط' :
                         employee.employment.status === EmployeeStatus.INACTIVE ? 'غير نشط' :
                         employee.employment.status === EmployeeStatus.ON_LEAVE ? 'في إجازة' :
                         employee.employment.status === EmployeeStatus.TERMINATED ? 'منهي الخدمة' :
                         employee.employment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        {new Date(employee.employment.hireDate).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowEditModal(true);
                            resetForm();
                          }}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          aria-label="تعديل بيانات الموظف"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteEmployee(employee.id)}
                          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          aria-label="حذف الموظف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {showEditModal ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  aria-label="إغلاق النافذة"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">المعلومات الشخصية</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      الاسم الأول
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.personalInfo.firstName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, firstName: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      اسم العائلة
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.personalInfo.lastName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, lastName: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.personalInfo.email}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, email: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.personalInfo.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, phone: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      الرقم القومي
                    </label>
                    <input
                      type="text"
                      value={formData.personalInfo.nationalId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, nationalId: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      تاريخ الميلاد
                    </label>
                    <input
                      type="date"
                      value={formData.personalInfo.dateOfBirth}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      العنوان
                    </label>
                    <textarea
                      value={formData.personalInfo.address}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        personalInfo: { ...prev.personalInfo, address: e.target.value }
                      }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                {/* Employment Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">معلومات العمل</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      الرقم الوظيفي
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.employment.employeeId}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        employment: { ...prev.employment, employeeId: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      المنصب
                    </label>
                    <select
                      required
                      value={formData.employment.role}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        employment: { ...prev.employment, role: e.target.value as EmployeeRole }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.values(EmployeeRole).map(role => (
                        <option key={role} value={role}>{getRoleDisplayName(role)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      القسم
                    </label>
                    <select
                      required
                      value={formData.employment.department}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        employment: { ...prev.employment, department: e.target.value as EmployeeDepartment }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.values(EmployeeDepartment).map(dept => (
                        <option key={dept} value={dept}>{getDepartmentDisplayName(dept)}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      الحالة
                    </label>
                    <select
                      required
                      value={formData.employment.status}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        employment: { ...prev.employment, status: e.target.value as EmployeeStatus }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {Object.values(EmployeeStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      تاريخ التعيين
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.employment.hireDate}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        employment: { ...prev.employment, hireDate: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      الراتب
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.employment.salary}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        employment: { ...prev.employment, salary: Number(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {showAddModal ? 'إضافة' : 'حفظ التغييرات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
