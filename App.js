import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './AuthContext';
import SignupScreen from './src/screens/SignupScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { currentUser } = useAuth();

  return (
    <NavigationContainer>
     <Stack.Navigator>
  {currentUser ? (
    <Stack.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{ 
        headerShown: true, // ← Add this line
        title: 'Home',     // ← Optional: Add a title
        headerStyle: {
          backgroundColor: '#1f7a4f', // Match your theme
        },
        headerTintColor: '#fff',
      }}
    />
  ) : (
    <>
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignupScreen} 
        options={{ headerShown: false }}
      />
    </>
  )}
</Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}