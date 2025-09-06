import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

const AnalyticsScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const periods = ['day', 'week', 'month', 'year'];
  const { theme, colors } = useTheme();

  const analyticsData = {
    week: {
      detections: 45,
      fields: 4,
      healthScore: 89,
      trends: [
        { name: 'Aphids', count: 12, trend: '+15%' },
        { name: 'Whiteflies', count: 8, trend: '-5%' },
        { name: 'Spider Mites', count: 15, trend: '+8%' },
        { name: 'Thrips', count: 3, trend: '-12%' },
      ]
    }
  };

  const defaultData = { detections: 0, fields: 0, healthScore: 0, trends: [] };
  const currentData = analyticsData[selectedPeriod] ?? defaultData;

  const getTrendColor = (t) => {
    const value = typeof t === 'string' ? t : t?.trend;
    if (typeof value !== 'string') return '#27ae60';
    return value.trim().startsWith('+') ? '#e74c3c' : '#27ae60';
  };

  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = ((angle - 90) * Math.PI) / 180; return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  };
  const Pie = ({ size = 180, data }) => {
    const cx = size / 2, cy = size / 2, r = size / 2; const total = data.reduce((s, d) => s + d.value, 0) || 1; let angle = 0;
    return (
      <Svg width={size} height={size}>
        {data.map((d, i) => { const slice = (d.value / total) * 360; const path = describeArc(cx, cy, r, angle, angle + slice); angle += slice; return <Path key={i} d={path} fill={d.color} />; })}
      </Svg>
    );
  };

  const cropHealthData = [ { label: 'Healthy', value: 85, color: '#2ecc71' }, { label: 'Affected', value: 15, color: '#e74c3c' } ];
  const insectDistributionData = [
    { label: 'Aphid', value: 30, color: '#f1c40f' },
    { label: 'Flea Beetles', value: 10, color: '#2980b9' },
    { label: 'Mealy Bugs', value: 12, color: '#8e44ad' },
    { label: 'Squash Beetles', value: 8, color: '#e67e22' },
    { label: 'Pumpkin Beetles', value: 18, color: '#27ae60' },
    { label: 'Leaf Miners', value: 22, color: '#c0392b' },
  ];
  const Legend = ({ items }) => (
    <View style={{ marginTop: 8 }}>
      {items.map((it, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: it.color, marginRight: 8 }} />
          <Text style={{ color: colors.text }}>{it.label}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}><Text style={[styles.title, { color: colors.text }]}>Analytics</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Insights and trends for your crops</Text></View>

      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity key={period} style={[styles.periodButton, { backgroundColor: colors.card }, selectedPeriod === period && { backgroundColor: colors.primary }]} onPress={() => setSelectedPeriod(period)}>
            <Text style={[styles.periodText, { color: colors.muted }, selectedPeriod === period && { color: '#fff' }]}>{period.charAt(0).toUpperCase() + period.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.overviewSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { backgroundColor: colors.card }]}><Text style={[styles.overviewNumber, { color: colors.primary }]}>{currentData.detections}</Text><Text style={[styles.overviewLabel, { color: colors.muted }]}>Total Detections</Text></View>
          <View style={[styles.overviewCard, { backgroundColor: colors.card }]}><Text style={[styles.overviewNumber, { color: colors.primary }]}>{currentData.fields}</Text><Text style={[styles.overviewLabel, { color: colors.muted }]}>Active Fields</Text></View>
          <View style={[styles.overviewCard, { backgroundColor: colors.card }]}><Text style={[styles.overviewNumber, { color: colors.primary }]}>{currentData.healthScore}%</Text><Text style={[styles.overviewLabel, { color: colors.muted }]}>Health Score</Text></View>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}><Text style={[styles.sectionTitle, { color: colors.text }]}>Overall Crop health Distribution</Text><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Pie size={180} data={cropHealthData} /><Legend items={[{ label: 'Affected', color: '#e74c3c' }, { label: 'Healthy', color: '#2ecc71' }]} /></View></View>

      <View style={[styles.card, { backgroundColor: colors.card }]}><Text style={[styles.sectionTitle, { color: colors.text }]}>Overall Insect Distribution</Text><View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Pie size={180} data={insectDistributionData} /><Legend items={insectDistributionData} /></View></View>

      <View style={styles.insightsSection}><Text style={[styles.sectionTitle, { color: colors.text }]}>Key Insights</Text><View style={[styles.insightCard, { backgroundColor: colors.card }]}><Text style={styles.insightIcon}></Text><View style={styles.insightContent}><Text style={[styles.insightTitle, { color: colors.text }]}>High Risk Alert</Text><Text style={[styles.insightDescription, { color: colors.muted }]}>Aphid population has increased by 15% this week. Consider immediate treatment.</Text></View></View><View style={[styles.insightCard, { backgroundColor: colors.card }]}><Text style={styles.insightIcon}></Text><View style={styles.insightContent}><Text style={[styles.insightTitle, { color: colors.text }]}>Positive Trend</Text><Text style={[styles.insightDescription, { color: colors.muted }]}>Thrips population decreased by 12%. Your treatment is working effectively.</Text></View></View><View style={[styles.insightCard, { backgroundColor: colors.card }]}><Text style={styles.insightIcon}></Text><View style={styles.insightContent}><Text style={[styles.insightTitle, { color: colors.text }]}>Growth Monitoring</Text><Text style={[styles.insightDescription, { color: colors.muted }]}>Overall crop health is stable at 89%. Continue current practices.</Text></View></View></View>

      <View style={styles.exportSection}><TouchableOpacity style={[styles.exportButton, { backgroundColor: colors.primary }]}><Text style={styles.exportIcon}></Text><Text style={styles.exportText}>Export Report</Text></TouchableOpacity></View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#7f8c8d' },
  periodSelector: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 30 },
  periodButton: { flex: 1, paddingVertical: 10, paddingHorizontal: 15, marginHorizontal: 5, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  selectedPeriodButton: { backgroundColor: '#3498db' },
  periodText: { fontSize: 14, fontWeight: '600', color: '#7f8c8d' },
  selectedPeriodText: { color: '#fff' },
  overviewSection: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#2c3e50', marginBottom: 12 },
  overviewGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  overviewCard: { flex: 1, backgroundColor: '#fff', padding: 20, marginHorizontal: 5, borderRadius: 15, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  overviewNumber: { fontSize: 24, fontWeight: 'bold', color: '#3498db', marginBottom: 5 },
  overviewLabel: { fontSize: 12, color: '#7f8c8d', textAlign: 'center' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 15, marginHorizontal: 20, marginBottom: 20, elevation: 2 },
  insightsSection: { paddingHorizontal: 20, marginBottom: 30 },
  insightCard: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  insightIcon: { fontSize: 24, marginRight: 15, marginTop: 2 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  insightDescription: { fontSize: 14, color: '#7f8c8d', lineHeight: 20 },
  exportSection: { paddingHorizontal: 20, marginBottom: 30 },
  exportButton: { backgroundColor: '#27ae60', paddingVertical: 15, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  exportIcon: { fontSize: 20, marginRight: 10 },
  exportText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default AnalyticsScreen;
