import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera'; 
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import UserService from '../services/UserService';
import { Ionicons } from '@expo/vector-icons';

const RegisterIoTScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  // --- NEW: SAFE NAVIGATION FALLBACK ---
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If history is empty due to an app reload, force it back to Settings
      navigation.navigate('Settings'); 
    }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true); 
    setIsLoading(true); 
    
    console.log(`Scanned QR code! Type: ${type} Data: ${data}`);

    try {
      const result = await UserService.updateUserData(user.uid, {
        pairedPiId: data 
      });

      if (result.success) {
        Alert.alert(
          'Success!',
          `You have successfully paired with device: ${data}`,
          [{ text: 'OK', onPress: handleGoBack }] // <-- Updated
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

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 15 }}>
          Checking camera permissions...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg, justifyContent: 'center' }]}>
        <Ionicons name="camera-outline" size={60} color={colors.muted} style={{ alignSelf: 'center', marginBottom: 20 }} />
        <Text style={[styles.text, { color: colors.text, textAlign: 'center', marginHorizontal: 30, marginBottom: 30, fontSize: 16 }]}>
          Organic Eye needs your permission to use the camera to scan the IoT device's QR code.
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary, marginBottom: 15 }]} 
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.muted }]} 
          onPress={handleGoBack} // <-- Updated
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"], 
        }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={[styles.header, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack} // <-- Updated
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan IoT Device QR Code</Text>
      </View>

      <View style={styles.overlay}>
        <View style={styles.scannerFrame} />
        <Text style={styles.scannerText}>
          Point your camera at the QR code on your IoT device
        </Text>
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: '#fff', marginTop: 10 }}>Pairing device...</Text>
        </View>
      )}
    </View>
  );
};

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
    paddingTop: 50, 
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