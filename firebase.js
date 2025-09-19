import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBjjCpnHhb8rfl0ghbPRAkryta2CvzQSnA",
  authDomain: "organiceye-43911.firebaseapp.com",
  projectId: "organiceye-43911",
  storageBucket: "organiceye-43911.firebasestorage.app",
  messagingSenderId: "76863181539",
  appId: "1:76863181539:web:297bc60a9113d963686bd6",
  measurementId: "G-S38WN2T42R"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Export directly (no renaming needed)
export { app, auth, db };
export default app;