import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Image, ImageBackground, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
// Import AuthService to use the resetPassword function
import AuthService from '../services/AuthService'; 
// Import Ionicons if you add the checklist
import { Ionicons } from '@expo/vector-icons'; 

const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    First_Name: '',
    Last_Name: '',
    contact: '',
    email: '',
    password: '',
  });
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const { theme, colors } = useTheme();
  const { signup } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async () => {
    const { First_Name, Last_Name, contact, email, password } = formData;

    // --- UPDATED VALIDATION BLOCK ---
    if (!First_Name || !Last_Name || !contact || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // New Policy Checks
    if (password.length < 12) {
      Alert.alert('Error', 'Password must be at least 12 characters long');
      return;
    }
    if (!/[a-z]/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one lowercase letter');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one uppercase letter');
      return;
    }
    if (!/\d/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one number');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      Alert.alert('Error', 'Password must contain at least one special character (e.g., !@#$)');
      return;
    }
    // --- END UPDATED VALIDATION BLOCK ---

    setLoading(true);

    try {
      const result = await signup(email, password, First_Name, Last_Name, contact);
      
      if (result.success) {
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK' }
        ]);
      } else {
        Alert.alert('Registration Failed', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }

    try {
      // Use the imported AuthService
      const result = await AuthService.resetPassword(formData.email); 
      if (result.success) {
        Alert.alert('Password Reset', 'Password reset email sent! Check your inbox.');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/backgroundimage.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroWrapper}>
          <Image
            source={require('../../assets/background.png')}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Sign Up</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Create your new account</Text>
        </View>

        <View style={styles.form}>
          {/* First Name Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <View style={styles.inputIcon}><Text style={styles.iconText}>👤</Text></View>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={formData.First_Name}
              onChangeText={(v) => handleInputChange('First_Name', v)}
              placeholder="First Name"
              placeholderTextColor={colors.muted}
              editable={!loading}
            />
          </View>

          {/* Last Name Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <View style={styles.inputIcon}><Text style={styles.iconText}>👤</Text></View>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={formData.Last_Name}
              onChangeText={(v) => handleInputChange('Last_Name', v)}
              placeholder="Last Name"
              placeholderTextColor={colors.muted}
              editable={!loading}
            />
          </View>

          {/* Contact Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <View style={styles.inputIcon}><Text style={styles.iconText}>📞</Text></View>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={formData.contact}
              onChangeText={(v) => handleInputChange('contact', v)}
              placeholder="+63 Contact Number"
              keyboardType="phone-pad"
              placeholderTextColor={colors.muted}
              editable={!loading}
            />
          </View>

          {/* Email Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <View style={styles.inputIcon}><Text style={styles.iconText}>📧</Text></View>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={formData.email}
              onChangeText={(v) => handleInputChange('email', v)}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.muted}
              editable={!loading}
            />
          </View>

          {/* Password Input */}
          <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
            <View style={styles.inputIcon}><Text style={styles.iconText}>🔒</Text></View>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={formData.password}
              onChangeText={(v) => handleInputChange('password', v)}
              placeholder="Password" // Changed from "min 12 chars"
              secureTextEntry
              placeholderTextColor={colors.muted}
              editable={!loading}
            />
          </View>

          {/* HERE IS WHERE YOU SHOULD ADD THE 
            "PASSWORD REQUIREMENTS" CHECKLIST UI
            (See "Next Step" below)
          */}

          <View style={styles.rowBetween}>
            <TouchableOpacity style={styles.remember} onPress={() => setRemember(r => !r)} disabled={loading}>
              <View style={[styles.checkbox, remember && styles.checkboxChecked]} />
              <Text style={[styles.rememberText, { color: colors.text }]}>Remember me</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>Forget Password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.signupButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} 
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signupButtonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.muted }]} />
            <Text style={[styles.dividerText, { color: colors.muted }]}>Or Continue With</Text>
            <View style={[styles.divider, { backgroundColor: colors.muted }]} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, { backgroundColor: colors.card }]} disabled={loading}>
              <Text style={[styles.socialText, { color: colors.primary }]}>G</Text>
            </TouchableOpacity>
            {/* <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1877F2' }]} disabled={loading}>
              <Text style={[styles.socialText, { color: '#fff' }]}>f</Text>
            </TouchableOpacity> */}
          </View>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.muted }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

// ... (Your styles are perfect) ...
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  heroWrapper: { marginTop: 20, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden' },
  heroImage: { width: '100%', height: 200 },
  header: { paddingHorizontal: 16, marginTop: 20, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#ffffff', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#e8f5e9' },
  form: { paddingHorizontal: 16, marginTop: 20 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    marginBottom: 12, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2 
  },
  inputIcon: { marginRight: 8 },
  iconText: { fontSize: 16 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#2e7d32' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  remember: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 16, height: 16, borderWidth: 2, borderColor: '#2e7d32', borderRadius: 3, marginRight: 8 },
  checkboxChecked: { backgroundColor: '#2e7d32' },
  rememberText: { fontSize: 14, color: '#ffffff' },
  forgotText: { fontSize: 14, color: '#2e7d32' },
  signupButton: { backgroundColor: '#1f7a4f', borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  signupButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700', textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#2e7d32' },
  dividerText: { marginHorizontal: 12, fontSize: 14, color: '#2e7d32' },
 socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  socialBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  socialText: { fontSize: 18, fontWeight: '700', color: '#2e7d32' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14, color: '#2e7d32' },
  footerLink: { fontSize: 14, color: '#2e7d32', fontWeight: '600' },
});

export default SignupScreen;