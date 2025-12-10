import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode 
} from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { auth as firebaseAuth } from '../config/firebase';

// Define the shape of the authentication context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, pass: string) => Promise<User | null>;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

// Authentication provider component - manages auth state for the app
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, []);

  // Register a new user account
  const signup = async (email: string, pass: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
      return userCredential.user;
    } catch (error: any) {
      console.error("Signup error:", error);
      // Re-throw error so calling component can handle it
      throw error;
    }
  };

  // Sign in existing user
  const login = async (email: string, pass: string) => {
     try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, pass);
      return userCredential.user;
    } catch (error: any) {
      console.error("Login error:", error);
      // Re-throw error so calling component can handle it
      throw error;
    }
  };

  // Sign out current user
  const logout = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Context value containing auth state and methods
  const value = {
    user,
    loading,
    signup,
    login,
    logout,
  };

  // Provide auth context to children
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  // Ensure hook is used within AuthProvider
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};