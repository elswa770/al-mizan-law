import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { AppUser } from '../types';
import { MOCK_ROLES } from '../services/mockData';

interface AuthContextType {
  currentUser: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  firmId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  firebaseUser: null,
  loading: true,
  firmId: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // Listen to the user document in real-time
        unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as AppUser;
            setCurrentUser({ ...userData, id: user.uid });
          } else {
            // User exists in Auth but not in Firestore (e.g., first time login)
            // Check if user might already have a firm before creating new document
            console.log('🔍 User document not found, checking for existing firms...');
            
            try {
              // Check if this user owns any firms
              const firmsQuery = query(collection(db, 'firms'), where('ownerId', '==', user.uid));
              const firmsSnapshot = await getDocs(firmsQuery);
              
              if (!firmsSnapshot.empty) {
                // User has existing firms, use the first one
                const existingFirm = firmsSnapshot.docs[0];
                console.log('✅ Found existing firm:', existingFirm.id);
                
                const newUserDoc: AppUser = {
                  id: user.uid,
                  email: user.email || '',
                  name: user.displayName || '',
                  roleLabel: 'مدير النظام',
                  isActive: true,
                  permissions: MOCK_ROLES.find(r => r.name === 'مدير النظام')?.permissions || [],
                  firmId: existingFirm.id
                };
                
                await setDoc(doc(db, 'users', user.uid), newUserDoc);
                setCurrentUser(newUserDoc);
                console.log('✅ Created user document with existing firm ID');
              } else {
                // No existing firms, create user document without firm
                const newUserDoc: AppUser = {
                  id: user.uid,
                  email: user.email || '',
                  name: user.displayName || '',
                  roleLabel: 'مدير النظام',
                  isActive: true,
                  permissions: [], // Will be populated based on role
                  firmId: '' // Will be set when firm is created
                };
                
                await setDoc(doc(db, 'users', user.uid), newUserDoc);
                setCurrentUser(newUserDoc);
                console.log('✅ Created user document without firm (first time)');
              }
            } catch (error) {
              console.error('❌ Error checking existing firms:', error);
              // Fallback: create user document without firm
              const newUserDoc: AppUser = {
                id: user.uid,
                email: user.email || '',
                name: user.displayName || '',
                roleLabel: 'مدير النظام',
                isActive: true,
                permissions: [],
                firmId: ''
              };
              
              await setDoc(doc(db, 'users', user.uid), newUserDoc);
              setCurrentUser(newUserDoc);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          setCurrentUser(null);
          setLoading(false);
        });
      } else {
        if (unsubscribeUser) {
          unsubscribeUser();
          unsubscribeUser = undefined;
        }
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  const value = {
    currentUser,
    firebaseUser,
    loading,
    firmId: currentUser?.firmId || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
