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
} from "react-native";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp, 
  doc, 
  orderBy 
} from "firebase/firestore";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../theme/ThemeContext";
import { db } from "../../firebase";
import { CROP_LABELS, INSECT_LABELS } from "../config/LabelMap";
import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from 'expo-sharing';
// THE FIX: Pointing strictly to the legacy folder to clear the warning!
import * as FileSystem from 'expo-file-system/legacy'; 
import * as XLSX from 'xlsx';
import { useAuth } from "../context/AuthContext";
import { Ionicons } from '@expo/vector-icons';

const AnalyticsScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const periods = ["day", "week", "month", "year"];
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [overviewData, setOverviewData] = useState({ detections: 0, fields: 0, healthScore: 0 });
  const [cropHealthChartData, setCropHealthChartData] = useState([]);
  const [insectChartData, setInsectChartData] = useState([]);
  const [insights, setInsights] = useState([]);
  
  // State to hold the raw data for our exports
  const [reportData, setReportData] = useState([]); 
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

        const getStartDate = (period) => {
          const date = new Date();
          if (period === "day") date.setHours(0, 0, 0, 0);
          else if (period === "week") date.setDate(date.getDate() - 7);
          else if (period === "month") date.setMonth(date.getMonth() - 1);
          else if (period === "year") date.setFullYear(date.getFullYear() - 1);
          return Timestamp.fromDate(date);
        };

        const startDate = getStartDate(selectedPeriod);

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
          const rawTableData = []; 

          querySnapshot.forEach((doc) => {
            totalDetections++;
            const data = doc.data();
            const name = (data.detection || data.primary || data.label || "Unknown").trim();
            const type = data.type || "";

            // Categorize as Crop or Insect based on type or LabelMap
            if (type.includes("Crop") || CROP_LABELS.includes(name)) {
              healthCounts[name] = (healthCounts[name] || 0) + 1;
            } else if (type.includes("Insect") || INSECT_LABELS.includes(name)) {
              insectCounts[name] = (insectCounts[name] || 0) + 1;
            }

            // --- ANOMALY CLASSIFICATION FOR EXPORTS ---
            const isGood = name.toLowerCase().includes('beneficial') || name.toLowerCase().includes('healthy');
            const isAnomaly = name.toLowerCase().includes('unidentified');
            const exportStatus = isAnomaly ? 'Anomaly' : (isGood ? 'Good' : 'Warning');

            // Build Raw Data Array for Exports
            rawTableData.push({
              id: doc.id,
              date: data.timestamp ? data.timestamp.toDate().toLocaleDateString() : 'N/A',
              time: data.timestamp ? data.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A',
              detection: name,
              confidence: data.score ? `${Math.round(data.score * 100)}%` : (data.confidence || 'N/A'),
              status: exportStatus
            });
          });

          const totalHealthy = healthCounts["Healthy"] || 0;
          const totalUnhealthy = Object.entries(healthCounts)
            .filter(([key]) => !key.toLowerCase().includes("healthy"))
            .reduce((sum, [_, val]) => sum + val, 0);
          
          const totalCrops = totalHealthy + totalUnhealthy;
          const healthScore = totalCrops === 0 ? 100 : Math.round((totalHealthy / totalCrops) * 100);

          setOverviewData({ detections: totalDetections, fields: 1, healthScore: healthScore });
          setReportData(rawTableData); 

          setCropHealthChartData([
            { label: "Healthy", value: totalHealthy, color: "#2ecc71" },
            { label: "Affected", value: totalUnhealthy, color: "#e74c3c" },
          ]);

          const mappedInsects = Object.keys(insectCounts).map((key) => ({
            label: key,
            value: insectCounts[key],
            color: getColorForLabel(key),
          }));

          setInsectChartData(mappedInsects);
          setInsights([{ 
            title: "Trend Summary", 
            description: `OrganicEye identified ${totalDetections} events in the past ${selectedPeriod}. The system indicates a ${healthScore}% health score.` 
          }]);
          setLoading(false);
        }, (err) => {
          console.error("Firestore Error:", err);
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
      'Infected Aphid': "#9b59b6",
      'Infected Flea Beetle': "#e67e22",
      'Infected Pumpkin Beetle': "#1abc9c",
      'Unidentified Insect': "#34495E", 
      'Unidentified Crop': "#7F8C8D",  
    };
    return map[label] || "#94A3B8";
  };

  // --- SVG HELPER FUNCTIONS ---
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

  const Pie = ({ size = 150, data }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return (
      <Svg width={size} height={size}>
        <Path d={describeArc(size/2, size/2, size/2, 0, 359.99)} fill="#ececec" />
      </Svg>
    );
    let angle = 0;
    return (
      <Svg width={size} height={size}>
        {data.map((d, i) => {
          const slice = (d.value / total) * 360;
          const path = describeArc(size/2, size/2, size/2, angle, angle + slice);
          angle += slice;
          return <Path key={i} d={path} fill={d.color} />;
        })}
      </Svg>
    );
  };

  const Legend = ({ items }) => (
    <View style={styles.legendContainer}>
      {items.map((it, idx) => (
        <View key={idx} style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: it.color }]} />
          <Text style={{ color: colors.text, fontSize: 11 }}>{`${it.label} (${it.value})`}</Text>
        </View>
      ))}
    </View>
  );

  // ==========================================
  // EXPORT LOGIC ENGINE (FIXED ENCODING)
  // ==========================================

  const exportToCSV = async () => {
    setIsExporting(true);
    if (reportData.length === 0) { Alert.alert("No Data", "No data to export."); setIsExporting(false); return; }
    try {
      const header = "Date,Time,Detection,Confidence,Status\n";
      const rows = reportData.map(row => `${row.date},${row.time},${row.detection},${row.confidence},${row.status}`).join('\n');
      const fileUri = `${FileSystem.documentDirectory}OrganicEye_Data_${selectedPeriod}.csv`;
      
      // FIXED: Using FileSystem.EncodingType for perfect cross-platform support
      await FileSystem.writeAsStringAsync(fileUri, header + rows, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { dialogTitle: 'Export CSV Data' });
    } catch (error) { Alert.alert("Export Error", error.message); }
    setIsExporting(false);
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    if (reportData.length === 0) { Alert.alert("No Data", "No data to export."); setIsExporting(false); return; }
    try {
      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Detections");
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileUri = `${FileSystem.documentDirectory}OrganicEye_Data_${selectedPeriod}.xlsx`;
      
      // FIXED: Using FileSystem.EncodingType for perfect cross-platform support
      await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(fileUri, { dialogTitle: 'Export Excel Data' });
    } catch (error) { Alert.alert("Export Error", error.message); }
    setIsExporting(false);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    if (reportData.length === 0) { Alert.alert("No Data", "No data to export."); setIsExporting(false); return; }
    try {
      // 1. Capture the visual charts as a Base64 image
      const chartBase64 = await reportRef.current.capture({ result: "base64" });

      // 2. Generate Data Table
      const tableRows = reportData.map(item => {
        let statusColor = '#e74c3c'; // Warning red
        if (item.status === 'Good') statusColor = '#2ecc71';
        if (item.status === 'Anomaly') statusColor = '#34495E'; 
        
        return `
          <tr>
            <td>${item.date}</td>
            <td>${item.time}</td>
            <td><strong>${item.detection}</strong></td>
            <td>${item.confidence}</td>
            <td style="color: ${statusColor}; font-weight: bold;">${item.status}</td>
          </tr>
        `;
      }).join('');

      // 3. Build HTML combining the Image + Table
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
              h1 { color: #1B4332; text-align: center; border-bottom: 2px solid #1B4332; padding-bottom: 10px; }
              p { text-align: center; color: #666; font-size: 14px; }
              .chart-container { text-align: center; margin: 20px 0; }
              img { max-width: 100%; border-radius: 10px; border: 1px solid #eee; }
              table { width: 100%; border-collapse: collapse; margin-top: 30px; font-size: 12px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background-color: #2D6A4F; color: white; }
              tr:nth-child(even) { background-color: #f8f9fa; }
            </style>
          </head>
          <body>
            <h1>Organic Eye - Official Field Diagnostic Report</h1>
            <p>Generated on: ${new Date().toLocaleString()} | Reporting Period: Past ${selectedPeriod}</p>
            
            <div class="chart-container">
               <img src="data:image/png;base64,${chartBase64}" />
            </div>

            <h2 style="color: #1B4332; margin-top: 40px;">Raw Detection Logs</h2>
            <table>
              <tr><th>Date</th><th>Time</th><th>Detection</th><th>Confidence</th><th>Status</th></tr>
              ${tableRows}
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { dialogTitle: 'Export PDF Report' });
    } catch (error) { Alert.alert("Export Error", error.message); }
    setIsExporting(false);
  };

  const saveToGallery = async () => {
    try {
      const uri = await reportRef.current.capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("Success", "Dashboard image saved to your gallery!");
    } catch (error) { Alert.alert("Error", "Failed to save image."); }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      
      {/* EVERYTHING INSIDE VIEWSHOT GETS CAPTURED FOR THE PDF */}
      <ViewShot ref={reportRef} options={{ format: "png", quality: 0.9 }}>
        <View style={{ backgroundColor: colors.bg, paddingBottom: 10 }} collapsable={false}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Analytics Dashboard</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Data Trends & Reports</Text>
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
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Overview</Text>
            {loading ? <ActivityIndicator color={colors.primary} /> : (
              <View style={styles.overviewGrid}>
                <StatCard num={overviewData.detections} label="Detections" color={colors.primary} cardBg={colors.card} />
                <StatCard num={overviewData.fields} label="Active Fields" color={colors.primary} cardBg={colors.card} />
                <StatCard num={`${overviewData.healthScore}%`} label="Health Score" color={colors.primary} cardBg={colors.card} />
              </View>
            )}
          </View>

          <ChartCard title="Crop Health Distribution" loading={loading} data={cropHealthChartData} colors={colors} Pie={Pie} Legend={Legend} />
          <ChartCard title="Insects Detected" loading={loading} data={insectChartData} colors={colors} Pie={Pie} Legend={Legend} />

          <View style={styles.insightsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Insights</Text>
            {insights.map((ins, i) => (
              <View key={i} style={[styles.insightCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>{ins.title}</Text>
                <Text style={[styles.insightDescription, { color: colors.muted }]}>{ins.description}</Text>
              </View>
            ))}
          </View>
        </View>
      </ViewShot>

      {/* EXPORT ACTION BUTTONS */}
      <View style={styles.exportSection}>
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 15 }]}>Generate Reports</Text>
        
        {isExporting ? (
           <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View style={styles.buttonGrid}>
            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#E53935' }]} onPress={exportToPDF}>
              <Ionicons name="document-text" size={20} color="#FFF" />
              <Text style={styles.btnText}>PDF Report</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#43A047' }]} onPress={exportToExcel}>
              <Ionicons name="grid" size={20} color="#FFF" />
              <Text style={styles.btnText}>Excel Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#1E88E5' }]} onPress={exportToCSV}>
              <Ionicons name="list" size={20} color="#FFF" />
              <Text style={styles.btnText}>CSV Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.exportBtn, { backgroundColor: '#8E24AA' }]} onPress={saveToGallery}>
              <Ionicons name="image" size={20} color="#FFF" />
              <Text style={styles.btnText}>Save Graph Image</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{height: 40}} />
    </ScrollView>
  );
};

const StatCard = ({ num, label, color, cardBg }) => (
  <View style={[styles.overviewCard, { backgroundColor: cardBg }]}>
    <Text style={[styles.overviewNumber, { color }]}>{num}</Text>
    <Text style={[styles.overviewLabel]}>{label}</Text>
  </View>
);

const ChartCard = ({ title, loading, data, colors, Pie, Legend }) => (
  <View style={[styles.card, { backgroundColor: colors.card }]}>
    <Text style={[styles.chartTitle, { color: colors.text }]}>{title}</Text>
    {loading ? <ActivityIndicator color={colors.primary} /> : (
      <View style={styles.chartRow}>
        <Pie size={140} data={data} />
        <Legend items={data} />
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  title: { fontSize: 26, fontWeight: "bold" },
  subtitle: { fontSize: 14, marginTop: 4 },
  periodSelector: { flexDirection: "row", paddingHorizontal: 15, marginVertical: 20 },
  periodButton: { flex: 1, paddingVertical: 10, marginHorizontal: 4, borderRadius: 25, alignItems: "center", elevation: 1 },
  periodText: { fontSize: 12, fontWeight: "bold" },
  overviewSection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  overviewGrid: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  overviewCard: { flex: 1, padding: 15, borderRadius: 15, alignItems: "center", elevation: 2 },
  overviewNumber: { fontSize: 22, fontWeight: "bold" },
  overviewLabel: { fontSize: 10, marginTop: 4, color: '#94A3B8' },
  card: { padding: 20, borderRadius: 20, marginHorizontal: 20, marginBottom: 20, elevation: 3 },
  chartTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 15 },
  chartRow: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
  legendContainer: { flex: 1, paddingLeft: 15 },
  legendItem: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  legendColor: { width: 10, height: 10, borderRadius: 2, marginRight: 8 },
  insightsSection: { paddingHorizontal: 20, marginBottom: 10 },
  insightCard: { padding: 18, borderRadius: 15, marginBottom: 12, elevation: 1 },
  insightTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  insightDescription: { fontSize: 13, lineHeight: 18 },
  
  // EXPORT STYLES
  exportSection: { paddingHorizontal: 20, marginTop: 10 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  exportBtn: { width: '48%', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "bold", marginLeft: 8 }
});

export default AnalyticsScreen;