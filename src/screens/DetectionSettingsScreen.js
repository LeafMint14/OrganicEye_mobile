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
  Slider
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DetectionSettingsScreen = ({ navigation }) => {
  const [detectionSettings, setDetectionSettings] = useState({
    autoDetection: false,
    realTimeDetection: true,
    highAccuracyMode: false,
    saveDetections: true,
    cloudSync: true,
    detectionThreshold: 0.7,
    maxDetectionsPerDay: 50,
    enableNotifications: true,
    enableSound: true,
    enableVibration: true,
    detectionInterval: 5, // minutes
    imageQuality: 'high', // low, medium, high
    detectionMode: 'balanced', // fast, balanced, accurate
  });
  const [loading, setLoading] = useState(true);
  const { theme, colors } = useTheme();

  useEffect(() => {
    loadDetectionSettings();
  }, []);

  const loadDetectionSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('detection_settings');
      if (savedSettings) {
        setDetectionSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading detection settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDetectionSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('detection_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving detection settings:', error);
    }
  };

  const handleToggle = async (setting, value) => {
    const newSettings = { ...detectionSettings, [setting]: value };
    setDetectionSettings(newSettings);
    await saveDetectionSettings(newSettings);
  };

  const handleSliderChange = async (setting, value) => {
    const newSettings = { ...detectionSettings, [setting]: value };
    setDetectionSettings(newSettings);
    await saveDetectionSettings(newSettings);
  };

  const handleTestDetection = () => {
    Alert.alert(
      'Test Detection',
      'This will test the current detection settings with a sample image. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Test', onPress: () => console.log('Testing detection...') }
      ]
    );
  };

  const handleCalibrateCamera = () => {
    Alert.alert(
      'Calibrate Camera',
      'This will help optimize the camera for better detection accuracy. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Calibrate', onPress: () => console.log('Calibrating camera...') }
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Detection Settings',
      'Are you sure you want to reset all detection settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const defaultSettings = {
              autoDetection: false,
              realTimeDetection: true,
              highAccuracyMode: false,
              saveDetections: true,
              cloudSync: true,
              detectionThreshold: 0.7,
              maxDetectionsPerDay: 50,
              enableNotifications: true,
              enableSound: true,
              enableVibration: true,
              detectionInterval: 5,
              imageQuality: 'high',
              detectionMode: 'balanced',
            };
            setDetectionSettings(defaultSettings);
            await saveDetectionSettings(defaultSettings);
          }
        }
      ]
    );
  };

  const getThresholdLabel = (value) => {
    if (value < 0.3) return 'Very Low';
    if (value < 0.5) return 'Low';
    if (value < 0.7) return 'Medium';
    if (value < 0.9) return 'High';
    return 'Very High';
  };

  const getIntervalLabel = (value) => {
    if (value < 2) return 'Very Fast';
    if (value < 5) return 'Fast';
    if (value < 10) return 'Normal';
    if (value < 20) return 'Slow';
    return 'Very Slow';
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/backgroundimage.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading detection settings...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/backgroundimage.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
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

        {/* Basic Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Settings</Text>
          <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Ionicons name="scan-outline" size={20} color={colors.primary} style={styles.optionIcon} />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Auto Detection</Text>
                  <Text style={[styles.optionDescription, { color: colors.muted }]}>
                    Automatically detect insects when camera is opened
                  </Text>
                </View>
              </View>
              <Switch
                value={detectionSettings.autoDetection}
                onValueChange={(value) => handleToggle('autoDetection', value)}
                trackColor={{ false: '#9ca3af', true: colors.primary }}
                thumbColor={'#fff'}
              />
            </View>

            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Ionicons name="flash-outline" size={20} color={colors.primary} style={styles.optionIcon} />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>Real-time Detection</Text>
                  <Text style={[styles.optionDescription, { color: colors.muted }]}>
                    Process images in real-time for instant results
                  </Text>
                </View>
              </View>
              <Switch
                value={detectionSettings.realTimeDetection}
                onValueChange={(value) => handleToggle('realTimeDetection', value)}
                trackColor={{ false: '#9ca3af', true: colors.primary }}
                thumbColor={'#fff'}
              />
            </View>

            <View style={styles.optionItem}>
              <View style={styles.optionLeft}>
                <Ionicons name="diamond-outline" size={20} color={colors.primary} style={styles.optionIcon} />
                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>High Accuracy Mode</Text>
                  <Text style={[styles.optionDescription, { color: colors.muted }]}>
                    Use advanced algorithms for maximum accuracy (slower)
                  </Text>
                </View>
              </View>
              <Switch
                value={detectionSettings.highAccuracyMode}
                onValueChange={(value) => handleToggle('highAccuracyMode', value)}
                trackColor={{ false: '#9ca3af', true: colors.primary }}
                thumbColor={'#fff'}
              />
            </View>
          </View>
        </View>

        {/* Detection Parameters */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Detection Parameters</Text>
          <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
            <View style={styles.sliderItem}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.sliderTitle, { color: colors.text }]}>Detection Threshold</Text>
                <Text style={[styles.sliderValue, { color: colors.primary }]}>
                  {getThresholdLabel(detectionSettings.detectionThreshold)}
                </Text>
              </View>
              <Text style={[styles.sliderDescription, { color: colors.muted }]}>
                Higher values = more strict detection (fewer false positives)
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={1.0}
                value={detectionSettings.detectionThreshold}
                onValueChange={(value) => handleSliderChange('detectionThreshold', value)}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="#e0e0e0"
                thumbStyle={{ backgroundColor: colors.primary }}
              />
            </View>

            <View style={styles.sliderItem}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.sliderTitle, { color: colors.text }]}>Detection Interval</Text>
                <Text style={[styles.sliderValue, { color: colors.primary }]}>
                  {detectionSettings.detectionInterval} min
                </Text>
              </View>
              <Text style={[styles.sliderDescription, { color: colors.muted }]}>
                How often to run detection in auto mode
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={30}
                value={detectionSettings.detectionInterval}
                onValueChange={(value) => handleSliderChange('detectionInterval', Math.round(value))}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="#e0e0e0"
                thumbStyle={{ backgroundColor: colors.primary }}
              />
            </View>

            <View style={styles.sliderItem}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.sliderTitle, { color: colors.text }]}>Max Detections Per Day</Text>
                <Text style={[styles.sliderValue, { color: colors.primary }]}>
                  {detectionSettings.maxDetectionsPerDay}
                </Text>
              </View>
              <Text style={[styles.sliderDescription, { color: colors.muted }]}>
                Limit to prevent excessive usage
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={200}
                value={detectionSettings.maxDetectionsPerDay}
                onValueChange={(value) => handleSliderChange('maxDetectionsPerDay', Math.round(value))}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="#e0e0e0"
                thumbStyle={{ backgroundColor: colors.primary }}
              />
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
                onValueChange={(value) => handleToggle('enableNotifications', value)}
                trackColor={{ false: '#9ca3af', true: colors.primary }}
                thumbColor={'#fff'}
              />
            </View>

            <View style={styles.optionItem}>
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
                value={detectionSettings.enableSound}
                onValueChange={(value) => handleToggle('enableSound', value)}
                trackColor={{ false: '#9ca3af', true: colors.primary }}
                thumbColor={'#fff'}
              />
            </View>

            <View style={styles.optionItem}>
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
                value={detectionSettings.enableVibration}
                onValueChange={(value) => handleToggle('enableVibration', value)}
                trackColor={{ false: '#9ca3af', true: colors.primary }}
                thumbColor={'#fff'}
              />
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleTestDetection}
          >
            <Ionicons name="play-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Test Detection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f39c12' }]}
            onPress={handleCalibrateCamera}
          >
            <Ionicons name="camera-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Calibrate Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
            onPress={handleResetSettings}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Reset Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingTop: 20,
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
});

export default DetectionSettingsScreen;
