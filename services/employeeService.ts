import { collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Employee, EmployeePerformance, EmployeeRole, EmployeeStatus, EmployeeDepartment } from '../types';

// Employee CRUD operations
export const createEmployee = async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    console.log('👤 Creating employee with data:', {
      firmId: employeeData.firmId,
      personalInfo: {
        firstName: employeeData.personalInfo.firstName,
        lastName: employeeData.personalInfo.lastName,
        email: employeeData.personalInfo.email
      },
      employment: {
        role: employeeData.employment.role,
        department: employeeData.employment.department,
        status: employeeData.employment.status
      }
    });

    const employee = {
      ...employeeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, 'employees'), employee);
    console.log('✅ Employee created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating employee:', error);
    console.error('❌ Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const getEmployee = async (employeeId: string): Promise<Employee | null> => {
  try {
    const docRef = doc(db, 'employees', employeeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Employee;
    }
    return null;
  } catch (error) {
    console.error('Error getting employee:', error);
    throw error;
  }
};

export const getFirmEmployees = async (firmId: string): Promise<Employee[]> => {
  try {
    const q = query(
      collection(db, 'employees'),
      where('firmId', '==', firmId),
      orderBy('employment.hireDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
  } catch (error) {
    console.error('Error getting firm employees:', error);
    throw error;
  }
};

export const updateEmployee = async (employeeId: string, updates: Partial<Employee>): Promise<void> => {
  try {
    const docRef = doc(db, 'employees', employeeId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

export const deleteEmployee = async (employeeId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'employees', employeeId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// Employee performance operations
export const createEmployeePerformance = async (performanceData: Omit<EmployeePerformance, 'id'>): Promise<string> => {
  try {
    const performance = {
      ...performanceData,
      reviewDate: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, 'employeePerformances'), performance);
    return docRef.id;
  } catch (error) {
    console.error('Error creating employee performance:', error);
    throw error;
  }
};

export const getEmployeePerformances = async (employeeId: string): Promise<EmployeePerformance[]> => {
  try {
    const q = query(
      collection(db, 'employeePerformances'),
      where('employeeId', '==', employeeId),
      orderBy('period.start', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeePerformance));
  } catch (error) {
    console.error('Error getting employee performances:', error);
    throw error;
  }
};

// Employee statistics
export const getEmployeeStats = async (firmId: string): Promise<{
  totalEmployees: number;
  activeEmployees: number;
  employeesByRole: Record<EmployeeRole, number>;
  employeesByDepartment: Record<EmployeeDepartment, number>;
  recentHires: Employee[];
}> => {
  try {
    const employees = await getFirmEmployees(firmId);
    
    const stats = {
      totalEmployees: employees.length,
      activeEmployees: employees.filter(emp => emp.employment.status === EmployeeStatus.ACTIVE).length,
      employeesByRole: {} as Record<EmployeeRole, number>,
      employeesByDepartment: {} as Record<EmployeeDepartment, number>,
      recentHires: employees
        .filter(emp => {
          const hireDate = new Date(emp.employment.hireDate);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return hireDate >= thirtyDaysAgo;
        })
        .slice(0, 5),
    };
    
    // Count by role
    Object.values(EmployeeRole).forEach(role => {
      stats.employeesByRole[role] = employees.filter(emp => emp.employment.role === role).length;
    });
    
    // Count by department
    Object.values(EmployeeDepartment).forEach(dept => {
      stats.employeesByDepartment[dept] = employees.filter(emp => emp.employment.department === dept).length;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting employee stats:', error);
    throw error;
  }
};

// Search and filter employees
export const searchEmployees = async (
  firmId: string,
  searchTerm: string,
  filters?: {
    role?: EmployeeRole;
    department?: EmployeeDepartment;
    status?: EmployeeStatus;
  }
): Promise<Employee[]> => {
  try {
    let employees = await getFirmEmployees(firmId);
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      employees = employees.filter(emp => 
        emp.personalInfo.firstName.toLowerCase().includes(term) ||
        emp.personalInfo.lastName.toLowerCase().includes(term) ||
        emp.personalInfo.email.toLowerCase().includes(term) ||
        emp.employment.employeeId.toLowerCase().includes(term)
      );
    }
    
    // Apply filters
    if (filters) {
      if (filters.role) {
        employees = employees.filter(emp => emp.employment.role === filters.role);
      }
      if (filters.department) {
        employees = employees.filter(emp => emp.employment.department === filters.department);
      }
      if (filters.status) {
        employees = employees.filter(emp => emp.employment.status === filters.status);
      }
    }
    
    return employees;
  } catch (error) {
    console.error('Error searching employees:', error);
    throw error;
  }
};

// Employee performance summary
export const getEmployeePerformanceSummary = async (employeeId: string): Promise<{
  totalCases: number;
  totalRevenue: number;
  averageSatisfaction: number;
  lastReviewDate: string;
  performanceTrend: 'improving' | 'stable' | 'declining';
}> => {
  try {
    const employee = await getEmployee(employeeId);
    const performances = await getEmployeePerformances(employeeId);
    
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    const summary = {
      totalCases: employee.performance.casesHandled,
      totalRevenue: employee.performance.revenueGenerated,
      averageSatisfaction: employee.performance.clientSatisfaction,
      lastReviewDate: employee.performance.lastReviewDate,
      performanceTrend: 'stable' as 'improving' | 'stable' | 'declining',
    };
    
    // Calculate trend if we have multiple performance records
    if (performances.length >= 2) {
      const recent = performances[0];
      const previous = performances[1];
      
      const recentScore = (
        recent.metrics.casesHandled * 0.3 +
        recent.metrics.revenueGenerated * 0.3 +
        recent.metrics.clientSatisfaction * 0.4
      ) / 100;
      
      const previousScore = (
        previous.metrics.casesHandled * 0.3 +
        previous.metrics.revenueGenerated * 0.3 +
        previous.metrics.clientSatisfaction * 0.4
      ) / 100;
      
      if (recentScore > previousScore * 1.05) {
        summary.performanceTrend = 'improving';
      } else if (recentScore < previousScore * 0.95) {
        summary.performanceTrend = 'declining';
      }
    }
    
    return summary;
  } catch (error) {
    console.error('Error getting employee performance summary:', error);
    throw error;
  }
};
