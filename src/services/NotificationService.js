import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Check if we're on Expo Go Android (notifications not supported in Expo Go for Android SDK 53+)
const isExpoGoAndroidPlatform = Constants.appOwnership === 'expo' && Platform.OS === 'android';

let Notifications = null;
let NotificationsAvailable = false;

(async () => {
  if (!isExpoGoAndroidPlatform) {
    try {
      const NotifModule = await import('expo-notifications');
      Notifications = NotifModule.default || NotifModule;
      NotificationsAvailable = true;
      
      // Setup handler for when notifications arrive while app is OPEN
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch (error) {
      console.warn('Notifications module not available on this platform');
    }
  }
})();

/**
 * Request notification permissions AND generate Push Token
 * @param {string} userId - Current user's Firebase UID
 * @returns {Promise<boolean>} - True if permissions granted
 */
export const registerForPushNotificationsAsync = async (userId) => {
  if (!Notifications || !Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }

    // Generate the unique Expo Push Token
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId, // Make sure your app.json has a projectId if using EAS
    });
    
    const expoPushToken = tokenData.data;
    console.log('Your Expo Push Token:', expoPushToken);

    // Save the token to Firebase so the Raspberry Pi can find it
    if (userId) {
      await updateDoc(doc(db, 'users', userId), {
        expoPushToken: expoPushToken
      });
      console.log('Push token saved to Firebase profile');
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1f7a4f',
      });
    }

    return true;
  } catch (error) {
    console.warn('Error fetching push token:', error);
    return false;
  }
};

/**
 * Schedule a local notification (Used for Fallback / Foreground alerts)
 */
export const scheduleLocalNotification = async (title, body, data = {}, delay = 0) => {
  if (!Notifications) return;

  try {
    const trigger = delay > 0 ? { seconds: delay } : null;
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority?.HIGH || 'high',
      },
      trigger,
    });
  } catch (error) {
    console.warn('Failed to schedule local notification:', error.message);
  }
};

/**
 * Get user's alert settings from Firestore
 */
export const getUserAlertSettings = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.alertSettings || getDefaultAlertSettings();
    }
    return getDefaultAlertSettings();
  } catch (error) {
    return getDefaultAlertSettings();
  }
};

const getDefaultAlertSettings = () => ({
  highRiskEnabled: true,
  mediumRiskEnabled: true,
  lowRiskEnabled: false,
  minConfidence: 70,
  pushNotifications: !isExpoGoAndroidPlatform,
  insectAlerts: true,
  cropAlerts: true,
  unknownAlerts: false,
  highRiskThreshold: 90,
  mediumRiskThreshold: 75,
});

export const getRiskLevel = (confidence, settings) => {
  if (confidence < settings.minConfidence) return null;
  if (confidence >= settings.highRiskThreshold) return 'high';
  if (confidence >= settings.mediumRiskThreshold) return 'medium';
  return 'low';
};

export const shouldTriggerAlert = (detectionType, confidence, settings) => {
  const typeEnabled = {
    insect: settings.insectAlerts,
    crop: settings.cropAlerts,
    unknown: settings.unknownAlerts,
  };
  if (!typeEnabled[detectionType]) return false;

  const riskLevel = getRiskLevel(confidence, settings);
  const riskEnabled = {
    high: settings.highRiskEnabled,
    medium: settings.mediumRiskEnabled,
    low: settings.lowRiskEnabled,
  };

  return riskLevel && riskEnabled[riskLevel];
};

/**
 * Show immediate notification (Called during manual testing inside the app)
 */
export const showDetectionAlert = async (detectionType, detectionName, confidence, settings = null) => {
  if (!settings) settings = getDefaultAlertSettings();
  if (!shouldTriggerAlert(detectionType, confidence, settings)) return;

  const riskLevel = getRiskLevel(confidence, settings);
  const riskText = riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) : '';
  const title = `🚨 ${riskText} Risk: ${detectionType.charAt(0).toUpperCase() + detectionType.slice(1)} Detected`;
  const body = `${detectionName} detected with ${confidence}% confidence`;

  await scheduleLocalNotification(title, body, {
    type: 'detection',
    detectionType,
    detectionName,
    confidence,
    riskLevel,
  });
};

export const isExpoGoAndroid = () => isExpoGoAndroidPlatform;

export const getNotificationCapabilityDescription = () => {
  if (isExpoGoAndroidPlatform) return 'Local notifications only (Expo Go limited)';
  return 'Push notifications supported';
};