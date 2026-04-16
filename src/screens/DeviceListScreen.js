import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, 
  TouchableOpacity, Alert, Modal, TextInput 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 

import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore'; 
import { db } from '../../firebase'; 

export default function DeviceListScreen({ navigation }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- NEW STATE FOR RENAME MODAL ---
  const [isRenameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [newDeviceName, setNewDeviceName] = useState('');

  useEffect(() => {
    const devicesCollection = collection(db, 'devices');

    const unsubscribe = onSnapshot(devicesCollection, (snapshot) => {
      const deviceArray = snapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data() 
      }));
      
      setDevices(deviceArray);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Sync Error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- NEW FUNCTION: Delete Device ---
  const handleDeleteDevice = (deviceId, deviceName) => {
    Alert.alert(
      "Remove Device",
      `Are you sure you want to remove ${deviceName || deviceId}? This will disconnect it from the app.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'devices', deviceId));
            } catch (error) {
              console.error("Error deleting device:", error);
              Alert.alert("Error", "Failed to remove the device. Please try again.");
            }
          } 
        }
      ]
    );
  };

  // --- NEW FUNCTIONS: Rename Device ---
  const openRenameModal = (device) => {
    setSelectedDevice(device);
    setNewDeviceName(device.name || device.id); // Default to current name or ID
    setRenameModalVisible(true);
  };

  const handleSaveRename = async () => {
    if (!selectedDevice || !newDeviceName.trim()) {
      Alert.alert("Invalid Name", "Device name cannot be empty.");
      return;
    }

    try {
      await updateDoc(doc(db, 'devices', selectedDevice.id), {
        name: newDeviceName.trim()
      });
      setRenameModalVisible(false);
      setSelectedDevice(null);
      setNewDeviceName('');
    } catch (error) {
      console.error("Error renaming device:", error);
      Alert.alert("Error", "Failed to rename the device. Please try again.");
    }
  };

  // The UI for a single Device Card
  const renderDeviceCard = ({ item }) => {
    let isOnline = false;
    
    if (item.lastActive) {
      const now = new Date();
      const lastActiveTime = new Date(item.lastActive);
      const differenceInMinutes = (now - lastActiveTime) / (1000 * 60);
      isOnline = differenceInMinutes <= 3;
    }

    const statusColor = isOnline ? '#4CAF50' : '#F44336'; 
    const displayStatus = isOnline ? 'Online' : 'Offline';

    return (
      <View style={styles.card}>
        {/* Left Side: Clickable area to view device details */}
        <TouchableOpacity 
          style={styles.deviceInfoContainer}
          onPress={() => navigation.navigate('DeviceDetail', { device: item })}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.deviceName} numberOfLines={1}>
              {item.name || item.id}
            </Text>
          </View>
          
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {displayStatus}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right Side: Edit and Delete Actions */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => openRenameModal(item)}
          >
            <Ionicons name="pencil" size={20} color="#4B5563" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => handleDeleteDevice(item.id, item.name)}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Syncing with Pi Units...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Device Management</Text>
      </View>
      
      {devices.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No devices connected.</Text>
          <Text style={styles.subEmptyText}>Waiting for pi-unit-001 to register...</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={renderDeviceCard}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* --- RENAME MODAL UI --- */}
      <Modal
        visible={isRenameModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Device</Text>
            <Text style={styles.modalSubtitle}>ID: {selectedDevice?.id}</Text>
            
            <TextInput
              style={styles.input}
              value={newDeviceName}
              onChangeText={setNewDeviceName}
              placeholder="Enter device name"
              placeholderTextColor="#9CA3AF"
              autoFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setRenameModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveRename}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50, 
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15, 
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333', 
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row', // Allows info and buttons to sit side-by-side
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, 
    shadowRadius: 4,
  },
  deviceInfoContainer: {
    flex: 1, // Takes up remaining space on the left
    padding: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingRight: 15,
  },
  iconButton: {
    padding: 10,
    marginLeft: 5,
  },
  cardHeader: {
    marginBottom: 12,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333', 
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    color: '#666666', 
    marginTop: 12,
    fontSize: 16,
  },
  emptyText: {
    color: '#333333', 
    fontSize: 18,
    fontWeight: 'bold',
  },
  subEmptyText: {
    color: '#666666', 
    fontSize: 14,
    marginTop: 8,
  },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});