import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  Alert, ScrollView, Image, ImageBackground, ActivityIndicator 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { colors } = useTheme();
  const { login, resetPassword } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate password: exactly 8 alphanumeric characters
    const passwordRegex = /^[a-zA-Z0-9]{8}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert('Error', 'Password must be exactly 8 letters and/or numbers only');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        Alert.alert('Success', 'Login successful!');
      } else {
        Alert.alert('Login Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setResetLoading(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        Alert.alert('Password Reset', 'Password reset email sent! Check your inbox.');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/backgroundimage.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* --- Added significant margin here --- */}
        <View style={styles.heroWrapper}>
          <Image
            source={require('../../assets/background.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: '#ffffff' }]}>Sign In</Text>
          <Text style={[styles.subtitle, { color: '#000000ff', fontWeight: 'bold' }]}>
            Welcome back to your account
          </Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <View style={styles.inputIcon}><Text style={styles.iconText}>📧</Text></View>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.muted}
              editable={!loading}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <View style={styles.inputIcon}><Text style={styles.iconText}>🔒</Text></View>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry={!showPassword}
              placeholderTextColor={colors.muted}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.rowBetween}>
            <TouchableOpacity style={styles.remember} onPress={() => setRemember(r => !r)} disabled={loading}>
              <View style={[styles.checkbox, remember && styles.checkboxChecked]} />
              <Text style={[styles.rememberText, { color: '#ffffff' }]}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleForgotPassword} disabled={loading || resetLoading}>
              <Text style={[styles.forgotText, { color: '#FFFFFF', fontWeight: 'bold' }]}>
                {resetLoading ? 'Sending...' : 'Forget Password?'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: '#1eff00ff', fontWeight: 'bold' }]}>
              Don't have an account? 
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')} disabled={loading}>
              <Text style={[styles.footerLink, { color: '#FFFFFF', fontWeight: 'bold' }]}> Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  heroWrapper: { 
    marginTop: 60, // Increased from 20 to 60 for more top space
    marginHorizontal: 16, 
    borderRadius: 20, 
    overflow: 'hidden',
    elevation: 5, // Adds a slight shadow to the hero image
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  heroImage: { width: '100%', height: 200 },
  header: { paddingHorizontal: 16, marginTop: 24, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 16 },
  form: { paddingHorizontal: 16, marginTop: 12 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    marginBottom: 16, 
    elevation: 2,
    height: 55,
  },
  inputIcon: { marginRight: 8 },
  iconText: { fontSize: 18 },
  input: { flex: 1, fontSize: 16 },
  eyeIcon: { padding: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  remember: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 18, height: 18, borderWidth: 2, borderColor: '#ffffff', borderRadius: 4, marginRight: 8 },
  checkboxChecked: { backgroundColor: '#1f7a4f', borderColor: '#1f7a4f' },
  rememberText: { fontSize: 14 },
  forgotText: { fontSize: 14 },
  loginButton: { borderRadius: 12, paddingVertical: 16, marginTop: 8, elevation: 3 },
  loginButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { fontSize: 15 },
  footerLink: { fontSize: 15 },
});

export default LoginScreen;