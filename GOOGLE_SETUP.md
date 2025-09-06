# Google Sign-In Setup Guide

## Current Status
 Google Sign-In package installed
 App configuration updated
 Service created
 Login/Signup screens updated

## Next Steps to Complete Setup

### 1. Get Google OAuth Credentials
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable Google Sign-In API
4. Go to "Credentials"  "Create Credentials"  "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Copy the "Client ID" (this is your Web Client ID)

### 2. Update the Service
Replace `YOUR_WEB_CLIENT_ID_HERE` in `src/services/GoogleSignInService.js` with your actual Web Client ID.

### 3. Test the App
```bash
npx expo start
```

### 4. For Production (Optional)
- Download `google-services.json` for Android
- Download `GoogleService-Info.plist` for iOS
- Add them to your project root
- Update `app.json` to include the file paths

## Current Error Fixed
- Removed `googleServicesFile` references from `app.json` that were causing parsing errors
- The app should now start without configuration errors

## Testing
The Google Sign-In button will show an error until you add your Web Client ID, but the app will run without crashing.
