import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  ImageBackground, 
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const SplashScreen = () => {
  const { colors } = useTheme();

  // --- 1. SET UP ANIMATION VALUES ---
  const fadeAnim = useRef(new Animated.Value(0)).current;  // Starts invisible
  const scaleAnim = useRef(new Animated.Value(0.8)).current; // Starts slightly shrunken

  useEffect(() => {
    // --- 2. START THE ANIMATIONS ---
    // Just run the animations! AppNavigator handles when to unmount this screen.
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200, // Takes 1.2 seconds to fade in
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,    // Controls the "bounciness" of the logo
        tension: 20,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <ImageBackground 
      source={require('../../assets/backgroundimage.png')} 
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        
        {/* CENTER CONTENT: Animated Logo and Title */}
        <Animated.View style={[styles.centerContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.logoWrapper}>
            <Animated.Image 
              source={require('../../assets/logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          <Text style={[styles.title, { color: colors.primary || '#1B4332' }]}>
            Organic Eye
          </Text>
          <Text style={styles.subtitle}>
            IoT Crop & Insect Diagnostics
          </Text>
        </Animated.View>
        
        {/* BOTTOM CONTENT: Loading Indicator */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <ActivityIndicator size="large" color={colors.primary || '#2D6A4F'} />
          <Text style={styles.loadingText}>Initializing AI Engine...</Text>
        </Animated.View>

      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', 
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoWrapper: {
    width: 150,
    height: 150,
    backgroundColor: '#FFF', 
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    marginBottom: 25,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1,
  },
});

export default SplashScreen;