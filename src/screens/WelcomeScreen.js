import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar, ImageBackground } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const WelcomeScreen = ({ navigation }) => {
  const { theme, colors } = useTheme();

  return (
    <ImageBackground
      source={require('../../assets/backgroundimage.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={styles.headerArea}>
        <Text style={[styles.headline, { color: colors.text }]}>The Best App{"\n"}For Your Plant</Text>
      </View>

      <View style={styles.logoArea}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.primary }]}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={[styles.secondaryButtonText, { color: '#FFFFFF',fontWeight: 'bold'}]}>Create An Account</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerArea: {
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  headline: {
    fontSize: 38,
    lineHeight: 45,
    fontWeight: '800',
    color: '#113b11',
    textAlign: 'left',
    textDecorationLine: 'none',
  },
  logoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 400,
    height: 400,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: '#1f7a4f',
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    marginTop: 14,
    borderColor: '#1f7a4f',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#0f3010',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default WelcomeScreen;
