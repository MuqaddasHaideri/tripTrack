import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useSelector } from 'react-redux';

// NOTE: Import your actual API functions here
import { createAdminApi, fetchAdminsApi, deleteAdminApi } from '../../service/server';

const StatCard = ({ label, value, icon, color = "#196F31" }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBg, { borderColor: color }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const ProvisionAdminView = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal & Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form Fields mapped exactly to backend req.body
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { token } = useSelector((state) => state.auth);

  const loadAdmins = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      const response = await fetchAdminsApi(token); 
      
      let extractedData = [];
      if (response?.success && Array.isArray(response.admins)) {
        extractedData = response.admins;
      } else if (response?.success && Array.isArray(response.data)) {
        extractedData = response.data;
      } else if (Array.isArray(response)) {
        extractedData = response;
      }
      
      // Filter only users with role 'admin'
      setAdmins(extractedData.filter(user => user.role === 'admin'));
      
    } catch (error) {
      console.error("Error loading admins:", error);
      Alert.alert("Error", "Could not fetch admin directory.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) loadAdmins();
  }, [token]);

  const openForm = () => {
    setAdminName('');
    setAdminEmail('');
    setAdminPhone('');
    setAdminPassword('');
    setShowPassword(false);
    setModalVisible(true);
  };

  const handleCreateAdmin = async () => {
    if (!adminName || !adminEmail || !adminPassword) {
      Alert.alert("Validation Error", "Name, email, and password are required.");
      return;
    }

    if (!adminEmail.includes('@')) {
      Alert.alert("Validation Error", "Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword,
    };

    try {
      const response = await createAdminApi(payload, token);

      if (response && response.success !== false) {
        Alert.alert("Success", response.message || "New admin provisioned successfully!");
        setModalVisible(false);
        loadAdmins(); 
      } else {
        Alert.alert("Error", response.message || "Failed to create admin.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network request failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Revoke Access",
      "Are you sure you want to permanently remove this admin's access?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Revoke", 
          style: "destructive", 
          onPress: async () => {
            const response = await deleteAdminApi(id, token);
            if (response && response.success !== false) {
              setAdmins(prev => prev.filter(a => a._id !== id));
              Alert.alert("Revoked", "Admin access removed successfully.");
            } else {
              Alert.alert("Error", "Could not remove admin.");
            }
          }
        }
      ]
    );
  };

  const renderAdminItem = ({ item }) => {
    const initials = item.name ? item.name.substring(0, 2).toUpperCase() : 'AD';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {item.profilePic ? (
            <Image source={{ uri: item.profilePic }} style={styles.avatarCircle} />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: '#FDEBD0' }]}>
              <Text style={[styles.avatarText, { color: '#D35400' }]}>{initials}</Text>
            </View>
          )}
          
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.email}</Text>
          </View>

          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.iconBtn}>
            <Ionicons name="trash" size={20} color="#E74C3C" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>System Admin</Text>
          </View>
          
          {item.phone ? (
             <Text style={styles.detailText}><Ionicons name="call-outline" size={12}/> {item.phone}</Text>
          ) : (
             <Text style={styles.detailText}>No Phone Listed</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* ── UPDATED STATS ROW ── */}
      <View style={styles.statsRow}>
        <StatCard label="Total Admins" value={admins.length} icon="shield-checkmark-outline" />
        <TouchableOpacity style={styles.addBtnCard} onPress={openForm}>
          <Ionicons name="person-add" size={24} color="#FFF" />
          <Text style={styles.addBtnText}>New Admin</Text>
        </TouchableOpacity>
      </View>

      {/* LIST OF ADMINS */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#196F31" />
          <Text style={styles.loadingText}>Fetching admin directory...</Text>
        </View>
      ) : (
        <FlatList
          data={admins}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderAdminItem}
          contentContainerStyle={styles.scroll}
          refreshing={refreshing}
          onRefresh={() => loadAdmins(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.placeholderWrapper}>
              <View style={styles.placeholderIconBg}>
                <Ionicons name="shield-outline" size={32} color="#196F31" />
              </View>
              <Text style={styles.mainPrompt}>No Admins Found</Text>
              <Text style={styles.placeholderSub}>Provision a new admin to grant dashboard access.</Text>
            </View>
          }
        />
      )}

      {/* CREATE ADMIN MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Provision New Admin</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                <Ionicons name="close-circle" size={28} color="#A0B4A5" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g., Ali Khan"
                  value={adminName}
                  onChangeText={setAdminName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="admin@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={adminEmail}
                  onChangeText={setAdminEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g., +92 300 1234567"
                  keyboardType="phone-pad"
                  value={adminPhone}
                  onChangeText={setAdminPhone}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Temporary Password *</Text>
                <View style={styles.passwordWrap}>
                  <TextInput 
                    style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]} 
                    placeholder="Create a secure password"
                    secureTextEntry={!showPassword}
                    value={adminPassword}
                    onChangeText={setAdminPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 10 }}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#A0B4A5" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.btn, styles.btnCancel]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.btnCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.btn, styles.btnSubmit, isSubmitting && styles.btnDisabled]} 
                  onPress={handleCreateAdmin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.btnSubmitText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// ==========================================
// INTEGRATED STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9F4' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, color: '#4A6B54', fontSize: 14, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 100 },

  statsRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 15,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#D1E8D9',
  },
  statCard: {
    flex: 1, backgroundColor: '#F0F9F4', borderRadius: 12, padding: 10,
    borderWidth: 1.5, borderColor: '#D1E8D9', alignItems: 'center', gap: 4,
  },
  statIconBg: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#123D1F' },
  statLabel: { fontSize: 10, color: '#6A8E75', fontWeight: '600' },
  
  addBtnCard: {
    flex: 1, backgroundColor: '#196F31', borderRadius: 12, padding: 10,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    elevation: 3, shadowColor: '#196F31', shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { height: 3, width: 0}
  },
  addBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  card: {
    backgroundColor: '#fff', padding: 18, borderRadius: 24, borderWidth: 2, 
    borderColor: '#E8F3EB', elevation: 4, shadowColor: '#196F31', shadowOpacity: 0.08, 
    shadowRadius: 10, marginBottom: 16
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarCircle: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden' },
  avatarText: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#123D1F' },
  cardSub: { fontSize: 13, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  iconBtn: { padding: 8, backgroundColor: '#F8F9FA', borderRadius: 8, borderWidth: 1, borderColor: '#EFEFEF' },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, borderTopColor: '#F0F9F4', paddingTop: 12 },
  roleBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#C8E6C9' },
  roleBadgeText: { color: '#196F31', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  detailText: { fontSize: 12, color: '#A0B4A5', fontWeight: '700' },

  placeholderWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  placeholderIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E8F3EB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  mainPrompt: { fontSize: 24, fontWeight: '900', color: '#123D1F', marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#C5D9C9', alignSelf: 'center', marginBottom: 16 },
  
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#123D1F' },
  closeModalBtn: { padding: 4 },

  formContainer: { paddingBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#A0B4A5', textTransform: 'uppercase', marginBottom: 8 },
  input: { backgroundColor: '#F0F9F4', borderRadius: 14, padding: 14, fontSize: 15, color: '#123D1F', borderWidth: 1.5, borderColor: '#E8F3EB' },
  
  passwordWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F4', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8F3EB' },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  btnCancel: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E8F3EB' },
  btnCancelText: { color: '#6A8E75', fontSize: 16, fontWeight: '700' },
  btnSubmit: { backgroundColor: '#196F31' },
  btnDisabled: { backgroundColor: '#A0B4A5' },
  btnSubmitText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});