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
  ActivityIndicator 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PrivacySettingsScreen = ({ navigation }) => {
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    dataCollection: true,
    analytics: true,
    crashReporting: true,
    locationTracking: false,
    cameraAccess: true,
    microphoneAccess: false,
    contactsAccess: false,
    notifications: true,
    marketingEmails: false,
  });
  const [loading, setLoading] = useState(true);
  const { theme, colors } = useTheme();

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('privacy_settings');
      if (savedSettings) {
        setPrivacySettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('privacy_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  };

  const handleToggle = async (setting, value) => {
    const newSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(newSettings);
    await savePrivacySettings(newSettings);
  };

  const handleResetToDefaults = () => {
    Alert.alert(
      'Reset Privacy Settings',
      'Are you sure you want to reset all privacy settings to their default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const defaultSettings = {
              profileVisibility: true,
              dataCollection: true,
              analytics: true,
              crashReporting: true,
              locationTracking: false,
              cameraAccess: true,
              microphoneAccess: false,
              contactsAccess: false,
              notifications: true,
              marketingEmails: false,
            };
            setPrivacySettings(defaultSettings);
            await savePrivacySettings(defaultSettings);
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your privacy data will be exported to a JSON file. This includes all your privacy settings and preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => console.log('Exporting privacy data...') }
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your privacy settings and personal data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('privacy_settings');
              setPrivacySettings({
                profileVisibility: true,
                dataCollection: true,
                analytics: true,
                crashReporting: true,
                locationTracking: false,
                cameraAccess: true,
                microphoneAccess: false,
                contactsAccess: false,
                notifications: true,
                marketingEmails: false,
              });
              Alert.alert('Success', 'All privacy data has been deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const privacyOptions = [
    {
      title: 'Profile & Visibility',
      items: [
        {
          key: 'profileVisibility',
          title: 'Profile Visibility',
          description: 'Make your profile visible to other users',
          icon: 'person-outline',
        },
        {
          key: 'notifications',
          title: 'Push Notifications',
          description: 'Receive notifications about app updates and features',
          icon: 'notifications-outline',
        },
      ]
    },
    {
      title: 'Data Collection',
      items: [
        {
          key: 'dataCollection',
          title: 'Data Collection',
          description: 'Allow collection of usage data to improve the app',
          icon: 'analytics-outline',
        },
        {
          key: 'analytics',
          title: 'Analytics',
          description: 'Help us understand how you use the app',
          icon: 'bar-chart-outline',
        },
        {
          key: 'crashReporting',
          title: 'Crash Reporting',
          description: 'Automatically send crash reports to help fix bugs',
          icon: 'bug-outline',
        },
      ]
    },
    {
      title: 'Device Permissions',
      items: [
        {
          key: 'locationTracking',
          title: 'Location Tracking',
          description: 'Allow the app to access your location for field mapping',
          icon: 'location-outline',
        },
        {
          key: 'cameraAccess',
          title: 'Camera Access',
          description: 'Allow the app to access your camera for crop detection',
          icon: 'camera-outline',
        },
        {
          key: 'microphoneAccess',
          title: 'Microphone Access',
          description: 'Allow the app to access your microphone for voice notes',
          icon: 'mic-outline',
        },
        {
          key: 'contactsAccess',
          title: 'Contacts Access',
          description: 'Allow the app to access your contacts for sharing',
          icon: 'people-outline',
        },
      ]
    },
    {
      title: 'Communication',
      items: [
        {
          key: 'marketingEmails',
          title: 'Marketing Emails',
          description: 'Receive promotional emails and updates',
          icon: 'mail-outline',
        },
      ]
    }
  ];

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/backgroundimage.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading privacy settings...</Text>
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
          <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Settings</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Privacy Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Your Privacy Matters</Text>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              Control how your data is collected and used. You can change these settings anytime.
            </Text>
          </View>
        </View>

        {/* Privacy Options */}
        {privacyOptions.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.optionItem}>
                  <View style={styles.optionLeft}>
                    <Ionicons 
                      name={item.icon} 
                      size={20} 
                      color={colors.primary} 
                      style={styles.optionIcon}
                    />
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[styles.optionDescription, { color: colors.muted }]}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={privacySettings[item.key]}
                    onValueChange={(value) => handleToggle(item.key, value)}
                    trackColor={{ false: '#9ca3af', true: colors.primary }}
                    thumbColor={'#fff'}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleExportData}
          >
            <Ionicons name="download-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Export My Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f39c12' }]}
            onPress={handleResetToDefaults}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#e74c3c' }]}
            onPress={handleDeleteData}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.actionButtonText}>Delete All Data</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.card }]}>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            Last updated: {new Date().toLocaleDateString()}
          </Text>
          <Text style={[styles.footerText, { color: colors.muted }]}>
            For more information, visit our Privacy Policy
          </Text>
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
  footer: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});

export default PrivacySettingsScreen;
