import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { AppUser } from '../types';
import Swal from 'sweetalert2';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  signIn: (user: User) => Promise<void>;
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate or retrieve a persistent session ID for this browser/device
const getSessionId = () => {
  let id = localStorage.getItem('examcore_session_id');
  if (!id) {
    id = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('examcore_session_id', id);
  }
  return id;
};
const currentLocalSessionId = getSessionId();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      
      // Cleanup previous listener if it exists
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }
      
      if (fUser) {
        // Listen to User Document for real-time session monitoring
        unsubSnapshot = onSnapshot(doc(db, 'users', fUser.uid), async (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as AppUser;
            
            // Single Device Logic: If activeSessionId exists and differs from currentLocalSessionId
            // Ensure the update did not just originate from this device
            if (data.role === 'student' && data.activeSessionId && data.activeSessionId !== currentLocalSessionId && !snapshot.metadata.hasPendingWrites) {
              await auth.signOut();
              Swal.fire({
                title: 'Session Ended',
                text: 'You have been logged out because you signed in from another device.',
                icon: 'warning',
                confirmButtonColor: '#3c8dbc'
              });
              return;
            }

            const verifiedUser = { ...data, uid: fUser.uid };

            // Force admin role for the project owner's email
            if (fUser.email === 'musaukulenga1@gmail.com' && data.role !== 'admin') {
              await updateDoc(doc(db, 'users', fUser.uid), { role: 'admin' });
              setUser({ ...verifiedUser, role: 'admin' });
            } else {
              setUser(verifiedUser);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("User doc snapshot error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubSnapshot) unsubSnapshot();
    };
  }, []);

  const signIn = async (fUser: User) => {
    const userDocRef = doc(db, 'users', fUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    const sessionUpdate = {
      activeSessionId: currentLocalSessionId,
      lastLogin: new Date().toISOString()
    };

    if (!userDoc.exists()) {
      const isAdmin = fUser.email === 'musaukulenga1@gmail.com';
      const newUser: AppUser = {
        uid: fUser.uid,
        name: fUser.displayName || 'Anonymous',
        email: fUser.email || '',
        role: isAdmin ? 'admin' : 'student',
        createdAt: new Date().toISOString(),
        ...sessionUpdate
      };
      await setDoc(userDocRef, newUser);
      setUser(newUser);
    } else {
      await updateDoc(userDocRef, sessionUpdate);
      setUser({ ...userDoc.data() as AppUser, ...sessionUpdate });
    }
  };

  const signInWithGoogle = async () => {
    const { signInWithPopup } = await import('firebase/auth');
    const result = await signInWithPopup(auth, googleProvider);
    await signIn(result.user);
    return result.user;
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await signIn(result.user);
    return result.user;
  };

  const logout = async () => {
    localStorage.removeItem('examcore_session_id');
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signIn, signInWithGoogle, signInWithEmail, signOut: logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
