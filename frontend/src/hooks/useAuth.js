import { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email, password, displayName) => {
    return await AuthService.signUp(email, password, displayName);
  };

  const signIn = async (email, password) => {
    return await AuthService.signIn(email, password);
  };

  const signInWithGoogle = async () => {
    return await AuthService.signInWithGoogle();
  };

  const signOut = async () => {
    return await AuthService.signOutUser();
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut
  };
};