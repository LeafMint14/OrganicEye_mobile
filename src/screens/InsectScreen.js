import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, FlatList,
  TouchableOpacity, ActivityIndicator, Alert 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { db } from '../../firebase'; // Make sure this path is correct
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { INSECT_LABELS } from '../config/LabelMap'; 
import DetectionCard from '../components/DetectionCard'; 
import { Ionicons } from '@expo/vector-icons'; 

const InsectScreen = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]); 

  useEffect(() => {
    const q = query(
      collection(db, "detections"),
      where("detection", "in", INSECT_LABELS),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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

    return () => unsubscribe();
  }, []);

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
      navigation.navigate('InsectDetails', { 
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
        <Text style={[styles.titleBannerText, { color: colors.text }]}>INSECT DATA</Text>
      </View>

      {/* --- MODIFIED: Added the white sheet View wrapper --- */}
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>No insect detections yet.</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandBar: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 10 },
  brandText: { fontWeight: '800', letterSpacing: 2, fontSize: 16, textAlign: 'center' },
  titleBanner: { paddingVertical: 12, marginHorizontal: 16, marginBottom: 8 },
  titleBannerText: { fontWeight: '800', fontSize: 18, letterSpacing: 1, textAlign: 'center' },
  
  // --- NEW: Added the sheet style back ---
  sheet: { 
    flex: 1, 
    marginHorizontal: 16, 
    // backgroundColor is set inline
    borderRadius: 18, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.15, 
    shadowRadius: 6,
    overflow: 'hidden', // Ensures FlatList respects the border radius
  },
  // --- END NEW STYLE ---

  listContainer: {
    paddingTop: 10,
    paddingHorizontal: 12, // Add padding for inside the sheet
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    paddingTop: 150,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
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

export default InsectScreen;