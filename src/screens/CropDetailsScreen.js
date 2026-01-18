import React, { useRef, useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, ImageBackground, ScrollView, 
  Modal, TouchableOpacity, Animated, SafeAreaView, ActivityIndicator 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getCropInsight, INSECT_LABELS } from '../config/LabelMap';
import * as Speech from 'expo-speech';
import YoutubeIframe from 'react-native-youtube-iframe';
import { useAuth } from '../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, Timestamp, getDocs, doc, getDoc } from 'firebase/firestore';
import UserService from '../services/UserService';
import { Ionicons } from '@expo/vector-icons';

const CropDetailsScreen = ({ route, navigation }) => {
  // 1. Get the skeleton data passed from CropScreen
  const { item } = route.params || {};

  // 2. State to hold the full data (including "basis" counts)
  const [fullData, setFullData] = useState(item || {});
  const [loadingFullData, setLoadingFullData] = useState(true);

  // 3. UI States
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  
  // 4. Insect Correlation Logic
  const [mostLikelyInsect, setMostLikelyInsect] = useState(null);
  const [isLoadingInsect, setIsLoadingInsect] = useState(false);
  const { user } = useAuth();
  const { colors } = useTheme();

  // --- EFFECT 1: FETCH FULL DETAILS (Basis, etc.) ---
  useEffect(() => {
    const fetchFullDocument = async () => {
      if (!item?.id) return;
      try {
        const docRef = doc(db, "detections", item.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Merge fetched data with existing item data
          setFullData(prev => ({ 
            ...prev, 
            ...data,
            // Ensure timestamp is handled correctly regardless of source
            timestamp: data.timestamp || prev.timestamp 
          }));
        }
      } catch (e) {
        console.log("Error fetching full details:", e);
      } finally {
        setLoadingFullData(false);
      }
    };
    fetchFullDocument();
  }, [item]);

  // --- EFFECT 2: FETCH PROBABLE INSECT CAUSE ---
  useEffect(() => {
    const fetchProbableInsect = async () => {
      // Only run if we have a "Insect Bite" detection or generic insect issue
      const basis = fullData.basis || {};
      const hasInsectSign = basis['Insect Bite'] > 0 || fullData.detection === 'Insect bite';
      
      if (!hasInsectSign || !user) return;

      setIsLoadingInsect(true);
      try {
        const userResult = await UserService.getUserData(user.uid);
        const piId = userResult?.userData?.pairedPiId;
        if (!piId) return;

        // Look back 7 days for insects
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const q = query(
          collection(db, "detections"),
          where("pi_id", "==", piId),
          where("detection", "in", INSECT_LABELS), // Look for specific bugs
          where("timestamp", ">=", Timestamp.fromDate(sevenDaysAgo))
        );

        const snap = await getDocs(q);
        const counts = {};
        snap.forEach(doc => {
          const name = doc.data().detection;
          counts[name] = (counts[name] || 0) + 1;
        });

        // Find most frequent insect
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) setMostLikelyInsect(sorted[0][0]);
      } catch (e) {
        console.warn("Insect Fetch Error:", e);
      } finally {
        setIsLoadingInsect(false);
      }
    };

    if (!loadingFullData) {
      fetchProbableInsect();
    }
  }, [fullData, user, loadingFullData]);

  // --- DERIVED DATA ---
  const diagnosis = fullData.detection || fullData.diagnosis || "Analysis";
  const score = fullData.score || fullData.healthScore || 0;
  const isHealthy = diagnosis === 'Healthy' || score > 85;
  const imageUrl = fullData.imageUrl || fullData.img?.uri;
  const basis = fullData.basis || {}; // Might be empty until fetch completes

  // Get AI Text
  const insight = getCropInsight(diagnosis);

  // --- HANDLERS ---
  const startReading = () => {
    setIsSpeaking(true);
    Speech.speak(`${insight.title}. ${insight.description}`, {
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  if (!item) return null;

  return (
    <ImageBackground source={require('../../assets/backgroundimage.png')} style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#1B4332" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DIAGNOSTIC REPORT</Text>
          <View style={{width: 28}} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          
          {/* HERO IMAGE & SCORE */}
          <View style={styles.heroCard}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewVisible(true)} style={styles.imageFrame}>
              <Image source={{ uri: imageUrl }} style={styles.mainImage} />
              <View style={[styles.statusBadge, { backgroundColor: isHealthy ? '#2D6A4F' : '#BC4749' }]}>
                <Text style={styles.statusText}>{isHealthy ? "HEALTHY" : "ISSUE DETECTED"}</Text>
              </View>
            </TouchableOpacity>
            
            <View style={styles.scoreSection}>
              <View>
                <Text style={styles.dateText}>
                  {fullData.timestamp?.toDate ? fullData.timestamp.toDate().toLocaleDateString() : 'Recent'}
                </Text>
                <Text style={styles.timeText}>
                  {fullData.timestamp?.toDate ? fullData.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </Text>
              </View>
              <View style={styles.scoreCircle}>
                <Text style={[styles.scorePercent, { color: isHealthy ? '#2D6A4F' : '#BC4749' }]}>{score}</Text>
                <Text style={styles.scoreSub}>SCORE</Text>
              </View>
            </View>
          </View>

          {/* BASIS OF ANALYSIS (Dynamic Loading) */}
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
               <Ionicons name="analytics" size={20} color="#1B4332" />
               <Text style={styles.sheetTitle}>BASIS OF ANALYSIS</Text>
            </View>
            <View style={styles.divider} />
            
            {loadingFullData ? (
              <ActivityIndicator color="#1B4332" />
            ) : Object.keys(basis).length > 0 ? (
              Object.entries(basis).map(([label, count]) => (
                <View key={label} style={styles.analysisRow}>
                  <Text style={styles.analysisLabel}>{label}</Text>
                  <View style={[styles.countPill, {backgroundColor: count > 0 ? (isHealthy ? '#E8F5E9' : '#FFEBEE') : '#F8FAFC'}]}>
                     <Text style={[styles.analysisCount, {color: count > 0 ? (isHealthy ? '#2D6A4F' : '#BC4749') : '#94A3B8'}]}>
                       {count} detected
                     </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{color: '#94A3B8', fontStyle: 'italic'}}>No specific symptoms recorded.</Text>
            )}
          </View>

          {/* AI CROSS REFERENCE (Only if Insect Bite found) */}
          {(basis['Insect Bite'] > 0 || diagnosis === 'Insect bite') && (
            <View style={[styles.sheet, styles.causeSheet]}>
              <Text style={styles.causeLabel}>AI CROSS-REFERENCE</Text>
              {isLoadingInsect ? (
                <ActivityIndicator color="#FFF" style={{marginVertical: 10}} />
              ) : (
                <View style={styles.causeContent}>
                  <Ionicons name="bug" size={24} color="#A7F3D0" />
                  <Text style={styles.causeDesc}>
                    Diagnostic data suggests recent <Text style={{fontWeight: '900', color: '#A7F3D0'}}>{mostLikelyInsect || "Pest"}</Text> activity is the primary cause of damage.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TREATMENT SECTION */}
          <View style={[styles.sheet, { marginTop: 15 }]}>
            <View style={styles.treatmentHeader}>
              <View style={{flex: 1}}>
                <Text style={styles.treatmentLabel}>RECOMMENDED TREATMENT</Text>
                <Text style={[styles.insightTitle, {color: isHealthy ? '#2D6A4F' : '#BC4749'}]}>
                  {insight.title}
                </Text>
              </View>
              <TouchableOpacity onPress={isSpeaking ? () => Speech.stop() : startReading} style={styles.audioBtn}>
                <Ionicons name={isSpeaking ? "stop-circle" : "volume-high"} size={32} color="#1B4332" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.insightDesc}>{insight.description}</Text>

            {insight.youtubeId && (
              <TouchableOpacity 
                style={styles.videoBtn}
                onPress={() => { setPlaying(true); setVideoModalVisible(true); }}
              >
                <Ionicons name="logo-youtube" size={20} color="#FFF" />
                <Text style={styles.videoBtnText}>WATCH TREATMENT GUIDE</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
      
      {/* MODALS */}
      <Modal visible={previewVisible} transparent={true} onRequestClose={() => setPreviewVisible(false)}>
         <View style={styles.modalContainer}>
             <TouchableOpacity style={styles.closeModal} onPress={() => setPreviewVisible(false)}>
                 <Ionicons name="close-circle" size={40} color="#FFF"/>
             </TouchableOpacity>
             {imageUrl && <Image source={{ uri: imageUrl }} style={styles.fullImage} />}
         </View>
       </Modal>

       {insight.youtubeId && (
         <Modal visible={videoModalVisible} transparent={true} animationType="slide">
           <View style={styles.videoModalContainer}>
             <View style={styles.videoWrapper}>
               <YoutubeIframe
                 height={220}
                 play={playing}
                 videoId={insight.youtubeId}
               />
               <TouchableOpacity style={styles.closeVideoBtn} onPress={() => { setPlaying(false); setVideoModalVisible(false); }}>
                 <Text style={{color: 'white', fontWeight: 'bold'}}>Close Video</Text>
               </TouchableOpacity>
             </View>
           </View>
         </Modal>
       )}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  headerTitle: { color: '#1B4332', fontWeight: '900', fontSize: 14, letterSpacing: 3, opacity: 0.8 },
  scrollBody: { paddingHorizontal: 16, paddingBottom: 40 },
  
  heroCard: { backgroundColor: '#FFF', borderRadius: 25, overflow: 'hidden', elevation: 10, marginBottom: 15 },
  imageFrame: { width: '100%', height: 230, backgroundColor: '#eee' },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  statusBadge: { position: 'absolute', top: 15, right: 15, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  statusText: { color: '#FFF', fontWeight: '900', fontSize: 10 },
  
  scoreSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  dateText: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  timeText: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  scoreCircle: { alignItems: 'center', backgroundColor: '#F8FAFC', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 18 },
  scorePercent: { fontSize: 24, fontWeight: '900' },
  scoreSub: { fontSize: 8, fontWeight: 'bold', color: '#94A3B8', marginTop: -2 },

  sheet: { backgroundColor: '#FFF', borderRadius: 25, padding: 20, marginBottom: 12, elevation: 5 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sheetTitle: { fontSize: 13, fontWeight: '800', marginLeft: 8, color: '#94A3B8', letterSpacing: 1 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 15 },
  
  analysisRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  analysisLabel: { color: '#475569', fontSize: 15, fontWeight: '700' },
  countPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  analysisCount: { fontWeight: '800', fontSize: 12 },

  causeSheet: { backgroundColor: '#1B4332' },
  causeLabel: { color: '#A7F3D0', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
  causeContent: { flexDirection: 'row', alignItems: 'center' },
  causeDesc: { color: '#FFF', fontSize: 14, lineHeight: 20, flex: 1, marginLeft: 12 },

  treatmentHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 15 },
  treatmentLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', marginBottom: 5, letterSpacing: 1 },
  insightTitle: { fontSize: 20, fontWeight: '800' },
  insightDesc: { fontSize: 15, color: '#475569', lineHeight: 24, marginBottom: 20 },
  videoBtn: { 
    backgroundColor: '#BC4749', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    borderRadius: 18 
  },
  videoBtnText: { color: '#FFF', fontWeight: '800', marginLeft: 10, fontSize: 13 },
  audioBtn: { marginLeft: 10 },
  
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  closeModal: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  fullImage: { width: '100%', height: 400, resizeMode: 'contain' },
  
  videoModalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  videoWrapper: { backgroundColor: '#000', borderRadius: 12, overflow: 'hidden', paddingBottom: 10 },
  closeVideoBtn: { alignItems: 'center', padding: 15 }
});

export default CropDetailsScreen;