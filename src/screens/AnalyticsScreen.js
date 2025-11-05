import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { CROP_LABELS, INSECT_LABELS } from '../config/LabelMap';

import ViewShot from 'react-native-view-shot';
import * as Print from 'expo-print';
import * as MediaLibrary from 'expo-media-library';


const screenWidth = Dimensions.get('window').width;



const AnalyticsScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const periods = ['day', 'week', 'month', 'year'];
  const { theme, colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState({ detections: 0, fields: 1, healthScore: 0 });
  const [cropHealthChartData, setCropHealthChartData] = useState([]);
  const [insectChartData, setInsectChartData] = useState([]);
  const [insights, setInsights] = useState([]);

  const reportRef = useRef();

  

  useEffect(() => {
    setLoading(true);

    const getStartDate = (period) => {
      const now = new Date();
      if (period === 'day') now.setDate(now.getDate() - 1);
      else if (period === 'week') now.setDate(now.getDate() - 7);
      else if (period === 'month') now.setMonth(now.getMonth() - 1);
      else if (period === 'year') now.setFullYear(now.getFullYear() - 1);
      return Timestamp.fromDate(now);
    };

    const startDate = getStartDate(selectedPeriod);
    const q = query(collection(db, 'detections'), where('timestamp', '>=', startDate));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        let totalDetections = 0;
        const healthCounts = {};
        const insectCounts = {};

        querySnapshot.forEach((doc) => {
          totalDetections++;
          const data = doc.data() || {};
          const detection = data.detection;

          if (CROP_LABELS.includes(detection)) {
            healthCounts[detection] = (healthCounts[detection] || 0) + 1;
          } else if (INSECT_LABELS.includes(detection)) {
            insectCounts[detection] = (insectCounts[detection] || 0) + 1;
          }
        });

        const totalHealthy = healthCounts['Healthy'] || 0;
        const totalUnhealthy =
          (healthCounts['Wilting'] || 0) +
          (healthCounts['Spotting'] || 0) +
          (healthCounts['Yellowing'] || 0) +
          (healthCounts['Insect Bite'] || 0);
        const totalCrops = totalHealthy + totalUnhealthy;
        const healthScore = totalCrops === 0 ? 0 : Math.round((totalHealthy / totalCrops) * 100);

        setOverviewData({
          detections: totalDetections,
          fields: 1,
          healthScore: healthScore,
        });

        setCropHealthChartData([
          { label: 'Healthy', value: totalHealthy, color: '#2ecc71' },
          { label: 'Affected', value: totalUnhealthy, color: '#e74c3c' },
        ]);

        setInsectChartData(
          Object.keys(insectCounts).map((key) => ({
            label: key,
            value: insectCounts[key],
            color: getColorForLabel(key),
          }))
        );

        let mostCommonPest = 'None';
        let maxCount = 0;
        for (const [pest, count] of Object.entries(insectCounts)) {
          if (count > maxCount) {
            maxCount = count;
            mostCommonPest = pest;
          }
        }

        const newInsights = [
          {
            title: 'Growth Monitoring',
            description: `Overall crop health is stable at ${healthScore}%.`,
          },
        ];

        if (mostCommonPest !== 'None') {
          newInsights.push({
            title: 'Key Pest Alert',
            description: `${mostCommonPest} is the most detected pest this ${selectedPeriod} with ${maxCount} sightings.`,
          });
        }

        setInsights(newInsights);
        setLoading(false);
      },
      (error) => {
        console.error('Firebase Snapshot Error in Analytics:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedPeriod, colors.text]);

  const getColorForLabel = (label) => {
    switch (label) {
      case 'Infected Aphids':
        return '#f1c40f';
      case 'Infected Flea Beetles':
        return '#2980b9';
      case 'Beneficial Ladybug':
        return '#8e44ad';
      case 'Infected Squash Beetles':
        return '#e67e22';
      case 'Infected Pumpkin Beetles':
        return '#27ae60';
      case 'Infected Leaf Miners':
        return '#c0392b';
      default:
        return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    }
  };

  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

 const describeArc = (cx, cy, r, startAngle, endAngle) => {
    // --- NEW FIX: Handle the 360-degree bug ---
    // If the slice is a full 360, make it 359.99
    // This prevents the start and end points from being the same.
    if (endAngle - startAngle === 360) {
      endAngle = 359.99;
    }

    // --- Corrected logic from before ---
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);

    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';

    // --- Corrected SVG Path ---
    // M = Move to the arc's starting point
    // A = Draw the Arc
    // L = Draw a Line back to the center
    // Z = Close the path
    const d = [
      "M", start.x, start.y,
      "A", r, r, 0, largeArc, 1, end.x, end.y,
      "L", cx, cy,
      "Z",
    ].join(" ");

    return d;
  };

  const Pie = ({ size = 180, data }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) {
      return (
        <Svg width={size} height={size}>
          <Path d={describeArc(size / 2, size / 2, size / 2, 0, 359.99)} fill="#ececec" />
        </Svg>
      );
    }

    const cx = size / 2,
      cy = size / 2,
      r = size / 2;
    let angle = 0;

    return (
      <Svg width={size} height={size}>
        {data.map((d, i) => {
          const slice = (d.value / total) * 360;
          const path = describeArc(cx, cy, r, angle, angle + slice);
          angle += slice;
          return <Path key={i} d={path} fill={d.color} />;
        })}
      </Svg>
    );
  };

  const Legend = ({ items, colors }) => (
    <View style={{ marginTop: 8, flex: 1, paddingLeft: 10 }}>
      {items.map((it, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: it.color,
              marginRight: 8,
            }}
          />
          <Text style={{ color: colors.text, fontSize: 12 }}>
            {String(it.label)} ({String(it.value)})
          </Text>
        </View>
      ))}
    </View>
  );

  const captureReport = async () => {
    try {
      return await reportRef.current.capture();
    } catch (e) {
      console.error('Oops, snapshot failed', e);
      Alert.alert('Error', 'Could not capture report.');
      return null;
    }
  };

  const onExportPng = async () => {
    const uri = await captureReport();
    if (!uri) return;

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please grant permissions to save to your photo library.');
      return;
    }

    try {
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success!', 'Report saved to your photo gallery.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save image.');
    }
  };

  // const onExportPdf = async () => {
  //   const uri = await captureReport();
  //   if (!uri) return;

  //   const html = `
  //     <html>
  //       <head>
  //         <style>
  //           body { margin: 0; padding: 0; }
  //           img { width: 100%; display: block; }
  //         </style>
  //       </head>
  //       <body>
  //         <img src="${uri}" />
  //       </body>
  //     </html>
  //   `;

  //   try {
  //     await Print.printAsync({
  //       html,
  //       orientation: Print.Orientation.portrait,
  //     });
  //   } catch (e) {
  //     console.error(e);
  //     Alert.alert('Error', 'Could not generate PDF.');
  //   }
  // };

  // This is the NEW, fixed onExportPdf function
const onExportPdf = async () => {
  let imageBase64;
  try {
    // 1. Capture the report, but ask for 'base64' data, NOT a file uri
    imageBase64 = await reportRef.current.capture({
      result: 'base64', // Get base64 string
      format: 'png',
      quality: 0.9,
    });
  } catch (e) {
    console.error("Oops, snapshot failed", e);
    Alert.alert("Error", "Could not capture report.");
    return;
  }

  if (!imageBase64) return;

  // 2. Create an HTML string that embeds the base64 data
  // This "data:image/png;base64," part is the magic fix
  const html = `
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; }
          img { width: 100%; display: block; }
        </style>
      </head>
      <body>
        <img src="data:image/png;base64,${imageBase64}" />
      </body>
    </html>
  `;

  try {
    console.log("Generating PDF...");
    await Print.printAsync({
      html,
      orientation: Print.Orientation.portrait,
    });
  } catch (e) {
    console.error(e);
    Alert.alert('Error', 'Could not generate PDF.');
  }
};

  const onExport = () => {
    Alert.alert(
      'Export Report',
      'Choose a format to export your analytics report.',
      [
        { text: 'Save as PNG', onPress: onExportPng },
        { text: 'Save as PDF', onPress: onExportPdf },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ViewShot is now INSIDE the ScrollView, wrapping all the report content.
        The "collapsable={false}" prop is important for ViewShot to work.
      */}
      <ViewShot ref={reportRef} options={{ format: 'png', quality: 0.9 }}>
        <View style={{ backgroundColor: colors.bg }} collapsable={false}>
          
          {/* --- All your report content goes here --- */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Analytics</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Insights and trends for your crops
            </Text>
          </View>

          <View style={styles.periodSelector}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  { backgroundColor: colors.card },
                  selectedPeriod === period && { backgroundColor: colors.primary },
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: colors.muted },
                    selectedPeriod === period && { color: '#fff' },
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.overviewSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={styles.overviewGrid}>
                <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.overviewNumber, { color: colors.primary }]}>
                    {overviewData.detections}
                  </Text>
                  <Text style={[styles.overviewLabel, { color: colors.muted }]}>Total Detections</Text>
                </View>
                <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.overviewNumber, { color: colors.primary }]}>
                    {overviewData.fields}
                  </Text>
                  <Text style={[styles.overviewLabel, { color: colors.muted }]}>Active Fields</Text>
                </View>
                <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.overviewNumber, { color: colors.primary }]}>
                    {overviewData.healthScore}%
                  </Text>
                  <Text style={[styles.overviewLabel, { color: colors.muted }]}>Health Score</Text>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Overall Crop Health Distribution
            </Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pie size={180} data={cropHealthChartData} />
                <Legend items={cropHealthChartData} colors={colors} />
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Overall Insect Distribution
            </Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pie size={180} data={insectChartData} />
                <Legend items={insectChartData} colors={colors} />
              </View>
            )}
          </View>

          <View style={styles.insightsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Insights</Text>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              insights.map((insight, index) => (
                <View key={index} style={[styles.insightCard, { backgroundColor: colors.card }]}>
                  <View style={styles.insightIcon} />
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightTitle, { color: colors.text }]}>
                      {String(insight.title)}
                    </Text>
                    <Text style={[styles.insightDescription, { color: colors.muted }]}>
                      {String(insight.description)}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ViewShot>

      {/* The Export Button is now OUTSIDE the ViewShot ref,
        but still INSIDE the ScrollView.
      */}
      <View style={styles.exportSection}>
        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: colors.primary }]}
          onPress={onExport}
        >
          <View style={styles.exportIcon} />
          <Text style={styles.exportText}>Export Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { fontSize: 16 },
  periodSelector: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 30 },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: 5,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 1,
  },
  periodText: { fontSize: 14, fontWeight: '600' },
  overviewSection: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12 },
  overviewGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewCard: {
    flex: 1,
    padding: 20,
    marginHorizontal: 5,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
  },
  overviewNumber: { fontSize: 24, fontWeight: 'bold', marginBottom: 5 },
  overviewLabel: { fontSize: 12, textAlign: 'center' },
  card: { padding: 16, borderRadius: 15, marginHorizontal: 20, marginBottom: 20, elevation: 2 },
  insightsSection: { paddingHorizontal: 20, marginBottom: 30 },
  insightCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 1,
  },
  insightIcon: { width: 20, height: 20, marginRight: 15, backgroundColor: '#ccc', borderRadius: 4 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  insightDescription: { fontSize: 14, lineHeight: 20 },
  exportSection: { paddingHorizontal: 20, marginBottom: 30 },
  exportButton: {
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  exportIcon: { width: 20, height: 20, marginRight: 10, backgroundColor: '#fff', borderRadius: 4 },
  exportText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AnalyticsScreen;
