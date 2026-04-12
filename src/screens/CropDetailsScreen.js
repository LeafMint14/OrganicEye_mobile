import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, ImageBackground, ScrollView, 
  Modal, TouchableOpacity, SafeAreaView, ActivityIndicator,
  Platform, StatusBar 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getCropInsight } from '../config/LabelMap';
import * as Speech from 'expo-speech';
import { WebView } from 'react-native-webview';
import { useAuth } from '../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const CropDetailsScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  const [fullData, setFullData] = useState(item || {});
  const [loadingFullData, setLoadingFullData] = useState(true);
  
  // Modals & Features States
  const [webModalVisible, setWebModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false); 
  const [currentUrl, setCurrentUrl] = useState('');
  const [modalTitle, setModalTitle] = useState(''); 
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const { user } = useAuth();

  // 1. Core Data Extraction
  const rawDiagnosis = fullData.detection || fullData.diagnosis || "Analysis";
  let score = fullData.score || fullData.healthScore || fullData.confidence || 0;
  if (score < 1 && score > 0) score = Math.round(score * 100); 

  // --- NEW ANOMALY LOGIC ---
  const isHealthy = rawDiagnosis.toLowerCase().includes('healthy') || score > 85;
  const isAnomaly = rawDiagnosis.toLowerCase().includes('unidentified');
  
  const imageUrl = fullData.imageUrl || fullData.img?.uri;
  
  // 2. Date and Time Logic
  let detectionDate = "Unknown Date";
  let detectionTime = "Unknown Time";
  if (fullData.timestamp) {
    const dateObj = fullData.timestamp.toDate ? fullData.timestamp.toDate() : new Date(fullData.timestamp);
    detectionDate = dateObj.toLocaleDateString();
    detectionTime = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  // 3. Basis / Confidence Logic
  let basis = fullData.basis || {};
  if (Object.keys(basis).length === 0 && rawDiagnosis) {
    basis[rawDiagnosis] = score > 1 ? score / 100 : score; 
  }

  // Split multiple detections into an array
  const detectedIssues = rawDiagnosis.split(',').map(issue => issue.trim()).filter(issue => issue.length > 0);
  const primaryDiagnosis = detectedIssues.length > 0 ? detectedIssues[0] : "Healthy";

  useEffect(() => {
    const fetchFullDocument = async () => {
      if (!item?.id) {
        setLoadingFullData(false);
        return;
      }
      try {
        const docRef = doc(db, "detections", item.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFullData(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (e) {
        console.log("Error fetching full details:", e);
      } finally {
        setLoadingFullData(false);
      }
    };
    fetchFullDocument();
  }, [item]);

  // Fetch expert insight from LabelMap
  const insight = getCropInsight(primaryDiagnosis) || {
    title: "General Plant Care",
    description: `Symptoms detected: ${rawDiagnosis}.`,
    medicalDetail: "Requires multi-step systemic approach.",
    treatmentSteps: "1. Isolate plant.\n2. Ensure proper watering.\n3. Apply organic neem oil.\n4. Monitor daily.",
    source: "Consult local agricultural extension.",
    youtubeId: null
  };

  // --- TEXT TO SPEECH LOGIC ---
  const toggleSpeech = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      const textToRead = `Diagnostic Report for ${detectionDate}. Detected: ${rawDiagnosis}. ${insight.title}. ${insight.medicalDetail}. Steps: ${insight.treatmentSteps}`;
      Speech.speak(textToRead, {
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
        pitch: 1.0,
        rate: 0.9,
      });
    }
  };

  useEffect(() => {
    return () => Speech.stop();
  }, []);

  // --- WEBVIEW LOGIC ---
  const openWebResource = (url, title) => {
    setCurrentUrl(url);
    setModalTitle(title);
    setWebModalVisible(true);
  };

  if (!item) return null;

  return (
    <ImageBackground source={require('../../assets/backgroundimage.png')} style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={28} color="#1B4332" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>DIAGNOSTIC REPORT</Text>
          <TouchableOpacity onPress={toggleSpeech} style={styles.audioAction}>
            <Ionicons name={isSpeaking ? "stop-circle" : "volume-high"} size={26} color="#1B4332" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          
          {/* 🖼️ HERO IMAGE */}
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => setImageModalVisible(true)} 
            style={styles.heroCard}
          >
            <Image source={{ uri: imageUrl }} style={styles.mainImage} />
            <View style={[styles.statusBadge, { backgroundColor: isAnomaly ? '#475569' : (isHealthy ? '#2D6A4F' : '#BC4749') }]}>
              <Text style={styles.statusText}>
                {isAnomaly ? "⚠️ ANOMALY" : (isHealthy ? "HEALTHY" : "UNHEALTHY")}
              </Text>
            </View>
            <View style={styles.expandIcon}>
              <Ionicons name="expand" size={18} color="#FFF" />
            </View>
          </TouchableOpacity>

          {/* ⏰ TIME & DATE SECTION */}
          <View style={styles.timeSection}>
            <Ionicons name="time-outline" size={18} color="#64748B" />
            <Text style={styles.timeText}>Detected on {detectionDate} at {detectionTime}</Text>
          </View>

          {/* 📊 BASIS OF ANALYSIS SECTION */}
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
               <Ionicons name="analytics" size={20} color="#1B4332" />
               <Text style={styles.sheetTitle}>BASIS OF ANALYSIS</Text>
            </View>
            <View style={styles.divider} />
            
            <View style={styles.analysisBox}>
                <Text style={styles.labelSmall}>DETECTION</Text>
                <Text style={styles.detectionMain}>{rawDiagnosis}</Text>
                
                <Text style={[styles.labelSmall, {marginTop: 15}]}>CONFIDENCE LEVELS</Text>
                {Object.keys(basis).length > 0 ? (
                    Object.entries(basis).map(([label, confidence]) => {
                      const confDecimal = confidence > 1 ? confidence / 100 : confidence;
                      const confPercent = Math.round(confDecimal * 100);
                      
                      return (
                        <View key={label} style={styles.confidenceRow}>
                            <Text style={styles.confLabel}>{label}</Text>
                            <View style={styles.barContainer}>
                                <View style={[styles.barFill, {width: `${confPercent}%`, backgroundColor: isAnomaly ? '#475569' : (isHealthy ? '#2D6A4F' : '#BC4749')}]} />
                            </View>
                            <Text style={styles.confValue}>{confPercent}%</Text>
                        </View>
                      )
                    })
                ) : (
                    <Text style={styles.emptyText}>Processing confidence scores...</Text>
                )}
                
                <View style={styles.statusRow}>
                    <Text style={styles.labelSmall}>STATUS</Text>
                    <Text style={[styles.statusResult, {color: isAnomaly ? '#475569' : (isHealthy ? '#2D6A4F' : '#BC4749')}]}>
                        {isAnomaly ? "Foreign Matter Detected" : (isHealthy ? "Optimal Condition" : "Intervention Required")}
                    </Text>
                </View>
            </View>
          </View>

          {/* 🔬 AGRONOMIC PATHOLOGY (DYNAMIC EXPERT INFO) */}
          <View style={styles.sheet}>
            <Text style={styles.infoHeading}>BIOLOGICAL MECHANISM</Text>
            <Text style={styles.infoPara}>
              {insight.medicalDetail}
            </Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.infoHeading}>EXPERT RESOURCES</Text>
            <Text style={[styles.infoPara, { fontStyle: 'italic', fontSize: 12 }]}>
              {insight.source}
            </Text>

            {detectedIssues.map((issue, index) => {
              const displayIssue = issue.charAt(0).toUpperCase() + issue.slice(1);
              
              const smartSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(issue + ' Brassica rapa pechay site:.gov OR site:.edu')}`;
              
              return (
                <TouchableOpacity 
                  key={index}
                  style={styles.webLinkBtn}
                  onPress={() => openWebResource(smartSearchUrl, `Academic Journals: ${displayIssue}`)}
                >
                    <Ionicons name="library-outline" size={18} color="#2D6A4F" />
                    <Text style={styles.webLinkText}>Search .gov & .edu Databases</Text>
                    <Ionicons name="open-outline" size={18} color="#2D6A4F" style={{marginLeft: 'auto'}} />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 🩺 RECOMMENDED TREATMENT */}
          <View style={[styles.sheet, { borderLeftWidth: 5, borderLeftColor: isAnomaly ? '#475569' : '#2D6A4F' }]}>
            <Text style={styles.treatmentLabel}>IPM TREATMENT PROTOCOL</Text>
            <Text style={styles.treatmentTitle}>{insight.title}</Text>
            
            <Text style={styles.treatmentSteps}>
              {insight.treatmentSteps || insight.description}
            </Text>

            {insight.youtubeId && (
              <TouchableOpacity 
                style={[styles.videoBtn, {backgroundColor: isAnomaly ? '#475569' : '#BC4749'}]}
                onPress={() => openWebResource(`https://www.youtube.com/embed/${insight.youtubeId}?autoplay=1`, 'Treatment Video Guide')}
              >
                <Ionicons name="logo-youtube" size={20} color="#FFF" />
                <Text style={styles.videoBtnText}>WATCH TREATMENT VIDEO</Text>
              </TouchableOpacity>
            )}
            
            <Text style={styles.legalNotice}>
              *Apply treatments according to Integrated Pest Management (IPM) safety standards. 
            </Text>

            {/* NEW DISCLAIMER TEXT ADDED HERE */}
            <Text style={styles.disclaimerText}>
              Disclaimer: ORGANIC-EYE claims no ownership of this information. It is curated from expert agricultural advice and public internet sources.
            </Text>

          </View>
        </ScrollView>
      </SafeAreaView>

       {/* FULL SCREEN IMAGE MODAL */}
       <Modal visible={imageModalVisible} transparent={true} animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
         <View style={styles.imageModalContainer}>
           <TouchableOpacity style={styles.closeImageBtn} onPress={() => setImageModalVisible(false)}>
             <Ionicons name="close-circle" size={40} color="#FFF"/>
           </TouchableOpacity>
           {imageUrl && <Image source={{ uri: imageUrl }} style={styles.fullImage} />}
         </View>
       </Modal>

       {/* UNIVERSAL WEBPAGE VIEWER MODAL */}
       <Modal visible={webModalVisible} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
            <View style={styles.webHeader}>
              <TouchableOpacity onPress={() => setWebModalVisible(false)} style={styles.webCloseBtn}>
                <Ionicons name="close" size={28} color="#1B4332" />
                <Text style={styles.webCloseText}>Close</Text>
              </TouchableOpacity>
              <Text style={styles.webTitle}>{modalTitle}</Text>
              <View style={{ width: 70 }} /> 
            </View>
            <WebView 
              source={{ uri: currentUrl }} 
              style={{ flex: 1 }} 
              startInLoadingState={true}
              allowsInlineMediaPlayback={true}
              renderLoading={() => (
                <View style={styles.webLoader}>
                  <ActivityIndicator size="large" color="#1B4332" />
                </View>
              )}
            />
          </SafeAreaView>
       </Modal>

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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 40,
    paddingBottom: 10 
  },
  headerTitle: { color: '#1B4332', fontWeight: '900', fontSize: 13, letterSpacing: 2 },
  audioAction: { padding: 5 },
  scrollBody: { paddingHorizontal: 16, paddingBottom: 40 },
  
  heroCard: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', elevation: 5, marginBottom: 10, position: 'relative' },
  mainImage: { width: '100%', height: 200, resizeMode: 'cover' },
  statusBadge: { position: 'absolute', top: 15, right: 15, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { color: '#FFF', fontWeight: '900', fontSize: 10 },
  expandIcon: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 20 },
  
  imageModalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeImageBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
  fullImage: { width: '100%', height: '80%', resizeMode: 'contain' },

  timeSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  timeText: { fontSize: 12, fontWeight: '700', color: '#64748B', marginLeft: 5 },

  sheet: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 12, elevation: 3 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sheetTitle: { fontSize: 12, fontWeight: '800', marginLeft: 8, color: '#64748B' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 15 },
  
  analysisBox: { padding: 5 },
  labelSmall: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  detectionMain: { fontSize: 20, fontWeight: '800', color: '#1B4332', marginTop: 4, textTransform: 'capitalize' },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  confLabel: { flex: 1.5, fontSize: 13, fontWeight: '600', color: '#475569', textTransform: 'capitalize' },
  barContainer: { flex: 2, height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, marginHorizontal: 10 },
  barFill: { height: '100%', borderRadius: 4 },
  confValue: { flex: 0.5, fontSize: 12, fontWeight: '800', textAlign: 'right' },
  statusRow: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F8FAFC', flexDirection: 'row', justifyContent: 'space-between' },
  statusResult: { fontWeight: '900', fontSize: 13 },

  infoHeading: { fontSize: 14, fontWeight: '900', color: '#1B4332', marginBottom: 8 },
  infoPara: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 10 },
  
  webLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  webLinkText: { color: '#2D6A4F', fontWeight: '800', fontSize: 13, marginLeft: 10 },

  treatmentLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 1 },
  treatmentTitle: { fontSize: 18, fontWeight: '800', color: '#1B4332', marginVertical: 8 },
  treatmentSteps: { fontSize: 14, color: '#475569', lineHeight: 24, marginBottom: 20 },
  videoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12 },
  videoBtnText: { color: '#FFF', fontWeight: '800', marginLeft: 10, fontSize: 12 },
  legalNotice: { fontSize: 10, color: '#94A3B8', marginTop: 15, textAlign: 'center' },
  
  // NEW DISCLAIMER STYLE ADDED HERE
  disclaimerText: { fontSize: 10, color: '#808080', marginTop: 10, textAlign: 'center', fontStyle: 'italic' },
  
  webHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  webCloseBtn: { flexDirection: 'row', alignItems: 'center' },
  webCloseText: { fontSize: 16, color: '#1B4332', fontWeight: '600', marginLeft: 5 },
  webTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  webLoader: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  emptyText: { fontStyle: 'italic', color: '#94A3B8', fontSize: 12, marginTop: 5 }
});

export default CropDetailsScreen;