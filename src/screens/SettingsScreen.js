import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Image, ImageBackground, ActivityIndicator, Linking, Share, TextInput } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import UserService from '../services/UserService';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  // const [autoDetection, setAutoDetection] = useState(false);
  const [dataSync, setDataSync] = useState(true);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const { theme, colors, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      console.log('useEffect triggered, user:', user);
      
      if (user?.uid) {
        try {
          console.log('Fetching data for UID:', user.uid);
          // Set loading to true ONLY if userData is not already loaded
          if (!userData) {
             setLoading(true);
          }
          
          const result = await UserService.getUserData(user.uid);
          console.log('UserService result:', result);
          
          if (result.success) {
            console.log('User data received:', result.userData);
            setUserData(result.userData);
          } else {
            console.warn('UserService error:', result.error);
          }
        } catch (error) {
          console.error('Error in fetchUserData:', error);
          Alert.alert('Error', 'Failed to load user data');
        } finally {
          setLoading(false);
        }
      } else {
        console.log('No user UID available or user is null');
        setLoading(false);
      }
    };
    
    // Add a listener that re-runs fetchUserData() every time this screen
    // comes into focus (e.g., when you navigate back from ProfileEdit)
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('SettingsScreen FOCUSED, re-fetching data...');
      fetchUserData();
    });

    // Return the unsubscribe function to clean up the listener
    return unsubscribe;
    
  }, [user, navigation, userData]);

  const profile = {
    name: userData?.First_Name && userData?.Last_Name 
      ? `${userData.First_Name} ${userData.Last_Name}`
      : user?.displayName || 'User Name',
    email: user?.email || 'email@example.com',
    contact: userData?.contact || 'Not provided',
    role: userData?.role || 'Farmer',
    // This now dynamically uses the avatarUrl from the database
    avatar: userData?.avatarUrl 
      ? { uri: userData.avatarUrl } 
      : require('../../assets/logo.png'),
  };

  const settingsOptions = [
    {
      title: 'Account',
      items: [
        { name: 'Edit Profile', icon: 'person-outline', action: 'profile' },
        { name: 'Change Password', icon: 'lock-closed-outline', action: 'password' },
        { name: 'Privacy Settings', icon: 'shield-checkmark-outline', action: 'privacy' },
        // { name: 'Account Security', icon: 'security-outline', action: 'security' },
      ]
    },
    {
      title: 'Detection',
      items: [
        { name: 'Register IoT Device', icon: 'qr-code-outline', action: 'registerIoT' },
        { name: 'Detection Settings', icon: 'camera-outline', action: 'detection' },
        { name: 'Alert Thresholds', icon: 'notifications-outline', action: 'alerts' },
        // { name: 'Field Management', icon: 'leaf-outline', action: 'fields' },
        { name: 'Detection History', icon: 'time-outline', action: 'history' },
      ]
    },
    // {
    //   title: 'Data & Storage',
    //   items: [
    //     { name: 'Data Export', icon: 'download-outline', action: 'export' },
    //     { name: 'Storage Usage', icon: 'analytics-outline', action: 'storage' },
    //     { name: 'Backup Settings', icon: 'cloud-upload-outline', action: 'backup' },
    //     { name: 'Clear Cache', icon: 'trash-outline', action: 'clearCache' },
    //   ]
    // },
    {
      title: 'Support',
      items: [
        // { name: 'Help Center', icon: 'help-circle-outline', action: 'help' },
        { name: 'Contact Support', icon: 'mail-outline', action: 'contact' },
        // { name: 'Rate App', icon: 'star-outline', action: 'rate' },
        // { name: 'Share App', icon: 'share-outline', action: 'share' },
        { name: 'About', icon: 'information-circle-outline', action: 'about' },
      ]
    }
  ];

  // Filter settings based on search query
  const filteredSettingsOptions = settingsOptions.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  const handleSettingAction = async (action) => {
    switch (action) {
      case 'registerIoT':
      navigation.navigate('RegisterIoT'); // Make sure this matches your navigator's screen name
      break;
      case 'profile':
        navigation.navigate('ProfileEdit');
        break;
      case 'password':
        navigation.navigate('PasswordChange');
        break;
      case 'privacy':
        navigation.navigate('PrivacySettings');
        break;
      case 'security':
        Alert.alert(
          'Account Security',
          'Security settings will be implemented here',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Security', onPress: () => console.log('Navigate to security settings') }
          ]
        );
        break;
      case 'detection':
        navigation.navigate('DetectionSettings');
        break;
      case 'alerts':
        Alert.alert(
          'Alert Thresholds',
          'Alert configuration will be implemented here',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Configure', onPress: () => console.log('Navigate to alert settings') }
          ]
        );
        break;
      case 'fields':
        Alert.alert(
          'Field Management',
          'Field management will be implemented here',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Manage', onPress: () => console.log('Navigate to field management') }
          ]
        );
        break;
      case 'history':
        Alert.alert(
          'Detection History',
          'Detection history will be implemented here',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'View', onPress: () => console.log('Navigate to detection history') }
          ]
        );
        break;
      case 'export':
        Alert.alert(
          'Data Export',
          'Choose the format for your data export:',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Export CSV', 
              onPress: () => {
                Alert.alert(
                  'Export CSV',
                  'What data would you like to export?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Detection History', onPress: () => {
                      Alert.alert('Exporting...', 'Your detection history is being exported to CSV format. You will receive an email when ready.');
                    }},
                    { text: 'User Profile', onPress: () => {
                      Alert.alert('Exporting...', 'Your profile data is being exported to CSV format.');
                    }},
                    { text: 'All Data', onPress: () => {
                      Alert.alert('Exporting...', 'All your data is being exported to CSV format. This may take a few minutes.');
                    }}
                  ]
                );
              }
            },
            { 
              text: 'Export PDF', 
              onPress: () => {
                Alert.alert(
                  'Export PDF',
                  'Generate a comprehensive PDF report:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Detection Report', onPress: () => {
                      Alert.alert('Generating PDF...', 'Your detection report is being generated. You will receive an email when ready.');
                    }},
                    { text: 'Complete Report', onPress: () => {
                      Alert.alert('Generating PDF...', 'Your complete report is being generated. This includes all detections, analytics, and profile data.');
                    }}
                  ]
                );
              }
            }
          ]
        );
        break;
      case 'storage':
        const calculateStorageUsage = () => {
          const appData = 45.2;
          const cache = 12.8;
          const images = 32.4;
          const userData = 8.7;
          const total = appData + cache + images + userData;
          
          return {
            appData: appData.toFixed(1),
            cache: cache.toFixed(1),
            images: images.toFixed(1),
            userData: userData.toFixed(1),
            total: total.toFixed(1)
          };
        };
        
        const storage = calculateStorageUsage();
        Alert.alert(
          'Storage Usage',
          `Storage Information:\n• App Data: ${storage.appData} MB\n• Cache: ${storage.cache} MB\n• Images: ${storage.images} MB\n• User Data: ${storage.userData} MB\n• Total: ${storage.total} MB\n\nAvailable: 2.1 GB`,
          [
            { text: 'OK' },
            { text: 'Clear Cache', onPress: () => {
              Alert.alert('Cache Cleared', '12.8 MB of cache has been cleared.');
            }}
          ]
        );
        break;
      case 'backup':
        Alert.alert(
          'Backup Settings',
          'Configure your data backup preferences:',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Auto Backup', 
              onPress: () => {
                Alert.alert(
                  'Auto Backup',
                  'Enable automatic backup to cloud storage?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Enable', onPress: () => {
                      Alert.alert('Auto Backup Enabled', 'Your data will be automatically backed up daily at 2:00 AM.');
                    }}
                  ]
                );
              }
            },
            { 
              text: 'Manual Backup', 
              onPress: () => {
                Alert.alert('Backing Up...', 'Creating backup of your data. This may take a few minutes.');
              }
            },
            { 
              text: 'Restore', 
              onPress: () => {
                Alert.alert(
                  'Restore Data',
                  'Restore from a previous backup?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Restore', onPress: () => {
                      Alert.alert('Restore Complete', 'Your data has been restored from the latest backup.');
                    }}
                  ]
                );
              }
            }
          ]
        );
        break;
      case 'clearCache':
        Alert.alert(
          'Clear Cache',
          'This will clear all cached data and free up storage space. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Clear', 
              style: 'destructive',
              onPress: () => {
                console.log('Clearing cache...');
                Alert.alert('Success', 'Cache cleared successfully!');
              }
            }
          ]
        );
        break;
      case 'help':
        Alert.alert(
          'Help Center',
          'Get help and support:',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'User Guide', 
              onPress: () => {
                Alert.alert('User Guide', 'Opening the comprehensive user guide...');
              }
            },
            { 
              text: 'FAQ', 
              onPress: () => {
                Alert.alert('FAQ', 'Opening frequently asked questions...');
              }
            },
            { 
              text: 'Video Tutorials', 
              onPress: () => {
                Alert.alert('Video Tutorials', 'Opening video tutorials for app features...');
              }
            },
            { 
              text: 'Report Bug', 
              onPress: () => {
                Alert.alert('Report Bug', 'Help us improve by reporting bugs and issues.');
              }
            }
          ]
        );
        break;
      case 'contact':
        Alert.alert(
          'Contact Support',
          'How would you like to contact support?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Email', onPress: () => Linking.openURL('mailto:support@organiceye.com') },
            { text: 'Phone', onPress: () => Linking.openURL('tel:+1234567890') }
          ]
        );
        break;
      case 'rate':
        Alert.alert(
          'Rate App',
          'Would you like to rate this app?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Rate', onPress: () => console.log('Open app store rating') }
          ]
        );
        break;
      case 'share':
        try {
          await Share.share({
            message: 'Check out OrganicEye - The best mobile crop detection app!',
            url: 'https://organiceye.com',
            title: 'OrganicEye App'
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
        break;
      case 'about':
        Alert.alert(
          'About OrganicEye',
          'Version: 1.0.0\nBuild: 2024.1\n\nOrganicEye is a mobile crop detection app that helps farmers identify insects and diseases in their crops using AI technology.\n\n© 2024 OrganicEye. All rights reserved.',
          [{ text: 'OK' }]
        );
        break;
      default:
        Alert.alert('Feature', 'This feature is coming soon!');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: async () => {
            try {
              const result = await logout(); // This calls AuthService.logout()
              
              if (result.success) {
                console.log('Logout successful');
              } else {
                Alert.alert('Error', result.error || 'Failed to logout');
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
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
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading user data...</Text>
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
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <Image source={profile.avatar} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{profile.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.muted }]}>{profile.email}</Text>
            <Text style={[styles.profileContact, { color: colors.muted }]}>Contact: {profile.contact}</Text>
            <View style={[styles.roleBadge, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)' }]}>
              <Text style={styles.roleBadgeDot}>•</Text>
              <Text style={[styles.roleBadgeText, { color: colors.text }]}>{profile.role}</Text>
            </View>
          </View>
          <TouchableOpacity 
          style={[styles.editBtn, { backgroundColor: colors.primary }]} 
          onPress={() => navigation.navigate('ProfileEdit')}
        > 
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <View style={styles.searchSection}>
            <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="search" size={20} color={colors.muted} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search settings..."
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              <TouchableOpacity onPress={() => setShowSearch(false)}>
                <Ionicons name="close" size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Add user details section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Details</Text>
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
              <Ionicons name="search" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}> 
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>First Name</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{userData?.First_Name || 'Not set'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Last Name</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{userData?.Last_Name || 'Not set'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Email</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{user?.email || 'Not set'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Contact</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{userData?.contact || 'Not provided'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Member Since</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {userData?.createdAt ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        {/* Preferences with Dark mode */}
        <View style={styles.toggleSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>

          {/* <View style={[styles.toggleItem, { backgroundColor: colors.card }]}> 
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.toggleDescription, { color: colors.muted }]}>Switch between light and dark theme</Text>
            </View>
            <Switch value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#9ca3af', true: colors.primary }} thumbColor={'#fff'} />
          </View> */}
          
          <View style={[styles.toggleItem, { backgroundColor: colors.card }]}> 
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.toggleDescription, { color: colors.muted }]}>Receive alerts and updates</Text>
            </View>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#9ca3af', true: colors.primary }} thumbColor={'#fff'} />
          </View>

          {/* <View style={[styles.toggleItem, { backgroundColor: colors.card }]}> 
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Auto Detection</Text>
              <Text style={[styles.toggleDescription, { color: colors.muted }]}>Automatically detect insects</Text>
            </View>
            <Switch value={autoDetection} onValueChange={setAutoDetection} trackColor={{ false: '#9ca3af', true: colors.primary }} thumbColor={'#fff'} />
          </View> */}

          <View style={[styles.toggleItem, { backgroundColor: colors.card }]}> 
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Data Sync</Text>
              <Text style={[styles.toggleDescription, { color: colors.muted }]}>Sync data across devices</Text>
            </View>
            <Switch value={dataSync} onValueChange={setDataSync} trackColor={{ false: '#9ca3af', true: colors.primary }} thumbColor={'#fff'} />
          </View>
        </View>

        {filteredSettingsOptions.length > 0 ? (
          filteredSettingsOptions.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
              <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}> 
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    style={styles.optionItem}
                    onPress={() => handleSettingAction(item.action)}
                  >
                    <View style={styles.optionLeft}> 
                      <Ionicons 
                        name={item.icon} 
                        size={20} 
                        color={colors.primary} 
                        style={styles.optionIcon}
                      />
                      <Text style={[styles.optionName, { color: colors.text }]}>{item.name}</Text>
                    </View>
                    <Ionicons 
                      name="chevron-forward" 
                      size={16} 
                      color={colors.muted} 
                      style={styles.optionArrow}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : searchQuery ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search" size={48} color={colors.muted} />
            <Text style={[styles.noResultsText, { color: colors.text }]}>No settings found</Text>
            <Text style={[styles.noResultsSubtext, { color: colors.muted }]}>Try a different search term</Text>
          </View>
        ) : null}

        <View style={styles.logoutSection}>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: '#e74c3c' }]} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

// ... (Your styles are perfect, no changes) ...
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  profileEmail: {
    marginTop: 4,
    fontSize: 14,
    color: '#e8f5e9',
  },
  profileContact: {
    marginTop: 2,
    fontSize: 12,
    color: '#e8f5e9',
 },
  roleBadge: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeDot: {
    color: '#F6C453',
    marginRight: 6,
    fontSize: 16,
  },
  roleBadgeText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  editBtn: {
    backgroundColor: '#1f7a4f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
   flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
  },
  detailItem: {
    padding: 15,
    borderBottomWidth: 1,
 borderBottomColor: '#f1f2f6',
  },
  detailLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  toggleSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
},
  toggleItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
 optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  optionItem: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  optionName: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  optionArrow: {
    marginLeft: 10,
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 15,


borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
},
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SettingsScreen;