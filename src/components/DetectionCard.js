import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons'; // Import icons

const DetectionCard = ({ item, onPress, onLongPress, isSelected }) => {
  const { colors } = useTheme();

  // Format the timestamp
  const date = item.timestamp ? item.timestamp.toDate() : new Date();
  const formattedDate = format(date, 'MMM dd, yyyy');
  const formattedTime = format(date, 'h:mm a');

  return (
    // Add onLongPress and style changes here
    <TouchableOpacity 
      onPress={onPress} 
      onLongPress={onLongPress} 
      style={[
        styles.card,
        { backgroundColor: colors.card },
        // Add a highlight border if selected
        isSelected && { borderColor: colors.primary, borderWidth: 2.5 }
      ]}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{item.detection}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{formattedDate}</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{formattedTime}</Text>
      </View>
      <View style={styles.confidenceContainer}>
        <Text style={[styles.confidence, { color: colors.primary }]}>
          {item.confidence}%
        </Text>
      </View>

      {/* Show a checkmark if selected */}
      {isSelected && (
        <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
          <Ionicons name="checkmark" size={18} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16, // Add horizontal margin
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
  },
  confidenceContainer: {
    marginLeft: 10,
    padding: 8,
  },
  confidence: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkmark: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  }
});

export default DetectionCard;