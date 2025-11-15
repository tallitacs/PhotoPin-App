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
import { auth as firebaseAuth } from '../config/firebase'; // The initialized auth instance

// Define the shape of the auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signup: (email: string, pass: string) => Promise<User | null>;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signup = async (email: string, pass: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
      // NOTE: You might want to call your backend '/api/auth/register' endpoint
      // here to create a corresponding user profile in your database (Firestore)
      return userCredential.user;
    } catch (error) {
      console.error("Signup error:", error);
      return null;
    }
  };

  const login = async (email: string, pass: string) => {
     try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, pass);
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  };

  const logout = async () => {
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
  };

  // Render children only when not loading
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily consume the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};