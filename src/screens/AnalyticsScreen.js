import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../theme/ThemeContext";
import { db } from "../../firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { CROP_LABELS, INSECT_LABELS } from "../config/LabelMap";
import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import * as MediaLibrary from "expo-media-library";
import { useAuth } from "../context/AuthContext";
import UserService from "../services/UserService";

const screenWidth = Dimensions.get("window").width;

const AnalyticsScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const periods = ["day", "week", "month", "year"];
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState({ detections: 0, fields: 1, healthScore: 0 });
  const [cropHealthChartData, setCropHealthChartData] = useState([]);
  const [insectChartData, setInsectChartData] = useState([]);
  const [insights, setInsights] = useState([]);

  const reportRef = useRef();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setOverviewData({ detections: 0, fields: 1, healthScore: 0 });
      setCropHealthChartData([]);
      setInsectChartData([]);
      setInsights([]);
      return;
    }

    setLoading(true);
    let unsubscribe = () => {};

    const fetchUserDataAndSubscribe = async () => {
      try {
        const userResult = await UserService.getUserData(user.uid);

        if (userResult.success && userResult.userData.pairedPiId) {
          const piId = userResult.userData.pairedPiId;

          const getStartDate = (period) => {
            const now = new Date();
            if (period === "day") now.setDate(now.getDate() - 1);
            if (period === "week") now.setDate(now.getDate() - 7);
            if (period === "month") now.setMonth(now.getMonth() - 1);
            if (period === "year") now.setFullYear(now.getFullYear() - 1);
            return Timestamp.fromDate(now);
          };

          const startDate = getStartDate(selectedPeriod);

          const q = query(
            collection(db, "detections"),
            where("pi_id", "==", piId),
            where("timestamp", ">=", startDate)
          );

          unsubscribe = onSnapshot(q, (querySnapshot) => {
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

            const totalHealthy = healthCounts["Healthy"] || 0;
            const totalUnhealthy =
              (healthCounts["Wilting"] || 0) +
              (healthCounts["Spotting"] || 0) +
              (healthCounts["Yellowing"] || 0) +
              (healthCounts["Insect Bite"] || 0);
            const totalCrops = totalHealthy + totalUnhealthy;
            const healthScore = totalCrops === 0 ? 0 : Math.round((totalHealthy / totalCrops) * 100);

            setOverviewData({
              detections: totalDetections,
              fields: 1,
              healthScore: healthScore,
            });

            setCropHealthChartData([
              { label: "Healthy", value: totalHealthy, color: "#2ecc71" },
              { label: "Affected", value: totalUnhealthy, color: "#e74c3c" },
            ]);

            setInsectChartData(
              Object.keys(insectCounts).map((key) => ({
                label: key,
                value: insectCounts[key],
                color: getColorForLabel(key),
              }))
            );

            let mostCommonPest = Object.entries(insectCounts).reduce(
              (max, curr) => (curr[1] > max[1] ? curr : max),
              ["None", 0]
            );

            const newInsights = [
              { title: "Growth Monitoring", description: `Overall crop health is stable at ${healthScore}%.` },
            ];

            if (mostCommonPest[0] !== "None") {
              newInsights.push({
                title: "Key Pest Alert",
                description: `${mostCommonPest[0]} detected ${mostCommonPest[1]} times this ${selectedPeriod}.`,
              });
            }

            setInsights(newInsights);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data for Analytics:", error);
        setLoading(false);
      }
    };

    fetchUserDataAndSubscribe();
    return () => unsubscribe();
  }, [selectedPeriod, user]);

  const getColorForLabel = (label) => {
    const map = {
      "Infected Aphids": "#f1c40f",
      "Infected Flea Beetles": "#2980b9",
      "Beneficial Ladybug": "#8e44ad",
      "Infected Squash Beetles": "#e67e22",
      "Infected Pumpkin Beetles": "#27ae60",
      "Infected Leaf Miners": "#c0392b",
    };
    return map[label] || "#ccc";
  };

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
          <View
            style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: it.color, marginRight: 8 }}
          />
          <Text style={{ color: colors.text, fontSize: 12 }}>
            {`${it.label} (${it.value})`}
          </Text>
        </View>
      ))}
    </View>
  );

  const captureReport = async () => {
    try {
      return await reportRef.current.capture();
    } catch {
      Alert.alert("Error", "Could not capture report.");
      return null;
    }
  };

  const onExportPng = async () => {
    const uri = await captureReport();
    if (!uri) return;

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Enable storage access to save export.");
      return;
    }

    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert("Success!", "Report saved to gallery.");
  };

  const onExportPdf = async () => {
    const imageBase64 = await reportRef.current.capture({
      result: "base64",
      format: "png",
      quality: 0.9,
    });

    const html = `
      <html><body style="margin:0;"><img src="data:image/png;base64,${imageBase64}" style="width:100%;" /></body></html>
    `;

    await Print.printAsync({ html });
  };

  const onExport = () => {
    Alert.alert("Export Report", "Choose format:", [
      { text: "PNG", onPress: onExportPng },
      { text: "PDF", onPress: onExportPdf },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ViewShot ref={reportRef} options={{ format: "png", quality: 0.9 }}>
        <View style={{ backgroundColor: colors.bg }} collapsable={false}>
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
                    selectedPeriod === period && { color: "#fff" },
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
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Pie size={180} data={cropHealthChartData} />
                <Legend items={cropHealthChartData} />
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
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Pie size={180} data={insectChartData} />
                <Legend items={insectChartData} />
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
                      {insight.title}
                    </Text>
                    <Text style={[styles.insightDescription, { color: colors.muted }]}>
                      {insight.description}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ViewShot>

      <View style={styles.exportSection}>
        <TouchableOpacity style={[styles.exportButton, { backgroundColor: colors.primary }]} onPress={onExport}>
          <View style={styles.exportIcon} />
          <Text style={styles.exportText}>Export Report</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 5 },
  subtitle: { fontSize: 16 },
  periodSelector: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 30 },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 20,
    alignItems: "center",
  },
  periodText: { fontSize: 14, fontWeight: "600" },
  overviewSection: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "900", marginBottom: 12 },
  overviewGrid: { flexDirection: "row", justifyContent: "space-between" },
  overviewCard: { flex: 1, padding: 20, marginHorizontal: 5, borderRadius: 15, alignItems: "center" },
  overviewNumber: { fontSize: 24, fontWeight: "bold", marginBottom: 5 },
  overviewLabel: { fontSize: 12, textAlign: "center" },
  card: { padding: 16, borderRadius: 15, marginHorizontal: 20, marginBottom: 20 },
  insightsSection: { paddingHorizontal: 20, marginBottom: 30 },
  insightCard: { padding: 15, borderRadius: 10, marginBottom: 10, flexDirection: "row" },
  insightIcon: { width: 20, height: 20, marginRight: 15, backgroundColor: "#ccc", borderRadius: 4 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  insightDescription: { fontSize: 14, lineHeight: 20 },
  exportSection: { paddingHorizontal: 20, marginBottom: 30 },
  exportButton: { paddingVertical: 15, borderRadius: 10, flexDirection: "row", justifyContent: "center" },
  exportIcon: { width: 20, height: 20, marginRight: 10, backgroundColor: "#fff", borderRadius: 4 },
  exportText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default AnalyticsScreen;
