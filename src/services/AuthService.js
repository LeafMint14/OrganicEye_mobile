import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; // Check this path

class AuthService {
  // Register with email, password, and additional user data
  static async register(email, password, First_Name, Last_Name, contact) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with display name
      await updateProfile(user, {
        displayName: `${First_Name} ${Last_Name}`
      });

      // Save additional user data to Firestore
      await this.saveUserToFirestore(user.uid, email, First_Name, Last_Name, contact);

      return {
        success: true,
        user: user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Login with email and password
  static async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Reset password
  static async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: 'Password reset email sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Logout
  static async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // Get current user
  static getCurrentUser() {
    return auth.currentUser;
  }

  // Check if user is logged in
  static isLoggedIn() {
    return !!auth.currentUser;
  }

  // Auth state listener - FIXED
  static onAuthStateChange(callback) {
    if (!auth) {
      console.error('Auth is not initialized');
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  }

  // Save user data to Firestore
  static async saveUserToFirestore(uid, email, First_Name, Last_Name, contact) {
    try {
      const userData = {
        email: email,
        First_Name: First_Name,
        Last_Name: Last_Name,
        contact: contact,
        createdAt: new Date(),
        lastLogin: new Date(),
        uid: uid,
        displayName: `${First_Name} ${Last_Name}`
      };
      
      await setDoc(doc(db, "users", uid), userData);
      console.log("User saved to Firestore successfully");
    } catch (error) {
      console.error("Error saving user to Firestore:", error);
      throw error;
    }
  }

  // Get user-friendly error messages
  static getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered. Please use a different email or login.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
      'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/invalid-credential': 'Invalid login credentials. Please check your email and password.'
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }
}

export default AuthService; // Use default export for consistency