import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ImageBackground, FlatList, Image,
  TouchableOpacity, ActivityIndicator, Alert, SafeAreaView,
  Platform, StatusBar
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { db } from '../../firebase'; 
import { collection, query, where, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; 
import { useAuth } from '../context/AuthContext';
import UserService from '../services/UserService';
// NOTE: NotificationService import removed to stop local duplicate alerts

const InsectScreen = ({ navigation }) => {
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

    let unsubscribeUser = () => {};
    let unsubscribeDetections = () => {};

    // 1. Listen for Pairing (Real-time)
    const userDocRef = doc(db, "users", user.uid);
    unsubscribeUser = onSnapshot(userDocRef, (userDocSnap) => {
      const userData = userDocSnap.data();
      const piId = userData?.pairedPiId;

      if (piId) {
        setPairedPiId(piId);

        // 2. Listen for Insects
        const q = query(
          collection(db, "detections"),
          where("pi_id", "==", piId),
          where("type", "in", ["Insect", "Insect Detection"]), 
          orderBy("timestamp", "desc")
        );

        unsubscribeDetections();
        unsubscribeDetections = onSnapshot(q, (querySnapshot) => {
          const detectionsData = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Soft Delete Filter
            if (data.imageUrl && !data.hiddenFromMain) {
              detectionsData.push({
                id: doc.id,
                detection: data.detection || data.primary || "Unknown Insect",
                confidence: data.score || Math.round(data.confidence * 100) || 0,
                imageUrl: data.imageUrl, 
                timestamp: data.timestamp,
              });
            }
          });
          setItems(detectionsData); 
          setLoading(false);
        }, (error) => {
          console.error("🔥 Query Error:", error);
          setLoading(false);
        });
      } else {
        setPairedPiId(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeUser();
      unsubscribeDetections();
    };
  }, [user]);

  // --- LOGIC FUNCTIONS ---
  const toggleSelect = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleLongPress = (id) => {
    setIsSelectMode(true);
    toggleSelect(id);
  };

  const handleDeleteSelected = async () => {
    Alert.alert(
      "Remove Detections", 
      `Remove ${selectedItems.length} items from this screen? (They will still be saved in your Detection History for 30 days)`, 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: async () => {
            try {
              const batch = writeBatch(db);
              
              selectedItems.forEach(id => {
                const docRef = doc(db, "detections", id);
                batch.update(docRef, { hiddenFromMain: true });
              });
              
              await batch.commit();
              setIsSelectMode(false);
              setSelectedItems([]);
            } catch (error) {
              console.error("Error hiding items:", error);
              Alert.alert("Error", "Could not remove items.");
            }
          } 
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedItems.includes(item.id);
    
    // --- NEW ANOMALY LOGIC FOR FEED HIGHLIGHTING ---
    const normalizedDetection = item.detection.toLowerCase();
    const isAnomaly = normalizedDetection.includes('unidentified');
    const isBeneficial = normalizedDetection.includes('ladybug') || normalizedDetection.includes('bee') || normalizedDetection.includes('lacewing') || normalizedDetection.includes('beneficial');

    // Dynamic Styling Variables
    let statusColor = '#E63946'; // Default: Pest (Red)
    let iconName = 'bug';
    
    if (isAnomaly) {
      statusColor = '#475569'; // Slate Gray for Anomaly
      iconName = 'warning';
    } else if (isBeneficial) {
      statusColor = '#2D6A4F'; // Green for Beneficial
      iconName = 'shield-checkmark';
    }

    return (
      <TouchableOpacity 
        style={[
          styles.diagnosticCard, 
          isAnomaly && !isSelected && styles.anomalyCard, // Highlight Unidentified items
          isSelected && styles.selectedCard
        ]}
        onLongPress={() => handleLongPress(item.id)}
        onPress={() => isSelectMode ? toggleSelect(item.id) : navigation.navigate('InsectDetails', { item })}
      >
        <View style={styles.cardMain}>
          {isSelectMode && (
            <Ionicons name={isSelected ? "checkbox" : "square-outline"} size={24} color="#1B4332" style={{marginRight: 10}} />
          )}
          <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
          <View style={styles.cardInfo}>
            <Text style={[styles.cardStatus, { color: statusColor }]} numberOfLines={1}>
               {isAnomaly ? `⚠️ Anomaly: ${item.detection}` : item.detection}
            </Text>
            <Text style={styles.cardTime}>
              {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Just now'} • {item.confidence}%
            </Text>
          </View>

          <View style={styles.iconCircle}>
             <Ionicons 
                name={iconName} 
                size={22} 
                color={statusColor} 
             />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground source={require('../../assets/backgroundimage.png')} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.brandBar}>
          {isSelectMode ? (
            <View style={styles.selectionHeader}>
              <TouchableOpacity onPress={() => {setIsSelectMode(false); setSelectedItems([]);}}>
                <Ionicons name="close" size={28} color="#1B4332" />
              </TouchableOpacity>
              <Text style={styles.selectedCountText}>{selectedItems.length} Selected</Text>
              <TouchableOpacity onPress={() => setSelectedItems(items.map(i => i.id))}>
                <Text style={styles.selectAllBtn}>Select All</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.brandText}>ORGANIC-EYE</Text>
              <View style={styles.titleBanner}>
                <Text style={styles.titleBannerText}>INSECT DATA</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.sheet}>
          {loading ? (
            <ActivityIndicator size="large" color="#1B4332" style={{ marginTop: 50 }} />
          ) : (
            <FlatList
              data={items}
              renderItem={renderItem} 
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name={!pairedPiId ? "qr-code-outline" : "bug-outline"} size={50} color="#CBD5E1" />
                  <Text style={styles.emptyText}>{!pairedPiId ? "No IoT Device Paired" : "No Insects Detected"}</Text>
                </View>
              }
            />
          )}
        </View>

        {isSelectMode && selectedItems.length > 0 && (
          <TouchableOpacity style={styles.actionContainer} onPress={handleDeleteSelected}>
            <Ionicons name="trash" size={24} color="#E74C3C" />
            <Text style={styles.actionText}>Delete Selected</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandBar: { 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 40, 
    paddingHorizontal: 16, 
    paddingBottom: 10 
  },
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
  listContainer: { paddingHorizontal: 20, paddingBottom: 100, paddingTop: 20 },
  diagnosticCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#F1F5F9', elevation: 2,
  },
  
  // --- NEW ANOMALY STYLING ---
  anomalyCard: { 
    borderColor: '#94A3B8', 
    backgroundColor: '#F8FAFC', 
    borderWidth: 1.5 
  },
  // ---------------------------
  
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
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    paddingHorizontal: 30, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', elevation: 20,
  },
  actionButton: { alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '900', color: '#E74C3C' },
  selectedCount: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  emptyContainer: { flex: 1, alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#94A3B8', fontWeight: '700', textAlign: 'center' }
});

export default InsectScreen;