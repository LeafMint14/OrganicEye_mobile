import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
// --- 1. THIS IS THE CORRECT IMPORT ---
import { CameraView, Camera } from 'expo-camera'; 
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import UserService from '../services/UserService';
import { Ionicons } from '@expo/vector-icons';

const RegisterIoTScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 2. Ask for camera permission (using the 'Camera' module)
  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  // 3. This function runs when a QR code is successfully scanned
  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true); // Stop scanning
    setIsLoading(true); // Show loading spinner
    
    console.log(`Scanned QR code! Type: ${type} Data: ${data}`);

    try {
      const result = await UserService.updateUserData(user.uid, {
        pairedPiId: data 
      });

      if (result.success) {
        Alert.alert(
          'Success!',
          `You have successfully paired with device: ${data}`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to pair device:", error);
      Alert.alert(
        'Pairing Failed',
        `Could not save device ID. ${error.message}`,
        [{ text: 'Try Again', onPress: () => setScanned(false) }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Render permission status
  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center' }]}>
        <Text style={{ color: colors.text, textAlign: 'center' }}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center' }]}>
        <Text style={[styles.text, { color: colors.text, textAlign: 'center', margin: 20 }]}>
          No access to camera. Please enable camera permissions in your phone's settings to use this feature.
        </Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 5. This is the main return: show the camera scanner
  return (
    <View style={styles.container}>
      {/* --- 3. THIS IS THE CORRECT COMPONENT --- */}
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"], // We only care about QR codes
        }}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan IoT Device QR Code</Text>
      </View>

      {/* Scanner Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scannerFrame} />
        <Text style={styles.scannerText}>
          Point your camera at the QR code on your IoT device
        </Text>
      </View>

      {/* Loading indicator when we are saving */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Pairing device...</Text>
        </View>
      )}
    </View>
  );
};

// ... Your styles are 100% fine, no changes needed ...
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50, // Adjust for status bar
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerText: {
    marginTop: 20,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '70%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterIoTScreen;