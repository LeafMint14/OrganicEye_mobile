import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, 
  TouchableOpacity, Image, ImageBackground, ActivityIndicator 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';

import { useAuth } from '../context/AuthContext';
import { db } from '../../firebase';
import { doc, collection, query, where, orderBy, onSnapshot, limit, Timestamp } from 'firebase/firestore';
import UserService from '../services/UserService';
import { Ionicons } from '@expo/vector-icons'; 

// Helper function to format timestamps
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Just now';
  const now = new Date();
  const detectionDate = timestamp.toDate();
  const seconds = Math.floor((now - detectionDate) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};


const getStatusStyle = (detection) => {
  const highRisk = ['Infected Aphid', 'Infected Flea Beetle', 'Infected Pumpkin Beetle', 'Wilting'];
  const medRisk = ['Insect bite', 'Spotting', 'Yellowing'];
  
  if (highRisk.includes(detection)) {
    return { text: 'High Risk', color: '#e74c3c' };
  }
  if (medRisk.includes(detection)) {
    return { text: 'Medium Risk', color: '#f39c12' };
  }
  return { text: 'Good', color: '#27ae60' };
};


const getGreeting = () => {
  const currentHour = new Date().getHours();
  
  if (currentHour >= 5 && currentHour < 12) {
    return "Good Morning";
  } else if (currentHour >= 12 && currentHour < 18) {
    return "Good Afternoon";
  } else {
    return "Good Evening";
  }
};


const HomeScreen = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [pairedPiId, setPairedPiId] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  

  const [greeting, setGreeting] = useState(getGreeting());


  const [stats, setStats] = useState({
    detectionsToday: 0,
    activeFields: 0, 
    cropHealth: 'N/A',
  });
  

  useEffect(() => {
  
    const timerId = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000); 

   
    return () => clearInterval(timerId);
  }, []);

  

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setRecentActivities([]);
      setUserData(null);
      return;
    }

    let unsubscribeUser = () => {};
    let unsubscribeDetections = () => {};
    let unsubscribeStats = () => {};

    const userDocRef = doc(db, "users", user.uid);
    unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const newUserData = docSnap.data();
        setUserData(newUserData);
        const piId = newUserData.pairedPiId || null;
        setPairedPiId(piId);

        if (piId) {
        
          const recentQuery = query(
            collection(db, "detections"),
            where("pi_id", "==", piId),
            orderBy("timestamp", "desc"),
            limit(5)
          );
          unsubscribeDetections = onSnapshot(recentQuery, (snap) => {
            const activities = [];
            snap.forEach(d => activities.push({ id: d.id, ...d.data() }));
            setRecentActivities(activities);
            setLoading(false);
          });

        
          const today = new Date();
          today.setHours(0, 0, 0, 0); 
          const startOfToday = Timestamp.fromDate(today);

          const statsQuery = query(
            collection(db, "detections"),
            where("pi_id", "==", piId),
            where("timestamp", ">=", startOfToday)
          );
         
          unsubscribeStats = onSnapshot(statsQuery, (snap) => {
            setStats({
              detectionsToday: snap.size,
              activeFields: 1, 
              cropHealth: '95%', 
            });
          });

        } else {
       
          setRecentActivities([]);
          
          setStats({
            detectionsToday: 0,
            activeFields: 0,
            cropHealth: 'N/A',
          });
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }, (error) => {
      console.error("Error listening to user doc:", error);
      setLoading(false);
    });

 
    return () => {
      unsubscribeUser();
      unsubscribeDetections();
      unsubscribeStats();
    };
  }, [user]); 


  const quickActions = [
    { title: 'Insect Detection', icon: 'bug', screen: 'Insect' },
    { title: 'Crop Monitoring', icon: 'leaf', screen: 'Crop' },
    { title: 'Analytics', icon: 'stats-chart', screen: 'Analytics' },
    { title: 'Settings', icon: 'settings', screen: 'Settings' },
  ];

  return (
    <ImageBackground
      source={require('../../assets/backgroundimage.png')}
      style={styles.bg}
      resizeMode="cover"
    >
    <ScrollView style={styles.container}>
   
      <View style={styles.header}>
        <View>
      
          <Text style={[styles.greeting, { color: colors.text }]}>
            {greeting}, {userData?.First_Name || 'User'}!
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>Welcome to Organic-Eye</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Image 
            source={userData?.avatarUrl ? { uri: userData.avatarUrl } : require('../../assets/logo.png')} 
            style={styles.profileImage} 
          />
        </TouchableOpacity>
      </View>

      {/* --- STATS --- */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.activeFields}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Active Fields</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>
            {loading ? <ActivityIndicator size="small" /> : stats.detectionsToday}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Detections Today</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.cropHealth}</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Crop Health</Text>
        </View>
      </View>

  
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.actionCard, { backgroundColor: colors.card }]}
              onPress={() => navigation.navigate(action.screen)}
            >
              <Ionicons name={action.icon} size={32} color={colors.primary} style={styles.actionIcon} />
              <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

   
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activities</Text>
        <View style={styles.activitiesList}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : recentActivities.length > 0 ? (
            recentActivities.map((activity) => {
              const status = getStatusStyle(activity.detection);
              return (
                <TouchableOpacity 
                  key={activity.id} 
                  style={[styles.activityItem, { backgroundColor: colors.card }]}
                  onPress={() => navigation.navigate(
                    status.text === 'Good' ? 'CropDetails' : 'InsectDetails', 
                    { item: { id: activity.id, name: activity.detection, img: { uri: activity.imageUrl }, ...activity } }
                  )}
                >
                  <View style={styles.activityContent}>
                    <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.detection}</Text>
                    <Text style={[styles.activityTime, { color: colors.muted }]}>
                      {formatTimeAgo(activity.timestamp)}
                    </Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: status.color }
                  ]}>
                    <Text style={styles.statusText}>{status.text}</Text>
                  </View>
                </TouchableOpacity>
              )
            })
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Ionicons 
                name={!pairedPiId ? "qr-code-outline" : "analytics-outline"} 
                size={32} 
                color={colors.muted} 
              />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {!pairedPiId ? "No Device Paired" : "No Recent Activity"}
              </Text>
              {!pairedPiId && (
                <Text style={[styles.emptySubText, { color: colors.muted }]}>
                  Go to Settings to register your IoT device.
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
    </ImageBackground>
  );
};

// ... (Styles are all perfect, no changes) ...
const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
  justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 16,
    marginTop: 4,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%', // Ensures two cards per row
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionIcon: {
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
 marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyCard: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minHeight: 150,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default HomeScreen;