import { useState, useEffect } from 'react';
import { 
  User, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (err: any) {
      setError(err.message);
      return { user: null, error: err.message };
    }
  };
  
  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (err: any) {
      setError(err.message);
      return { user: null, error: err.message };
    }
  };
  
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      return { user: result.user, error: null };
    } catch (err: any) {
      setError(err.message);
      return { user: null, error: err.message };
    }
  };
  
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err.message };
    }
  };
  
  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut
  };
}