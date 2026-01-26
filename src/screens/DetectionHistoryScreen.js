import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, FlatList, Image,
  TouchableOpacity, ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { db } from '../../firebase';
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
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

    const fetchUserDataAndSubscribe = async () => {
      try {
        const userResult = await UserService.getUserData(user.uid);

        if (userResult.success && userResult.userData.pairedPiId) {
          const piId = userResult.userData.pairedPiId;
          setPairedPiId(piId);

          // Query all detections for this pi_id, ordered by timestamp desc
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

  const handleItemPress = (item) => {
    if (isSelectMode) {
      const isSelected = selectedItems.includes(item.id);
      if (isSelected) {
        setSelectedItems(selectedItems.filter(id => id !== item.id));
      } else {
        setSelectedItems([...selectedItems, item.id]);
      }
    } else {
      // Navigate to details based on type
      if (item.type === 'Insect') {
        navigation.navigate('InsectDetails', { item });
      } else if (item.type === 'Crop') {
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

  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) return;

    Alert.alert(
      'Delete Detections',
      `Are you sure you want to delete ${selectedItems.length} detection(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const batch = writeBatch(db);
              selectedItems.forEach(id => {
                const docRef = doc(db, "detections", id);
                batch.delete(docRef);
              });
              await batch.commit();
              setSelectedItems([]);
              setIsSelectMode(false);
              Alert.alert('Success', 'Detections deleted successfully');
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

        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No detections found</Text>
            <Text style={styles.emptySubtext}>Detection history will appear here</Text>
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
    paddingVertical: 12,
    backgroundColor: 'rgba(31, 122, 79, 0.9)',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerButton: { padding: 8, marginLeft: 8 },
  countText: { fontSize: 14, color: '#fff', opacity: 0.8 },
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