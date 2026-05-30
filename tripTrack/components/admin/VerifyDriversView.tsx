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
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { fetchPendingDriversApi, fetchAllDriversApi, approveDriverApi } from '../../service/server'; 
import { useSelector } from 'react-redux';

export const VerifyDriversView = () => {

  const [activeSegment, setActiveSegment] = useState('pending');
  
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null); 
  const { token } = useSelector((state: any) => state.auth);


  const loadDriverData = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      if (!token) {
        setDrivers([]);
        return;
      }

      let response;
      if (activeSegment === 'pending') {
        response = await fetchPendingDriversApi(token);
      } else {
        response = await fetchAllDriversApi(token);
      }

      console.log(`API Response (${activeSegment}):`, response); 

      if (response?.success && Array.isArray(response.data)) {
        setDrivers(response.data);
      } else if (Array.isArray(response)) {
        setDrivers(response);
      } else {
        setDrivers([]);
      }
    } catch (error) {
      console.error("Error loading driver data:", error);
      Alert.alert("Error", "Something went wrong fetching data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDriverData();
    }
  }, [token, activeSegment]);

  const handleApprove = async (driverId) => {
    setProcessingId(driverId);
    try {
      const response = await approveDriverApi(driverId, token);

      if (response && response.success !== false) {
        Alert.alert("Success", "Driver application approved successfully!");
        
        if (activeSegment === 'pending') {

          setDrivers(prevDrivers => prevDrivers.filter(driver => driver._id !== driverId));
        } else {
          setDrivers(prevDrivers => 
            prevDrivers.map(d => d._id === driverId ? { ...d, isVerified: true } : d)
          );
        }
      } else {
        Alert.alert("Error", response.message || "Failed to approve driver.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not complete approval request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewLicense = (url) => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert("Error", "Cannot open license link."));
    } else {
      Alert.alert("Not Available", "No document image uploaded.");
    }
  };

  const renderDriverItem = ({ item }) => {
    const isApproved = item.isVerified === true;

    return (
      <View style={styles.driverCard}>
        <View style={styles.cardHeader}>
          {item.profilePic ? (
            <Image source={{ uri: item.profilePic }} style={styles.profileAvatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={44} color="#555" />
          )}
          
          <View style={styles.textContainer}>
            <Text style={styles.driverName}>{item.name || "Unknown Driver"}</Text>
            <Text style={styles.driverDetails}>✉️ {item.email}</Text>
            <Text style={styles.driverDetails}>📞 {item.phone || 'N/A'}</Text>
            <Text style={styles.driverDetails}>🆔 CNIC: {item.cnic || 'N/A'}</Text>
          </View>

          {/* Verification Status Badge (Visible on 'All Drivers' Tab) */}
          {activeSegment === 'all' && (
            <View style={[styles.statusBadge, isApproved ? styles.badgeApproved : styles.badgePending]}>
              <Text style={[styles.statusText, isApproved ? styles.textApproved : styles.textPending]}>
                {isApproved ? "Approved" : "Pending"}
              </Text>
            </View>
          )}
        </View>

        {item.driverLicense && (
          <TouchableOpacity 
            style={styles.licenseLinkButton} 
            onPress={() => handleViewLicense(item.driverLicense)}
          >
            <Ionicons name="document-text-outline" size={15} color="#196F31" />
            <Text style={styles.licenseLinkText}>View Uploaded Driver License Docs</Text>
          </TouchableOpacity>
        )}

        {/* Render Approve button ONLY if the driver is not verified yet */}
        {!isApproved && (
          <TouchableOpacity 
            style={[styles.approveButton, processingId === item._id && styles.disabledButton]} 
            onPress={() => handleApprove(item._id)}
            disabled={processingId === item._id}
          >
            {processingId === item._id ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" />
                <Text style={styles.approveButtonText}>Approve Driver</Text>
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
        <Ionicons name={activeSegment === 'pending' ? "card-outline" : "people-outline"} size={28} color="#196F31" />
      </View>
      <Text style={styles.placeholderTitle}>
        {activeSegment === 'pending' ? "All Caught Up!" : "No Drivers Registered"}
      </Text>
      <Text style={styles.placeholderSub}>
        {activeSegment === 'pending' 
          ? "There are no pending driver applications to review right now."
          : "There are currently no drivers in the database system."}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── SEGMENTED TOP CONTROL BUTTONS ── */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity 
          style={[styles.segmentButton, activeSegment === 'pending' && styles.activeSegmentButton]}
          onPress={() => setActiveSegment('pending')}
          activeOpacity={0.9}
        >
          <Text style={[styles.segmentText, activeSegment === 'pending' && styles.activeSegmentText]}>
            Pending Applications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.segmentButton, activeSegment === 'all' && styles.activeSegmentButton]}
          onPress={() => setActiveSegment('all')}
          activeOpacity={0.9}
        >
          <Text style={[styles.segmentText, activeSegment === 'all' && styles.activeSegmentText]}>
            All Drivers Directory
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Container Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#196F31" />
          <Text style={styles.loadingText}>Updating workspace records...</Text>
        </View>
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderDriverItem}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => loadDriverData(true)}
        />
      )}
    </View>
  );
};

export default VerifyDriversView;

// ==========================================
// STYLES
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

  // Driver Card Layout
  driverCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  profileAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0E0E0' },
  textContainer: { marginLeft: 12, flex: 1 },
  driverName: { fontSize: 15, fontWeight: '700', color: '#123D1F', marginBottom: 4 },
  driverDetails: { fontSize: 12, color: '#555', marginTop: 1 },
  
  // Custom Badges
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  badgeApproved: { backgroundColor: '#E8F5E9' },
  badgePending: { backgroundColor: '#FEF9E7' },
  statusText: { fontSize: 11, fontWeight: '700' },
  textApproved: { color: '#196F31' },
  textPending: { color: '#D35400' },

  // Action Buttons
  licenseLinkButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F4', padding: 8, borderRadius: 6, marginBottom: 12, borderWidth: 1, borderColor: '#D1E8D9', gap: 6 },
  licenseLinkText: { color: '#196F31', fontSize: 12, fontWeight: '600' },
  approveButton: { backgroundColor: '#196F31', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
  disabledButton: { opacity: 0.7 },
  approveButtonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  
  // Placeholders
  placeholderWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  placeholderIconBg: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  placeholderTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  placeholderSub: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 32 },
});