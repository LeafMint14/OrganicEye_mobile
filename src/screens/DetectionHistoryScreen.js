import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, SafeAreaView,
  Platform, StatusBar
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { db } from '../../firebase';
// --- ADDED Timestamp TO IMPORTS ---
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc, getDocs, Timestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import UserService from '../services/UserService';
import DetectionCard from '../components/DetectionCard';

const DetectionHistoryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const { user } = useAuth();
  const [pairedPiId, setPairedPiId] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};

    // --- 30-DAY GARBAGE COLLECTION LOGIC ---
    const cleanupOldDetections = async (piId) => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // CRITICAL FIX: Convert JS Date to Firebase Timestamp for accurate querying
        const fbTimestamp = Timestamp.fromDate(thirtyDaysAgo);

        const oldDetectionsQuery = query(
          collection(db, "detections"),
          where("pi_id", "==", piId),
          where("timestamp", "<", fbTimestamp)
        );

        const snapshot = await getDocs(oldDetectionsQuery);
        
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.forEach(docSnap => {
            // This is a HARD delete. It permanently wipes it from the database.
            batch.delete(docSnap.ref);
          });
          await batch.commit();
          console.log(`🧹 Cleaned up ${snapshot.size} detections older than 30 days.`);
        }
      } catch (error) {
        console.error("Error cleaning up old detections. (Note: You may need to build a composite index in Firebase for this):", error);
      }
    };

    const fetchUserDataAndSubscribe = async () => {
      try {
        const userResult = await UserService.getUserData(user.uid);

        if (userResult.success && userResult.userData.pairedPiId) {
          const piId = userResult.userData.pairedPiId;
          setPairedPiId(piId);

          // 1. Run the background cleanup task first
          await cleanupOldDetections(piId);

          // 2. Query ALL detections for this pi_id (ignoring 'hiddenFromMain')
          const q = query(
            collection(db, "detections"),
            where("pi_id", "==", piId),
            orderBy("timestamp", "desc")
          );

          unsubscribe = onSnapshot(
            q,
            (querySnapshot) => {
              const detections = [];
              querySnapshot.forEach((doc) => {
                detections.push({ id: doc.id, ...doc.data() });
              });
              setItems(detections);
              setLoading(false);
            },
            (error) => {
              console.error("Error fetching detections:", error);
              setLoading(false);
            }
          );
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in fetchUserDataAndSubscribe:", error);
        setLoading(false);
      }
    };

    fetchUserDataAndSubscribe();

    return () => unsubscribe();
  }, [user]);

  // --- SELECTION & NAVIGATION LOGIC ---
  const handleItemPress = (item) => {
    if (isSelectMode) {
      const isSelected = selectedItems.includes(item.id);
      if (isSelected) {
        setSelectedItems(selectedItems.filter(id => id !== item.id));
      } else {
        setSelectedItems([...selectedItems, item.id]);
      }
    } else {
      if (item.type === 'Insect' || item.type === 'Insect Detection') {
        navigation.navigate('InsectDetails', { item });
      } else if (item.type === 'Crop' || item.type === 'Crop Analysis') {
        navigation.navigate('CropDetailsScreen', { item });
      }
    }
  };

  const handleLongPress = (item) => {
    if (!isSelectMode) {
      setIsSelectMode(true);
      setSelectedItems([item.id]);
    }
  };

  // --- MANUAL HARD DELETE ---
  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return;

    Alert.alert(
      'Permanently Delete',
      `Are you sure you want to permanently delete ${selectedItems.length} detection(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              const batch = writeBatch(db);
              selectedItems.forEach(id => {
                const docRef = doc(db, "detections", id);
                batch.delete(docRef); // Hard Delete for the master history screen
              });
              await batch.commit();
              setSelectedItems([]);
              setIsSelectMode(false);
            } catch (error) {
              console.error("Error deleting detections:", error);
              Alert.alert('Error', 'Failed to delete detections');
            }
          }
        }
      ]
    );
  };

  const cancelSelection = () => {
    setIsSelectMode(false);
    setSelectedItems([]);
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
          <Text style={styles.loadingText}>Loading detection history...</Text>
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
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detection History</Text>
          <View style={styles.headerRight}>
            {isSelectMode ? (
              <>
                <TouchableOpacity onPress={deleteSelectedItems} style={styles.headerButton}>
                  <Ionicons name="trash" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={cancelSelection} style={styles.headerButton}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.countText}>{items.length} detections</Text>
            )}
          </View>
        </View>

        {/* 30-Day Note Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={18} color="#1B4332" />
          <Text style={styles.infoBannerText}>
            Note: Detection data is automatically permanently deleted after 30 days to save space.
          </Text>
        </View>

        {/* List Content */}
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No detections found</Text>
            <Text style={styles.emptySubtext}>Your full detection history will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <DetectionCard
                item={item}
                onPress={() => handleItemPress(item)}
                onLongPress={() => handleLongPress(item)}
                isSelected={selectedItems.includes(item.id)}
              />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 45, 
    paddingBottom: 12,
    backgroundColor: 'rgba(31, 122, 79, 0.9)',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerButton: { padding: 8, marginLeft: 8 },
  countText: { fontSize: 14, color: '#fff', opacity: 0.8 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#C8E6C9',
  },
  infoBannerText: {
    fontSize: 12,
    color: '#1B4332',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16, textAlign: 'center' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8, textAlign: 'center' },
  listContainer: { paddingBottom: 20 },
});

export default DetectionHistoryScreen;