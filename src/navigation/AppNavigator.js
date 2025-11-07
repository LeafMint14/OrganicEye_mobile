import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Import screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import InsectScreen from '../screens/InsectScreen';
import CropScreen from '../screens/CropScreen';
import CropDetailsScreen from '../screens/CropDetailsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import InsectDetailsScreen from '../screens/InsectDetailsScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import PasswordChangeScreen from '../screens/PasswordChangeScreen';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
import DetectionSettingsScreen from '../screens/DetectionSettingsScreen';
import RegisterIoTScreen from '../screens/RegisterIoTScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for main app screens
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3498db',
        tabBarInactiveTintColor: '#7f8c8d',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e1e8ed',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Insect"
        component={InsectScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🐛</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Crop"
        component={CropScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🌱</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator() {
  const { user, loading } = useAuth();
  
  console.log('AppNavigator: Current user:', user ? user.email : 'null');
  console.log('AppNavigator: Loading:', loading);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f7a4f" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? "Main" : "Welcome"}
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          // currentUser is signed in - show main app
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="InsectDetails" component={InsectDetailsScreen} />
            <Stack.Screen name="CropDetails" component={CropDetailsScreen} />
            <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
            <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
            <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
            <Stack.Screen name="DetectionSettings" component={DetectionSettingsScreen} />
            <Stack.Screen name="RegisterIoT" component={RegisterIoTScreen} />
          </>
        ) : (
          // currentUser is not signed in - show auth screens
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1f7a4f',
    fontWeight: '500',
  },
});

