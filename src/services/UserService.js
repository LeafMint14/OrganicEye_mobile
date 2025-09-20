// services/UserService.js
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase'; 

class UserService {
  // Get user data from Firestore
//   static async getUserData(uid) {
//     try {
//       const userDoc = await getDoc(doc(db, "users", uid));
//       if (userDoc.exists()) {
//         return {
//           success: true,
//           userData: userDoc.data()
//         };
//       } else {
//         return {
//           success: false,
//           error: 'User data not found'
//         };
//       }
//     } catch (error) {
//       console.error('Error getting user data:', error);
//       return {
//         success: false,
//         error: 'Failed to fetch user data'
//       };
//     }
//   }

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

  // Update user data
  static async updateUserData(uid, updatedData) {
    try {
      await setDoc(doc(db, "users", uid), updatedData, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error updating user data:', error);
      return {
        success: false,
        error: 'Failed to update user data'
      };
    }
  }
}

export default UserService;