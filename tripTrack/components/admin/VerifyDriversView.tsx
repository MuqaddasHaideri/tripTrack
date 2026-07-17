import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { fetchAllDriversApi, approveDriverApi } from '../../service/server'; 
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

export const VerifyDriversView = () => {
  const { t } = useTranslation();
  const [activeSegment, setActiveSegment] = useState('pending');
  
  const [allDrivers, setAllDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null); 
  const { token } = useSelector((state) => state.auth);

  const loadDriverData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      if (!token) {
        setAllDrivers([]);
        return;
      }

      const response = await fetchAllDriversApi(token);
      let extractedData = [];
      if (response?.success && Array.isArray(response.data)) {
        extractedData = response.data;
      } else if (Array.isArray(response)) {
        extractedData = response;
      }

      setAllDrivers(extractedData);
    } catch (error) {
      console.error("Error loading driver data:", error);
      Alert.alert("Error", t("verifyDrivers.fetchError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDriverData();
    }
  }, [token]);

  const handleApprove = async (driverId) => {
    setProcessingId(driverId);
    try {
      const response = await approveDriverApi(driverId, token);

      if (response && response.success !== false) {
        Alert.alert("Success", t("verifyDrivers.approveSuccessMessage"));
        setAllDrivers(prevDrivers => 
          prevDrivers.map(d => d._id === driverId ? { ...d, isVerified: true } : d)
        );
      } else {
        Alert.alert("Error", response.message || t("verifyDrivers.approveFailed"));
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", t("verifyDrivers.requestError"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewLicense = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert("Error", t("verifyDrivers.cannotOpenLicense")));
    } else {
      Alert.alert("Not Available", t("verifyDrivers.noDocument"));
    }
  };

  const renderDriverItem = ({ item }) => {
    const isApproved = item.isVerified === true;
    const formattedDateTime = item.createdAt 
      ? new Date(item.createdAt).toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }) 
      : 'Date Unknown';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { padding: 0, overflow: 'hidden' }]}>
            {item.profilePic ? (
              <Image source={{ uri: item.profilePic }} style={styles.profileAvatar} />
            ) : (
              <Ionicons name="person" size={24} color="#A0B4A5" />
            )}
          </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name || "Unknown Driver"}</Text>
            <Text style={styles.cardSub}>{item.email}</Text>
          </View>

          <View style={[styles.priorityChip, isApproved ? styles.badgeApproved : styles.badgePending]}>
            <Text style={[styles.priorityChipText, isApproved ? styles.textApproved : styles.textPending]}>
              {isApproved ? t("verifyDrivers.approved") : t("verifyDrivers.pending")}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailText}><Ionicons name="call-outline" size={14}/> {item.phone || t("verifyDrivers.na")}</Text>
          <Text style={styles.detailText}><Ionicons name="card-outline" size={14}/> {item.cnic || t("verifyDrivers.na")}</Text>
        </View>

        {item.driverLicense && (
          <TouchableOpacity 
            style={styles.licenseLinkButton} 
            onPress={() => handleViewLicense(item.driverLicense)}
          >
            <View style={styles.licenseIconBg}>
              <Ionicons name="document-text" size={16} color="#196F31" />
            </View>
            <Text style={styles.licenseLinkText}>{t("verifyDrivers.viewLicense")}</Text>
            <Ionicons name="chevron-forward" size={16} color="#196F31" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={16} color="#A0B4A5" />
            <Text style={styles.timestamp}>{formattedDateTime}</Text>
          </View>

          {!isApproved && (
            <TouchableOpacity 
              style={[styles.actionButton, processingId === item._id && styles.disabledButton]} 
              onPress={() => handleApprove(item._id)}
              disabled={processingId === item._id}
            >
              {processingId === item._id ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>{t("verifyDrivers.approveDriver")}</Text>
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
        <Ionicons name={activeSegment === 'pending' ? "checkmark-done-circle-outline" : "people-outline"} size={32} color="#196F31" />
      </View>
      <Text style={styles.mainPrompt}>
        {activeSegment === 'pending' ? t("verifyDrivers.allCaughtUp") : t("verifyDrivers.noDrivers")}
      </Text>
      <Text style={styles.placeholderSub}>
        {activeSegment === 'pending' 
          ? t("verifyDrivers.noPendingApplications")
          : t("verifyDrivers.noDriversDatabase")}
      </Text>
    </View>
  );

  const totalDrivers = allDrivers.length;
  const verifiedDrivers = allDrivers.filter(d => d.isVerified).length;
  const pendingDrivers = totalDrivers - verifiedDrivers;

  const displayedDrivers = (activeSegment === 'pending' 
    ? allDrivers.filter(d => !d.isVerified) 
    : allDrivers
  ).sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return (
    <View style={styles.container}>
      {/* ── STATS ROW ── */}
      <View style={styles.statsRow}>
        <StatCard label={t("verifyDrivers.total")} value={totalDrivers} icon="people-outline" />
        <StatCard label={t("verifyDrivers.verified")} value={verifiedDrivers} icon="checkmark-circle-outline" />
        <StatCard label={t("verifyDrivers.pending")} value={pendingDrivers} icon="time-outline" />
      </View>

      {/* ── UPDATED COMPACT SEGMENT CONTROLS ── */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={[styles.segmentButton, activeSegment === 'pending' && styles.activeSegmentButton]}
          onPress={() => setActiveSegment('pending')}
          activeOpacity={1}
        >
          <Text style={[styles.segmentText, activeSegment === 'pending' && styles.activeSegmentText]}>
            {t("verifyDrivers.pendingApplications")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.segmentButton, activeSegment === 'all' && styles.activeSegmentButton]}
          onPress={() => setActiveSegment('all')}
          activeOpacity={1}
        >
          <Text style={[styles.segmentText, activeSegment === 'all' && styles.activeSegmentText]}>
            {t("verifyDrivers.allDriversDirectory")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Container Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#196F31" />
          <Text style={styles.loadingText}>{t("verifyDrivers.updatingWorkspace")}</Text>
        </View>
      ) : (
        <FlatList
          data={displayedDrivers}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderDriverItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.scroll}
          refreshing={refreshing}
          onRefresh={() => loadDriverData(true)}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default VerifyDriversView;

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

  // Updated Compact Segment Switch Controls
  segmentContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#E8F3EB', 
    marginHorizontal: 20, 
    marginTop: 16, 
    marginBottom: 6, 
    borderRadius: 16, 
    padding: 3,
    height: 44,
    alignItems: 'center'
    
  },
  segmentButton: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', borderRadius: 14 },
  activeSegmentButton: { 
    backgroundColor: '#FFF', 
    height: 38,
    elevation: 3, 
    shadowColor: '#196F31', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4,
    
  },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#6A8E75' },
  activeSegmentText: { color: '#196F31', fontWeight: '800' },

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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconCircle: {
    width: 52, 
    height: 52, 
    borderRadius: 18,
    backgroundColor: '#F0F9F4', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 14,
  },
  profileAvatar: { width: '100%', height: '100%', borderRadius: 18 },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#123D1F' },
  cardSub: { fontSize: 13, color: '#8E8E93', marginTop: 2, fontWeight: '600' },
  
  detailsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  detailText: { fontSize: 13, color: '#4A6B54', fontWeight: '600' },

  // Status Chips
  priorityChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, borderWidth: 1.5 },
  priorityChipText: { fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  badgePending: { backgroundColor: '#FFF3E0', borderColor: '#FFAB40' },
  textPending: { color: '#E65100' },
  badgeApproved: { backgroundColor: '#E1F5EE', borderColor: '#9FE1CB' },
  textApproved: { color: '#0F6E56' },

  // License Link Button
  licenseLinkButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0F9F4', 
    padding: 10, 
    borderRadius: 14, 
    marginBottom: 16, 
    borderWidth: 1.5, 
    borderColor: '#E8F3EB', 
    gap: 10 
  },
  licenseIconBg: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  licenseLinkText: { color: '#123D1F', fontSize: 13, fontWeight: '700' },

  // Actions / Footer
  cardFooter: {
    borderTopWidth: 1.5,
    borderTopColor: '#F0F9F4',
    paddingTop: 16,
  },
  dateRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginBottom: 12 
  },
  timestamp: { 
    fontSize: 13, 
    color: '#A0B4A5', 
    fontWeight: '700' 
  },
  actionButton: { 
    backgroundColor: '#196F31', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 14, 
    borderRadius: 16, 
    gap: 6 
  },
  disabledButton: { backgroundColor: '#A0B4A5', elevation: 0 },
  actionButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  
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