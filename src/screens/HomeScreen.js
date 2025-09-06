import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ImageBackground } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const HomeScreen = ({ navigation }) => {
  const { theme, colors } = useTheme();

  const quickActions = [
    { title: 'Insect Detection', icon: '', screen: 'Insect' },
    { title: 'Crop Monitoring', icon: '', screen: 'Crop' },
    { title: 'Analytics', icon: '', screen: 'Analytics' },
    { title: 'Settings', icon: '', screen: 'Settings' },
  ];

  const recentActivities = [
    { id: 1, title: 'Detected Aphids in Field A', time: '2 hours ago', status: 'High Risk' },
    { id: 2, title: 'Crop Health Check Complete', time: '1 day ago', status: 'Good' },
    { id: 3, title: 'New Detection Alert', time: '3 days ago', status: 'Medium Risk' },
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
          <Text style={[styles.greeting, { color: colors.text }]}>Good Morning!</Text>
          <Text style={[styles.userName, { color: colors.text }]}>Welcome to Organic-Eye</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Image source={require('../../assets/logo.png')} style={styles.profileImage} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>12</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Active Fields</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>8</Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>Detections Today</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>95%</Text>
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
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activities</Text>
        <View style={styles.activitiesList}>
          {recentActivities.map((activity) => (
            <View key={activity.id} style={[styles.activityItem, { backgroundColor: colors.card }]}>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
                <Text style={[styles.activityTime, { color: colors.muted }]}>{activity.time}</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: activity.status === 'High Risk' ? '#e74c3c' : activity.status === 'Good' ? '#27ae60' : '#f39c12' }
              ]}>
                <Text style={styles.statusText}>{activity.status}</Text>
              </View>
            </View>
          ))}
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userName: {
    fontSize: 16,
    color: '#e8f5e9',
    marginTop: 4,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
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
    backgroundColor: '#ffffff',
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
    color: '#1f7a4f',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
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
    fontSize: 32,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'center',
  },
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    backgroundColor: '#ffffff',
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
    color: '#2c3e50',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default HomeScreen;
