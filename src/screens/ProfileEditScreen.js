import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  Image, 
  ImageBackground, 
  ActivityIndicator,
  Platform 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import UserService from '../services/UserService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 

// --- Helper function to upload the image ---
const uploadImageToCloudinary = async (localUri) => {
  
  const CLOUD_NAME = "dqqhcfe39"; // Your Cloud Name
  const UPLOAD_PRESET = "pi_uploads"; // From our Pi script
  
  if (!localUri) return null;

  const apiUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  
  
  const uriParts = localUri.split('.');
  const fileType = uriParts[uriParts.length - 1];

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: `profile_${Date.now()}.${fileType}`,
    type: `image/${fileType}`,
  });
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();
    if (data.secure_url) {
      console.log('Cloudinary Upload Success:', data.secure_url);
      return data.secure_url;
    } else {
      console.error('Cloudinary Upload Error:', data);
      return null;
    }
  } catch (error) {
    console.error('Cloudinary Upload Fetch Error:', error);
    return null;
  }
};


const ProfileEditScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    First_Name: '',
    Last_Name: '',
    contact: '',
    email: '',
  });
  
  const [image, setImage] = useState(null);
  
  const [loading, setLoading] = useState(true); 
  const [saving, setSaving] = useState(false);
  const { theme, colors } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (user?.uid) {
     
      try {
        const result = await UserService.getUserData(user.uid);
        if (result.success) {
          setFormData({
            First_Name: result.userData.First_Name || '',
            Last_Name: result.userData.Last_Name || '',
            contact: result.userData.contact || '',
            email: user.email || '',
          });
          
         
          if (result.userData.avatarUrl) {
            setImage(result.userData.avatarUrl);
          }
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  
  const pickImage = async () => {
   
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your photo library.');
      return;
    }

    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.7, 
    });

    if (!result.canceled) {
   
      setImage(result.assets[0].uri);
    }
  };


  const validateForm = () => {
 
    if (!formData.First_Name.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }
    if (!formData.Last_Name.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }
    if (!formData.contact.trim()) {
      Alert.alert('Error', 'Contact number is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      let newAvatarUrl = null;

     
      if (image && (image.startsWith('file://') || image.startsWith('content://'))) {
        newAvatarUrl = await uploadImageToCloudinary(image);
        if (!newAvatarUrl) {
          throw new Error("Image upload failed");
        }
      }

     
      const updatedData = {
        First_Name: formData.First_Name.trim(),
        Last_Name: formData.Last_Name.trim(),
        contact: formData.contact.trim(),
        email: formData.email.trim(),
        
      };

     
      if (newAvatarUrl) {
        updatedData.avatarUrl = newAvatarUrl;
      }

       
      const result = await UserService.updateUserData(user.uid, updatedData);
      
      if (result.success) {
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error("Save Profile Error:", error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={require('../../assets/backgroundimage.png')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading profile...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/backgroundimage.png')}
      style={styles.bg}
      resizeMode="cover"
    >
      <ScrollView style={styles.container}>
       
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

       
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
          
           
            <Image 
              source={image ? { uri: image } : require('../../assets/logo.png')} 
              style={styles.avatar} 
            />
            
           
            <TouchableOpacity 
              style={[styles.editAvatarBtn, { backgroundColor: colors.primary }]}
              onPress={pickImage} 
              disabled={saving}
            >
              <Ionicons name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {formData.First_Name} {formData.Last_Name}
          </Text>
        </View>

        {/* --- THIS IS THE FIXED FORM BLOCK --- */}
        <View style={styles.form}>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>First Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="person-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.First_Name}
                onChangeText={(value) => handleInputChange('First_Name', value)}
                placeholder="Enter first name"
                placeholderTextColor={colors.muted}
                disabled={saving}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Last Name</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="person-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.Last_Name}
                onChangeText={(value) => handleInputChange('Last_Name', value)}
                placeholder="Enter last name"
                placeholderTextColor={colors.muted}
                disabled={saving}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                placeholder="Enter email address"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                disabled={saving}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Contact Number</Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.card }]}>
              <Ionicons name="call-outline" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.contact}
                onChangeText={(value) => handleInputChange('contact', value)}
                placeholder="Enter contact number"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                disabled={saving}
              />
            </View>
          </View>

        </View>
        {/* --- END OF FIXED FORM BLOCK --- */}
       
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff', 
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
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
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  saveButton: {
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
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileEditScreen;