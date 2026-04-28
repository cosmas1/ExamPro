import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { AppUser } from '../types';

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

export function AuthProvider({ children }: { ReactNode?: any, children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        const userDoc = await getDoc(doc(db, 'users', fUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as AppUser;
          // Force admin role for the project owner's email
          if (fUser.email === 'musaukulenga1@gmail.com' && data.role !== 'admin') {
            const updated = { ...data, role: 'admin' as const };
            await updateDoc(doc(db, 'users', fUser.uid), { role: 'admin' });
            setUser(updated);
          } else {
            setUser(data);
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = async (fUser: User) => {
    const userDocRef = doc(db, 'users', fUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      const isAdmin = fUser.email === 'musaukulenga1@gmail.com';
      const newUser: AppUser = {
        uid: fUser.uid,
        name: fUser.displayName || 'Anonymous',
        email: fUser.email || '',
        role: isAdmin ? 'admin' : 'student',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, newUser);
      setUser(newUser);
    } else {
      setUser(userDoc.data() as AppUser);
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

  const logout = () => auth.signOut();

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
