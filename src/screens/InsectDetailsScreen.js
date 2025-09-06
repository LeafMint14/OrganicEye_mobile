import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, ImageBackground, ScrollView, Modal, TouchableOpacity, TouchableWithoutFeedback, Animated } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const InsectDetailsScreen = ({ route }) => {
  const { item } = route.params || {};
  const [previewVisible, setPreviewVisible] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const lastTapRef = useRef(0);
  const { theme, colors } = useTheme();

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>No insect selected.</Text>
      </View>
    );
  }

  const openPreview = () => {
    setPreviewVisible(true);
    scale.setValue(1);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    scale.setValue(1);
  };

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

          <View style={styles.row}><Text style={[styles.label, { color: colors.text }]}>Date :</Text><Text style={[styles.value, { color: colors.text }]}> {item.date || 'July 07, 2025'}</Text></View>
          <View style={styles.row}><Text style={[styles.label, { color: colors.text }]}>Type :</Text><Text style={[styles.value, { color: colors.text }]}> {item.type || item.name}</Text></View>
          <View style={styles.rowMulti}><Text style={[styles.label, { color: colors.text }]}>Behavior :</Text><Text style={[styles.value, { color: colors.text }]}> {item.behavior || 'Multiple Aphids appearances'}</Text></View>
          <View style={styles.row}><Text style={[styles.label, { color: colors.text }]}>Confidence level :</Text><Text style={[styles.value, { color: colors.text }]}> {item.confidence}%</Text></View>
          <View style={styles.row}><Text style={[styles.label, { color: colors.text }]}>Time stamp :</Text><Text style={[styles.value, { color: colors.text }]}> {item.timestamp || '11:30 PM'}</Text></View>
        </View>
      </ScrollView>

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

          <Text style={styles.hint}>Tap to close  Double-tap to zoom</Text>
        </View>
      </Modal>
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
  heroCard: { marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 18, padding: 16 },
  heroImage: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12 },
  heroTitle: { textAlign: 'center', fontWeight: '800', color: '#0b3010', fontSize: 16 },
  sheet: { marginTop: 14, marginHorizontal: 16, backgroundColor: '#ffffff', borderRadius: 18, padding: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
  sheetTitle: { textAlign: 'center', fontSize: 18, fontWeight: '900', marginBottom: 12 },
  row: { flexDirection: 'row', marginBottom: 10 },
  rowMulti: { marginBottom: 10 },
  label: { fontWeight: '800', color: '#111' },
  value: { color: '#111' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', alignItems: 'center', justifyContent: 'center' },
  modalBackdropTouchable: { ...StyleSheet.absoluteFillObject },
  previewImage: { width: '90%', height: '70%' },
  hint: { color: '#fff', opacity: 0.7, marginTop: 12 },
});

export default InsectDetailsScreen;
