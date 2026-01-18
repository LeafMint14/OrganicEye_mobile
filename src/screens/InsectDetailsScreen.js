import React, { useRef, useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Image, ImageBackground, ScrollView, 
  Modal, TouchableOpacity, Animated, SafeAreaView 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { getInsectInsight } from '../config/LabelMap'; 
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import YoutubeIframe from 'react-native-youtube-iframe'; // Ensure this is installed

const InsectDetailsScreen = ({ route, navigation }) => {
  const { item } = route.params || {};
  
  // --- FIX 1: DATA MAPPING ---
  // We check for both 'detection' (IoT) and 'name' (Manual/Legacy)
  const insectName = item?.detection || item?.name || "Unknown";
  const insectScore = item?.score || item?.confidence || 0;
  // --- FIX 2: IMAGE URL HANDLING ---
  const insectImage = item?.imageUrl || item?.img || null;

  const [previewVisible, setPreviewVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  
  const insight = getInsectInsight(insectName);
  const isBeneficial = insectName.toLowerCase().includes('beneficial') || 
                       insectName.toLowerCase().includes('bee') || 
                       insectName.toLowerCase().includes('ladybug');

  useEffect(() => {
    return () => {
      Speech.stop();
      setIsSpeaking(false);
    };
  }, []); 

  if (!item) {
    return (
      <View style={styles.centerError}>
        <Text style={{color: '#64748B'}}>No insect data found.</Text>
      </View>
    );
  }

  const startReading = () => {
    const textToSpeak = `${insight.title}. ${insight.description}`;
    setIsSpeaking(true);
    Speech.speak(textToSpeak, {
      language: 'en-US',
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
    });
  };

  const stopReading = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  return (
    <ImageBackground source={require('../../assets/backgroundimage.png')} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.brandBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={28} color="#1B4332" />
          </TouchableOpacity>
          <Text style={styles.brandText}>INSECT REPORT</Text>
          <View style={{ width: 28 }} /> 
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          
          {/* HERO IMAGE SECTION */}
          <View style={styles.heroSection}>
            <TouchableOpacity activeOpacity={0.9} onPress={() => setPreviewVisible(true)} style={styles.imageFrame}>
              {/* --- FIX 3: CORRECT IMAGE SOURCE SYNTAX --- */}
              {insectImage ? (
                  <Image source={{ uri: insectImage }} style={styles.heroImage} />
              ) : (
                  <View style={[styles.heroImage, {backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center'}]}>
                      <Ionicons name="image-outline" size={50} color="#fff"/>
                  </View>
              )}
              
              <View style={[styles.badge, { backgroundColor: isBeneficial ? '#2D6A4F' : '#BC4749' }]}>
                <Text style={styles.badgeText}>{isBeneficial ? 'BENEFICIAL' : 'PEST'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* QUICK STATS SHEET */}
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>DETECTION SUMMARY</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoRow}>
                <Ionicons name="bug" size={18} color="#64748B" />
                <Text style={styles.label}>Identity:</Text>
                <Text style={[styles.value, { fontWeight: '800', color: isBeneficial ? '#2D6A4F' : '#BC4749' }]}>
                   {insectName}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="analytics" size={18} color="#64748B" />
                <Text style={styles.label}>Confidence:</Text>
                <Text style={styles.value}>{insectScore}%</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="calendar" size={18} color="#64748B" />
                <Text style={styles.label}>Detected:</Text>
                <Text style={styles.value}>
                    {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleDateString() : 'Just now'}
                </Text>
              </View>
            </View>
          </View>

          {/* AI INSIGHTS SHEET */}
          <View style={[styles.sheet, { marginTop: 15 }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>AI INSIGHTS</Text>
              <TouchableOpacity 
                style={[styles.listenButton, { backgroundColor: isSpeaking ? '#BC4749' : '#1B4332' }]}
                onPress={isSpeaking ? stopReading : startReading}
              >
                <Ionicons name={isSpeaking ? "stop" : "volume-medium"} size={16} color="#FFF" />
                <Text style={styles.listenButtonText}>{isSpeaking ? 'Stop' : 'Listen'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.insightTitle, { color: isBeneficial ? '#2D6A4F' : '#BC4749' }]}>
              {insight.title}
            </Text>
            <Text style={styles.insightDescription}>{insight.description}</Text>
            <Text style={styles.sourceText}>{insight.source}</Text>

            {insight.youtubeId && (
              <TouchableOpacity 
                style={styles.playButton}
                onPress={() => { setPlaying(true); setVideoModalVisible(true); }}
              >
                <Ionicons name="logo-youtube" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.playButtonText}>Watch Educational Video</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* VIDEO MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={videoModalVisible}
        onRequestClose={() => { setVideoModalVisible(false); setPlaying(false); }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.videoWrapper}>
            <YoutubeIframe
              height={220}
              play={playing}
              videoId={insight.youtubeId}
            />
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => { setVideoModalVisible(false); setPlaying(false); }}
            >
              <Text style={styles.closeButtonText}>Close Video</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* IMAGE PREVIEW MODAL */}
      <Modal visible={previewVisible} transparent={true} onRequestClose={() => setPreviewVisible(false)}>
        <View style={styles.modalContainer}>
            <TouchableOpacity style={{position: 'absolute', top: 40, right: 20, zIndex: 10}} onPress={() => setPreviewVisible(false)}>
                <Ionicons name="close-circle" size={40} color="#FFF"/>
            </TouchableOpacity>
            {insectImage && <Image source={{ uri: insectImage }} style={{width: '100%', height: 400, resizeMode: 'contain'}} />}
        </View>
      </Modal>

    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerError: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  brandBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  brandText: { fontWeight: '900', letterSpacing: 2, fontSize: 16, color: '#1B4332' },
  heroSection: { paddingHorizontal: 16, marginTop: 10 },
  imageFrame: { width: '100%', height: 220, borderRadius: 25, overflow: 'hidden', elevation: 10, backgroundColor: '#000' },
  heroImage: { width: '100%', height: '100%', opacity: 0.9, resizeMode: 'cover' },
  badge: { position: 'absolute', top: 15, right: 15, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  badgeText: { color: '#FFF', fontWeight: '900', fontSize: 10 },
  sheet: { marginHorizontal: 16, backgroundColor: '#FFF', borderRadius: 25, padding: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sheetTitle: { fontSize: 13, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  infoGrid: { marginTop: 5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  label: { marginLeft: 10, fontSize: 14, color: '#64748B', width: 90 },
  value: { fontSize: 14, color: '#1E293B', flex: 1 },
  insightTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  insightDescription: { fontSize: 15, color: '#475569', lineHeight: 22 },
  sourceText: { fontSize: 11, fontStyle: 'italic', color: '#94A3B8', marginTop: 15, textAlign: 'right' },
  listenButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  listenButtonText: { color: '#FFF', fontWeight: '800', fontSize: 12, marginLeft: 5 },
  playButton: { marginTop: 20, backgroundColor: '#BC4749', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 15 },
  playButtonText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  videoWrapper: { backgroundColor: '#000', paddingVertical: 20 },
  closeButton: { alignSelf: 'center', marginTop: 20, padding: 10 },
  closeButtonText: { color: '#FFF', fontWeight: 'bold' }
});

export default InsectDetailsScreen;