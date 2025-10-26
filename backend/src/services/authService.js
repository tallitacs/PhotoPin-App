// src/services/authService.js
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

export class AuthService {
  // Sign up with email and password
  static async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore
      await this.createUserDocument(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign in with email and password
  static async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.updateLastLogin(userCredential.user.uid);
      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sign out
  static async signOutUser() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  // Create user document in Firestore
  static async createUserDocument(user) {
    const userDoc = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL || '',
      createdAt: new Date(),
      lastLogin: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userDoc);
  }

  // Update last login
  static async updateLastLogin(uid) {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { lastLogin: new Date() }, { merge: true });
  }

  // Auth state observer
  static onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }
}