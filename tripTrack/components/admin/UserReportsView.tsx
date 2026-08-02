import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteReportApi, fetchAllReportsApi, updateReportStatusApi } from '../../service/server';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const { t } = useTranslation();

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
  const deleteReportHandler = (reportId) => async () => {
    Alert.alert(
      t("userReports.deleteReport"),
      t("userReports.confirmDelete"),
      [
        {
          text: t("userReports.cancel"),
          style: "cancel",
        },
        {
          text: t("userReports.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              const response = await deleteReportApi(reportId, token);

              if (response?.success) {
                setReports((prev) =>
                  prev.filter((report) => report._id !== reportId)
                );
              } else {
                Alert.alert(
                  t("common.error"),
                  response?.message || t("userReports.deleteError")
                );
              }
            } catch (error) {
              console.error(error);
              Alert.alert(
                t("common.error"),
                t("userReports.deleteError")
              );
            }
          },
        },]);
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

    const displayTitle = item.issueType || item.reportType || "User Report";
    const displayName = item.reportedBy?.name || (item.isAnonymous ? 'Anonymous' : 'Unknown User');
    const visualAttachment = item.screenshotUrl || item.attachment;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Ionicons
              name={item.priority === 'critical' ? "alert-circle" : "warning"}
              size={24}
              color={item.priority === 'critical' ? "#E24B4A" : "#196F31"}
            />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{displayTitle}</Text>
            <Text style={styles.cardSub}>By: {displayName}</Text>
          </View>

          {/* Correct Placement: Status Badge grouped cleanly in header */}
          <View style={[styles.priorityChip, statusTheme.badge, { marginRight: 8 }]}>
            <Text style={[styles.priorityChipText, statusTheme.text]}>
              {item.status || "Pending"}
            </Text>
          </View>

          {/* Muted delete button layout configuration inside arrow block */}
          <TouchableOpacity
            style={styles.trashBtn}
            activeOpacity={0.6}
            onPress={deleteReportHandler(item._id)}
          >
            <Ionicons name="trash-outline" size={18} color="#E24B4A" />
          </TouchableOpacity>
        </View>

        <Text style={styles.reportDetails}>{item.description || 'No description provided.'}</Text>

        {!!visualAttachment && (
          <TouchableOpacity
            style={styles.screenshotLinkButton}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(visualAttachment)}
          >
            <View style={styles.screenshotIconBg}>
              <Ionicons name="image" size={16} color="#196F31" />
            </View>
            <Text style={styles.screenshotLinkText}>{t("reportIssue.screenshot") || "View Attached Screenshot"}</Text>
            <Ionicons name="chevron-forward" size={16} color="#196F31" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={16} color="#A0B4A5" />
            <Text style={styles.timestamp}>
              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Date Unknown'}
            </Text>
          </View>

          {/* Cleaner Card Footer: Reserved completely for the active actionable update container */}
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
                  <Ionicons name="sync-outline" size={14} color="#FFF" />
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

  const totalReports = reports.length;
  const pendingReports = reports.filter(r => r.status === 'pending' || !r.status).length;
  const reviewedReports = reports.filter(r => r.status === 'reviewed').length;
  const resolvedReports = reports.filter(r => r.status === 'resolved').length;

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard label={t("userReports.total")} value={totalReports} icon="folder-open-outline" />
        <StatCard label={t("userReports.pending")} value={pendingReports} icon="time-outline" />
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
    </View>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#E8F3EB',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F0F9F4',
    borderRadius: 14,
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
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E8F3EB',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#123D1F', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: '#A0B4A5', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },

  // Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#196F31',
    elevation: 4,
    shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
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
  reportDetails: { fontSize: 14, color: '#4A6B54', lineHeight: 20, marginBottom: 14 },

  screenshotLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9F4',
    padding: 10,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E8F3EB',
    gap: 10
  },
  screenshotIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  screenshotLinkText: { color: '#123D1F', fontSize: 13, fontWeight: '700' },

  // Footer Setup
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#F0F9F4',
    paddingTop: 16,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timestamp: { fontSize: 13, color: '#A0B4A5', fontWeight: '700' },
  trashBtn: { padding: 4, marginLeft: 8 },

  // Right Side Segment alignment parameters
  actionsRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Status Badges
  priorityChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1.5 },
  priorityChipText: { fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  badgePending: { backgroundColor: '#FFF3E0', borderColor: '#FFAB40' },
  textPending: { color: '#E65100' },
  badgeReviewed: { backgroundColor: '#EBF5FB', borderColor: '#D6EAF8' },
  textReviewed: { color: '#2980B9' },
  badgeResolved: { backgroundColor: '#E1F5EE', borderColor: '#9FE1CB' },
  textResolved: { color: '#0F6E56' },
  badgeDismissed: { backgroundColor: '#F2F4F4', borderColor: '#E5E8E8' },
  textDismissed: { color: '#7B7D7D' },

  // Update Button Style
  actionButton: {
    backgroundColor: '#196F31',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4
  },
  submitBtnDisabled: { backgroundColor: '#A0B4A5', elevation: 0 },
  actionButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },

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