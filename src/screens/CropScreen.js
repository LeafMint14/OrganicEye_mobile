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

const CropScreen = ({ navigation }) => {
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

          // --- ðŸ”’ STRICT FILTERING FOR CROP DATA ---
          // This query ensures ONLY: Healthy, Wilting, Yellowing, Spotting, Insect Bite
          // appear here. Real insects will be ignored.
          const q = query(
            collection(db, "detections"),
            where("pi_id", "==", piId),
            where("type", "==", "Crop"), // <--- THE KEY FILTER
            orderBy("timestamp", "desc")
          );

          unsubscribe = onSnapshot(q, (querySnapshot) => {
            const detectionsData = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              if (data.imageUrl) {
                detectionsData.push({
                  id: doc.id,
                  // Use 'detection' or 'primary' to get the disease name (e.g. "Wilting")
                  detection: data.detection || data.primary || "Analysis",
                  score: data.score || 0,
                  imageUrl: data.imageUrl, 
                  timestamp: data.timestamp,
                  status: data.status || "Unknown"
                });
              }
            });
            setItems(detectionsData); 
            setLoading(false);
          }, (error) => {
             console.error("Query Error:", error);
             setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    };

    fetchUserDataAndSubscribe();
    return () => unsubscribe();
  }, [user]); 

  // --- SELECTION & DELETE LOGIC (Same as InsectScreen) ---
  const toggleSelect = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(prev => prev.filter(item => item !== id));
    } else {
      setSelectedItems(prev => [...prev, id]);
    }
  };

  const handleLongPress = (id) => {
    setIsSelectMode(true);
    toggleSelect(id);
  };

  const selectAll = () => {
    setSelectedItems(items.map(item => item.id));
  };

  const exitSelection = () => {
    setIsSelectMode(false);
    setSelectedItems([]);
  };

  const handleDeleteSelected = async () => {
    Alert.alert(
      "Delete Reports",
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
                batch.delete(doc(db, "detections", docId));
              });
              await batch.commit();
              exitSelection();
            } catch (error) {
              Alert.alert("Error", "Could not delete items.");
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.id);
    const isHealthy = item.detection === 'Healthy';

    return (
      <TouchableOpacity 
        style={[styles.diagnosticCard, isSelected && styles.selectedCard]}
        onLongPress={() => handleLongPress(item.id)}
        onPress={() => {
          if (isSelectMode) {
            toggleSelect(item.id);
          } else {
            // Navigate to Details
            navigation.navigate('CropDetailsScreen', { 
              item: {
                id: item.id,
                diagnosis: item.detection,
                healthScore: item.score,
                img: { uri: item.imageUrl }, // Wrap strictly for legacy details screen
                timestamp: item.timestamp,
              }
            });
          }
        }}
      >
        <View style={styles.cardMain}>
          {isSelectMode && (
            <View style={styles.checkboxContainer}>
               <Ionicons 
                 name={isSelected ? "checkbox" : "square-outline"} 
                 size={24} 
                 color={isSelected ? "#1B4332" : "#CBD5E1"} 
               />
            </View>
          )}
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
          
          <View style={styles.cardInfo}>
            <Text style={[styles.cardStatus, { color: isHealthy ? '#2D6A4F' : '#E63946' }]}>
              {item.detection}
            </Text>
            <Text style={styles.cardTime}>
              {item.timestamp?.toDate().toLocaleDateString()} â€¢ Health Score: {item.score}/100
            </Text>
          </View>

          <View style={styles.iconCircle}>
             <Ionicons 
                name={isHealthy ? "leaf" : "alert-circle"} 
                size={22} 
                color={isHealthy ? "#2D6A4F" : "#E63946"} 
             />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground source={require('../../assets/backgroundimage.png')} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.brandBar}>
          {isSelectMode ? (
            <View style={styles.selectionHeader}>
              <TouchableOpacity onPress={exitSelection}>
                <Ionicons name="close" size={28} color="#1B4332" />
              </TouchableOpacity>
              <Text style={styles.selectedCountText}>{selectedItems.length} Selected</Text>
              <TouchableOpacity onPress={selectAll}>
                <Text style={styles.selectAllBtn}>Select All</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.brandText}>ORGANIC-EYE</Text>
              <View style={styles.titleBanner}>
                <Text style={styles.titleBannerText}>CROP HEALTH</Text>
              </View>
            </>
          )}
        </View>

        {/* LIST SHEET */}
        <View style={styles.sheet}>
          <Text style={styles.historyTitle}>Health History</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#1B4332" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="leaf-outline" size={50} color="#CBD5E1" />
                  <Text style={styles.emptyText}>
                     {!pairedPiId ? "No IoT Device Paired" : "No Health Scans Yet"}
                  </Text>
                </View>
              }
            />
          )}
        </View>

        {/* DELETE BAR */}
        {isSelectMode && selectedItems.length > 0 && (
          <View style={styles.actionContainer}>
            <Text style={styles.selectedCount}>{selectedItems.length} items selected</Text>
            <TouchableOpacity style={styles.actionButton} onPress={handleDeleteSelected}>
              <Ionicons name="trash" size={24} color="#E74C3C" />
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandBar: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 10 },
  brandText: { fontWeight: '900', letterSpacing: 4, fontSize: 14, textAlign: 'center', color: '#1B4332', opacity: 0.6 },
  titleBanner: { paddingVertical: 5 },
  titleBannerText: { fontWeight: '800', fontSize: 24, letterSpacing: 1, textAlign: 'center', color: '#1B4332' },
  selectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  selectedCountText: { fontSize: 18, fontWeight: '800', color: '#1B4332' },
  selectAllBtn: { fontWeight: '700', color: '#2D6A4F' },
  sheet: { 
    flex: 1, backgroundColor: '#FFFFFF', borderTopLeftRadius: 35, borderTopRightRadius: 35, 
    marginTop: 10, elevation: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
  },
  historyTitle: { fontSize: 16, fontWeight: '800', color: '#64748B', paddingHorizontal: 25, paddingTop: 25, paddingBottom: 15 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  diagnosticCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9', elevation: 2,
  },
  selectedCard: { borderColor: '#1B4332', backgroundColor: '#F0FFF4', borderWidth: 2 },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  checkboxContainer: { marginRight: 10 },
  thumbnail: { width: 55, height: 55, borderRadius: 12, backgroundColor: '#F8FAFC' },
  cardInfo: { flex: 1, marginLeft: 15 },
  cardStatus: { fontSize: 15, fontWeight: '800' },
  cardTime: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  iconCircle: { alignItems: 'flex-end', width: 40 },
  actionContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, backgroundColor: '#FFF',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 30, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', elevation: 20,
  },
  actionButton: { alignItems: 'center' },
  actionText: { fontSize: 11, fontWeight: '800', color: '#E74C3C', marginTop: 4 },
  selectedCount: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#94A3B8', fontWeight: '700', textAlign: 'center' }
});

export default CropScreen;