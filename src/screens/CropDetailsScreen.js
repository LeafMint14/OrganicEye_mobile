import React, { useRef, useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, ImageBackground, ScrollView, 
  Modal, TouchableOpacity, TouchableWithoutFeedback, Animated, SafeAreaView, Dimensions, 
  ActivityIndicator // <-- 1. NEW IMPORT
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
// --- 2. NEW IMPORTS ---
import { getCropInsight, INSECT_LABELS } from '../config/LabelMap';
import * as Speech from 'expo-speech';
import YoutubeIframe from 'react-native-youtube-iframe';
import { useAuth } from '../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, Timestamp, getDocs } from 'firebase/firestore';
import UserService from '../services/UserService';
// --- END NEW IMPORTS ---


const CropDetailsScreen = ({ route }) => {
  const { item } = route.params || {};
  const [previewVisible, setPreviewVisible] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const lastTapRef = useRef(0);
  const { theme, colors } = useTheme();
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  
  const insight = item ? getCropInsight(item.name) : getCropInsight(null);

  // --- 3. NEW STATE AND HOOKS FOR INSECT TALLY ---
  const { user } = useAuth(); // Get the current user
  const [mostLikelyInsect, setMostLikelyInsect] = useState(null); // To store the winner
  const [isLoadingInsect, setIsLoadingInsect] = useState(false); // For loading spinner
  // --- END NEW STATE ---
  
  // Stop speech when user leaves the screen
  useEffect(() => {
    return () => {
      Speech.stop();
      setIsSpeaking(false);
    };
  }, []); 

  // --- 4. NEW useEffect: To find the most likely insect for "Insect bite" ---
  useEffect(() => {
    const fetchMostLikelyInsect = async () => {
      // Only run this logic if the detection is "Insect bite" and user is logged in
      if (item.name !== 'Insect bite' || !user) {
        return;
      }

      setIsLoadingInsect(true);
      try {
        // 1. Get the user's paired Pi ID
        const userResult = await UserService.getUserData(user.uid);
        const piId = userResult?.userData?.pairedPiId;
        if (!piId) {
          setIsLoadingInsect(false);
          return; // No paired Pi, so we can't search
        }

        // 2. Define time range (e.g., last 7 days)
        const now = new Date();
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

        // 3. Query for all *insect* detections from this Pi in the last 7 days
        const q = query(
          collection(db, "detections"),
          where("pi_id", "==", piId),
          where("detection", "in", INSECT_LABELS), // Filter for insects only
          where("timestamp", ">=", sevenDaysAgoTimestamp) // Filter for last 7 days
        );

        // 4. Get and tally the documents
        const querySnapshot = await getDocs(q);
        const insectCounts = {};
        querySnapshot.forEach(doc => {
          const detectionName = doc.data().detection;
          insectCounts[detectionName] = (insectCounts[detectionName] || 0) + 1;
        });

        // 5. Find the insect with the highest count (the "majority")
        let maxCount = 0;
        let mostFrequent = null;
        for (const [insect, count] of Object.entries(insectCounts)) {
          if (count > maxCount) {
            maxCount = count;
            mostFrequent = insect;
          }
        }

        setMostLikelyInsect(mostFrequent); // This will be null if no insects were found
      } catch (error) {
        console.error("Error fetching likely insect:", error);
      } finally {
        setIsLoadingInsect(false);
      }
    };

    fetchMostLikelyInsect();
  }, [item, user]); // Re-run if the item or user changes
  // --- END NEW useEffect ---


  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No crop selected.</Text>
      </View>
    );
  }

  // --- Speech Functions (Unchanged) ---
  const startReading = () => {
    const textToSpeak = `${insight.title}. ${insight.description}`;
    setIsSpeaking(true);
    Speech.speak(textToSpeak, {
      language: 'en-US',
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const stopReading = () => {
    Speech.stop();
    setIsSpeaking(false);
  };
  
  // --- Modal/Tap Handlers (Unchanged) ---
  const openPreview = () => setPreviewVisible(true);
  const closePreview = () => setPreviewVisible(false);

  const handlePreviewTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 250) {
      Animated.spring(scale, {
        toValue: Math.abs(scale.__getValue() - 1) < 0.1 ? 2 : 1,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }).start();
    }
    lastTapRef.current = now;
  };

  // --- Video Player Handlers (Unchanged) ---
  const onVideoStateChange = (state) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  };

  const closeVideoModal = () => {
    setPlaying(false); // Stop the video
    setVideoModalVisible(false); // Close the modal
  };

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

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.15)' }]}>
          <TouchableOpacity activeOpacity={0.8} onPress={openPreview}>
            <Image source={item.img} style={styles.heroImage} resizeMode="cover" />
          </TouchableOpacity>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{(item.name || '').toUpperCase()}</Text>
        </View>

        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>DETAILS</Text>
          <View style={styles.row}><Text style={[styles.label, { color: colors.text }]}>Date :</Text><Text style={[styles.value, { color: colors.text }]}> {item.timestamp ? item.timestamp.toDate().toLocaleDateString() : 'N/A'}</Text></View>
          <View style={styles.rowMulti}><Text style={[styles.label, { color: colors.text }]}>Status :</Text><Text style={[styles.value, { color: colors.text }]}> {item.name}</Text></View>
          <View style={styles.row}><Text style={[styles.label, { color: colors.text }]}>Confidence level :</Text><Text style={[styles.value, { color: colors.text }]}> {item.confidence}%</Text></View>
          <View style={styles.row}><Text style={[styles.label, { color: colors.text }]}>Time :</Text><Text style={[styles.value, { color: colors.text }]}> {item.timestamp ? item.timestamp.toDate().toLocaleTimeString() : 'N/A'}</Text></View>
        </View>

        <View style={[styles.sheet, { backgroundColor: colors.card, marginTop: 14 }]}>
          <View style={styles.sheetTitleContainer}>
            <Text style={[styles.sheetTitle, { color: colors.text, flex: 1 }]}>SUGGESTIONS</Text>
            <TouchableOpacity 
              style={[styles.listenButton, { backgroundColor: colors.primary }]}
              onPress={isSpeaking ? stopReading : startReading}
            >
              <Text style={styles.listenButtonText}>
                {isSpeaking ? 'Stop 🤫' : 'Listen 🔊'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[
            styles.insightTitle, 
            { color: item.name === 'Healthy' ? '#2ecc71' : colors.primary }
          ]}>
            {insight.title}
          </Text>
          <Text style={[styles.insightDescription, { color: colors.text }]}>
            {insight.description}
          </Text>
          <Text style={[styles.sourceText, { color: colors.muted }]}>
            {insight.source}
          </Text>

          {/* --- 5. NEW: Most Likely Insect Block --- */}
          {item.name === 'Insect bite' && (
            <View style={[styles.likelyInsectBox, { borderColor: colors.primary, backgroundColor: theme === 'dark' ? colors.bg : '#f9f9f9' }]}>
              <Text style={[styles.likelyInsectTitle, { color: colors.primary }]}>Probable Cause Analysis</Text>
              {isLoadingInsect ? (
                <ActivityIndicator color={colors.primary} />
              ) : mostLikelyInsect ? (
                <Text style={[styles.likelyInsectText, { color: colors.text }]}>
                  Based on recent activity from your IoT device, the most likely cause for this damage is: 
                  <Text style={{ fontWeight: 'bold' }}> {mostLikelyInsect}</Text>.
                </Text>
              ) : (
                <Text style={[styles.likelyInsectText, { color: colors.muted }]}>
                  No recent insect detections found on your device to suggest a probable cause.
                </Text>
              )}
            </View>
          )}
          {/* --- END: Most Likely Insect Block --- */}

          {insight.youtubeId && (
            <TouchableOpacity 
              style={[styles.playButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setPlaying(true); 
                setVideoModalVisible(true);
              }}
            >
              <Text style={styles.playButtonText}>For more info, Play Me ▶️</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
      {/* ... (Image Preview Modal is unchanged) ... */}
      <Modal visible={previewVisible} transparent animationType="fade" onRequestClose={closePreview}>
        <View style={styles.modalBackdrop}>
          <TouchableWithoutFeedback onPress={closePreview}>
            <View style={styles.modalBackdropTouchable} />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={handlePreviewTap}>
            <Animated.Image
              source={item.img}
              style={[styles.previewImage, { transform: [{ scale }] }]}
              resizeMode="contain"
            />
          </TouchableWithoutFeedback>
          <Text style={styles.hint}>Tap to close  Double-tap to zoom</Text>
        </View>
      </Modal>
      
      {/* ... (Video Modal is unchanged) ... */}
      <Modal
        visible={videoModalVisible}
        animationType="slide"
        onRequestClose={closeVideoModal}
      >
        <SafeAreaView style={[styles.videoModalContainer, { backgroundColor: colors.bg }]}>
          <View style={styles.videoPlayerContainer}>
            <YoutubeIframe
              height={300}
              width={Dimensions.get('window').width}
              play={playing}
              videoId={insight.youtubeId}
              onChangeState={onVideoStateChange}
            />
          </View>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={closeVideoModal} 
          >
            <Text style={styles.closeButtonText}>Close Video</Text>
          </TouchableOpacity>
          <ScrollView style={styles.videoModalScroll}>
            <Text style={[styles.insightTitle, { color: colors.text, padding: 16 }]}>
              {insight.title}
            </Text>
            <Text style={[styles.insightDescription, { color: colors.text, paddingHorizontal: 16 }]}>
              {insight.description}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ImageBackground>
  );
};

// --- 6. NEW STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  brandBar: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandText: { color: '#E9F5EC', fontWeight: '800', letterSpacing: 2, fontSize: 16 },
  rolePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  roleDot: { color: '#F6C453', marginRight: 6 },
  roleText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  heroCard: { marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 18, padding: 16 },
  heroImage: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12 },
  heroTitle: { textAlign: 'center', fontWeight: '800', color: '#0b3010', fontSize: 16 },
  sheet: { marginTop: 14, marginHorizontal: 16, backgroundColor: '#ffffff', borderRadius: 18, padding: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
  sheetTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: { 
    textAlign: 'center', 
    fontSize: 18, 
    fontWeight: '900',
  },
  listenButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  listenButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  row: { flexDirection: 'row', marginBottom: 10 },
  rowMulti: { marginBottom: 10 },
  label: { fontWeight: '800', color: '#111' },
  value: { color: '#111' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  modalBackdropTouchable: { ...StyleSheet.absoluteFillObject },
  previewImage: { width: '90%', height: '70%' },
  hint: { color: '#fff', opacity: 0.7, marginTop: 12 },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sourceText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 10,
  },
  playButton: {
    marginTop: 15,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  videoModalContainer: {
    flex: 1,
  },
  videoPlayerContainer: {
    width: '100%',
    backgroundColor: '#000',
  },
  videoModalScroll: {
    flex: 1, 
  },
  closeButton: {
    padding: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // --- STYLES FOR NEW "PROBABLE CAUSE" BOX ---
  likelyInsectBox: {
    marginTop: 15,
    padding: 12,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  likelyInsectTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  likelyInsectText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // --- END NEW STYLES ---
});

export default CropDetailsScreen;