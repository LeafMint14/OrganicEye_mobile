# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "organic-eye-app"
4. Enable Google Analytics (optional)
5. Create project

## 2. Enable Authentication

1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Save

## 3. Create Firestore Database

1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)
5. Done

## 4. Enable Storage

1. Go to "Storage"
2. Click "Get started"
3. Choose "Start in test mode"
4. Select same location as Firestore
5. Done

## 5. Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Add app"  Web app (</>) icon
4. Register app with nickname: "organic-eye-web"
5. Copy the config object

## 6. Update Firebase Config

Replace the placeholder config in `src/config/firebase.js` with your actual config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

## 7. Firestore Security Rules (Optional - for production)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /detections/{detectionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /fields/{fieldId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## 8. Storage Security Rules (Optional - for production)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /detections/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Database Structure

### Collections:

1. **users** - User profiles
   - uid (string)
   - email (string)
   - fullName (string)
   - role (string) - "farmer"
   - createdAt (timestamp)
   - profileImage (string, optional)

2. **detections** - Insect/Crop detections
   - userId (string)
   - type (string) - "insect" or "crop"
   - name (string) - detected name
   - confidence (number) - 0-100
   - imageUrl (string)
   - location (object) - {lat, lng}
   - fieldId (string, optional)
   - status (string) - "pending", "confirmed", "false_positive"
   - notes (string, optional)
   - createdAt (timestamp)
   - updatedAt (timestamp)

3. **fields** - User's fields/farms
   - userId (string)
   - name (string)
   - location (object) - {lat, lng}
   - area (number) - in hectares
   - cropType (string)
   - createdAt (timestamp)
   - updatedAt (timestamp)

## Next Steps

1. Update the Firebase config with your actual values
2. Test authentication in the app
3. Add real data to Firestore
4. Implement image upload functionality
5. Connect all screens to Firebase data
