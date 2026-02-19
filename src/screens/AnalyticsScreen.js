import React, { useState, useEffect, useRef } from "react";
import { 
  Dimensions, 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  StyleSheet 
} from "react-native"; // Added missing UI components
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp, 
  doc, 
  orderBy 
} from "firebase/firestore"; // Consolidated into one clean import
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../theme/ThemeContext";
import { db } from "../../firebase";
import { CROP_LABELS, INSECT_LABELS } from "../config/LabelMap";
import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import * as MediaLibrary from "expo-media-library";
import { useAuth } from "../context/AuthContext";

const screenWidth = Dimensions.get("window").width;

// ... rest of your component code

const AnalyticsScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const periods = ["day", "week", "month", "year"];
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState({ detections: 0, fields: 0, healthScore: 0 });
  const [cropHealthChartData, setCropHealthChartData] = useState([]);
  const [insectChartData, setInsectChartData] = useState([]);
  const [insights, setInsights] = useState([]);
  const [pairedPiId, setPairedPiId] = useState(null);

  const reportRef = useRef();
  const { user } = useAuth();

  useEffect(() => {
  if (!user) {
    setLoading(false);
    return;
  }

  let unsubscribeUser = () => {};
  let unsubscribeDetections = () => {};

  const userDocRef = doc(db, "users", user.uid);
  
  unsubscribeUser = onSnapshot(userDocRef, (userSnap) => {
    const userData = userSnap.data();
    const piId = userData?.pairedPiId;

    if (piId) {
      setPairedPiId(piId);

      // 1. IMPROVED DATE CALCULATION
      const getStartDate = (period) => {
        const date = new Date();
        if (period === "day") date.setHours(0, 0, 0, 0); // Start of today
        else if (period === "week") date.setDate(date.getDate() - 7);
        else if (period === "month") date.setMonth(date.getMonth() - 1);
        else if (period === "year") date.setFullYear(date.getFullYear() - 1);
        return Timestamp.fromDate(date);
      };

      const startDate = getStartDate(selectedPeriod);

      // 2. BROADENED QUERY 
      // Removed the 'type' filter here so we catch all detections, 
      // then we filter them in Javascript for better reliability.
      const q = query(
        collection(db, "detections"),
        where("pi_id", "==", piId),
        where("timestamp", ">=", startDate),
        orderBy("timestamp", "desc")
      );

      unsubscribeDetections();
      unsubscribeDetections = onSnapshot(q, (querySnapshot) => {
        let totalDetections = 0;
        const healthCounts = {};
        const insectCounts = {};

        console.log(`📊 Found ${querySnapshot.size} total docs for ${selectedPeriod}`);

        querySnapshot.forEach((doc) => {
          totalDetections++;
          const data = doc.data();
          
          // Try to find the name in multiple common fields
          const rawName = data.detection || data.primary || data.label || "Unknown";
          const name = rawName.trim(); 
          const type = data.type || "";

          // 3. FLEXIBLE FILTERING LOGIC
          // Check if it's a Crop or an Insect
          if (type.includes("Crop") || CROP_LABELS.includes(name)) {
            healthCounts[name] = (healthCounts[name] || 0) + 1;
          } 
          // If the type says Insect OR it's in our Insect list
          else if (type.includes("Insect") || INSECT_LABELS.includes(name)) {
            insectCounts[name] = (insectCounts[name] || 0) + 1;
          }
        });

        // Calculate Crop Health
        const totalHealthy = healthCounts["Healthy"] || 0;
        const totalUnhealthy = Object.entries(healthCounts)
          .filter(([key]) => key !== "Healthy")
          .reduce((sum, [_, val]) => sum + val, 0);
        
        const totalCrops = totalHealthy + totalUnhealthy;
        const healthScore = totalCrops === 0 ? 100 : Math.round((totalHealthy / totalCrops) * 100);

        setOverviewData({
          detections: totalDetections,
          fields: 1,
          healthScore: healthScore,
        });

        // Update Crop Chart
        setCropHealthChartData([
          { label: "Healthy", value: totalHealthy, color: "#2ecc71" },
          { label: "Affected", value: totalUnhealthy, color: "#e74c3c" },
        ]);

        // 4. FIX: ENSURE INSECT DATA IS MAPPED CORRECTLY
        const mappedInsects = Object.keys(insectCounts).map((key) => ({
          label: key,
          value: insectCounts[key],
          color: getColorForLabel(key),
        }));

        setInsectChartData(mappedInsects);

        // Insights...
        const newInsights = [{ title: "Analysis", description: `Data updated for the last ${selectedPeriod}.` }];
        setInsights(newInsights);
        setLoading(false);
      }, (err) => {
        console.error("🔥 Firestore Error:", err);
        setLoading(false);
      });

    } else {
      setLoading(false);
    }
  });

  return () => {
    unsubscribeUser();
    unsubscribeDetections();
  };
}, [selectedPeriod, user]);

  const getColorForLabel = (label) => {
    const map = {
      'Beneficial Bee': "#f1c40f",
      'Beneficial Lacewing Larvae': "#2ecc71",
      'Beneficial Ladybug': "#e74c3c",
      'Beneficial Larvae': "#3498db",
      'Infected Aphid': "#9b59b6",
      'Infected Flea Beetle': "#e67e22",
      'Infected Pumpkin Beetle': "#1abc9c",
    };
    return map[label] || "#ccc";
  };

  // --- CHART RENDERING HELPERS ---
  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    if (endAngle - startAngle === 360) endAngle = 359.99;
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} L ${cx} ${cy} Z`;
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

    let angle = 0;
    return (
      <Svg width={size} height={size}>
        {data.map((d, i) => {
          const slice = (d.value / total) * 360;
          const path = describeArc(size / 2, size / 2, size / 2, angle, angle + slice);
          angle += slice;
          return <Path key={i} d={path} fill={d.color} />;
        })}
      </Svg>
    );
  };

  const Legend = ({ items }) => (
    <View style={{ marginTop: 8, flex: 1, paddingLeft: 10 }}>
      {items.map((it, idx) => (
        <View key={idx} style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: it.color, marginRight: 8 }} />
          <Text style={{ color: colors.text, fontSize: 12 }}>{`${it.label} (${it.value})`}</Text>
        </View>
      ))}
    </View>
  );

  // --- EXPORT FUNCTIONS ---
  const onExport = () => {
    Alert.alert("Export Report", "Choose format:", [
      { text: "PNG", onPress: async () => {
          const uri = await reportRef.current.capture();
          await MediaLibrary.saveToLibraryAsync(uri);
          Alert.alert("Success", "Saved to Gallery");
      }},
      { text: "PDF", onPress: async () => {
          const base64 = await reportRef.current.capture({ result: "base64" });
          await Print.printAsync({ html: `<html><body><img src="data:image/png;base64,${base64}" style="width:100%;" /></body></html>` });
      }},
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ViewShot ref={reportRef} options={{ format: "png", quality: 0.9 }}>
        <View style={{ backgroundColor: colors.bg }} collapsable={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Analytics</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Insights and trends for your crops</Text>
          </View>

          <View style={styles.periodSelector}>
            {periods.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodButton, { backgroundColor: colors.card }, selectedPeriod === p && { backgroundColor: colors.primary }]}
                onPress={() => setSelectedPeriod(p)}
              >
                <Text style={[styles.periodText, { color: selectedPeriod === p ? "#fff" : colors.muted }]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.overviewSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
            {loading ? <ActivityIndicator color={colors.primary} /> : (
              <View style={styles.overviewGrid}>
                <StatCard num={overviewData.detections} label="Detections" color={colors.primary} cardBg={colors.card} />
                <StatCard num={overviewData.fields} label="Active Fields" color={colors.primary} cardBg={colors.card} />
                <StatCard num={`${overviewData.healthScore}%`} label="Health Score" color={colors.primary} cardBg={colors.card} />
              </View>
            )}
          </View>

          <ChartCard title="Crop Health Distribution" loading={loading} data={cropHealthChartData} colors={colors} Pie={Pie} Legend={Legend} />
          <ChartCard title="Insect Distribution" loading={loading} data={insectChartData} colors={colors} Pie={Pie} Legend={Legend} />

          <View style={styles.insightsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Insights</Text>
            {insights.map((ins, i) => (
              <View key={i} style={[styles.insightCard, { backgroundColor: colors.card }]}>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>{ins.title}</Text>
                  <Text style={[styles.insightDescription, { color: colors.muted }]}>{ins.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ViewShot>

      <TouchableOpacity style={[styles.exportButton, { backgroundColor: colors.primary }]} onPress={onExport}>
        <Text style={styles.exportText}>Export Report</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// Sub-components for cleaner JSX
const StatCard = ({ num, label, color, cardBg }) => (
  <View style={[styles.overviewCard, { backgroundColor: cardBg }]}>
    <Text style={[styles.overviewNumber, { color }]}>{num}</Text>
    <Text style={[styles.overviewLabel, { color: '#94A3B8' }]}>{label}</Text>
  </View>
);

const ChartCard = ({ title, loading, data, colors, Pie, Legend }) => (
  <View style={[styles.card, { backgroundColor: colors.card }]}>
    <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    {loading ? <ActivityIndicator color={colors.primary} /> : (
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: 'center' }}>
        <Pie size={150} data={data} />
        <Legend items={data} />
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold" },
  subtitle: { fontSize: 16, marginTop: 5 },
  periodSelector: { flexDirection: "row", paddingHorizontal: 15, marginBottom: 20 },
  periodButton: { flex: 1, paddingVertical: 8, marginHorizontal: 5, borderRadius: 20, alignItems: "center" },
  periodText: { fontSize: 13, fontWeight: "600" },
  overviewSection: { paddingHorizontal: 20, marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 15 },
  overviewGrid: { flexDirection: "row", justifyContent: "space-between" },
  overviewCard: { flex: 1, padding: 15, marginHorizontal: 4, borderRadius: 15, alignItems: "center", elevation: 2 },
  overviewNumber: { fontSize: 22, fontWeight: "bold" },
  overviewLabel: { fontSize: 10, marginTop: 4 },
  card: { padding: 20, borderRadius: 20, marginHorizontal: 20, marginBottom: 20, elevation: 3 },
  insightsSection: { paddingHorizontal: 20, marginBottom: 30 },
  insightCard: { padding: 15, borderRadius: 15, marginBottom: 10 },
  insightTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  insightDescription: { fontSize: 14, lineHeight: 20 },
  exportButton: { margin: 20, paddingVertical: 15, borderRadius: 15, alignItems: "center", marginBottom: 50 },
  exportText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default AnalyticsScreen;