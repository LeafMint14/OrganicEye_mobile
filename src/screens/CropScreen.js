import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, FlatList,
  TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { db } from '../../firebase'; 
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { CROP_LABELS } from '../config/LabelMap'; 
import DetectionCard from '../components/DetectionCard'; 
import { Ionicons } from '@expo/vector-icons'; 
// --- 1. NEW IMPORTS ---
import { useAuth } from '../context/AuthContext';
import UserService from '../services/UserService';

const CropScreen = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]); 
  // --- 2. NEW STATE & HOOK ---
  const { user } = useAuth(); // Get the currently logged-in user
  const [pairedPiId, setPairedPiId] = useState(null); // To store the user's Pi ID

  // --- 3. UPDATED useEffect ---
  useEffect(() => {
    // If there is no user, don't do anything
    if (!user) {
      setLoading(false);
      setItems([]);
      return;
    }

    setLoading(true);
    let unsubscribe = () => {}; // This will hold our listener

    // We must FIRST fetch the user's profile to see which Pi they are paired with
    const fetchUserDataAndSubscribe = async () => {
      try {

       
        const userResult = await UserService.getUserData(user.uid);
        
        // Check if the user was found AND they have a paired Pi
        if (userResult.success && userResult.userData.pairedPiId) {
          const piId = userResult.userData.pairedPiId;
          setPairedPiId(piId); // Save the ID to our state

           console.log("--- CROP SCREEN DEBUG: My Paired Pi ID is:", piId);
          // NOW, build the query using that Pi ID
          const q = query(
          collection(db, "detections"),
          where("pi_id", "==", piId),
          // where("detection", "in", CROP_LABELS), // <-- We are TEMPORARILY disabling this
          orderBy("timestamp", "desc")
        );

          // And attach the real-time listener
          unsubscribe = onSnapshot(q, (querySnapshot) => {
            const detectionsData = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.imageUrl) {
                detectionsData.push({
                  id: doc.id,
                  detection: data.detection,
                  confidence: Math.round(data.confidence * 100),
                  imageUrl: data.imageUrl, 
                  timestamp: data.timestamp,
                });
              }
            });
            setItems(detectionsData); 
            setLoading(false);
          });

        } else {
          // This user has not paired a device
          console.log("User has no paired Pi ID.");
          setItems([]);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error setting up filtered listener:", error);
        Alert.alert("Error", "Could not load detections.");
        setLoading(false);
      }
    };

    fetchUserDataAndSubscribe();

    // This is the cleanup function that runs when the screen is left
    return () => unsubscribe();
    
  }, [user]); // This useEffect will re-run if the user logs in or out

  // --- All other functions (handleLongPress, handleCardPress, etc.) are perfect! ---
  // --- No changes are needed from here down to the FlatList. ---
  
  const handleLongPress = (docId) => {
    setIsSelectMode(true);
    setSelectedItems([docId]);
  };

  const handleCardPress = (item) => {
    if (isSelectMode) {
      if (selectedItems.includes(item.id)) {
        setSelectedItems(selectedItems.filter(id => id !== item.id));
      } else {
        setSelectedItems([...selectedItems, item.id]);
      }
    } else {
      navigation.navigate('CropDetails', { 
        item: {
          id: item.id,
          name: item.detection,
          img: { uri: item.imageUrl },
          timestamp: item.timestamp,
          confidence: item.confidence,
        }
      });
    }
  };
  
  const cancelSelection = () => {
    setIsSelectMode(false);
    setSelectedItems([]);
  };

  const handleDeleteSelected = async () => {
    Alert.alert(
      "Delete Detections",
      `Are you sure you want to delete ${selectedItems.length} item(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const batch = writeBatch(db);
              selectedItems.forEach(docId => {
                const docRef = doc(db, "detections", docId);
                batch.delete(docRef);
              });
              await batch.commit();
              cancelSelection();
              Alert.alert("Success", "Selected items deleted.");
            } catch (error) {
              console.error("Error deleting items: ", error);
              Alert.alert("Error", "Could not delete items.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.id);

    return (
      <DetectionCard
        item={item}
        isSelected={isSelected}
        onPress={() => handleCardPress(item)}
        onLongPress={() => handleLongPress(item.id)}
      />
    );
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/backgroundimage.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/backgroundimage.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.brandBar}>
        <Text style={[styles.brandText, { color: colors.text }]}>ORGANIC-EYE</Text>
      </View>
      <View style={styles.titleBanner}>
        <Text style={[styles.titleBannerText, { color: colors.text }]}>CROP DATA</Text>
      </View>

      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          
          // --- 4. UPDATED Empty List Component ---
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={!pairedPiId ? "qr-code-outline" : "leaf-outline"} 
                size={48} 
                color={colors.muted} 
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {!pairedPiId ? "No IoT Device Paired" : "No Crop Detections Yet"}
              </Text>
              {!pairedPiId && (
                <>
                  <Text style={[styles.emptySubText, { color: colors.muted }]}>
                    Please register your device in the Settings menu.
                  </Text>
                  <TouchableOpacity 
                    style={[styles.registerButton, { backgroundColor: colors.primary }]}
                    onPress={() => navigation.navigate('Settings', { screen: 'RegisterIoT' })}
                  >
                    <Text style={styles.registerButtonText}>Go to Settings</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          }
          extraData={selectedItems} 
        />
      </View>
      {/* --- END OF MODIFICATION --- */}


      {isSelectMode && (
        <View style={[styles.actionContainer, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={cancelSelection} style={styles.actionButton}>
            <Ionicons name="close-circle" size={28} color={colors.muted} />
            <Text style={[styles.actionText, { color: colors.muted }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.selectedCount, { color: colors.primary }]}>
            {selectedItems.length} selected
          </Text>
          <TouchableOpacity 
            onPress={handleDeleteSelected} 
            style={styles.actionButton}
            disabled={selectedItems.length === 0}
          >
            <Ionicons 
              name="trash" 
              size={28} 
              color={selectedItems.length > 0 ? '#E74C3C' : colors.muted}
            />
            <Text style={[
              styles.actionText, 
              { color: selectedItems.length > 0 ? '#E74C3C' : colors.muted }
            ]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
};

// --- 5. UPDATED Styles ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  brandBar: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 10 },
  brandText: { fontWeight: '800', letterSpacing: 2, fontSize: 16, textAlign: 'center' },
  titleBanner: { paddingVertical: 12, marginHorizontal: 16, marginBottom: 8 },
  titleBannerText: { fontWeight: '800', fontSize: 18, letterSpacing: 1, textAlign: 'center' },
  
  sheet: { 
    flex: 1, 
    marginHorizontal: 16, 
    borderRadius: 18, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 6,
    overflow: 'hidden', 
  },

  listContainer: {
    paddingTop: 10,
    paddingHorizontal: 12, 
    paddingBottom: 100,
    flexGrow: 1, // --- Ensure empty list component can center
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 100, // Pushed down from the top
    alignItems: 'center',
    justifyContent: 'center', // Center vertically
    paddingHorizontal: 20, // Add some padding
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6b7280', // muted color
    textAlign: 'center',
    marginTop: 8,
  },
  registerButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 10,
  },
  actionButton: {
    alignItems: 'center',
    padding: 10,
  },
  actionText: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default CropScreen;