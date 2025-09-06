import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Image, ImageBackground } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';

const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [autoDetection, setAutoDetection] = useState(false);
  const [dataSync, setDataSync] = useState(true);
  const { theme, colors, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  // Mock profile data - in real app, get from user context
  const profile = {
    name: user?.displayName || 'Juan Dela Cruz',
    email: user?.email || 'juan@example.com',
    role: 'Farmer',
    avatar: require('../../assets/logo.png'),
  };

  const settingsOptions = [
    {
      title: 'Account',
      items: [
        { name: 'Profile', icon: '', action: 'profile' },
        { name: 'Change Password', icon: '', action: 'password' },
        { name: 'Privacy Settings', icon: '', action: 'privacy' },
      ]
    },
    {
      title: 'Detection',
      items: [
        { name: 'Detection Settings', icon: '', action: 'detection' },
        { name: 'Alert Thresholds', icon: '', action: 'alerts' },
        { name: 'Field Management', icon: '', action: 'fields' },
      ]
    },
    {
      title: 'Data & Storage',
      items: [
        { name: 'Data Export', icon: '', action: 'export' },
        { name: 'Storage Usage', icon: '', action: 'storage' },
        { name: 'Backup Settings', icon: '', action: 'backup' },
      ]
    },
    {
      title: 'Support',
      items: [
        { name: 'Help Center', icon: '', action: 'help' },
        { name: 'Contact Support', icon: '', action: 'contact' },
        { name: 'About', icon: 'ℹ', action: 'about' },
      ]
    }
  ];

  const handleSettingAction = (action) => {
    switch (action) {
      case 'profile':
        Alert.alert('Profile', 'Profile settings would open here');
        break;
      case 'password':
        Alert.alert('Change Password', 'Password change screen would open here');
        break;
      case 'privacy':
        Alert.alert('Privacy', 'Privacy settings would open here');
        break;
      case 'detection':
        Alert.alert('Detection Settings', 'Detection configuration would open here');
        break;
      case 'alerts':
        Alert.alert('Alert Thresholds', 'Alert configuration would open here');
        break;
      case 'fields':
        Alert.alert('Field Management', 'Field management would open here');
        break;
      case 'export':
        Alert.alert('Data Export', 'Data export options would open here');
        break;
      case 'storage':
        Alert.alert('Storage Usage', 'Storage information would be displayed here');
        break;
      case 'backup':
        Alert.alert('Backup Settings', 'Backup configuration would open here');
        break;
      case 'help':
        Alert.alert('Help Center', 'Help documentation would open here');
        break;
      case 'contact':
        Alert.alert('Contact Support', 'Support contact options would open here');
        break;
      case 'about':
        Alert.alert('About', 'Organic-Eye v1.0.0\nMobile Crop Detection App');
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
              await signOut();
              // Navigation will be handled automatically by AppNavigator
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

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
            <View style={[styles.roleBadge, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)' }]}>
              <Text style={styles.roleBadgeDot}></Text>
              <Text style={[styles.roleBadgeText, { color: colors.text }]}>{profile.role}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.primary }]} onPress={() => Alert.alert('Edit Profile', 'Edit screen would open here')}> 
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Preferences with Dark mode */}
        <View style={styles.toggleSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>

          <View style={[styles.toggleItem, { backgroundColor: colors.card }]}> 
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Dark Mode</Text>
              <Text style={[styles.toggleDescription, { color: colors.muted }]}>Switch between light and dark theme</Text>
            </View>
            <Switch value={theme === 'dark'} onValueChange={toggleTheme} trackColor={{ false: '#9ca3af', true: colors.primary }} thumbColor={'#fff'} />
          </View>
          
          <View style={[styles.toggleItem, { backgroundColor: colors.card }]}> 
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.toggleDescription, { color: colors.muted }]}>Receive alerts and updates</Text>
            </View>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#9ca3af', true: colors.primary }} thumbColor={'#fff'} />
          </View>

          <View style={[styles.toggleItem, { backgroundColor: colors.card }]}> 
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Auto Detection</Text>
              <Text style={[styles.toggleDescription, { color: colors.muted }]}>Automatically detect insects</Text>
            </View>
            <Switch value={autoDetection} onValueChange={setAutoDetection} trackColor={{ false: '#9ca3af', true: colors.primary }} thumbColor={'#fff'} />
          </View>

          <View style={[styles.toggleItem, { backgroundColor: colors.card }]}> 
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleTitle, { color: colors.text }]}>Data Sync</Text>
              <Text style={[styles.toggleDescription, { color: colors.muted }]}>Sync data across devices</Text>
            </View>
            <Switch value={dataSync} onValueChange={setDataSync} trackColor={{ false: '#9ca3af', true: colors.primary }} thumbColor={'#fff'} />
          </View>
        </View>

        {settingsOptions.map((section, sectionIndex) => (
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
                    <Text style={styles.optionIcon}>{item.icon}</Text>
                    <Text style={[styles.optionName, { color: colors.text }]}>{item.name}</Text>
                  </View>
                  <Text style={[styles.optionArrow, { color: colors.muted }]}></Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.logoutSection}>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: '#e74c3c' }]} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
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
  toggleSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
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
    fontSize: 20,
    marginRight: 15,
  },
  optionName: {
    fontSize: 16,
    color: '#2c3e50',
  },
  optionArrow: {
    fontSize: 20,
    color: '#bdc3c7',
    fontWeight: 'bold',
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
});

export default SettingsScreen;
