import React, { useState, useEffect, useRef } from "react";
import { 
  Dimensions, ScrollView, View, Text, TouchableOpacity, 
  ActivityIndicator, Alert, StyleSheet, Platform, Image 
} from "react-native";
import { collection, query, where, onSnapshot, Timestamp, doc, orderBy } from "firebase/firestore";
import Svg, { Path, Polyline, Circle, Line } from "react-native-svg";
import { useTheme } from "../theme/ThemeContext";
import { db } from "../../firebase"; 
import { CROP_LABELS, INSECT_LABELS } from "../config/LabelMap"; 
import ViewShot from "react-native-view-shot";
import * as Print from "expo-print";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy'; 
import * as XLSX from 'xlsx';
import { useAuth } from "../context/AuthContext";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==========================================
// --- 1. RESTORED STABLE IMAGE LIBRARY ---
// Uses public, stable images guaranteed to load instantly.
// ==========================================
const getReferenceImage = (classification) => {
  const images = {
    'Wilting': 'https://images.unsplash.com/photo-1635048424263-2396e952672d?w=200&q=80', 
    'Leaf Spot': 'https://images.unsplash.com/photo-1596434449830-179c3fbf11df?w=200&q=80',
    'Infected Aphid': 'https://images.unsplash.com/photo-1518580047392-cefb197ffb00?w=200&q=80',
    'Infected Flea Beetle': 'https://images.unsplash.com/photo-1550596334-7bb40a71b6bc?w=200&q=80',
    'Healthy': 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=200&q=80',
  };
  return images[classification] || 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=200&q=80'; // Default Leaf
};

const AnalyticsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const reportRef = useRef();

  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // Dates & Periods
  const periods = ["day", "week", "month", "year"];
  const [selectedPeriod, setSelectedPeriod] = useState("week"); 
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7))); 
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Data
  const [overviewData, setOverviewData] = useState({ detections: 0, fields: 0, healthScore: 0 });
  const [cropHealthChartData, setCropHealthChartData] = useState([]);
  const [insectChartData, setInsectChartData] = useState([]);
  const [healthTrendData, setHealthTrendData] = useState([]); 
  
  // Specific Anomaly Tracking
  const [dailyIssueData, setDailyIssueData] = useState([]); 
  const [availableIssues, setAvailableIssues] = useState([]); 
  const [selectedIssue, setSelectedIssue] = useState(null); 

  const [reportData, setReportData] = useState([]); 
  const [pairedPiId, setPairedPiId] = useState(null);

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    const now = new Date();
    let newStart = new Date();
    if (period === "day") newStart.setHours(0, 0, 0, 0); 
    else if (period === "week") newStart.setDate(now.getDate() - 7);
    else if (period === "month") newStart.setMonth(now.getMonth() - 1);
    else if (period === "year") newStart.setFullYear(now.getFullYear() - 1);
    setStartDate(newStart);
    setEndDate(now);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (userSnap) => {
      const piId = userSnap.data()?.pairedPiId;
      if (piId) {
        setPairedPiId(piId);
        const startTimestamp = new Date(startDate); startTimestamp.setHours(0, 0, 0, 0);
        const endTimestamp = new Date(endDate); endTimestamp.setHours(23, 59, 59, 999);

        const q = query(
          collection(db, "detections"),
          where("pi_id", "==", piId),
          where("timestamp", ">=", Timestamp.fromDate(startTimestamp)),
          where("timestamp", "<=", Timestamp.fromDate(endTimestamp)),
          orderBy("timestamp", "asc") 
        );

        const unsubscribeDetections = onSnapshot(q, (querySnapshot) => {
          let totalDetections = 0;
          const healthCounts = {}; const insectCounts = {};
          const dailyHealthTracker = {}; const dailyIssueTracker = {}; 
          const foundIssuesSet = new Set(); 

          const rawTableData = []; 

          querySnapshot.forEach((doc) => {
            totalDetections++;
            const data = doc.data();
            const name = (data.detection || data.primary || data.label || "Unknown").trim();
            const type = data.type || "";
            const isGood = name.toLowerCase().includes('beneficial') || name.toLowerCase().includes('healthy');
            const isAnomaly = name.toLowerCase().includes('unidentified');
            const dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
            
            let isCrop = false;
            if (type.includes("Crop") || CROP_LABELS.includes(name)) {
              healthCounts[name] = (healthCounts[name] || 0) + 1;
              isCrop = true;
            } else if (type.includes("Insect") || INSECT_LABELS.includes(name)) {
              insectCounts[name] = (insectCounts[name] || 0) + 1;
            }

            if (isCrop) {
              const dayKey = dateObj.toISOString().split('T')[0]; 
              if (!dailyHealthTracker[dayKey]) dailyHealthTracker[dayKey] = { healthy: 0, total: 0 };
              dailyHealthTracker[dayKey].total += 1;
              if (isGood) dailyHealthTracker[dayKey].healthy += 1;

              if (!isGood && !isAnomaly) {
                if (!dailyIssueTracker[dayKey]) dailyIssueTracker[dayKey] = {};
                dailyIssueTracker[dayKey][name] = (dailyIssueTracker[dayKey][name] || 0) + 1;
                foundIssuesSet.add(name);
              }
            }

            rawTableData.unshift({ 
              id: doc.id, date: dateObj.toLocaleDateString(), time: dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
              detection: name, confidence: data.score ? `${Math.round(data.score * 100)}%` : (data.confidence || 'N/A'),
              status: isAnomaly ? 'Anomaly' : (isGood ? 'Good' : 'Warning')
            });
          });

          const totalHealthy = healthCounts["Healthy"] || 0;
          const totalUnhealthy = Object.entries(healthCounts).filter(([k]) => !k.toLowerCase().includes("healthy")).reduce((sum, [_, v]) => sum + v, 0);
          const totalCrops = totalHealthy + totalUnhealthy;
          const healthScore = totalCrops === 0 ? 100 : Math.round((totalHealthy / totalCrops) * 100);

          setOverviewData({ detections: totalDetections, fields: 1, healthScore });
          setHealthTrendData(Object.keys(dailyHealthTracker).map(day => ({ date: day, score: Math.round((dailyHealthTracker[day].healthy / dailyHealthTracker[day].total) * 100) })));
          
          const uniqueIssuesArray = Array.from(foundIssuesSet);
          setDailyIssueData(Object.keys(dailyHealthTracker).map(day => ({ date: day, issues: dailyIssueTracker[day] || {} })));
          setAvailableIssues(uniqueIssuesArray);
          
          if (uniqueIssuesArray.length > 0 && !selectedIssue) setSelectedIssue(uniqueIssuesArray[0]);
          else if (uniqueIssuesArray.length === 0) setSelectedIssue(null);
          
          setCropHealthChartData([{ label: "Healthy", value: totalHealthy, color: "#2ecc71" }, { label: "Affected", value: totalUnhealthy, color: "#e74c3c" }]);
          setInsectChartData(Object.keys(insectCounts).map((key) => ({ label: key, value: insectCounts[key], color: getColorForLabel(key) })));
          setReportData(rawTableData);
          setLoading(false);
        });
        return () => unsubscribeDetections();
      } else { setLoading(false); }
    });
    return () => unsubscribeUser();
  }, [startDate, endDate, user]);

  const getColorForLabel = (label) => {
    const map = { 'Beneficial Bee': "#f1c40f", 'Wilting': "#e67e22", 'Leaf Spot': "#e74c3c", 'Infected Aphid': "#9b59b6" };
    return map[label] || "#94A3B8";
  };

  const polarToCartesian = (cx, cy, r, angle) => ({ x: cx + r * Math.cos(((angle - 90) * Math.PI) / 180), y: cy + r * Math.sin(((angle - 90) * Math.PI) / 180) });
  const describeArc = (cx, cy, r, start, end) => {
    if (end - start === 360) end = 359.99;
    const s = polarToCartesian(cx, cy, r, start), e = polarToCartesian(cx, cy, r, end);
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start <= 180 ? "0" : "1"} 1 ${e.x} ${e.y} L ${cx} ${cy} Z`;
  };

  const Pie = ({ size = 150, data }) => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return <Svg width={size} height={size}><Path d={describeArc(size/2, size/2, size/2, 0, 359.99)} fill="#ececec" /></Svg>;
    let angle = 0;
    return (
      <Svg width={size} height={size}>
        {data.map((d, i) => { const slice = (d.value / total) * 360; const path = describeArc(size/2, size/2, size/2, angle, angle + slice); angle += slice; return <Path key={i} d={path} fill={d.color} />; })}
      </Svg>
    );
  };

  const Legend = ({ items }) => (
    <View style={styles.legendContainer}>
      {items.map((it, idx) => (
        <View key={idx} style={styles.legendItem}><View style={[styles.legendColor, { backgroundColor: it.color }]} /><Text style={{ color: colors.text, fontSize: 11 }}>{`${it.label} (${it.value})`}</Text></View>
      ))}
    </View>
  );

  const PechayTrendLineChart = () => {
    const chartHeight = 100; const chartWidth = SCREEN_WIDTH - 80;
    if (healthTrendData.length === 0) return null;

    const firstScore = healthTrendData[0].score; const lastScore = healthTrendData[healthTrendData.length - 1].score;
    const isImproving = lastScore > firstScore; const isStable = lastScore === firstScore;
    const trendColor = isImproving ? "#2ecc71" : isStable ? "#f39c12" : "#e74c3c";
    
    const points = healthTrendData.map((d, i) => `${healthTrendData.length === 1 ? chartWidth / 2 : (i / (healthTrendData.length - 1)) * chartWidth},${chartHeight - (d.score / 100) * chartHeight}`).join(' ');

    return (
      <View style={{ alignItems: 'center', width: '100%', marginBottom: 10 }}>
        <Svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
          <Line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e0e0e0" strokeWidth="1" />
          {healthTrendData.length > 1 && <Polyline points={points} fill="none" stroke={trendColor} strokeWidth="3" />}
          {healthTrendData.map((d, i) => <Circle key={i} cx={healthTrendData.length === 1 ? chartWidth / 2 : (i / (healthTrendData.length - 1)) * chartWidth} cy={chartHeight - (d.score / 100) * chartHeight} r="4" fill={colors.card} stroke={trendColor} strokeWidth="2" />)}
        </Svg>
      </View>
    );
  };

  const ComparativeIssueAnalyzer = () => {
    if (availableIssues.length === 0) return (
      <View style={[styles.reportBox, { backgroundColor: '#d5f5e3', borderColor: '#2ecc71', borderWidth: 1 }]}>
        <Text style={{ color: '#1e8449', fontWeight: 'bold', textAlign: 'center' }}><Ionicons name="checkmark-circle" size={16} /> No Crop Diseases Detected!</Text>
        <Text style={{ fontSize: 11, color: '#1e8449', textAlign: 'center', marginTop: 5, fontStyle: 'italic' }}>Overall average health score is currently {overviewData.healthScore}%.</Text>
      </View>
    );
    if (!selectedIssue) return null;

    const chartData = dailyIssueData.map(d => ({ date: d.date, count: d.issues[selectedIssue] || 0 }));
    const firstCount = chartData.find(d => d.count > 0)?.count || 0; 
    const lastCount = chartData[chartData.length - 1].count; 
    
    let isSolved = lastCount === 0 && firstCount > 0;
    let isImproving = lastCount < firstCount && !isSolved;
    let isStable = lastCount === firstCount && lastCount > 0;

    let trendColor = (isSolved || isImproving) ? "#2ecc71" : isStable ? "#f39c12" : "#e74c3c";
    let trendIcon = isSolved ? "checkmark-done-outline" : isImproving ? "trending-down" : isStable ? "remove-outline" : "trending-up";
    let trendWord = isSolved ? "Completely Solved" : isImproving ? "Improving (Declining)" : isStable ? "Persistent / Unchanged" : "Worsening (Spreading)";

    const chartHeight = 100; const chartWidth = SCREEN_WIDTH - 80;
    const maxCount = Math.max(...chartData.map(d => d.count), 5); 
    const points = chartData.map((d, i) => `${chartData.length === 1 ? chartWidth / 2 : (i / (chartData.length - 1)) * chartWidth},${chartHeight - (d.count / maxCount) * chartHeight}`).join(' ');

    return (
       <View style={{ marginTop: 10 }}>
          <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 8, fontWeight: 'bold' }}>Select Issue to Analyze:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
             {availableIssues.map(issue => (
                <TouchableOpacity key={issue} onPress={() => setSelectedIssue(issue)} style={[ styles.issuePill, { backgroundColor: selectedIssue === issue ? colors.primary : colors.bg } ]}>
                   <Text style={{ color: selectedIssue === issue ? '#fff' : colors.text, fontSize: 12 }}>{issue}</Text>
                </TouchableOpacity>
             ))}
          </ScrollView>

          {/* --- RESTORED IMAGE RENDERING --- */}
          <View style={[styles.reportBox, { backgroundColor: colors.bg, borderLeftWidth: 4, borderLeftColor: trendColor, flexDirection: 'row', alignItems: 'center' }]}>
             
             <Image 
                source={{ uri: getReferenceImage(selectedIssue) }} 
                style={{ width: 70, height: 70, borderRadius: 10, marginRight: 15, backgroundColor: '#f0f0f0' }} 
                resizeMode="cover"
             />
             
             <View style={{ flex: 1 }}>
               <Text style={[styles.reportTitle, { color: colors.text, marginBottom: 4 }]}><Ionicons name="analytics-outline" size={16} color={trendColor} /> Analysis for {selectedIssue}</Text>
               <Text style={{ fontSize: 12, color: colors.text, lineHeight: 18 }}>Detections shifted from <Text style={{fontWeight: 'bold'}}>{firstCount}</Text> down to <Text style={{fontWeight: 'bold'}}>{lastCount}</Text> cases.</Text>
               <Text style={{ fontSize: 12, color: trendColor, marginTop: 4, fontWeight: 'bold' }}>Status: {trendWord}</Text>
             </View>
          </View>

          <View style={{ alignItems: 'center', width: '100%', marginTop: 20 }}>
             <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
               <Text style={{ color: colors.text, fontSize: 14, marginRight: 8, fontWeight: 'bold' }}>Graph Trend: <Text style={{ color: trendColor }}>{trendWord}</Text></Text>
               <Ionicons name={trendIcon} size={20} color={trendColor} />
             </View>
             <Svg width={chartWidth} height={chartHeight} style={{ overflow: 'visible' }}>
               <Line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#e0e0e0" strokeWidth="1" />
               {chartData.length > 1 && <Polyline points={points} fill="none" stroke={trendColor} strokeWidth="3" />}
               {chartData.map((d, i) => <Circle key={i} cx={chartData.length === 1 ? chartWidth / 2 : (i / (chartData.length - 1)) * chartWidth} cy={chartHeight - (d.count / maxCount) * chartHeight} r="4" fill={colors.card} stroke={trendColor} strokeWidth="2" />)}
             </Svg>
          </View>
       </View>
    );
  };

  // ==========================================
  // EXPORT ENGINE (Fully Functional & Upgraded)
  // ==========================================

  const getComparativeSummary = () => {
    if (!selectedIssue || dailyIssueData.length === 0) return null;
    const chartData = dailyIssueData.map(d => ({ count: d.issues[selectedIssue] || 0 }));
    const firstCount = chartData.find(d => d.count > 0)?.count || 0; 
    const lastCount = chartData[chartData.length - 1].count; 
    let isSolved = lastCount === 0 && firstCount > 0;
    let isImproving = lastCount < firstCount && !isSolved;
    let isStable = lastCount === firstCount && lastCount > 0;
    let trendWord = isSolved ? "Completely Solved" : isImproving ? "Improving (Declining)" : isStable ? "Persistent / Unchanged" : "Worsening (Spreading)";
    return { issue: selectedIssue, firstCount, lastCount, trendWord };
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    if (reportData.length === 0) { Alert.alert("No Data", "No data to export."); setIsExporting(false); return; }
    try {
      const comp = getComparativeSummary();
      let csvContent = `Report,Organic Eye Diagnostic Export\nStart Date:,${startDate.toLocaleDateString()}\nTarget Date:,${endDate.toLocaleDateString()}\nDevice ID:,${pairedPiId}\n\n`;
      if (comp) csvContent += `Specific Disease Tracking:,${comp.issue}\nTrend Status:,${comp.trendWord} (${comp.firstCount} cases to ${comp.lastCount})\n\n`;
      csvContent += "Date,Time,Detection,Confidence,Status\n";
      const rows = reportData.map(r => `${r.date},${r.time},${r.detection},${r.confidence},${r.status}`).join('\n');
      const fileUri = `${FileSystem.documentDirectory}OrganicEye_Report.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csvContent + rows, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { dialogTitle: 'Export CSV Data' });
    } catch (error) { Alert.alert("Export Error", error.message); }
    setIsExporting(false);
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    if (reportData.length === 0) { Alert.alert("No Data", "No data to export."); setIsExporting(false); return; }
    try {
      const comp = getComparativeSummary();
      const wsData = [
        ["Organic Eye Diagnostic Report"], ["Start Date:", startDate.toLocaleDateString()], ["Target Date:", endDate.toLocaleDateString()], ["Device ID:", pairedPiId], []
      ];
      if (comp) {
         wsData.push(["Specific Disease Tracking:", comp.issue]);
         wsData.push(["Trend Status:", `${comp.trendWord} (${comp.firstCount} cases to ${comp.lastCount})`]);
         wsData.push([]);
      }
      wsData.push(["Date", "Time", "Detection", "Confidence", "Status"]);
      reportData.forEach(r => wsData.push([r.date, r.time, r.detection, r.confidence, r.status]));
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Diagnostics");
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const fileUri = `${FileSystem.documentDirectory}OrganicEye_Report.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, wbout, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(fileUri, { dialogTitle: 'Export Excel Data' });
    } catch (error) { Alert.alert("Export Error", error.message); }
    setIsExporting(false);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    if (reportData.length === 0) { Alert.alert("No Data", "No data to export."); setIsExporting(false); return; }
    try {
      const chartBase64 = await reportRef.current.capture({ result: "base64" });
      const firstScore = healthTrendData.length > 0 ? healthTrendData[0].score : 0;
      const lastScore = healthTrendData.length > 0 ? healthTrendData[healthTrendData.length - 1].score : 0;
      const trendWord = lastScore > firstScore ? "Improving" : lastScore === firstScore ? "Stable" : "Declining";
      const trendColor = lastScore > firstScore ? "#2ecc71" : lastScore === firstScore ? "#f39c12" : "#e74c3c";

      const comp = getComparativeSummary();
      let comparativeHtml = '';
      if (comp) {
         comparativeHtml = `
            <div style="background: #f8fbf9; border-left: 4px solid #1B4332; padding: 15px; margin-bottom: 30px; border-radius: 4px;">
               <strong style="font-size: 13px; color: #1B4332;">Disease Tracking: ${comp.issue}</strong><br>
               <span style="font-size: 12px; color: #555;">The AI tracked ${comp.firstCount} cases at the start of the period, shifting to ${comp.lastCount} cases currently. Current status is considered: <strong>${comp.trendWord}</strong>.</span>
            </div>
         `;
      }

      const tableRows = reportData.map(item => {
        let badgeClass = 'status-warning'; 
        if (item.status === 'Good') badgeClass = 'status-good';
        if (item.status === 'Anomaly') badgeClass = 'status-anomaly'; 
        return `<tr><td>${item.date} <span style="color:#888; font-size:10px;">${item.time}</span></td><td><strong>${item.detection}</strong></td><td>${item.confidence}</td><td><span class="badge ${badgeClass}">${item.status}</span></td></tr>`;
      }).join('');

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 30px; background-color: #f4f7f6; color: #333; margin: 0; }
              .page-container { background: #ffffff; padding: 40px; border-radius: 12px; max-width: 900px; margin: auto; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eaeaea; padding-bottom: 20px; margin-bottom: 30px; }
              .logo-text { font-size: 28px; font-weight: 700; color: #1B4332; margin: 0; }
              .kpi-row { display: flex; gap: 15px; margin-bottom: 30px; }
              .kpi-card { flex: 1; background: #f8fbf9; border: 1px solid #e8f4ec; padding: 20px; text-align: center; border-radius: 8px;}
              .kpi-value { font-size: 32px; font-weight: 700; color: #1B4332; margin-bottom: 5px; }
              .ai-insight { background: linear-gradient(135deg, #1B4332, #2D6A4F); color: white; padding: 20px; margin-bottom: 15px; border-radius: 8px;}
              .chart-wrapper { text-align: center; background: #fff; padding: 10px; border: 1px solid #eaeaea; margin-bottom: 40px; border-radius: 8px;}
              img { max-width: 100%; height: auto; }
              table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 30px; }
              th { background-color: #f8f9fa; padding: 14px 12px; text-align: left; border-bottom: 2px solid #eaeaea; }
              td { padding: 12px; border-bottom: 1px solid #f1f1f1; }
              .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
              .status-good { color: #1e8449; background: #d5f5e3; }
              .status-warning { color: #c0392b; background: #fadbd8; }
              .status-anomaly { color: #d68910; background: #fcf3cf; }
              .footer { text-align: center; font-size: 10px; color: #aaa; margin-top: 30px; border-top: 1px solid #eaeaea; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="page-container">
              <div class="header">
                <div><h1 class="logo-text">Organic Eye</h1><div style="color: #2D6A4F; font-weight: bold; margin-top: 5px;">Field Analytics Report</div></div>
                <div style="text-align: right; font-size: 12px; color: #7f8c8d; line-height: 1.5;"><strong>Device:</strong> ${pairedPiId}<br><strong>Period:</strong> ${startDate.toLocaleDateString()} &mdash; ${endDate.toLocaleDateString()}</div>
              </div>

              <div class="kpi-row">
                <div class="kpi-card"><div class="kpi-value">${overviewData.healthScore}%</div><div style="font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase;">Avg Crop Health</div></div>
                <div class="kpi-card"><div class="kpi-value">${overviewData.detections}</div><div style="font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase;">Total AI Scans</div></div>
                <div class="kpi-card"><div class="kpi-value" style="color: ${trendColor}">${trendWord}</div><div style="font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase;">Overall Trend</div></div>
              </div>

              <div class="ai-insight">
                <strong style="font-size: 14px;">Overall AI Analysis:</strong><br> Crop health shifted from ${firstScore}% to ${lastScore}%. The field condition is <span style="font-weight: bold; color: #a3e4d7;">${trendWord}</span>.
              </div>
              
              ${comparativeHtml}
              
              <div class="chart-wrapper"><img src="data:image/png;base64,${chartBase64}" /></div>

              <h3 style="color: #1B4332; margin-bottom: 10px;">Detailed Detection Logs</h3>
              <table><tr><th>Timestamp</th><th>Classification</th><th>Confidence</th><th>Status</th></tr>${tableRows}</table>

              <div class="footer">
                Organic Eye IoT System - Field Analytics Division 
              </div>
            </div>
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
      
      <ViewShot ref={reportRef} options={{ format: "png", quality: 0.9 }}>
        <View style={{ backgroundColor: colors.bg, paddingBottom: 10 }} collapsable={false}>
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Analytics Dashboard</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Data Trends & Reports</Text>
          </View>

          <View style={styles.periodSelector}>
            {periods.map((p) => (
              <TouchableOpacity key={p} style={[styles.periodButton, { backgroundColor: colors.card }, selectedPeriod === p && { backgroundColor: colors.primary }]} onPress={() => handlePeriodSelect(p)}>
                <Text style={[styles.periodText, { color: selectedPeriod === p ? "#fff" : colors.muted }]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerWrapper}>
              <Text style={[styles.dateLabel, { color: colors.muted }]}>Start Date</Text>
              <TouchableOpacity style={[styles.dateButton, { backgroundColor: colors.card }]} onPress={() => setShowStartPicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: 'bold' }}>{startDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerWrapper}>
              <Text style={[styles.dateLabel, { color: colors.muted }]}>Target Date</Text>
              <TouchableOpacity style={[styles.dateButton, { backgroundColor: colors.card }]} onPress={() => setShowEndPicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: 'bold' }}>{endDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showStartPicker && ( <DateTimePicker value={startDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={(e, d) => { setShowStartPicker(false); if(d){ setStartDate(d); setSelectedPeriod("custom");} }} /> )}
          {showEndPicker && ( <DateTimePicker value={endDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={startDate} onChange={(e, d) => { setShowEndPicker(false); if(d){ setEndDate(d); setSelectedPeriod("custom");} }} /> )}

          <View style={styles.overviewSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Overview</Text>
            {loading ? <ActivityIndicator color={colors.primary} /> : (
              <View style={styles.overviewGrid}>
                <StatCard num={overviewData.detections} label="Total Scans" color={colors.primary} cardBg={colors.card} />
                <StatCard num={`${overviewData.healthScore}%`} label="Avg Health" color={colors.primary} cardBg={colors.card} />
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.chartTitle, { color: colors.text, fontSize: 18 }]}>Comparative Disease Analysis</Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 15 }}>
               Select an identified anomaly below to track its progression.
            </Text>
            
            {loading ? <ActivityIndicator color={colors.primary} /> : (
               <>
                 <PechayTrendLineChart />
                 <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 15 }} />
                 <ComparativeIssueAnalyzer />
               </>
            )}
          </View>

          <ChartCard title="Overall Crop Health" loading={loading} data={cropHealthChartData} colors={colors} Pie={Pie} Legend={Legend} />
          <ChartCard title="Insects Profile" loading={loading} data={insectChartData} colors={colors} Pie={Pie} Legend={Legend} />
        </View>
      </ViewShot>

      {/* EXPORTS SECTION */}
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
  periodSelector: { flexDirection: "row", paddingHorizontal: 15, marginVertical: 10 },
  periodButton: { flex: 1, paddingVertical: 10, marginHorizontal: 4, borderRadius: 25, alignItems: "center", elevation: 1 },
  periodText: { fontSize: 12, fontWeight: "bold" },
  datePickerContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, justifyContent: 'space-between' },
  datePickerWrapper: { flex: 0.48 },
  dateLabel: { fontSize: 12, marginBottom: 5, fontWeight: '600' },
  dateButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, elevation: 1 },
  overviewSection: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 5 },
  overviewGrid: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  overviewCard: { flex: 1, padding: 15, borderRadius: 15, alignItems: "center", elevation: 2 },
  overviewNumber: { fontSize: 24, fontWeight: "bold" },
  overviewLabel: { fontSize: 11, marginTop: 4, color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase' },
  card: { padding: 20, borderRadius: 20, marginHorizontal: 20, marginBottom: 20, elevation: 3 },
  chartTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 15 },
  chartRow: { flexDirection: "row", justifyContent: "space-between", alignItems: 'center' },
  legendContainer: { flex: 1, paddingLeft: 15 },
  legendItem: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  legendColor: { width: 10, height: 10, borderRadius: 2, marginRight: 8 },
  issuePill: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#eee', marginRight: 10 },
  reportBox: { width: '100%', padding: 15, borderRadius: 12, marginTop: 15 },
  reportTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  exportSection: { paddingHorizontal: 20, marginTop: 10 },
  buttonGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  exportBtn: { width: '48%', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 2, marginBottom: 10 },
  btnText: { color: "#fff", fontSize: 13, fontWeight: "bold", marginLeft: 8 }
});

export default AnalyticsScreen;