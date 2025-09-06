# CropGuard - Mobile Crop Detection App

A React Native mobile application for detecting and monitoring crop health and insect infestations.

## Features

- **Welcome Screen**: Introduction and navigation to login/signup
- **Authentication**: Login and signup screens with form validation
- **Home Screen**: Dashboard with quick actions and recent activity
- **Insect Detection**: Camera-based insect detection with results display
- **Crop Monitoring**: Field management and crop health tracking
- **Analytics**: Data visualization and trend analysis
- **Settings**: App configuration and user preferences

## Technology Stack

- React Native with Expo
- React Navigation (Stack & Bottom Tabs)
- React Hooks for state management
- Expo Vector Icons

## Project Structure

```
src/
 screens/
    WelcomeScreen.js
    LoginScreen.js
    SignupScreen.js
    HomeScreen.js
    InsectScreen.js
    CropScreen.js
    AnalyticsScreen.js
    SettingsScreen.js
 navigation/
    AppNavigator.js
 assets/
     images/
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on device/simulator:
   ```bash
   npm run android  # for Android
   npm run ios      # for iOS (macOS only)
   npm run web      # for web
   ```

## Screens Overview

### Welcome Screen
- App introduction and branding
- Navigation to login/signup

### Authentication Screens
- Login with email/password
- Signup with form validation
- Password confirmation

### Home Screen
- Dashboard with statistics
- Quick action buttons
- Recent activity feed

### Insect Detection
- Camera preview for detection
- Detection results with confidence scores
- Risk level indicators
- Detection history

### Crop Monitoring
- Field selection and management
- Crop health metrics
- Weather information
- Quick action buttons

### Analytics
- Data visualization
- Trend analysis
- Export functionality
- Key insights

### Settings
- App preferences
- Account management
- Support options
- Logout functionality

## Future Enhancements

- Real camera integration for insect detection
- Backend API integration
- Push notifications
- Data persistence
- Advanced analytics charts
- User authentication with Firebase
- Cloud data synchronization

## Development Notes

This is a frontend-only implementation. Backend services, database integration, and real camera functionality would be added in future iterations.
