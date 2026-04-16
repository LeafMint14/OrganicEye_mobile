import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';


import SplashScreen from '../screens/SplashScreen';
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
import DetectionHistoryScreen from '../screens/DetectionHistoryScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import PasswordChangeScreen from '../screens/PasswordChangeScreen';
import PrivacySettingsScreen from '../screens/PrivacySettingsScreen';
import DetectionSettingsScreen from '../screens/DetectionSettingsScreen';
import RegisterIoTScreen from '../screens/RegisterIoTScreen';
import AlertThresholdsScreen from '../screens/AlertThresholdsScreen';


import DeviceListScreen from '../screens/DeviceListScreen';
import DeviceDetailScreen from '../screens/DeviceDetailScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();


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


export default function AppNavigator() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  console.log('AppNavigator: Current user:', user ? user.email : 'null');
  console.log('AppNavigator: Auth Loading:', loading);

  
  
  useEffect(() => {
    
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  
  
  if (showSplash || loading) {
    return <SplashScreen />;
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
          
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="InsectDetails" component={InsectDetailsScreen} />
            <Stack.Screen name="CropDetailsScreen" component={CropDetailsScreen} />
            <Stack.Screen name="DetectionHistory" component={DetectionHistoryScreen} />
            <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
            <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
            <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
            <Stack.Screen name="DetectionSettings" component={DetectionSettingsScreen} />
            <Stack.Screen name="AlertThresholds" component={AlertThresholdsScreen} />
            <Stack.Screen name="RegisterIoT" component={RegisterIoTScreen} />
            
            {/* --- NEW MODULE SCREENS REGISTERED HERE --- */}
            <Stack.Screen name="DeviceList" component={DeviceListScreen} />
            <Stack.Screen name="DeviceDetail" component={DeviceDetailScreen} />
          </>
        ) : (
          
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

const styles = StyleSheet.create({});