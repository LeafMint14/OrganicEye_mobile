import Constants from 'expo-constants';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

// Check if we're on Expo Go Android (notifications not supported)
const isExpoGoAndroidPlatform = Constants.appOwnership === 'expo' && Constants.platform?.android;

// Dynamically import Notifications only if not on Expo Go Android
let Notifications = null;
let NotificationsAvailable = false;

(async () => {
  if (!isExpoGoAndroidPlatform) {
    try {
      const NotifModule = await import('expo-notifications');
      Notifications = NotifModule.default || NotifModule;
      NotificationsAvailable = true;
    } catch (error) {
      console.warn('Notifications module not available on this platform');
    }
  }
})();

/**
 * Notification utility functions for OrganicEye app
 * Handles both local notifications (works in Expo Go) and push notifications (development builds)
 */

// Configure notification handler (only if Notifications module becomes available)
setTimeout(() => {
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    } catch (error) {
      console.warn('Notification handler setup skipped');
    }
  }
}, 100);

/**
 * Request notification permissions
 * @returns {Promise<boolean>} - True if permissions granted
 */
export const requestNotificationPermissions = async () => {
  // Skip if Notifications not available (Expo Go Android)
  if (!Notifications) {
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    // Silently fail on unsupported platforms
    console.warn('Notification permission request not supported on this platform');
    return true; // Allow local notifications to continue
  }
};

/**
 * Schedule a local notification (works in Expo Go)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 * @param {number} delay - Delay in seconds (optional)
 */
export const scheduleLocalNotification = async (title, body, data = {}, delay = 0) => {
  // Skip if Notifications not available
  if (!Notifications) {
    console.warn('Notifications not available on this platform');
    return;
  }

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
    console.warn('Failed to schedule notification:', error.message);
  }
};

/**
 * Get user's alert settings from Firestore
 * @param {string} userId - User ID
 * @returns {Promise<object>} - Alert settings object
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
    console.error('Error fetching alert settings:', error);
    return getDefaultAlertSettings();
  }
};

/**
 * Get default alert settings
 * @returns {object} - Default settings
 */
const getDefaultAlertSettings = () => ({
  highRiskEnabled: true,
  mediumRiskEnabled: true,
  lowRiskEnabled: false,
  minConfidence: 70,
  // Disable push notifications only on Expo Go Android where they are unsupported
  pushNotifications: !isExpoGoAndroidPlatform,
  inAppAlerts: true,
  emailAlerts: false,
  immediateAlerts: true,
  dailySummary: false,
  weeklyReport: true,
  insectAlerts: true,
  cropAlerts: true,
  unknownAlerts: false,
  highRiskThreshold: 90,
  mediumRiskThreshold: 75,
});

/**
 * Determine risk level based on confidence and thresholds
 * @param {number} confidence - Detection confidence percentage
 * @param {object} settings - User alert settings
 * @returns {string|null} - Risk level ('high', 'medium', 'low') or null if below minimum
 */
export const getRiskLevel = (confidence, settings) => {
  if (confidence < settings.minConfidence) {
    return null; // Below minimum confidence, no alert
  }

  if (confidence >= settings.highRiskThreshold) {
    return 'high';
  } else if (confidence >= settings.mediumRiskThreshold) {
    return 'medium';
  } else {
    return 'low';
  }
};

/**
 * Check if alert should be triggered for a detection
 * @param {string} detectionType - 'insect', 'crop', or 'unknown'
 * @param {number} confidence - Detection confidence percentage
 * @param {object} settings - User alert settings
 * @returns {boolean} - True if alert should be triggered
 */
export const shouldTriggerAlert = (detectionType, confidence, settings) => {
  // Check if alerts are enabled for this detection type
  const typeEnabled = {
    insect: settings.insectAlerts,
    crop: settings.cropAlerts,
    unknown: settings.unknownAlerts,
  };

  if (!typeEnabled[detectionType]) {
    return false;
  }

  const riskLevel = getRiskLevel(confidence, settings);

  // Check if the risk level is enabled
  const riskEnabled = {
    high: settings.highRiskEnabled,
    medium: settings.mediumRiskEnabled,
    low: settings.lowRiskEnabled,
  };

  return riskLevel && riskEnabled[riskLevel] && settings.immediateAlerts;
};

/**
 * Show immediate notification for detection alerts
 * @param {string} detectionType - 'insect', 'crop', or 'unknown'
 * @param {string} detectionName - Name of detected item
 * @param {number} confidence - Confidence percentage
 * @param {object} settings - User alert settings (optional)
 */
export const showDetectionAlert = async (detectionType, detectionName, confidence, settings = null) => {
  if (!settings) {
    settings = getDefaultAlertSettings();
  }

  if (!shouldTriggerAlert(detectionType, confidence, settings)) {
    return; // Don't show alert if conditions not met
  }

  const riskLevel = getRiskLevel(confidence, settings);
  const riskText = riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) : '';

  const title = `${riskText} Risk: ${detectionType.charAt(0).toUpperCase() + detectionType.slice(1)} Detected`;
  const body = `${detectionName} detected with ${confidence}% confidence`;

  await scheduleLocalNotification(title, body, {
    type: 'detection',
    detectionType,
    detectionName,
    confidence,
    riskLevel,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Process a new detection and trigger alerts if needed
 * @param {object} detection - Detection data
 * @param {string} userId - User ID
 */
export const processDetectionAlert = async (detection, userId) => {
  try {
    const settings = await getUserAlertSettings(userId);
    const { type, detection: detectionName, confidence, score } = detection;

    // Normalize confidence value
    const confValue = score || confidence || 0;

    // Map detection type
    const detectionType = type?.toLowerCase() === 'insect' ? 'insect' :
                         type?.toLowerCase() === 'crop' ? 'crop' : 'unknown';

    await showDetectionAlert(detectionType, detectionName || 'Unknown', confValue, settings);
  } catch (error) {
    console.error('Error processing detection alert:', error);
  }
};

/**
 * Check if running in Expo Go on Android (limited notification support)
 * @returns {boolean}
 */
export const isExpoGoAndroid = () => {
  return Constants.appOwnership === 'expo' && Constants.platform?.android;
};

/**
 * Get notification capability description
 * @returns {string}
 */
export const getNotificationCapabilityDescription = () => {
  if (isExpoGoAndroid()) {
    return 'Local notifications (Expo Go limited support)';
  }
  return 'Push notifications supported';
};