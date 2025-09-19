// // Firebase configuration
// import { initializeApp } from 'firebase/app';
// import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// // Your Firebase config - Replace with your actual config
// const firebaseConfig = {
//   apiKey: "AIzaSyCLG3LhYJvMbEn9p-mRb_Hw4wGaazNS6a8",
//   authDomain: "organic-eye-29b32.firebaseapp.com",
//   projectId: "organic-eye-29b32",
//   storageBucket: "organic-eye-29b32.firebasestorage.app",
//   messagingSenderId: "646575791270",
//   appId: "1:646575791270:web:b0269554f412df67d52867",
//   measurementId: "G-W75STTYXW9"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);

// // Initialize Auth with AsyncStorage persistence
// const auth = initializeAuth(app, {
//   persistence: getReactNativePersistence(AsyncStorage)
// });

// // Initialize Firestore
// const db = getFirestore(app);

// // Initialize Storage
// const storage = getStorage(app);

// export { auth, db, storage };
// export default app;
