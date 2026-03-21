import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { ActivityLog } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const logActivity = async (firmId: string, userId: string, action: string, target: string, details?: string) => {
  try {
    await addDoc(collection(db, 'activities'), {
      firmId,
      user: userId,
      action,
      target,
      details: details || '', // Ensure details is never undefined
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'activities');
  }
};

// Get activities for a specific firm
export const getFirmActivities = async (firmId: string, limitCount: number = 10): Promise<ActivityLog[]> => {
  try {
    const q = query(
      collection(db, 'activities'), 
      where('firmId', '==', firmId),
      orderBy('timestamp', 'desc'), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'activities');
    return [];
  }
};

// Get all activities (for super admin)
export const getAllActivities = async (limitCount: number = 50): Promise<ActivityLog[]> => {
  try {
    const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'activities');
    return [];
  }
};

// Get activities for a specific user
export const getUserActivities = async (firmId: string, userName: string, limitCount: number = 20): Promise<ActivityLog[]> => {
  try {
    const q = query(
      collection(db, 'activities'), 
      where('firmId', '==', firmId),
      where('user', '==', userName),
      orderBy('timestamp', 'desc'), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'activities');
    return [];
  }
};

export const getActivityLogs = async (limitCount: number = 10): Promise<ActivityLog[]> => {
  try {
    const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'activities');
    return [];
  }
};
