import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, Switch, Animated,
  Modal, FlatList, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';

// Custom utilities & API hooks
import { fetchRoutesApi, getMyReportsApi, submitReportApi } from '@/service/server';
import { pickImage, uploadToCloudinary } from '@/utils/pickImage';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

// ─── Types ───────────────────────────────────────────────────────────────────
type Category = 'traffic' | 'bug' | 'suggestion' | null;
type Priority = 'low' | 'medium' | 'high' | 'critical' | null;

interface LastReport {
  id: string;
  status: 'submitted' | 'under_review' | 'resolved';
  category: string;
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_CHARS = 300;


export default function ReportIssueScreen() {
  const router = useRouter();
const {t}= useTranslation();
  // Core form state
  const [category, setCategory] = useState<Category>(null);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [quickSelect, setQuickSelect] = useState('');

  // Location tracking state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Feature state
  const [priority, setPriority] = useState<Priority>('medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [routeModalVisible, setRouteModalVisible] = useState(false);
  const [routeSearch, setRouteSearch] = useState('');
  const [lastReport, setLastReport] = useState<LastReport | null>(null);
const [pastReports, setPastReports] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const successAnim = useRef(new Animated.Value(0)).current;
  const { token } = useSelector((state) => state.auth);

const PRIORITY_CONFIG: Record<
  NonNullable<Priority>,
  { label: string; color: string; bg: string; border: string }
> = {
  low: { label: t('reportIssue.low'), color: '#0F6E56', bg: '#E1F5EE', border: '#9FE1CB' },
  medium: { label: t('reportIssue.medium'), color: '#854F0B', bg: '#FAEEDA', border: '#FAC775' },
  high: { label: t('reportIssue.high'), color: '#E65100', bg: '#FFF3E0', border: '#FFAB40' },
  critical: { label: t('reportIssue.critical'), color: '#791F1F', bg: '#F7C1C1', border: '#E24B4A' },
};

const STATUS_CONFIG: Record<
  'pending' | 'reviewed' | 'resolved' | 'dismissed',
  { label: string; color: string }
> = {
  pending:   { label: t('reportStatus.pending'),  color: '#4A6B54' }, // Subtle green-gray
  reviewed:  { label: t('reportStatus.reviewed'),   color: '#854F0B' }, // Amber/Orange
  resolved:  { label: t('reportStatus.resolved'),     color: '#196F31' }, // Vibrant Green
  dismissed: { label: t('reportStatus.dismissed'),      color: '#791F1F' }, // Subtle Muted Red
};
  useEffect(() => {
    fetchReportHistory();
  }, []);

  const fetchReportHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await getMyReportsApi(token);
      if (data.success) {
        setPastReports(data.reports); 
      }
    } catch (e) {
      console.log("Error displaying history state:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  const { data: routes } = useQuery({
    queryKey: ['routes', 'all'],
    queryFn: fetchRoutesApi,
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    loadLastReport();
  }, []);

  // ── Helpers & Trackers ──────────────────────────────────────────────────────

  const selectCategory = (selectedCat: Category) => {
    setCategory(selectedCat);
    if (selectedCat === 'traffic' || selectedCat === 'bug') {
      captureLocation();
    }
  };

  const captureLocation = async () => {
    setIsGettingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsGettingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
    } catch (e) {
      console.log("Location lock skipped or failed", e);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const loadLastReport = async () => {
    try {
      const raw = await AsyncStorage.getItem('last_report');
      if (raw) setLastReport(JSON.parse(raw));
    } catch (_) { }
  };

  const saveLastReport = async (report: LastReport) => {
    try {
      await AsyncStorage.setItem('last_report', JSON.stringify(report));
    } catch (_) { }
  };

  const isSubmitEnabled = () => {
    if (!category) return false;
    if (category === 'traffic') return !!quickSelect;
    return description.trim().length > 0;
  };

  const handleSubmit = async () => {
    if (!isSubmitEnabled()) {
      Alert.alert(t('reportIssue.missingInfoTitle'), t('reportIssue.missingInfoMessage'));
      return;
    }
    setIsSubmitting(true);

    try {
      let attachmentUrl = '';

      // Upload attachment to Cloudinary if image exists
      if (category === 'bug' && imageUri) {
        attachmentUrl = await uploadToCloudinary(imageUri);
      }

      // Payload compilation matching backend Mongoose expectations precisely
      const payload = {
        reportType: category === 'traffic' ? 'transit_issue' : category === 'bug' ? 'app_bug' : 'suggestion',
        description,
        isAnonymous,
        ...(category !== 'suggestion' && { priority }),
        ...(category === 'traffic' && {
          busRoute: selectedRoute?._id || null,
          issueType: quickSelect,
          location: latitude && longitude ? { lat: latitude, lng: longitude } : null
        }),
        ...(attachmentUrl && { screenshotUrl: attachmentUrl })
      };

      const data = await submitReportApi(payload, token);
      console.log("Report submission response:", data);
      if (data.success) {
        // Trigger smooth success layout animations
        Animated.sequence([
          Animated.spring(successAnim, { toValue: 1, useNativeDriver: true }),
          Animated.delay(1200),
          Animated.timing(successAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();

        const newReport: LastReport = {
          id: `#${1000 + Math.floor(Math.random() * 9000)}`,
          status: 'submitted',
          category: category!,
          timestamp: Date.now(),
        };
        await saveLastReport(newReport);

      } else {
        Alert.alert(t('reportIssue.submissionFailedTitle'), data.message || t('reportIssue.submissionFailedMessage'));
      }
    } catch (err) {
      Alert.alert(t('reportIssue.networkError'), t('reportIssue.networkErrorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (category) {
      setCategory(null);
      setDescription('');
      setQuickSelect('');
      setPriority('medium');
      setSelectedRoute(null);
      setLatitude(null);
      setLongitude(null);
    } else {
      router.back();
    }
  };

  const filteredRoutes = React.useMemo(() => {
    if (!routes) return [];
    return routes.filter((r: any) =>
      r.origin?.toLowerCase().includes(routeSearch.toLowerCase()) ||
      r.destination?.toLowerCase().includes(routeSearch.toLowerCase()) ||
      r.route_name?.toLowerCase().includes(routeSearch.toLowerCase())
    );
  }, [routeSearch, routes]);


  const renderPrioritySelector = () => (
    <View>
      <Text style={styles.sectionLabel}>{t('reportIssue.priority')}</Text>
      <View style={styles.chipContainer}>
        {(Object.keys(PRIORITY_CONFIG) as NonNullable<Priority>[]).map((p) => {
          const cfg = PRIORITY_CONFIG[p];
          const active = priority === p;
          return (
            <TouchableOpacity
              key={p}
              onPress={() => setPriority(p)}
              style={[
                styles.priorityChip,
                { borderColor: cfg.border },
                active && { backgroundColor: cfg.bg },
              ]}
            >
              <Text style={[styles.priorityChipText, { color: active ? cfg.color : '#4A6B54' }]}>
                {t(cfg.label)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderRouteSelector = () => (
    <View>
      <Text style={styles.sectionLabel}>{t('reportIssue.routeBus')}</Text>
      <TouchableOpacity
        style={styles.routeSelector}
        onPress={() => setRouteModalVisible(true)}
      >
        <Ionicons name="bus" size={16} color="#196F31" />
        <Text style={[styles.routeSelectorText, !selectedRoute && { color: '#A0B4A5' }]}>
          {selectedRoute ? `${selectedRoute.origin} ➔ ${selectedRoute.destination}` : t('reportIssue.selectRoute')}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#196F31" />
      </TouchableOpacity>
    </View>
  );

  const renderAnonymousToggle = () => (
    <View style={styles.toggleCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleTitle}>{t('reportIssue.anonymousTitle')}</Text>
        <Text style={styles.toggleSub}>{t('reportIssue.anonymousSubtitle')}</Text>
      </View>
      <Switch
        value={isAnonymous}
        onValueChange={setIsAnonymous}
        trackColor={{ false: '#E8F3EB', true: '#196F31' }}
        thumbColor="#fff"
      />
    </View>
  );
// Reusable card used to display report
// categories with an icon and navigation.
  const CategoryCard = ({ title, sub, icon, onPress }: {
    title: string; sub: string; icon: string; onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon as any} size={24} color="#196F31" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#196F31" />
    </TouchableOpacity>
  );
  const renderCharCount = () => (
    <Text style={[
      styles.charCount,
      description.length > MAX_CHARS * 0.9 && { color: '#E24B4A' },
    ]}>
      {description.length} / {MAX_CHARS}
    </Text>
  );

const renderLastReportCard = () => {
    if (pastReports.length === 0) return null;

    return (
      <View style={{ marginBottom: 10 }}>
        <Text style={styles.sectionLabel}>{t('reportIssue.recentReports')}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={{ gap: 12, paddingBottom: 5 }}
        >
          {pastReports.map((report) => {
            const statusType = (report.status || 'pending') as 'pending' | 'reviewed' | 'resolved' | 'dismissed';
            const statusCfg = STATUS_CONFIG[statusType];

            // Clean format for type display tag strings
            const displayTag = report.reportType?.replace('_', ' ').toUpperCase() || 'REPORT';

            return (
              <View key={report._id} style={styles.lastReportCard}>
                <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
                
                <View style={{ width: 200 }}>
                  <Text style={styles.lastReportId}>{displayTag}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{report.description}</Text>
                  
                  {report.busRoute?.routeName && (
                    <Text style={[styles.cardSub, { color: '#196F31', fontWeight: '700', marginTop: 2 }]}>
                       {report.busRoute.routeName}
                    </Text>
                  )}
                  
                  <Text style={[styles.lastReportStatus, { color: statusCfg.color }]}>
                    {statusCfg.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderSuccessOverlay = () => (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.successOverlay,
        {
          opacity: successAnim,
          transform: [{
            scale: successAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1],
            }),
          }],
        },
      ]}
    >
      <View style={styles.successCircle}>
        <Ionicons name="checkmark" size={40} color="#fff" />
      </View>
      <Text style={styles.successText}>{t('reportIssue.reportSent')}</Text>
    </Animated.View>
  );

  const renderRouteModal = () => (
    <Modal
      visible={routeModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setRouteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{t('reportIssue.selectRouteTitle')}</Text>
          <TextInput
            style={styles.modalSearch}
            placeholder={t('reportIssue.searchRoutes')}
            placeholderTextColor="#A0B4A5"
            value={routeSearch}
            onChangeText={setRouteSearch}
          />
          <FlatList
            data={filteredRoutes}
            keyExtractor={(item: any) => item._id}
            renderItem={({ item }: any) => {
              const isSelected = selectedRoute?._id === item._id;
              return (
                <TouchableOpacity
                  style={[styles.routeItem, isSelected && styles.routeItemActive]}
                  onPress={() => {
                    setSelectedRoute(item);
                    setRouteModalVisible(false);
                    setRouteSearch('');
                  }}
                >
                  <Ionicons name="bus" size={16} color={isSelected ? '#fff' : '#196F31'} />
                  <Text style={[
                    styles.routeItemText,
                    isSelected && styles.routeItemTextActive,
                  ]}>
                    {item.origin} to {item.destination} ({item.route_name || 'Active'})
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
              );
            }}
            style={{ maxHeight: 320 }}
            showsVerticalScrollIndicator={false}
          />
          {selectedRoute && (
            <TouchableOpacity
              style={styles.clearRouteBtn}
              onPress={() => { setSelectedRoute(null); setRouteModalVisible(false); }}
            >
              <Text style={styles.clearRouteTxt}>{t('reportIssue.clearSelection')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderContent = () => {
    switch (category) {
      case 'traffic':
        return (
          <View style={styles.formSection}>
            {renderPrioritySelector()}
            {renderRouteSelector()}
            <View>
              <Text style={styles.sectionLabel}>{t('reportIssue.selectIssue')}</Text>
              <View style={styles.chipContainer}>
                {[t('reportIssue.busDelayed'), t('reportIssue.routeClosed'), t('reportIssue.heavyTraffic'), t('reportIssue.accident'), t('reportIssue.busFull')].map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, quickSelect === item && styles.activeChip]}
                    onPress={() => setQuickSelect(quickSelect === item ? '' : item)}
                  >
                    <Text style={[styles.chipText, quickSelect === item && styles.activeChipText]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.sectionLabel}>{t('reportIssue.additionalDetails')}</Text>
              <View style={styles.textAreaWrap}>
                <TextInput
                  style={styles.textArea}
                  placeholder={t('reportIssue.extraContextPlaceholder')}
                  placeholderTextColor="#A0B4A5"
                  multiline
                  value={description}
                  onChangeText={(t) => t.length <= MAX_CHARS && setDescription(t)}
                />
                {renderCharCount()}
              </View>
            </View>

            <View style={styles.locationCard}>
              {isGettingLocation ? (
                <>
                  <ActivityIndicator size="small" color="#196F31" />
                  <Text style={styles.locationText}>{t('reportIssue.locationVerifying')}</Text>
                </>
              ) : latitude && longitude ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#196F31" />
                  <Text style={styles.locationText}>{t('reportIssue.locationAttached')}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="alert-circle" size={18} color="#854F0B" />
                  <Text style={[styles.locationText, { color: '#854F0B' }]}>{t('reportIssue.locationSkipped')}</Text>
                </>
              )}
            </View>

            {renderAnonymousToggle()}
          </View>
        );

      case 'bug':
        return (
          <View style={styles.formSection}>
            {renderPrioritySelector()}
            <View>
              <Text style={styles.sectionLabel}>
                {t('reportIssue.describeBug')} <Text style={{ color: '#E24B4A' }}>*</Text>
              </Text>
              <View style={styles.textAreaWrap}>
                <TextInput
                  style={styles.textArea}
                  placeholder={t('reportIssue.bugPlaceholder')}
                  placeholderTextColor="#A0B4A5"
                  multiline
                  value={description}
                  onChangeText={(t) => t.length <= MAX_CHARS && setDescription(t)}
                />
                {renderCharCount()}
              </View>
            </View>
            <View>
              <Text style={styles.sectionLabel}>{t('reportIssue.screenshot')}</Text>
              <TouchableOpacity
                style={[styles.uploadBox, imageUri && styles.uploadBoxActive]}
                onPress={async () => {
                  const uri = await pickImage();
                  if (uri) setImageUri(uri);
                }}
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="cloud-upload-outline" size={32} color="#196F31" />
                    <Text style={styles.uploadText}>{t('reportIssue.attachScreenshot')}</Text>
                  </View>
                )}
                {imageUri && (
                  <TouchableOpacity style={styles.removeImg} onPress={() => setImageUri(null)}>
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
            {renderAnonymousToggle()}
          </View>
        );

      case 'suggestion':
        return (
          <View style={styles.formSection}>
            <View>
              <Text style={styles.sectionLabel}>
                {t('reportIssue.yourIdea')} <Text style={{ color: '#E24B4A' }}>*</Text>
              </Text>
              <View style={styles.textAreaWrap}>
                <TextInput
                  style={styles.textArea}
                  placeholder={t('reportIssue.suggestionPlaceholder')}
                  placeholderTextColor="#A0B4A5"
                  multiline
                  value={description}
                  onChangeText={(t) => t.length <= MAX_CHARS && setDescription(t)}
                />
                {renderCharCount()}
              </View>
            </View>
            {renderAnonymousToggle()}
          </View>
        );

      default:
        return (
          <View style={styles.categoryPicker}>
            {renderLastReportCard()}
            <Text style={styles.mainPrompt}>{t('reportIssue.mainPrompt')}</Text>
            <CategoryCard
              title={t('reportIssue.trafficTitle')}
              sub={t('reportIssue.trafficSubtitle')}
              icon="bus"
              onPress={() => selectCategory('traffic')}
            />
            <CategoryCard
              title={t('reportIssue.bugTitle')}
              sub={t('reportIssue.bugSubtitle')}
              icon="bug"
              onPress={() => selectCategory('bug')}
            />
            <CategoryCard
              title={t('reportIssue.suggestionTitle')}
              sub={t('reportIssue.suggestionSubtitle')}
              icon="bulb"
              onPress={() => selectCategory('suggestion')}
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerCircleBtn}>
            <Ionicons name={category ? 'arrow-back' : 'close'} size={22} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{category ? t('reportIssue.details') : t('reportIssue.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </ScrollView>

        {category && (
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.submitBtn,
                (!isSubmitEnabled() || isSubmitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !isSubmitEnabled()}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.submitBtnText}>{t('reportIssue.submitReport')}</Text>
                  <Ionicons name="send" size={18} color="#fff" style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {renderRouteModal()}
      {renderSuccessOverlay()}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9F4' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  headerCircleBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E8F3EB',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#123D1F' },
  scroll: { padding: 20, paddingBottom: 40 },
  categoryPicker: { gap: 16 },
  mainPrompt: { fontSize: 24, fontWeight: '900', color: '#123D1F', marginBottom: 8, marginTop: 6 },
  card: {
    backgroundColor: '#fff', padding: 20, borderRadius: 24,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: '#196F31',
    elevation: 4, shadowColor: '#196F31', shadowOpacity: 0.1, shadowRadius: 10,
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: '#F0F9F4', justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#123D1F' },
  cardSub: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  lastReportCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#9FE1CB', marginBottom: 4,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  lastReportId: { fontSize: 13, fontWeight: '800', color: '#123D1F' },
  lastReportStatus: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  formSection: { gap: 22 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#A0B4A5',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
  },
  priorityChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5,
  },
  priorityChipText: { fontWeight: '700', fontSize: 13 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16,
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#E8F3EB',
  },
  activeChip: { backgroundColor: '#196F31', borderColor: '#196F31' },
  chipText: { color: '#4A6B54', fontWeight: '700' },
  activeChipText: { color: '#fff', fontWeight: 'bold' },
  routeSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: '#196F31',
  },
  routeSelectorText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#123D1F' },
  locationCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', padding: 15, borderRadius: 16,
    borderWidth: 2, borderColor: '#196F31', gap: 10,
  },
  locationText: { color: '#196F31', fontSize: 14, fontWeight: '700' },
  textAreaWrap: { position: 'relative' },
  textArea: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    borderWidth: 2, borderColor: '#196F31',
    textAlignVertical: 'top', fontSize: 16, color: '#123D1F',
    minHeight: 150, paddingBottom: 30,
  },
  charCount: {
    position: 'absolute', bottom: 10, right: 14,
    fontSize: 11, color: '#A0B4A5', fontWeight: '600',
  },
  uploadBox: {
    width: '100%', height: 180, borderRadius: 20,
    borderWidth: 2, borderColor: '#E8F3EB', borderStyle: 'dashed',
    backgroundColor: '#fff', overflow: 'hidden',
  },
  uploadBoxActive: { borderStyle: 'solid', borderColor: '#196F31' },
  uploadPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  uploadText: { color: '#196F31', fontWeight: '700' },
  previewImage: { width: '100%', height: '100%' },
  removeImg: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: '#fff', borderRadius: 12,
  },
  toggleCard: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E8F3EB', gap: 12,
  },
  toggleTitle: { fontSize: 15, fontWeight: '700', color: '#123D1F' },
  toggleSub: { fontSize: 12, color: '#A0B4A5', marginTop: 2 },
  footer: {
    padding: 20, backgroundColor: '#fff',
    borderTopWidth: 1.5, borderTopColor: '#E8F3EB',
  },
  submitBtn: {
    backgroundColor: '#196F31', height: 60, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: '#A0B4A5', elevation: 0 },
  btnContent: { flexDirection: 'row', alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#F0F9F4', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#C5D9C9',
    alignSelf: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#123D1F', marginBottom: 14 },
  modalSearch: {
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1.5, borderColor: '#E8F3EB',
    fontSize: 15, color: '#123D1F', marginBottom: 12,
  },
  routeItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14, marginBottom: 8,
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8F3EB',
  },
  routeItemActive: { backgroundColor: '#196F31', borderColor: '#196F31' },
  routeItemText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#123D1F' },
  routeItemTextActive: { color: '#fff' },
  clearRouteBtn: { marginTop: 8, alignItems: 'center', padding: 12 },
  clearRouteTxt: { color: '#E24B4A', fontWeight: '700', fontSize: 14 },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(240,249,244,0.92)', zIndex: 999,
  },
  successCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#196F31', justifyContent: 'center', alignItems: 'center',
    marginBottom: 16,
    elevation: 8, shadowColor: '#196F31', shadowOpacity: 0.3, shadowRadius: 20,
  },
  successText: { fontSize: 22, fontWeight: '900', color: '#123D1F' },

});