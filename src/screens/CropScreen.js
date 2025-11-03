import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Image, ScrollView, ImageBackground, ActivityIndicator // <-- MODIFIED: Added ActivityIndicator
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

// --- NEW IMPORTS ---
// Make sure this path to your firebase config is correct!
// It might be './firebaseConfig' or '../firebaseConfig' depending on your structure
import { db } from '../../firebase'; 
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
// Import the filter list from your new config file
import { CROP_LABELS } from '../config/LabelMap'; 
// --- END NEW IMPORTS ---

const CropScreen = ({ navigation }) => {
  const { theme, colors } = useTheme();

  // --- NEW: Create dynamic state for items and loading ---
  const [items, setItems] = useState([]); // Start with an empty list
  const [loading, setLoading] = useState(true); // To show a spinner
  // --- END NEW STATE ---

  // --- NEW: Add Firebase listener hook ---
  useEffect(() => {
    // 1. Create the query
    const q = query(
      collection(db, "detections"), // Get the "detections" collection
      where("detection", "in", CROP_LABELS), // Filter to ONLY show items in our CROP_LABELS list
      orderBy("timestamp", "desc") // Show the newest ones first
    );

    // 2. Set up the real-time listener
    // This is inside your useEffect hook...
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const detectionsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        if (data.imageUrl) {
          
          // --- HERE IS YOUR NEW ALGORITHM ---
          let status = 'UNKNOWN';
          if (data.detection === 'Healthy') {
            status = 'HEALTHY';
          } else if (CROP_LABELS.includes(data.detection)) {
            // If the label is in CROP_LABELS but NOT 'Healthy', it's unhealthy.
            status = 'UNHEALTHY';
          }
          // --- END OF ALGORITHM ---

          detectionsData.push({
            id: doc.id,
            name: data.detection, // The specific label (e.g., "Wilting")
            confidence: Math.round(data.confidence * 100), 
            img: { uri: data.imageUrl }, 
            timestamp: data.timestamp,
            status: status // <-- We add the new status field here
          });
        }
      });
      setItems(detectionsData); 
      setLoading(false);
    });
// ...

    // 3. Clean up the listener when the screen is closed
    return () => unsubscribe();
  }, []); // The empty array [] means this runs once when the screen loads
  // --- END FIREBASE LISTENER ---


  return (
    <ImageBackground
      source={require('../../assets/backgroundimage.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.brandBar}>
        <Text style={[styles.brandText, { color: colors.text }]}>ORGANIC-EYE</Text>
        <View style={[styles.rolePill, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.35)' }]}>
          <Text style={styles.roleDot}></Text>
          <Text style={[styles.roleText, { color: colors.text }]}>Farmer</Text>
        </View>
      </View>

      <View style={styles.titleBanner}>
        <Text style={styles.crop}></Text>
        <Text style={[styles.titleBannerText, { color: colors.text }]}>CROP DATA</Text>
        <Text style={styles.crop}></Text>
      </View>

      {/* --- MODIFIED: This section now shows a loader or the list --- */}
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        {loading ? (
          // If loading, show a spinner
          <ActivityIndicator style={{ marginTop: 50 }} size="large" color={colors.primary} />
        ) : items.length === 0 ? (
          // If no items, show a message
          <Text style={[styles.cardTitle, { color: colors.text, textAlign: 'center', marginTop: 50 }]}>
            No crop data found.
          </Text>
        ) : (
          // Otherwise, show the list of detections
        // This is in your return() section...
          <ScrollView contentContainerStyle={{ paddingVertical: 14 }} showsVerticalScrollIndicator={false}>
            {items.map(item => (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.bg }]}>
                <Image source={item.img} style={styles.cardImage} resizeMode="cover" />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                  
                  {/* --- NEW STATUS TEXT --- */}
                  <Text style={{ 
                    fontWeight: 'bold', 
                    color: item.status === 'HEALTHY' ? 'green' : 'red' 
                  }}>
                    Status: {item.status}
                  </Text>
                  {/* --- END NEW STATUS --- */}

                  <Text style={[styles.cardSub, { color: colors.muted }]}>{item.confidence}% confidence</Text>
                </View>
                <TouchableOpacity style={[styles.viewPill, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('CropDetails', { item })}>
                  <Text style={styles.viewPillText}>VIEW</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
// ...
        )}
      </View>
      {/* --- END OF MODIFICATION --- */}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  brandBar: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandText: { color: '#E9F5EC', fontWeight: '800', letterSpacing: 2, fontSize: 16 },
  rolePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  roleDot: { color: '#F6C453', marginRight: 6 },
  roleText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  titleBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginHorizontal: 16, marginBottom: 8 },
  crop: { fontSize: 20, marginHorizontal: 8 },
  titleBannerText: { color: '#0b3010', fontWeight: '800', fontSize: 18, letterSpacing: 1 },
  sheet: { flex: 1, marginHorizontal: 16, backgroundColor: '#ffffff', borderRadius: 18, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, marginHorizontal: 12, marginVertical: 6, backgroundColor: '#f8f9fa', borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  cardImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2c3e50', marginBottom: 4 },
  cardSub: { fontSize: 14, color: '#7f8c8d' },
  viewPill: { backgroundColor: '#1f7a4f', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  viewPillText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});

export default CropScreen;
