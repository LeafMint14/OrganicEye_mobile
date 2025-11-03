import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Image, ScrollView, ImageBackground, ActivityIndicator // <-- MODIFIED: Added ActivityIndicator
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

// --- NEW IMPORTS ---
// Make sure this path to your firebase config is correct!
import { db } from '../../firebase'; 
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
// Import the filter list from your new config file
import { INSECT_LABELS } from '../config/LabelMap'; 
// --- END NEW IMPORTS ---



const InsectScreen = ({ navigation }) => {
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
      where("detection", "in", INSECT_LABELS), // Filter to ONLY show items in our INSECT_LABELS list
      orderBy("timestamp", "desc") // Show the newest ones first
    );

    // 2. Set up the real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const detectionsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Only add if it has a valid image URL from Cloudinary
        if (data.imageUrl) { 
          detectionsData.push({
            id: doc.id,
            name: data.detection,
            confidence: Math.round(data.confidence * 100), // Format for display
            img: { uri: data.imageUrl }, // Load image from Cloudinary URL
            timestamp: data.timestamp, // Pass along for details screen
          });
        }
      });
      setItems(detectionsData); // Update the list with data from Firebase
      setLoading(false); // Stop the loading spinner
    });

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
        <Text style={styles.bug}></Text>
        <Text style={[styles.titleBannerText, { color: colors.text }]}>INSECT DATA</Text>
        <Text style={styles.bug}></Text>
      </View>

     {/* --- MODIFIED: This section now shows a loader or the list --- */}
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>
        {loading ? (
          // If loading, show a spinner
          <ActivityIndicator style={{ marginTop: 50 }} size="large" color={colors.primary} />
        ) : items.length === 0 ? (
          // If no items, show a message
          <Text style={[styles.cardTitle, { color: colors.text, textAlign: 'center', marginTop: 50 }]}>
            No insect data found.
          </Text>
        ) : (
          // Otherwise, show the list of detections
          <ScrollView contentContainerStyle={{ paddingVertical: 14 }} showsVerticalScrollIndicator={false}>
            {items.map(item => (
              <View key={item.id} style={[styles.card, { backgroundColor: colors.bg }]}>
                {/* Image 'source' now correctly uses the 'img' object from our state */}
                <Image source={item.img} style={styles.cardImage} resizeMode="cover" />
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>{item.confidence}% confidence</Text>
                </View>
                <TouchableOpacity style={[styles.viewPill, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate('InsectDetails', { item })}>
                  <Text style={styles.viewPillText}>VIEW</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
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
  bug: { fontSize: 20, marginHorizontal: 8 },
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

export default InsectScreen;
