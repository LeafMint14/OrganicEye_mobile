import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext'; // Need this to know WHICH user is logged in
import UserService from '../services/UserService'; // Need this to update their default device
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const DeviceDetailScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { user } = useAuth(); // Get the current user
  
  // Get the specific device ID that was passed from the Device Manager list
  const deviceId = route.params?.deviceId || 'pi-unit-001'; 
  
  const [deviceData, setDeviceData] = useState(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // 1. Fetch the basic status of THIS specific device
  useEffect(() => {
    const deviceRef = doc(db, 'devices', deviceId);
    const unsubscribe = onSnapshot(deviceRef, (docSnap) => {
      if (docSnap.exists()) {
        setDeviceData(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [deviceId]);

  // --- THE NEW "LOAD DATA" LOGIC ---
  const handleLoadDataPress = () => {
    Alert.alert(
      "Restart Application",
      `Are you sure you want to load data for ${deviceId}? The application will restart to apply these changes.`,
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: executeDataSwap }
      ]
    );
  };

  const executeDataSwap = async () => {
    setIsSwapping(true);
    try {
      // 1. Update the user's profile in Firebase to make this the new "Master" device
      await UserService.updateUserData(user.uid, {
        pairedPiId: deviceId 
      });

      // 2. "Restart" the app by wiping the navigation history and sending them to the Home screen.
      // NOTE: Change 'HomeTabs' or 'Main' to whatever your main dashboard route is actually named in App.js!
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }], // <-- Change 'Home' to the name of your main screen/tabs
      });

    } catch (error) {
      console.error("Failed to swap device:", error);
      Alert.alert("Error", "Could not load data for this device. Please try again.");
      setIsSwapping(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {!deviceData ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* Header / Device Info */}
            <View style={styles.headerBlock}>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>{deviceData.name || deviceId}</Text>
                <Text style={[styles.subtitle, { color: colors.muted }]}>Device ID: {deviceId}</Text>
              </View>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: deviceData.status === 'Online' ? '#4CAF50' : '#F44336' }
              ]}>
                <Text style={styles.statusText}>{deviceData.status}</Text>
              </View>
            </View>

            {/* Previous module content goes here (e.g., Settings, History, etc) */}
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <Text style={{ color: colors.text, marginBottom: 10 }}>
                This is the details page for {deviceId}. From here, you can view specific settings for this unit or set it as your primary active device.
              </Text>
            </View>

            {/* --- NEW MODULE: LOAD DATA BUTTON --- */}
            <TouchableOpacity 
              style={[styles.loadButton, { backgroundColor: colors.primary }]}
              onPress={handleLoadDataPress}
              disabled={isSwapping}
            >
              {isSwapping ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sync-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.loadButtonText}>Load Data & Restart</Text>
                </>
              )}
            </TouchableOpacity>

          </>
        )}
      </ScrollView>

      {/* Full screen loading overlay for when the app is "restarting" */}
      {isSwapping && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Restarting application...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  headerBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 30 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  infoCard: { padding: 20, borderRadius: 12, marginBottom: 30, elevation: 2 },
  
  // New Button Styles
  loadButton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    marginTop: 20,
  },
  loadButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayText: { color: '#fff', marginTop: 15, fontSize: 16, fontWeight: 'bold' }
});

export default DeviceDetailScreen;