import React, { useState, useEffect } from 'react'; 
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import { useSelector } from 'react-redux';
import { createAdminApi, fetchAdminsApi, deleteAdminApi } from '../../service/server';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

// Reusable StatCard Component
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
  
  // Form Fields
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();
  const { token } = useSelector((state: any) => state.auth);

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
      
      setAdmins(extractedData.filter(user => user.role === 'admin'));
    } catch (error) {
      console.error(t("admin.error:"), error);
      Alert.alert("Error", t("admin.fetchAdminsError"));
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
      Alert.alert(t("admin.validationError"), t("admin.requiredFields"));
      return;
    }

    if (!adminEmail.includes('@')) {
      Alert.alert(t("admin.validationError"), t("admin.invalidEmail"));
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
        Alert.alert(t("admin.success"), response.message || t("admin.adminCreated"));
        setModalVisible(false);
        loadAdmins(); 
      } else {
        Alert.alert(t("admin.error"), response.message || t("admin.createAdminError"));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t("admin.error"), t("admin.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      t("admin.revokeAccess"),
      t("admin.revokeConfirmation"),
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: t("admin.revoke"),
          style: "destructive", 
          onPress: async () => {
            const response = await deleteAdminApi(id, token);
            if (response && response.success !== false) {
              setAdmins(prev => prev.filter(a => a._id !== id));
              Alert.alert(t("admin.success"), t("admin.adminRevoked"));
            } else {
              Alert.alert(t("admin.error"), t("admin.deleteAdminError"));
            }
          }
        }
      ]
    );
  };

  const renderAdminItem = ({ item }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={20} color="#196F31" />
            </View>
          
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.email}</Text>
          </View>

          <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.trashBtn} activeOpacity={0.6}>
            <Ionicons name="trash-outline" size={18} color="#E24B4A" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{t("admin.systemAdmin")}</Text>
          </View>
          
          {item.phone ? (
             <Text style={styles.detailText}><Ionicons name="call-outline" size={14}/> {item.phone}</Text>
          ) : (
             <Text style={styles.detailText}>{t("admin.noPhoneListed")}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard label={t("admin.totalAdmins")} value={admins.length} icon="shield-checkmark-outline" />
        <TouchableOpacity style={styles.addBtnCard} onPress={openForm} activeOpacity={0.8}>
          <Ionicons name="person-add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>{t("admin.newAdmin")}</Text>
        </TouchableOpacity>
      </View>

      {/* List Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#196F31" />
          <Text style={styles.loadingText}>{t("admin.fetchingAdmins")}</Text>
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
              <Text style={styles.mainPrompt}>{t("admin.noAdminsFound")}</Text>
              <Text style={styles.placeholderSub}>{t("admin.provisionAdmin")}</Text>
            </View>
          }
        />
      )}

      {/* Create Admin Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{t("admin.provisionNewAdmin")}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                <Ionicons name="close-circle" size={28} color="#A0B4A5" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("admin.fullName")} *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder={t("admin.placeholderFullName")}
                  placeholderTextColor="#A0B4A5"
                  value={adminName}
                  onChangeText={setAdminName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("admin.emailAddress")} *</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder={t("admin.placeholderEmail")}
                  placeholderTextColor="#A0B4A5"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={adminEmail}
                  onChangeText={setAdminEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("admin.phoneNumber")}</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder={t("admin.placeholderPhone")}
                  placeholderTextColor="#A0B4A5"
                  keyboardType="phone-pad"
                  value={adminPhone}
                  onChangeText={setAdminPhone}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("admin.temporaryPassword")} *</Text>
                <View style={styles.passwordWrap}>
                  <TextInput 
                    style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]} 
                    placeholder={t("admin.placeholderPassword")}
                    placeholderTextColor="#A0B4A5"
                    secureTextEntry={!showPassword}
                    value={adminPassword}
                    onChangeText={setAdminPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 12 }}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#A0B4A5" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.btn, styles.btnCancel]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.btnCancelText}>{t("admin.cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.btn, styles.btnSubmit, isSubmitting && styles.btnDisabled]} 
                  onPress={handleCreateAdmin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.btnSubmitText}>{t("admin.createAccount")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9F4' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 12, color: '#4A6B54', fontSize: 14, fontWeight: '600' },
  scroll: { padding: 20, paddingBottom: 40 },

  statsRow: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 15,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1.5, borderBottomColor: '#E8F3EB',
  },
  statCard: {
    flex: 1, backgroundColor: '#F0F9F4', borderRadius: 14, padding: 10,
    borderWidth: 1.5, borderColor: '#196F31', alignItems: 'center', gap: 4,
    elevation: 2, shadowColor: '#196F31', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  statIconBg: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E8F3EB',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#123D1F', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: '#A0B4A5', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  
  addBtnCard: {
    flex: 1, backgroundColor: '#196F31', borderRadius: 14, padding: 10,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
    elevation: 4, shadowColor: '#196F31', shadowOpacity: 0.1, shadowRadius: 10,
  },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
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
  avatarCircle: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14, overflow: 'hidden', backgroundColor: '#F0F9F4' },
  avatarText: { fontSize: 16, fontWeight: '800', color: '#123D1F' },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#123D1F' },
  cardSub: { fontSize: 13, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  trashBtn: { padding: 4, marginLeft: 8 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, borderTopColor: '#F0F9F4', paddingTop: 16 },
  roleBadge: { backgroundColor: '#E1F5EE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1.5, borderColor: '#3a714a' },
  roleBadgeText: { color:  '#196F31', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  detailText: { fontSize: 13, color: '#4A6B54', fontWeight: '600' },

  placeholderWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  placeholderIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E8F3EB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  mainPrompt: { fontSize: 24, fontWeight: '900', color: '#123D1F', marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#F0F9F4', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 30 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#C5D9C9', alignSelf: 'center', marginBottom: 16 },
  
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#123D1F' },
  closeModalBtn: { padding: 4 },

  formContainer: { paddingBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: '800', color: '#A0B4A5', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#123D1F', fontWeight: '700', borderWidth: 2, borderColor: '#E8F3EB' },
  
  passwordWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: '#E8F3EB' },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { flex: 1, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  btnCancel: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E8F3EB' },
  btnCancelText: { color: '#6A8E75', fontSize: 16, fontWeight: '700' },
  btnSubmit: { backgroundColor: '#196F31' },
  btnDisabled: { backgroundColor: '#A0B4A5' },
  btnSubmitText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});