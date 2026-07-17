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
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import {
  fetchRoutesApi,
  createRouteApi,
  deleteRouteApi,
  updateRouteApi
} from '../../service/server';
import { useTranslation } from 'react-i18next';

// Pre-defined colors for the admin to easily select from
const PRESET_COLORS = [
  '#27AE60', // Green
  '#2980B9', // Blue
  '#E74C3C', // Red
  '#F39C12', // Orange
  '#8E44AD', // Purple
  '#34495E', // Dark Blue/Grey
];

const StatCard = ({ label, value, icon, color = "#196F31" }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIconBg, { borderColor: color }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const TransitManagementView = () => {
  const router = useRouter();

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal & Form State
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [routeName, setRouteName] = useState('');
  const [colorHex, setColorHex] = useState('#27AE60');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [stops, setStops] = useState([]);

  const { token } = useSelector((state) => state.auth);
const [t] = useTranslation();
  const loadRoutes = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      const response = await fetchRoutesApi();
      if (Array.isArray(response)) {
        setRoutes(response);
      } else {
        setRoutes([]);
      }
    } catch (error) {
      console.error("Error loading routes:", error);
      Alert.alert(t("routes.error"), t("routes.fetchRoutesError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const openForm = (route = null) => {
    if (route) {
      setEditingId(route._id || route.id);
      setRouteName(route.route_name || '');
      setColorHex(route.color_hex || '#27AE60');
      setOrigin(route.origin || '');
      setDestination(route.destination || '');
      setStops(route.stops ? route.stops.map(s => ({ ...s, uiKey: Math.random().toString() })) : []);
    } else {
      setEditingId(null);
      setRouteName('');
      setColorHex('#27AE60');
      setOrigin('');
      setDestination('');
      setStops([]);
    }
    setModalVisible(true);
  };

  const handleAddStop = () => {
    setStops([...stops, { uiKey: Math.random().toString(), stop_name: '', latitude: '', longitude: '' }]);
  };

  const handleUpdateStop = (index, field, value) => {
    const updatedStops = [...stops];
    updatedStops[index][field] = value;
    setStops(updatedStops);
  };

  const handleRemoveStop = (index) => {
    const updatedStops = stops.filter((_, i) => i !== index);
    setStops(updatedStops);
  };

  const handleSaveRoute = async () => {
    if (!routeName || !origin || !destination) {
      Alert.alert(t("routes.validation"), t("routes.fillRequiredFields"));
      return;
    }

    for (let i = 0; i < stops.length; i++) {
      if (!stops[i].stop_name || !stops[i].latitude || !stops[i].longitude) {
        Alert.alert(t("routes.validation"), t("routes.fillStopFields", { number: i + 1 }));
        return;
      }
    }

    setIsSubmitting(true);

    const formattedStops = stops.map(stop => ({
      stop_name: stop.stop_name,
      latitude: parseFloat(stop.latitude),
      longitude: parseFloat(stop.longitude)
    }));

    const payload = {
      route_name: routeName,
      color_hex: colorHex,
      origin: origin,
      destination: destination,
      stops: formattedStops,
      polyline: formattedStops.map(s => ({ latitude: s.latitude, longitude: s.longitude }))
    };

    try {
      let response;
      if (editingId) {
        response = await updateRouteApi(editingId, payload, token);
      } else {
        response = await createRouteApi(payload, token);
      }

      if (response && response.success !== false) {
        Alert.alert(t("routes.success"), t("routes.routeUpdated"));
        setModalVisible(false);
        loadRoutes();
      } else {
        Alert.alert(t("routes.error"), response.message || t("routes.saveRouteError"));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t("routes.error"), t("routes.networkError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      t("routes.deleteRoute"),
      t("routes.deleteConfirmation"),
      [
        { text: t("routes.cancel"), style: "cancel" },
        {
          text: t("routes.delete"),
          style: "destructive",
          onPress: async () => {
            const response = await deleteRouteApi(id, token);
            if (response && response.success !== false) {
              setRoutes(prev => prev.filter(r => (r._id || r.id) !== id));
              Alert.alert(t("routes.deleted"), t("routes.routeDeleted"));
            } else {
              Alert.alert(t("routes.error"), t("routes.deleteRouteError"));
            }
          }
        }
      ]
    );
  };

  const renderRouteItem = ({ item }) => {
    const routeColor = item.color_hex || '#196F31';
    const stopCount = item.stops ? item.stops.length : 0;
    const routeId = item._id || item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: `${routeColor}20` }]}>
            <Ionicons name="bus" size={26} color={routeColor} />
          </View>

          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.route_name}</Text>
            <View style={styles.routePill}>
              <View style={[styles.colorIndicator, { backgroundColor: routeColor }]} />
              <Text style={styles.cardSub}>{routeColor.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={() => openForm(item)} style={styles.iconBtn}>
              <Ionicons name="pencil" size={20} color="#2980B9" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(routeId)} style={styles.iconBtn}>
              <Ionicons name="trash" size={20} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.pathContainer}>
          <View style={styles.pathNode}>
            <Ionicons name="radio-button-on" size={14} color={routeColor} />
            <Text style={styles.pathText}>{item.origin}</Text>
          </View>
          <View style={[styles.pathLine, { borderLeftColor: routeColor }]} />
          <View style={styles.pathNode}>
            <Ionicons name="location" size={14} color={routeColor} />
            <Text style={styles.pathText}>{item.destination}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.detailText}>
            <Ionicons name="business-outline" size={14} /> {stopCount} {t('routes.activeStops')}
          </Text>

          <TouchableOpacity
            style={styles.viewMapBtn}
            onPress={() => router.push({
              pathname: '/(admin)/AdminMap',
              params: { routeId: routeId }
            })}
          >
            <Text style={[styles.viewMapText, { color: routeColor }]}>{t('routes.viewMap')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        <StatCard label={t("routes.totalRoutes")} value={routes.length} icon="git-network-outline" />
        <StatCard
          label={t("routes.totalStops")}
          value={routes.reduce((acc, route) => acc + (route.stops?.length || 0), 0)}
          icon="business-outline"
        />
        <TouchableOpacity style={styles.addBtnCard} onPress={() => openForm()}>
          <Ionicons name="add-circle" size={24} color="#FFF" />
          <Text style={styles.addBtnText}>{t("routes.newRoute")}</Text>
        </TouchableOpacity>
      </View>

      {/* LIST OF ROUTES */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#196F31" />
          <Text style={styles.loadingText}>{t("routes.fetchingTransitNetwork")}</Text>
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item) => (item._id || item.id || Math.random()).toString()}
          renderItem={renderRouteItem}
          contentContainerStyle={styles.scroll}
          refreshing={refreshing}
          onRefresh={() => loadRoutes(true)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.placeholderWrapper}>
              <View style={styles.placeholderIconBg}>
                <Ionicons name="bus-outline" size={32} color="#196F31" />
              </View>
              <Text style={styles.mainPrompt}>{t("routes.noRoutesAvailable")}</Text>
              <Text style={styles.placeholderSub}>{t("routes.createFirstRoute")}</Text>
            </View>
          }
        />
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {/* ── HEADER ROW WITH X BUTTON ── */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{editingId ? t("routes.editRoute") : t("routes.createRoute")}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeModalBtn}>
                <Ionicons name="close-circle" size={28} color="#A0B4A5" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("routes.routeName")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("routes.placeholderRouteName")}
                  value={routeName}
                  onChangeText={setRouteName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("routes.themeColor")}</Text>

                {/* ── QUICK SELECT COLOR SWATCHES ── */}
                <View style={styles.presetColorContainer}>
                  {PRESET_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.presetColorCircle,
                        { backgroundColor: color },
                        colorHex.toUpperCase() === color && styles.presetColorSelected
                      ]}
                      onPress={() => setColorHex(color)}
                    >
                      {colorHex.toUpperCase() === color && (
                        <Ionicons name="checkmark" size={16} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Manual Hex Input Fallback */}
                <View style={styles.colorInputWrap}>
                  <View style={[styles.colorPreview, { backgroundColor: colorHex }]} />
                  <TextInput
                    style={[styles.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
                    placeholder="#2d5a4c"
                    value={colorHex}
                    onChangeText={setColorHex}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("routes.originPoint")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("routes.placeholderOrigin")}
                  value={origin}
                  onChangeText={setOrigin}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t("routes.destinationPoint")}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t("routes.placeholderDestination")}
                  value={destination}
                  onChangeText={setDestination}
                />
              </View>

              {/* STOPS MANAGEMENT SECTION */}
              <View style={styles.stopsHeader}>
                <Text style={styles.inputLabel}>{t("routes.routeStops", { count: stops.length })}</Text>
                <TouchableOpacity onPress={handleAddStop} style={styles.addStopBtn}>
                  <Ionicons name="add" size={16} color="#196F31" />
                  <Text style={styles.addStopText}>{t("routes.addStop")}</Text>
                </TouchableOpacity>
              </View>

              {stops.map((stop, index) => (
                <View key={stop.uiKey} style={styles.stopCard}>
                  <View style={styles.stopCardHeader}>
                    <View style={styles.stopBadge}>
                      <Text style={styles.stopBadgeText}>{index + 1}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveStop(index)}>
                      <Ionicons name="close-circle" size={22} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[styles.input, { marginBottom: 10 }]}
                    placeholder={t("routes.placeholderStopName")}
                    value={stop.stop_name}
                    onChangeText={(val) => handleUpdateStop(index, 'stop_name', val)}
                  />

                  <View style={styles.coordinatesRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={t("routes.latitude")}
                      keyboardType="numeric"
                      value={String(stop.latitude)}
                      onChangeText={(val) => handleUpdateStop(index, 'latitude', val)}
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={t("routes.longitude")}
                      keyboardType="numeric"
                      value={String(stop.longitude)}
                      onChangeText={(val) => handleUpdateStop(index, 'longitude', val)}
                    />
                  </View>
                </View>
              ))}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.btnCancelText}>{t("routes.cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnSubmit, isSubmitting && styles.btnDisabled]}
                  onPress={handleSaveRoute}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={styles.btnSubmitText}>{t("routes.saveRoute")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    elevation: 3, shadowColor: '#196F31', shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { height: 3, width: 0 }
  },
  addBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  card: {
    backgroundColor: '#fff', padding: 18, borderRadius: 24, borderWidth: 2,
    borderColor: '#E8F3EB', elevation: 4, shadowColor: '#196F31', shadowOpacity: 0.08,
    shadowRadius: 10, marginBottom: 16
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconCircle: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#123D1F' },
  routePill: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  colorIndicator: { width: 10, height: 10, borderRadius: 5 },
  cardSub: { fontSize: 12, color: '#8E8E93', fontWeight: '700' },
  actionsContainer: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8, backgroundColor: '#F8F9FA', borderRadius: 8, borderWidth: 1, borderColor: '#EFEFEF' },

  pathContainer: { backgroundColor: '#F8F9FA', padding: 12, borderRadius: 12, marginBottom: 16 },
  pathNode: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pathText: { fontSize: 14, fontWeight: '600', color: '#333' },
  pathLine: { borderLeftWidth: 2, height: 16, marginLeft: 6, marginVertical: 4, borderStyle: 'dashed' },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, borderTopColor: '#F0F9F4', paddingTop: 12 },
  detailText: { fontSize: 13, color: '#4A6B54', fontWeight: '600' },
  viewMapBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#F0F9F4', borderRadius: 8, borderWidth: 1.5, borderColor: '#E8F3EB' },
  viewMapText: { fontSize: 12, fontWeight: '800' },

  placeholderWrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  placeholderIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E8F3EB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  mainPrompt: { fontSize: 24, fontWeight: '900', color: '#123D1F', marginBottom: 8 },
  placeholderSub: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#C5D9C9', alignSelf: 'center', marginBottom: 16 },

  // Header with X Button
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#123D1F' },
  closeModalBtn: { padding: 4 },

  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#A0B4A5', textTransform: 'uppercase', marginBottom: 8 },
  input: { backgroundColor: '#F0F9F4', borderRadius: 14, padding: 14, fontSize: 15, color: '#123D1F', borderWidth: 1.5, borderColor: '#E8F3EB' },

  // Preset Colors
  presetColorContainer: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  presetColorCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  presetColorSelected: { borderWidth: 3, borderColor: '#E8F3EB' },

  colorInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F4', borderRadius: 14, borderWidth: 1.5, borderColor: '#E8F3EB', paddingLeft: 14 },
  colorPreview: { width: 20, height: 20, borderRadius: 10 },

  stopsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 12 },
  addStopBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  addStopText: { fontSize: 13, fontWeight: '800', color: '#196F31', marginLeft: 4 },

  stopCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#E8F3EB', marginBottom: 12 },
  stopCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stopBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#196F31', alignItems: 'center', justifyContent: 'center' },
  stopBadgeText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  coordinatesRow: { flexDirection: 'row', gap: 10 },

  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  btnCancel: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#E8F3EB' },
  btnCancelText: { color: '#6A8E75', fontSize: 16, fontWeight: '700' },
  btnSubmit: { backgroundColor: '#196F31' },
  btnDisabled: { backgroundColor: '#A0B4A5' },
  btnSubmitText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});