import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; 

class AuthService {

  static async changePassword(currentPassword, newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) return { success: false, error: 'No user is logged in.' };

      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      return { success: true };
    } catch (error) {
      // Removed console.error popup trigger
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  static async register(email, password, First_Name, Last_Name, contact) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${First_Name} ${Last_Name}`
      });

      await this.saveUserToFirestore(user.uid, email, First_Name, Last_Name, contact);

      return { success: true, user: user };
    } catch (error) {
      // Removed console.error popup trigger
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  // --- FIXED LOGIN METHOD ---
  static async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user
      };
    } catch (error) {
      // ❌ REMOVED: console.error('Login error:', error);
      // This stops the full-screen popup from appearing.
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  static async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent successfully' };
    } catch (error) {
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  static async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      // Removed logout error logs
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  }

  static getCurrentUser() {
    return auth.currentUser;
  }

  static isLoggedIn() {
    return !!auth.currentUser;
  }

  static onAuthStateChange(callback) {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  }

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
    } catch (error) {
      // Use console.warn if you want to see it in terminal without a full-screen popup
      console.warn("Firestore Save Error:", error.message);
      throw error;
    }
  }

  static getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password is too weak.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/too-many-requests': 'Too many failed attempts. Try again later.',
      'auth/invalid-credential': 'Invalid login credentials. Please check your email and password.'
    };
    return errorMessages[errorCode] || 'An unexpected error occurred.';
  }
}

export default AuthService;