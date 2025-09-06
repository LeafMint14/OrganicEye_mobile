// Data Models and Firestore Service
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

// Data Models
export const DetectionTypes = {
  INSECT: 'insect',
  CROP: 'crop'
};

export const DetectionStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FALSE_POSITIVE: 'false_positive'
};

// Detection Service
export class DetectionService {
  // Add new detection
  static async addDetection(detectionData) {
    try {
      const docRef = await addDoc(collection(db, 'detections'), {
        ...detectionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all detections for a user
  static async getUserDetections(userId, type = null) {
    try {
      let q = query(
        collection(db, 'detections'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      const querySnapshot = await getDocs(q);
      const detections = [];
      
      querySnapshot.forEach((doc) => {
        detections.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, detections };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get detection by ID
  static async getDetection(detectionId) {
    try {
      const docRef = doc(db, 'detections', detectionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, detection: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Detection not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update detection
  static async updateDetection(detectionId, updateData) {
    try {
      const docRef = doc(db, 'detections', detectionId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete detection
  static async deleteDetection(detectionId) {
    try {
      await deleteDoc(doc(db, 'detections', detectionId));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Upload image to Firebase Storage
  static async uploadDetectionImage(imageUri, userId, detectionId) {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const imageRef = ref(storage, `detections/${userId}/${detectionId}_${Date.now()}.jpg`);
      await uploadBytes(imageRef, blob);
      
      const downloadURL = await getDownloadURL(imageRef);
      return { success: true, url: downloadURL };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Field Service
export class FieldService {
  // Add new field
  static async addField(fieldData) {
    try {
      const docRef = await addDoc(collection(db, 'fields'), {
        ...fieldData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get user fields
  static async getUserFields(userId) {
    try {
      const q = query(
        collection(db, 'fields'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const fields = [];
      
      querySnapshot.forEach((doc) => {
        fields.push({ id: doc.id, ...doc.data() });
      });

      return { success: true, fields };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Analytics Service
export class AnalyticsService {
  // Get detection statistics
  static async getDetectionStats(userId, period = 'week') {
    try {
      const detections = await DetectionService.getUserDetections(userId);
      if (!detections.success) return detections;

      const stats = {
        totalDetections: detections.detections.length,
        insectDetections: detections.detections.filter(d => d.type === DetectionTypes.INSECT).length,
        cropDetections: detections.detections.filter(d => d.type === DetectionTypes.CROP).length,
        confirmedDetections: detections.detections.filter(d => d.status === DetectionStatus.CONFIRMED).length,
        averageConfidence: 0
      };

      if (detections.detections.length > 0) {
        const totalConfidence = detections.detections.reduce((sum, d) => sum + (d.confidence || 0), 0);
        stats.averageConfidence = Math.round(totalConfidence / detections.detections.length);
      }

      return { success: true, stats };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
