import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { fetchAllReportsApi, updateReportStatusApi } from '../../service/server'; 
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

// Reusable StatCard Component
const StatCard = ({ label, value, icon }) => (
  <View style={styles.statCard}>
    <View style={styles.statIconBg}>
      <Ionicons name={icon} size={18} color="#196F31" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const UserReportsView = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null); 
  const { token } = useSelector((state) => state.auth);
const {t} = useTranslation();
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

      setReports(extractedReports);
    } catch (error) {
      console.error("Error loading report data:", error);
      Alert.alert("Error", t("userReports.fetchError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadReportData();
    }
  }, [token]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    setProcessingId(reportId);
    try {
      const response = await updateReportStatusApi(reportId, newStatus, token);

      if (response && response.success !== false) {
        Alert.alert("Success", t("userReports.updateSuccess", { status: newStatus }));
        
        setReports(prevReports => 
          prevReports.map(r => r._id === reportId ? { ...r, status: newStatus } : r)
        );
      } else {
        Alert.alert(t("userReports.error"), t("userReports.updateFailed"));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t("userReports.error"), t("userReports.statusUpdateError"));
    } finally {
      setProcessingId(null);
    }
  };

  const triggerStatusAlert = (reportId) => {
    Alert.alert(
      t("userReports.updateStatus"),
      t("userReports.chooseStatus"),
      [
        { text: t("userReports.markReviewed"), onPress: () => handleUpdateStatus(reportId, 'reviewed') },
        { text: t("userReports.markResolved"), onPress: () => handleUpdateStatus(reportId, 'resolved') },
        { text: t("userReports.dismiss"), onPress: () => handleUpdateStatus(reportId, 'dismissed'), style: 'destructive' },
        { text: t("userReports.cancel"), style: 'cancel' }
      ]
    );
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return { badge: styles.badgeResolved, text: styles.textResolved };
      case 'reviewed':
        return { badge: styles.badgeReviewed, text: styles.textReviewed };
      case 'dismissed':
        return { badge: styles.badgeDismissed, text: styles.textDismissed };
      case 'pending':
      default:
        return { badge: styles.badgePending, text: styles.textPending };
    }
  };

  const renderReportItem = ({ item }) => {
    const statusTheme = getStatusStyle(item.status);
    const isClosed = item.status === 'resolved' || item.status === 'dismissed';

    // Safely map your API's actual keys to the UI text
    const displayTitle = item.issueType || item.reportType || "User Report";
    const displayName = item.reportedBy?.name || (item.isAnonymous ? 'Anonymous' : 'Unknown User');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Ionicons 
              // Change icon color dynamically if priority is critical
              name={item.priority === 'critical' ? "alert-circle" : "warning-outline"} 
              size={26} 
              color={item.priority === 'critical' ? "#D35400" : "#196F31"} 
            />
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{displayTitle}</Text>
            <Text style={styles.cardSub}>By: {displayName}</Text>
          </View>

          <View style={[styles.priorityChip, statusTheme.badge]}>
            <Text style={[styles.priorityChipText, statusTheme.text]}>
              {item.status || "Pending"}
            </Text>
          </View>
        </View>

        <Text style={styles.reportDetails}>{item.description || 'No description provided.'}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.timestamp}>
            🕒 {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date Unknown'}
          </Text>

          {!isClosed && (
            <TouchableOpacity 
              style={[styles.actionButton, processingId === item._id && styles.submitBtnDisabled]} 
              onPress={() => triggerStatusAlert(item._id)}
              disabled={processingId === item._id}
            >
              {processingId === item._id ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
             <Ionicons name="sync-outline" size={16} color="#FFF" />
                  <Text style={styles.actionButtonText}>Update</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
  const renderEmptyState = () => (
    <View style={styles.placeholderWrapper}>
      <View style={styles.placeholderIconBg}>
        <Ionicons name="folder-open-outline" size={32} color="#196F31" />
      </View>
      <Text style={styles.mainPrompt}>{t("userReports.noReports")}</Text>
      <Text style={styles.placeholderSub}>
        {t("userReports.noReportsDescription")}
      </Text>
    </View>
  );

  // Dynamic Statistics Calculations
  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === 'pending' || !r.status).length;
  const reviewedReports = reports.filter(r => r.status === 'reviewed').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Dynamic Stats Row Replacing Header */}
      <View style={styles.statsRow}>
        <StatCard label={t("userReports.total")}    value={totalReports}    icon="folder-open-outline" />
        <StatCard label={t("userReports.pending")}  value={pendingReports}  icon="time-outline" />
        <StatCard label={t("userReports.reviewed")} value={reviewedReports} icon="eye-outline" />
        <StatCard label={t("userReports.resolved")} value={resolvedReports} icon="checkmark-circle-outline" />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#196F31" />
          <Text style={styles.loadingText}>{t("userReports.fetchingReports")}</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderReportItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.scroll}
          refreshing={refreshing}
          onRefresh={() => loadReportData(true)}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default UserReportsView;

// ==========================================
// INTEGRATED STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9F4' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, color: '#4A6B54', fontSize: 14, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 40 },

  // Stats Card Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D1E8D9',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F0F9F4',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#196F31',
    alignItems: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1E8D9',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#123D1F',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    color: '#6A8E75',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Card Layout
  card: {
    backgroundColor: '#fff', 
    padding: 18, 
    borderRadius: 24,
    borderWidth: 2, 
    borderColor: '#E8F3EB',
    elevation: 4, 
    shadowColor: '#196F31', 
    shadowOpacity: 0.08, 
    shadowRadius: 10,
    marginBottom: 16
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: {
    width: 52, 
    height: 52, 
    borderRadius: 18,
    backgroundColor: '#F0F9F4', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14,
  },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#123D1F' },
  cardSub: { fontSize: 13, color: '#8E8E93', marginTop: 2, fontWeight: '600' },
  reportDetails: { fontSize: 14, color: '#4A6B54', lineHeight: 20, marginBottom: 16 },
  
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#F0F9F4',
    paddingTop: 12,
  },
  timestamp: { fontSize: 12, color: '#A0B4A5', fontWeight: '700' },

  // Priority Chips
  priorityChip: {
    paddingHorizontal: 12, 
    paddingVertical: 6,
    borderRadius: 14, 
    borderWidth: 1.5,
  },
  priorityChipText: { fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  badgePending: { backgroundColor: '#FFF9E6', borderColor: '#FDEBD0' },
  textPending: { color: '#D35400' },
  badgeReviewed: { backgroundColor: '#EBF5FB', borderColor: '#D6EAF8' },
  textReviewed: { color: '#2980B9' },
  badgeResolved: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },
  textResolved: { color: '#196F31' },
  badgeDismissed: { backgroundColor: '#F2F4F4', borderColor: '#E5E8E8' },
  textDismissed: { color: '#7B7D7D' },

  // Buttons
  actionButton: { 
    backgroundColor: '#196F31', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 16,
    borderRadius: 14, 
    gap: 6 
  },
  submitBtnDisabled: { backgroundColor: '#A0B4A5', elevation: 0 },
  actionButtonText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  
  // Empty States
  placeholderWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  placeholderIconBg: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: '#fff', 
    borderWidth: 2, borderColor: '#E8F3EB',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16 
  },
  mainPrompt: { fontSize: 24, fontWeight: '900', color: '#123D1F', marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32, fontWeight: '500' },
});