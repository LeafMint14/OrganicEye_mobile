import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Alert, 
  ImageBackground, 
  ActivityIndicator,
  Platform,
  StatusBar,
  Modal
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants'; 

// --- IMPORTS FOR IOT COMMANDS & DIGITAL TWIN ---
import { useAuth } from '../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';

// --- BULLETPROOF EXPO GO CHECK & DYNAMIC IMPORT ---
const isExpoGo = Constants.executionEnvironment === 'storeClient';
let Notifications = null;

// Only load the module into memory if we are NOT in Expo Go
if (!isExpoGo) {
  Notifications = require('expo-notifications');
}

// --- ALGORITHM ARRAY: Exact allowed values for max detections ---
const MAX_DETECTION_OPTIONS = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200];
// UPDATED: Now represents seconds instead of minutes
const INTERVAL_CHOICES = [5, 15, 30]; 

const DetectionSettingsScreen = ({ navigation }) => {
  const [detectionSettings, setDetectionSettings] = useState({
    autoDetection: false,
    realTimeDetection: true,
    highAccuracyMode: false,
    saveDetections: true,
    cloudSync: true,
    detectionThreshold: 0.6, 
    enableMaxDetections: true, 
    maxDetectionsPerDay: 50,
    enableNotifications: true,
    enableSound: true,
    enableVibration: true,
    detectionInterval: 5, // Default to 5 seconds now
    imageQuality: 'high', 
    detectionMode: 'balanced', 
  });
  
  const [loading, setLoading] = useState(true);
  
  // IoT Communication States
  const { user } = useAuth();
  const [pairedPiId, setPairedPiId] = useState(null);
  const [isSendingCommand, setIsSendingCommand] = useState(false);
  
  // Modal & Temp States
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [isIntervalModalVisible, setIsIntervalModalVisible] = useState(false);
  const [pendingInterval, setPendingInterval] = useState(null);
  
  const [tempThreshold, setTempThreshold] = useState(0.6);
  const [isThresholdModalVisible, setIsThresholdModalVisible] = useState(false);

  // Notification Modal States
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [pendingNotification, setPendingNotification] = useState(null);

  const { theme, colors } = useTheme();

  useEffect(() => {
    fetchPairedDevice().then((piId) => {
      loadDetectionSettings(piId);
    });
  }, []);

  const fetchPairedDevice = async () => {
    if (!user) return null;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const piId = userDoc.data().pairedPiId;
        setPairedPiId(piId);
        return piId;
      }
    } catch (error) {
      console.error("Error fetching Pi ID:", error);
    }
    return null;
  };

  const sendDeviceCommand = async (commandName) => {
    if (!pairedPiId) {
      Alert.alert("No Device", "Please pair your Organic Eye IoT device first before sending commands.");
      return;
    }

    setIsSendingCommand(true);
    try {
      await addDoc(collection(db, 'device_commands'), {
        pi_id: pairedPiId,
        command: commandName,
        status: 'pending',
        timestamp: serverTimestamp(),
        issued_by: user.uid
      });
      
      Alert.alert("Command Sent", `The ${commandName.replace('_', ' ').toUpperCase()} command has been sent to your IoT device.`);
    } catch (error) {
      console.error("Error sending command:", error);
      Alert.alert("Error", "Could not reach the device. Check your connection.");
    } finally {
      setIsSendingCommand(false);
    }
  };

  // --- STRICT EXPO GO BYPASS ---
  const applyNotificationSettings = async (settings) => {
    if (isExpoGo || !Notifications) {
      console.log("📱 Expo Go Detected: Module completely bypassed to avoid SDK 53 errors.");
      return; 
    }

    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: settings.enableNotifications,
          shouldPlaySound: settings.enableNotifications && settings.enableSound,
          shouldSetBadge: false,
        }),
      });

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Organic Eye Detections',
          importance: settings.enableNotifications ? Notifications.AndroidImportance.MAX : Notifications.AndroidImportance.NONE,
          vibrationPattern: settings.enableVibration ? [0, 250, 250, 250] : [0],
          lightColor: '#2D6A4F',
          sound: settings.enableSound ? 'default' : null,
        });
      }
    } catch (error) {
      console.warn("System notifications error:", error);
    }
  };

  const loadDetectionSettings = async (currentPiId) => {
    try {
      const savedSettings = await AsyncStorage.getItem('detection_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setDetectionSettings(parsed);
        setTempThreshold(parsed.detectionThreshold || 0.6); 
        await applyNotificationSettings(parsed); 
        
        if (currentPiId) {
          await saveDetectionSettings(parsed, currentPiId);
        }
      } else {
        await applyNotificationSettings(detectionSettings); 
        if (currentPiId) {
          await saveDetectionSettings(detectionSettings, currentPiId);
        }
      }
    } catch (error) {
      console.error('Error loading detection settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDetectionSettings = async (newSettings, currentPiId = pairedPiId) => {
    try {
      await AsyncStorage.setItem('detection_settings', JSON.stringify(newSettings));
      
      if (currentPiId) {
        await setDoc(doc(db, 'device_settings', currentPiId), {
          detectionThreshold: newSettings.detectionThreshold,
          detectionInterval: newSettings.detectionInterval,
          enableMaxDetections: newSettings.enableMaxDetections,
          maxDetectionsPerDay: newSettings.maxDetectionsPerDay,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Error saving detection settings:', error);
    }
  };

  const handleToggle = async (setting, value) => {
    const newSettings = { ...detectionSettings, [setting]: value };
    setDetectionSettings(newSettings);
    await saveDetectionSettings(newSettings, pairedPiId);
    return newSettings; 
  };

  const handleTestDetection = () => {
    Alert.alert(
      'Test Detection',
      'This will wake up the Raspberry Pi camera and force a manual scan right now. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Execute', onPress: () => sendDeviceCommand('test_detection') }
      ]
    );
  };

  const handleCalibrateCamera = () => {
    Alert.alert(
      'Calibrate Camera',
      'This will command the IoT device to recalibrate its camera focus and lighting. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Execute', onPress: () => sendDeviceCommand('calibrate_camera') }
      ]
    );
  };

  const handleResetSettings = () => {
    setIsResetModalVisible(true);
  };

  const executeReset = async () => {
    const resetValues = {
      ...detectionSettings, 
      detectionThreshold: 0.2, 
      detectionInterval: 5, // Reset defaults to 5 seconds
      enableMaxDetections: false, 
      enableNotifications: false, 
      enableSound: false,         
      enableVibration: false,     
    };
    
    setDetectionSettings(resetValues);
    setTempThreshold(0.2); 
    await saveDetectionSettings(resetValues, pairedPiId);
    await applyNotificationSettings(resetValues); 
    setIsResetModalVisible(false); 
  };

  const requestIntervalChange = (interval) => {
    if (interval !== detectionSettings.detectionInterval) {
      setPendingInterval(interval);
      setIsIntervalModalVisible(true);
    }
  };

  const confirmIntervalChange = async () => {
    if (pendingInterval !== null) {
      await handleToggle('detectionInterval', pendingInterval);
    }
    setIsIntervalModalVisible(false);
    setPendingInterval(null);
  };

  const confirmThresholdSave = async () => {
    await handleToggle('detectionThreshold', tempThreshold);
    setIsThresholdModalVisible(false);
  };

  const requestNotificationToggle = (key, value, title) => {
    setPendingNotification({ key, value, title });
    setIsNotificationModalVisible(true);
  };

  const confirmNotificationToggle = async () => {
    if (!pendingNotification) return;
    
    const { key, value } = pendingNotification;

    if (key === 'enableNotifications' && value === true) {
      if (!isExpoGo && Notifications) {
        try {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          
          if (finalStatus !== 'granted') {
            Alert.alert('Permission Denied', 'Please enable notifications for Organic Eye in your device settings.');
            setIsNotificationModalVisible(false);
            setPendingNotification(null);
            return; 
          }
        } catch (error) {
          console.warn("Permission check error:", error);
        }
      } else {
        console.log("📱 Expo Go Detected: Skipping permission request block.");
      }
    }

    const updatedSettings = await handleToggle(key, value);
    await applyNotificationSettings(updatedSettings); 
    
    setIsNotificationModalVisible(false);
    setPendingNotification(null);
  };

  const getThresholdLabel = (value) => {
    const val = Math.round(value * 10); 
    if (val <= 2) return 'Very Low';
    if (val <= 4) return 'Low';
    if (val <= 6) return 'Medium';
    if (val <= 8) return 'High';
    return 'Very High';
  };

  let currentMaxIndex = MAX_DETECTION_OPTIONS.indexOf(detectionSettings.maxDetectionsPerDay);
  if (currentMaxIndex === -1) currentMaxIndex = 5; 

  if (loading) {
    return (
      <ImageBackground source={require('../../assets/backgroundimage.png')} style={styles.bg} resizeMode="cover">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading detection settings...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/backgroundimage.png')} style={styles.bg} resizeMode="cover">
      <ScrollView style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Detection Settings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Detection Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Ionicons name="camera-outline" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>AI Detection Engine</Text>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              Configure how the app detects insects and diseases in your crops
            </Text>
          </View>
        </View>

        {/* Detection Parameters */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Detection Parameters</Text>
          <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
            
            {/* THRESHOLD SLIDER */}
            <View style={styles.sliderItem}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.sliderTitle, { color: colors.text }]}>Detection Threshold</Text>
                <Text style={[styles.sliderValue, { color: colors.primary }]}>
                  {getThresholdLabel(tempThreshold)}
                </Text>
              </View>
              <Text style={[styles.sliderDescription, { color: colors.muted }]}>
                Higher values = more strict detection (fewer false positives)
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0.2} 
                maximumValue={1.0}
                step={0.2}        
                value={tempThreshold}
                onValueChange={(value) => setTempThreshold(value)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="#e0e0e0"
                thumbTintColor={colors.primary}
              />
              
              {tempThreshold !== detectionSettings.detectionThreshold && (
                <TouchableOpacity 
                  style={styles.inlineSaveBtn} 
                  onPress={() => setIsThresholdModalVisible(true)}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#fff" style={{marginRight: 6}} />
                  <Text style={styles.inlineSaveText}>Save New Threshold</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* DETECTION INTERVAL */}
            <View style={styles.sliderItem}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.sliderTitle, { color: colors.text }]}>Detection Interval</Text>
                <Text style={[styles.sliderValue, { color: colors.primary }]}>
                  {detectionSettings.detectionInterval} sec
                </Text>
              </View>
              <Text style={[styles.sliderDescription, { color: colors.muted }]}>
                Focused accuracy pacing for image capture
              </Text>
              <View style={styles.intervalRow}>
                {INTERVAL_CHOICES.map((interval) => {
                  const isActive = detectionSettings.detectionInterval === interval;
                  return (
                    <TouchableOpacity
                      key={interval}
                      style={[
                        styles.intervalBtn, 
                        { borderColor: isActive ? colors.primary : '#e0e0e0' },
                        isActive && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => requestIntervalChange(interval)}
                    >
                      <Text style={{ 
                        color: isActive ? '#fff' : colors.text, 
                        fontWeight: isActive ? 'bold' : 'normal' 
                      }}>
                        {interval} sec
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* MAX DETECTIONS TOGGLE & SLIDER */}
            <View style={styles.sliderItem}>
              <View style={[styles.sliderHeader, { marginBottom: 2 }]}>
                <Text style={[styles.sliderTitle, { color: colors.text }]}>Limit Daily Detections</Text>
                <Switch
                  value={detectionSettings.enableMaxDetections}
                  onValueChange={(value) => handleToggle('enableMaxDetections', value)}
                  trackColor={{ false: '#9ca3af', true: colors.primary }}
                  thumbColor={'#fff'}
                />
              </View>
              
              {detectionSettings.enableMaxDetections ? (
                <>
                  <Text style={[styles.sliderDescription, { color: colors.muted, marginTop: 4 }]}>
                    Limit to prevent excessive usage: <Text style={{fontWeight: 'bold', color: colors.primary}}>{detectionSettings.maxDetectionsPerDay}</Text> per day
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={MAX_DETECTION_OPTIONS.length - 1}
                    step={1}
                    value={currentMaxIndex}
                    onValueChange={(indexValue) => handleToggle('maxDetectionsPerDay', MAX_DETECTION_OPTIONS[indexValue])}
                    minimumTrackTintColor={colors.primary}
                    maximumTrackTintColor="#e0e0e0"
                    thumbTintColor={colors.primary}
                  />
                </>
              ) : (
                <Text style={[styles.sliderDescription, { color: colors.primary, marginTop: 4, fontWeight: 'bold' }]}>
                  Unlimited Detections Active
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
            
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} style={styles.optionIcon} />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Enable Notifications</Text>
                  <Text style={[styles.optionDescription, { color: colors.muted }]}>
                    Get notified when insects are detected
                  </Text>
                </View>
              </View>
              <Switch
                value={detectionSettings.enableNotifications}
                onValueChange={(value) => requestNotificationToggle('enableNotifications', value, 'Push Notifications')}
                trackColor={{ false: '#9ca3af', true: colors.primary }}
                thumbColor={'#fff'}
              />
            </View>

            <View style={[styles.optionItem, { opacity: detectionSettings.enableNotifications ? 1 : 0.5 }]}>
              <View style={styles.optionLeft}>
                <Ionicons name="volume-high-outline" size={20} color={colors.primary} style={styles.optionIcon} />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Sound Alerts</Text>
                  <Text style={[styles.optionDescription, { color: colors.muted }]}>
                    Play sound when detection is complete
                  </Text>
                </View>
              </View>
              <Switch
                disabled={!detectionSettings.enableNotifications}
                value={detectionSettings.enableSound}
                onValueChange={(value) => requestNotificationToggle('enableSound', value, 'Sound Alerts')}
                trackColor={{ false: '#9ca3af', true: colors.primary }}
                thumbColor={'#fff'}
              />
            </View>

            <View style={[styles.optionItem, { opacity: detectionSettings.enableNotifications ? 1 : 0.5 }]}>
              <View style={styles.optionLeft}>
                <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} style={styles.optionIcon} />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Vibration</Text>
                  <Text style={[styles.optionDescription, { color: colors.muted }]}>
                    Vibrate when detection is complete
                  </Text>
                </View>
              </View>
              <Switch
                disabled={!detectionSettings.enableNotifications}
                value={detectionSettings.enableVibration}
                onValueChange={(value) => requestNotificationToggle('enableVibration', value, 'Vibration')}
                trackColor={{ false: '#9ca3af', true: colors.primary }}
                thumbColor={'#fff'}
              />
            </View>

          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary, opacity: isSendingCommand ? 0.7 : 1 }]} 
            onPress={handleTestDetection}
            disabled={isSendingCommand}
          >
            {isSendingCommand ? (
              <ActivityIndicator size="small" color="#fff" style={styles.buttonIcon} />
            ) : (
              <Ionicons name="play-outline" size={20} color="#fff" style={styles.buttonIcon} />
            )}
            <Text style={styles.actionButtonText}>{isSendingCommand ? "Sending..." : "Test Detection"}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#f39c12', opacity: isSendingCommand ? 0.7 : 1 }]} 
            onPress={handleCalibrateCamera}
            disabled={isSendingCommand}
          >
            <Ionicons name="camera-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Calibrate Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#e74c3c' }]} onPress={handleResetSettings}>
            <Ionicons name="refresh-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Reset Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* NOTIFICATION CHANGE MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isNotificationModalVisible}
        onRequestClose={() => {
          setIsNotificationModalVisible(false);
          setPendingNotification(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeaderIcon, { backgroundColor: '#E8F4FD' }]}>
              <Ionicons name={pendingNotification?.value ? "notifications" : "notifications-off"} size={36} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Setting?</Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              Are you sure you want to turn <Text style={{fontWeight: 'bold', color: pendingNotification?.value ? colors.primary : '#e74c3c'}}>{pendingNotification?.value ? 'ON' : 'OFF'}</Text> {pendingNotification?.title}?
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancelBtn]} 
                onPress={() => {
                  setIsNotificationModalVisible(false);
                  setPendingNotification(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: colors.primary }]} 
                onPress={confirmNotificationToggle}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* THRESHOLD SAVE MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isThresholdModalVisible}
        onRequestClose={() => {
          setIsThresholdModalVisible(false);
          setTempThreshold(detectionSettings.detectionThreshold);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeaderIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="options" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Save Threshold?</Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              Are you sure you want to update your AI detection threshold to {getThresholdLabel(tempThreshold)}?
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancelBtn]} 
                onPress={() => {
                  setIsThresholdModalVisible(false);
                  setTempThreshold(detectionSettings.detectionThreshold); // Revert on cancel
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: colors.primary }]} 
                onPress={confirmThresholdSave}
              >
                <Text style={styles.modalConfirmText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* INTERVAL CHANGE CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isIntervalModalVisible}
        onRequestClose={() => setIsIntervalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeaderIcon, { backgroundColor: '#E8F4FD' }]}>
              <Ionicons name="time" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Interval?</Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              Are you sure you want to change the detection interval to {pendingInterval} seconds?
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancelBtn]} 
                onPress={() => {
                  setIsIntervalModalVisible(false);
                  setPendingInterval(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, { backgroundColor: colors.primary }]} 
                onPress={confirmIntervalChange}
              >
                <Text style={styles.modalConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* RESET CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isResetModalVisible}
        onRequestClose={() => setIsResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeaderIcon}>
              <Ionicons name="warning" size={40} color="#e74c3c" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Reset Settings</Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              Are you sure you want to reset all detection parameters and notifications to their lowest/off default values?
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancelBtn]} 
                onPress={() => setIsResetModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalConfirmBtn]} 
                onPress={executeReset}
              >
                <Text style={styles.modalConfirmText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 50, 
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  optionsContainer: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: 15,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
  },
  sliderItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  sliderDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 40,
    marginTop: 5,
  },
  
  // INLINE SAVE BUTTON
  inlineSaveBtn: {
    flexDirection: 'row',
    backgroundColor: '#2D6A4F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 5,
    alignItems: 'center',
    elevation: 2,
  },
  inlineSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },

  intervalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  intervalBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  actionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalHeaderIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FDEDED', 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalCancelBtn: {
    backgroundColor: '#f1f2f6',
  },
  modalConfirmBtn: {
    backgroundColor: '#e74c3c',
  },
  modalCancelText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default DetectionSettingsScreen;