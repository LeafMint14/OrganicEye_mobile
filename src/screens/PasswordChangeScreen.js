import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ImageBackground, 
  ActivityIndicator 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext'; // We need this
import { Ionicons } from '@expo/vector-icons';

const PasswordChangeScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const { theme, colors } = useTheme();
  
  // --- FIX 1: Get the 'changePassword' and 'logout' functions ---
  const { changePassword, logout } = useAuth(); 

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // --- FIX 2: Updated Validation Logic ---
  const validateForm = () => {
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword) {
      Alert.alert('Error', 'Current password is required');
      return false;
    }
    if (!newPassword) {
      Alert.alert('Error', 'New password is required');
      return false;
    }

    // --- NEW POLICY CHECKS ---
    if (newPassword.length < 12) {
      Alert.alert('Error', 'New password must be at least 12 characters long');
      return false;
    }
    if (!/[a-z]/.test(newPassword)) {
      Alert.alert('Error', 'New password must contain at least one lowercase letter');
      return false;
    }
    if (!/[A-Z]/.test(newPassword)) {
      Alert.alert('Error', 'New password must contain at least one uppercase letter');
      return false;
    }
    if (!/\d/.test(newPassword)) {
      Alert.alert('Error', 'New password must contain at least one number');
      return false;
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      Alert.alert('Error', 'New password must contain at least one special character (e.g., !@#$)');
      return false;
    }
    // --- END NEW POLICY ---

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return false;
    }
    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return false;
    }
    return true;
  };

  // --- This is the REAL Firebase function ---
  const handleChangePassword = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // This is the REAL Firebase logic
      const result = await changePassword(
        formData.currentPassword, 
        formData.newPassword
      );
      
      if (result.success) {
        // This is the "logout" feature you requested
        Alert.alert(
          'Success', 
          'Password changed. For your security, you will now be logged out.', 
          [{ 
            text: 'OK', 
            onPress: async () => {
              await logout();
              // AuthContext will handle navigation to Login screen
            } 
          }]
        );
      } else {
        // This will show the real error from Firebase (e.g., "Incorrect password.")
        Alert.alert('Error', result.error || 'Failed to change password.');
      }
    } catch (error) {
      console.error("Change Password Error:", error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- FIX 3: Updated Password Strength Meter ---
  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '', color: '#ccc' };
    
    let strength = 0;
    if (password.length >= 12) strength += 1; // <-- UPDATED from 8 to 12
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Checks for special char

    const strengthLevels = [
      { strength: 0, text: 'Very Weak', color: '#e74c3c' },
      { strength: 1, text: 'Weak', color: '#f39c12' },
      { strength: 2, text: 'Fair', color: '#f1c40f' },
      { strength: 3, text: 'Good', color: '#2ecc71' },
      { strength: 4, text: 'Strong', color: '#27ae60' },
      { strength: 5, text: 'Very Strong', color: '#1e8449' },
    ];

    return strengthLevels[Math.min(strength, 5)];
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <ImageBackground
      source={require('../../assets/backgroundimage.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Change Password</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Security Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Password Security</Text>
            <Text style={[styles.infoText, { color: colors.muted }]}>
              Keep your account secure with a strong password
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Current Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.currentPassword}
                onChangeText={(value) => handleInputChange('currentPassword', value)}
                placeholder="Enter current password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPasswords.current}
                editable={!loading} // <-- Use `loading` to disable
              />
              <TouchableOpacity onPress={() => togglePasswordVisibility('current')}>
                <Ionicons 
                  name={showPasswords.current ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={colors.muted} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.newPassword}
                onChangeText={(value) => handleInputChange('newPassword', value)}
                placeholder="Enter new password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPasswords.new}
                editable={!loading} // <-- Use `loading` to disable
              />
              <TouchableOpacity onPress={() => togglePasswordVisibility('new')}>
                <Ionicons 
                  name={showPasswords.new ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={colors.muted} 
                />
              </TouchableOpacity>
            </View>
            
            {/* Password Strength Indicator */}
            {formData.newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View 
                    style={[
                      styles.strengthFill, 
                      { 
                        width: `${(passwordStrength.strength / 5) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Confirm New Password</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                placeholder="Confirm new password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPasswords.confirm}
                editable={!loading} // <-- Use `loading` to disable
              />
              <TouchableOpacity onPress={() => togglePasswordVisibility('confirm')}>
                <Ionicons 
                  name={showPasswords.confirm ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={colors.muted} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* --- FIX 4: Updated Password Requirements UI --- */}
        <View style={[styles.requirementsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.requirementsTitle, { color: colors.text }]}>Password Requirements:</Text>
          <View style={styles.requirementsList}>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={formData.newPassword.length >= 12 ? "checkmark-circle" : "ellipse-outline"} // <-- UPDATED
                size={16} 
                color={formData.newPassword.length >= 12 ? "#2ecc71" : colors.muted} // <-- UPDATED
              />
              <Text style={[styles.requirementText, { color: colors.text }]}>
                At least 12 characters long {/* <-- UPDATED */}
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={/[a-z]/.test(formData.newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={/[a-z]/.test(formData.newPassword) ? "#2ecc71" : colors.muted} 
              />
              <Text style={[styles.requirementText, { color: colors.text }]}>
                Contains lowercase letter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={/[A-Z]/.test(formData.newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={/[A-Z]/.test(formData.newPassword) ? "#2ecc71" : colors.muted} 
              />
              <Text style={[styles.requirementText, { color: colors.text }]}>
                Contains uppercase letter
              </Text>
            </View>
            <View style={styles.requirementItem}>
              <Ionicons 
                name={/\d/.test(formData.newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={/\d/.test(formData.newPassword) ? "#2ecc71" : colors.muted} 
              />
              <Text style={[styles.requirementText, { color: colors.text }]}>
                Contains number
              </Text>
            </View>
            {/* --- NEW ITEM --- */}
            <View style={styles.requirementItem}>
              <Ionicons 
                name={/[^A-Za-z0-9]/.test(formData.newPassword) ? "checkmark-circle" : "ellipse-outline"} 
                size={16} 
                color={/[^A-Za-z0-9]/.test(formData.newPassword) ? "#2ecc71" : colors.muted} 
              />
              <Text style={[styles.requirementText, { color: colors.text }]}>
                Contains special character
              </Text>
            </View>
            {/* --- END NEW ITEM --- */}
          </View>
        </View>

        {/* Change Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.changeButton,
              { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }
            ]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="key" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.changeButtonText}>Change Password</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 10, // Added some margin
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  strengthContainer: {
    marginTop: 8,
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  requirementsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 14,
    marginLeft: 8,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonIcon: {
    marginRight: 8,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PasswordChangeScreen;