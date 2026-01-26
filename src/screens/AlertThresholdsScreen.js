import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ImageBackground, ActivityIndicator, BackHandler,
  TextInput, Modal
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import UserService from '../services/UserService';
import { db } from '../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { showDetectionAlert } from '../services/NotificationService';

// Threshold types configuration
const THRESHOLD_TYPES = {
  highRisk: {
    key: 'highRiskThreshold',
    label: 'High Risk',
    unit: '%',
    min: 0,
    max: 100,
    description: 'Confidence threshold for high-risk detections'
  },
  mediumRisk: {
    key: 'mediumRiskThreshold',
    label: 'Medium Risk',
    unit: '%',
    min: 0,
    max: 100,
    description: 'Confidence threshold for medium-risk detections'
  }
};

const AlertThresholdsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);

  // Modal states for threshold editing
  const [thresholdModalVisible, setThresholdModalVisible] = useState(false);
  const [editingThreshold, setEditingThreshold] = useState(null);
  const [tempThresholdValue, setTempThresholdValue] = useState('');

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});

  // Check if running in Expo Go on Android (push notifications not supported)
  const isExpoGoAndroid = !!(Constants.appOwnership === 'expo' && Constants.platform?.android);

  // Alert threshold settings
  const [settings, setSettings] = useState({
    // Detection thresholds
    highRiskEnabled: true,
    mediumRiskEnabled: true,
    lowRiskEnabled: false,
    minConfidence: 70, // Minimum confidence percentage

    // Notification preferences
    pushNotifications: !isExpoGoAndroid, // Disable by default on Expo Go Android
    inAppAlerts: true,
    emailAlerts: false,

    // Frequency settings
    immediateAlerts: true,
    dailySummary: false,
    weeklyReport: true,

    // Specific detection types
    insectAlerts: true,
    cropAlerts: true,
    unknownAlerts: false,

    // Threshold values
    highRiskThreshold: 90, // Confidence for high risk
    mediumRiskThreshold: 75, // Confidence for medium risk
  });

  useEffect(() => {
    loadAlertSettings();
  }, [user]);

  useEffect(() => {
    const backAction = () => {
      if (hasUnsavedChanges()) {
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved changes. Do you want to save them before leaving?',
          [
            { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Save',
              onPress: () => saveAlertSettings(true) // Pass true to navigate back after save
            }
          ]
        );
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [settings, originalSettings]);

  const hasUnsavedChanges = () => {
    if (!originalSettings) return false;
    return JSON.stringify(settings) !== JSON.stringify(originalSettings);
  };

  const handlePushNotificationToggle = async (value) => {
    if (value && isExpoGoAndroid) {
      // Show message that push notifications aren't available in Expo Go on Android
      Alert.alert(
        'Push Notifications Unavailable',
        'Push notifications are not supported in Expo Go on Android. To use push notifications, please create a development build.\n\nLearn more: https://docs.expo.dev/develop/development-builds/introduction/',
        [{ text: 'OK' }]
      );
      return; // Don't enable
    }

    // For other platforms, just enable without requesting permissions
    // (permissions are handled in NotificationService if needed)
    updateSetting('pushNotifications', value);
  };

  const loadAlertSettings = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        let loadedSettings = { ...settings };
        if (userData.alertSettings) {
          loadedSettings = { ...settings, ...userData.alertSettings };
        }
        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
      } else {
        setOriginalSettings(settings);
      }
    } catch (error) {
      console.error('Error loading alert settings:', error);
      Alert.alert('Error', 'Failed to load alert settings');
      setOriginalSettings(settings);
    } finally {
      setLoading(false);
    }
  };

  const saveAlertSettings = async (shouldNavigateBack = false) => {
    if (!user?.uid) return;

    // Validate settings before saving
    if (!validateSettings()) {
      Alert.alert('Validation Error', 'Please fix the validation errors before saving.');
      return;
    }

    Alert.alert(
      'Confirm Changes',
      'Are you sure you want to save these alert threshold settings? Changes will take effect immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save Settings',
          style: 'default',
          onPress: async () => {
            setSaving(true);
            try {
              await UserService.updateUserData(user.uid, {
                alertSettings: settings
              });
              setOriginalSettings(settings); // Update original settings after save
              Alert.alert('Success', 'Alert settings saved successfully', [
                {
                  text: 'OK',
                  onPress: () => {
                    if (shouldNavigateBack) {
                      navigation.goBack();
                    }
                  }
                }
              ]);
            } catch (error) {
              console.error('Error saving alert settings:', error);
              Alert.alert('Error', 'Failed to save alert settings');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Clear validation errors when user makes changes
    if (validationErrors[key]) {
      setValidationErrors(prev => ({ ...prev, [key]: undefined }));
    }
  };

  // Threshold editing functions
  const openThresholdEditor = (thresholdType, currentValue) => {
    setEditingThreshold(thresholdType);
    setTempThresholdValue(currentValue.toString());
    setThresholdModalVisible(true);
  };

  const saveThresholdValue = () => {
    const value = parseInt(tempThresholdValue);
    if (isNaN(value) || value < 0 || value > 100) {
      Alert.alert('Invalid Value', 'Please enter a valid percentage between 0 and 100.');
      return;
    }

    // Validate threshold relationships
    if (editingThreshold?.key === 'highRiskThreshold' && value <= settings.mediumRiskThreshold) {
      Alert.alert('Invalid Threshold', 'High risk threshold must be greater than medium risk threshold.');
      return;
    }
    if (editingThreshold?.key === 'mediumRiskThreshold' && (value <= settings.minConfidence || value >= settings.highRiskThreshold)) {
      Alert.alert('Invalid Threshold', 'Medium risk threshold must be between minimum confidence and high risk threshold.');
      return;
    }
    if (editingThreshold?.key === 'minConfidence' && value >= settings.mediumRiskThreshold) {
      Alert.alert('Invalid Threshold', 'Minimum confidence must be less than medium risk threshold.');
      return;
    }

    updateSetting(editingThreshold.key, value);
    setThresholdModalVisible(false);
    setEditingThreshold(null);
  };

  // Validate all settings
  const validateSettings = () => {
    const errors = {};

    if (settings.highRiskThreshold <= settings.mediumRiskThreshold) {
      errors.highRiskThreshold = 'Must be greater than medium risk threshold';
    }
    if (settings.mediumRiskThreshold <= settings.minConfidence) {
      errors.mediumRiskThreshold = 'Must be greater than minimum confidence';
    }
    if (settings.minConfidence < 0 || settings.minConfidence > 100) {
      errors.minConfidence = 'Must be between 0 and 100';
    }
    if (settings.highRiskThreshold < 0 || settings.highRiskThreshold > 100) {
      errors.highRiskThreshold = 'Must be between 0 and 100';
    }
    if (settings.mediumRiskThreshold < 0 || settings.mediumRiskThreshold > 100) {
      errors.mediumRiskThreshold = 'Must be between 0 and 100';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'Are you sure you want to reset all alert settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              highRiskEnabled: true,
              mediumRiskEnabled: true,
              lowRiskEnabled: false,
              minConfidence: 70,
              pushNotifications: true,
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
          }
        }
      ]
    );
  };

  const testAlert = async () => {
    Alert.alert(
      'Test Alert',
      'Choose a test scenario:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'High Risk Insect',
          onPress: () => showDetectionAlert('insect', 'Aphid', 95, settings)
        },
        {
          text: 'Medium Risk Crop',
          onPress: () => showDetectionAlert('crop', 'Wilting', 80, settings)
        },
        {
          text: 'Low Risk Detection',
          onPress: () => showDetectionAlert('unknown', 'Unknown Object', 60, settings)
        }
      ]
    );
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/backgroundimage.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1f7a4f" />
          <Text style={styles.loadingText}>Loading alert settings...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/backgroundimage.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alert Thresholds</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={testAlert} style={styles.testButton}>
              <Ionicons name="notifications" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={resetToDefaults} style={styles.resetButton}>
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Detection Thresholds Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Detection Thresholds</Text>
          
          {/* Threshold Summary */}
          <View style={styles.thresholdSummary}>
            <Text style={[styles.summaryText, { color: colors.muted }]}>
              Current ranges: Low (≥{settings.minConfidence}%), Medium (≥{settings.mediumRiskThreshold}%), High (≥{settings.highRiskThreshold}%)
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>High Risk Alerts</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Alert for high-risk detections (
                <Text
                  style={[styles.thresholdValue, { color: colors.primary }]}
                  onPress={() => openThresholdEditor(THRESHOLD_TYPES.highRisk, settings.highRiskThreshold)}
                >
                  ≥{settings.highRiskThreshold}%
                </Text>
                {' '}confidence)
              </Text>
            </View>
            <Switch
              value={settings.highRiskEnabled}
              onValueChange={(value) => updateSetting('highRiskEnabled', value)}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.highRiskEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Medium Risk Alerts</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Alert for medium-risk detections (
                <Text
                  style={[styles.thresholdValue, { color: colors.primary }]}
                  onPress={() => openThresholdEditor(THRESHOLD_TYPES.mediumRisk, settings.mediumRiskThreshold)}
                >
                  ≥{settings.mediumRiskThreshold}%
                </Text>
                {' '}confidence)
              </Text>
            </View>
            <Switch
              value={settings.mediumRiskEnabled}
              onValueChange={(value) => updateSetting('mediumRiskEnabled', value)}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.mediumRiskEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Low Risk Alerts</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Alert for low-risk detections
              </Text>
            </View>
            <Switch
              value={settings.lowRiskEnabled}
              onValueChange={(value) => updateSetting('lowRiskEnabled', value)}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.lowRiskEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Detection Types Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Detection Types</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Insect Detections</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Receive alerts for insect identifications
              </Text>
            </View>
            <Switch
              value={settings.insectAlerts}
              onValueChange={(value) => updateSetting('insectAlerts', value)}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.insectAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Crop Health</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Receive alerts for crop condition assessments
              </Text>
            </View>
            <Switch
              value={settings.cropAlerts}
              onValueChange={(value) => updateSetting('cropAlerts', value)}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.cropAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Unknown Detections</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Alert for unidentified objects
              </Text>
            </View>
            <Switch
              value={settings.unknownAlerts}
              onValueChange={(value) => updateSetting('unknownAlerts', value)}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.unknownAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notification Preferences Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notification Preferences</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Receive push notifications on your device
                {isExpoGoAndroid && (
                  <Text style={{ color: '#ff6b6b', fontSize: 12 }}>
                    {'\n'}Not available in Expo Go on Android. Requires development build.
                  </Text>
                )}
              </Text>
            </View>
            <Switch
              value={settings.pushNotifications}
              onValueChange={handlePushNotificationToggle}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.pushNotifications ? '#fff' : '#f4f3f4'}
              disabled={isExpoGoAndroid}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>In-App Alerts</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Show alerts within the app
              </Text>
            </View>
            <Switch
              value={settings.inAppAlerts}
              onValueChange={(value) => updateSetting('inAppAlerts', value)}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.inAppAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Email Alerts</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Receive email notifications
              </Text>
            </View>
            <Switch
              value={settings.emailAlerts}
              onValueChange={(value) => updateSetting('emailAlerts', value)}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.emailAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Frequency Settings Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Alert Frequency</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Immediate Alerts</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Get notified immediately when thresholds are met
              </Text>
            </View>
            <Switch
              value={settings.immediateAlerts}
              onValueChange={(value) => updateSetting('immediateAlerts', value)}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.immediateAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Daily Summary</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Receive a daily summary of all detections
              </Text>
            </View>
            <Switch
              value={settings.dailySummary}
              onValueChange={(value) => updateSetting('dailySummary', value)}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.dailySummary ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Weekly Report</Text>
              <Text style={[styles.settingSubtitle, { color: colors.muted }]}>
                Get a weekly analytics report
              </Text>
            </View>
            <Switch
              value={settings.weeklyReport}
              onValueChange={(value) => updateSetting('weeklyReport', value)}
              trackColor={{ false: '#767577', true: '#1f7a4f' }}
              thumbColor={settings.weeklyReport ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={saveAlertSettings}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Threshold Editing Modal */}
      <Modal
        visible={thresholdModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setThresholdModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit {editingThreshold?.label} Threshold
              </Text>
              <TouchableOpacity
                onPress={() => setThresholdModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalSubtitle, { color: colors.muted }]}>
                Set the threshold value for {editingThreshold?.label.toLowerCase()} alerts.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Threshold Value ({editingThreshold?.unit})
                </Text>
                <TextInput
                  style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
                  value={tempThresholdValue}
                  onChangeText={setTempThresholdValue}
                  keyboardType="numeric"
                  placeholder={`Enter ${editingThreshold?.label.toLowerCase()} threshold`}
                  placeholderTextColor={colors.muted}
                />
                {validationErrors.threshold && (
                  <Text style={styles.errorText}>{validationErrors.threshold}</Text>
                )}
              </View>

              <View style={styles.thresholdInfo}>
                <Text style={[styles.infoText, { color: colors.muted }]}>
                  Current: {settings[editingThreshold?.key]} {editingThreshold?.unit}
                </Text>
                <Text style={[styles.infoText, { color: colors.muted }]}>
                  Range: {editingThreshold?.min} - {editingThreshold?.max} {editingThreshold?.unit}
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setThresholdModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveThresholdValue}
              >
                <Text style={styles.saveButtonText}>Save Threshold</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  loadingText: { marginTop: 16, fontSize: 16, color: '#fff', fontWeight: '500' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(31, 122, 79, 0.9)',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  headerButtons: { flexDirection: 'row' },
  testButton: { padding: 8, marginRight: 8 },
  resetButton: { padding: 8 },
  section: {
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  thresholdSummary: { marginBottom: 16, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8 },
  summaryText: { fontSize: 14, lineHeight: 20 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  settingInfo: { flex: 1, marginRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  settingSubtitle: { fontSize: 14, lineHeight: 18 },
  saveSection: { padding: 16, paddingBottom: 32 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f7a4f',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  thresholdValue: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalCloseButton: { padding: 4 },
  modalBody: { padding: 16 },
  modalSubtitle: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  errorText: { color: '#dc3545', fontSize: 14, marginTop: 4 },
  thresholdInfo: { marginBottom: 16 },
  infoText: { fontSize: 14, marginBottom: 4 },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: { backgroundColor: '#6c757d' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saveButton: { backgroundColor: '#1f7a4f' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default AlertThresholdsScreen;