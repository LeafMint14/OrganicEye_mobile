// services/UserService.js
import { 
  doc, 
  getDoc, 
  updateDoc, // <-- We'll use updateDoc (it's better for updates)
  serverTimestamp // <-- We'll use this for timestamps
} from 'firebase/firestore';
import { db } from '../../firebase'; 

class UserService {
  // Get user data from Firestore
  static async getUserData(uid) {
    try {
      console.log('Fetching user data from Firestore for UID:', uid);
      
      const userDoc = await getDoc(doc(db, "users", uid));
      console.log('Firestore document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Retrieved user data:', userData);
        return {
          success: true,
          userData: userData
        };
      } else {
        console.log('No user document found in Firestore');
        return {
          success: false,
          error: 'User data not found in database'
        };
      }
    } catch (error) {
      console.error('Error in getUserData:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user data'
      };
    }
  }

  // --- THIS FUNCTION IS NOW FIXED ---
  static async updateUserData(uid, updatedData) {
    try {
      // 1. Get the reference to the user's document
      const userDocRef = doc(db, "users", uid);

      // 2. Add the 'updatedAt' timestamp automatically
      const dataToSave = {
        ...updatedData,
        updatedAt: serverTimestamp() // This is the reliable way
      };

      // 3. Use 'updateDoc' to update the document (this was the fix)
      // This will only change the fields in dataToSave and won't overwrite
      await updateDoc(userDocRef, dataToSave);
      
      return { success: true };

    } catch (error) {
      console.error('Error updating user data:', error);
      return {
        success: false,
        // Send back the specific error message
        error: error.message || 'Failed to update user data'
      };
    }
  }
}

export default UserService;