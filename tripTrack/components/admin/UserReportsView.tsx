import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { fetchAllReportsApi, updateReportStatusApi } from '../../service/server'; 
import { useSelector } from 'react-redux';

export const UserReportsView = () => {
  const [activeSegment, setActiveSegment] = useState('active');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null); 
  const { token } = useSelector((state: any) => state.auth);

  const loadReportData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      if (!token) {
        setReports([]);
        return;
      }

      const response = await fetchAllReportsApi(token);
      console.log("API Response (All Reports):", response); 

      let extractedReports = [];
      if (response?.success && Array.isArray(response.reports)) {
        extractedReports = response.reports;
      } else if (Array.isArray(response?.data)) {
        extractedReports = response.data;
      } else if (Array.isArray(response)) {
        extractedReports = response;
      }

      if (activeSegment === 'active') {
        setReports(extractedReports.filter(report => report.status !== 'resolved'));
      } else {
        setReports(extractedReports);
      }
    } catch (error) {
      console.error("Error loading report data:", error);
      Alert.alert("Error", "Something went wrong fetching reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadReportData();
    }
  }, [token, activeSegment]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    setProcessingId(reportId);
    try {
      const response = await updateReportStatusApi(reportId, newStatus, token);

      if (response && response.success !== false) {
        Alert.alert("Success", `Report status updated to ${newStatus}!`);
        
        if (activeSegment === 'active' && newStatus === 'resolved') {

          setReports(prevReports => prevReports.filter(report => report._id !== reportId));
        } else {
          setReports(prevReports => 
            prevReports.map(r => r._id === reportId ? { ...r, status: newStatus } : r)
          );
        }
      } else {
        Alert.alert("Error", response.message || "Failed to update report status.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not complete the status update.");
    } finally {
      setProcessingId(null);
    }
  };

  const triggerStatusAlert = (reportId) => {
    Alert.alert(
      "Update Report Status",
      "Choose a new progress state for this user ticket:",
      [
        { text: "Investigating", onPress: () => handleUpdateStatus(reportId, 'investigating') },
        { text: "Mark Resolved", onPress: () => handleUpdateStatus(reportId, 'resolved'), style: 'destructive' },
        { text: "Cancel", style: 'cancel' }
      ]
    );
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return { badge: styles.badgeResolved, text: styles.textResolved };
      case 'investigating':
        return { badge: styles.badgeInvestigating, text: styles.textInvestigating };
      default:
        return { badge: styles.badgePending, text: styles.textPending };
    }
  };

  const renderReportItem = ({ item }) => {
    const statusTheme = getStatusStyle(item.status);
    const isResolved = item.status === 'resolved';

    return (
      <View style={styles.reportCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrapper}>
            <Ionicons name="warning-outline" size={24} color="#D35400" />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.reportTitle}>{item.title || "User Report"}</Text>
            <Text style={styles.reportedBy}>Reported by: {item.reporter?.name || item.userId || 'Anonymous'}</Text>
            <Text style={styles.reportDetails}>{item.description || 'No description provided.'}</Text>
            {item.createdAt && (
              <Text style={styles.timestamp}>
                🕒 {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, statusTheme.badge]}>
            <Text style={[styles.statusText, statusTheme.text]}>
              {item.status || "Pending"}
            </Text>
          </View>
        </View>

        {/* Dynamic Action Buttons */}
        {!isResolved && (
          <TouchableOpacity 
            style={[styles.actionButton, processingId === item._id && styles.disabledButton]} 
            onPress={() => triggerStatusAlert(item._id)}
            disabled={processingId === item._id}
          >
            {processingId === item._id ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="create-outline" size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>Update Status</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.placeholderWrapper}>
      <View style={styles.placeholderIconBg}>
        <Ionicons name={activeSegment === 'active' ? "checkmark-done-circle-outline" : "folder-open-outline"} size={28} color="#196F31" />
      </View>
      <Text style={styles.placeholderTitle}>
        {activeSegment === 'active' ? "Clean Slate!" : "No Reports Found"}
      </Text>
      <Text style={styles.placeholderSub}>
        {activeSegment === 'active' 
          ? "There are no pending or open user reports to review."
          : "There are currently no user complaints or system tickets logged."}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── SEGMENTED CONTROL ── */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={[styles.segmentButton, activeSegment === 'active' && styles.activeSegmentButton]}
          onPress={() => setActiveSegment('active')}
          activeOpacity={0.9}
        >
          <Text style={[styles.segmentText, activeSegment === 'active' && styles.activeSegmentText]}>
            Active Reports
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.segmentButton, activeSegment === 'all' && styles.activeSegmentButton]}
          onPress={() => setActiveSegment('all')}
          activeOpacity={0.9}
        >
          <Text style={[styles.segmentText, activeSegment === 'all' && styles.activeSegmentText]}>
            All History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#196F31" />
          <Text style={styles.loadingText}>Fetching system reports...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderReportItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => loadReportData(true)}
        />
      )}
    </View>
  );
};

export default UserReportsView;

// ==========================================
// STYLES (Matched exactly with VerifyDriversView)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 13 },
  listContent: { paddingVertical: 12, paddingHorizontal: 14 },
  
  // Segment Switch Controls
  segmentContainer: { flexDirection: 'row', backgroundColor: '#EFEFEF', marginHorizontal: 14, marginTop: 14, marginBottom: 4, borderRadius: 10, padding: 4 },
  segmentButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  activeSegmentButton: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#666' },
  activeSegmentText: { color: '#123D1F', fontWeight: '700' },

  // Report Card Layout
  reportCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  iconWrapper: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FBEEE6', alignItems: 'center', justifyContent: 'center' },
  textContainer: { marginLeft: 12, flex: 1 },
  reportTitle: { fontSize: 15, fontWeight: '700', color: '#123D1F', marginBottom: 2 },
  reportedBy: { fontSize: 11, fontWeight: '600', color: '#777', marginBottom: 6 },
  reportDetails: { fontSize: 13, color: '#444', lineHeight: 18 },
  timestamp: { fontSize: 11, color: '#888', marginTop: 6 },
  
  // Custom Status Badges
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeResolved: { backgroundColor: '#E8F5E9' },
  badgeInvestigating: { backgroundColor: '#EBF5FB' },
  badgePending: { backgroundColor: '#FEF9E7' },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  textResolved: { color: '#196F31' },
  textInvestigating: { color: '#2980B9' },
  textPending: { color: '#D35400' },

  // Action Buttons
  actionButton: { backgroundColor: '#196F31', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6, marginTop: 4 },
  disabledButton: { opacity: 0.7 },
  actionButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  
  // Placeholders
  placeholderWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  placeholderIconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  placeholderTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  placeholderSub: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 32 },
});