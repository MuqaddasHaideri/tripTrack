import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import {
  createAnnouncementApi,
  fetchAdminAnnouncementsApi,
  deleteAnnouncementApi,
} from '../../service/server';
import { useTranslation } from 'react-i18next';

export const BroadcastStationView = () => {
  const { t } = useTranslation();

  const AUDIENCE_OPTIONS = [
    { key: 'all', label: t('announcement.all'), icon: 'people-outline', color: '#196F31' },
    { key: 'passenger', label: t('announcement.passenger'), icon: 'person-outline', color: '#2980B9' },
    { key: 'driver', label: t('announcement.driver'), icon: 'car-outline', color: '#D35400' },
  ];

  const { token } = useSelector((state: any) => state.auth);

  const [activeView, setActiveView] = useState<'list' | 'create'>('list');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');

  const loadAnnouncements = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setLoading(true);

      if (!token) { setAnnouncements([]); return; }

      const res = await fetchAdminAnnouncementsApi(token);
      if (res?.success && Array.isArray(res.announcements)) {
        setAnnouncements(res.announcements);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
      Alert.alert(t('announcement.error'), t('announcement.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (token) loadAnnouncements();
  }, [token]);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert(t('announcement.missingField'), t('announcement.enterTitle'));
      return;
    }
    if (!body.trim()) {
      Alert.alert(t('announcement.missingField'), t('announcement.enterBody'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAnnouncementApi(
        { title: title.trim(), body: body.trim(), targetAudience },
        token
      );
      if (res?.success) {
        Alert.alert(t('announcement.success'), t('announcement.announcementPublished'));
        setTitle('');
        setBody('');
        setTargetAudience('all');
        setActiveView('list');
        loadAnnouncements();
      } else {
        Alert.alert(t('announcement.error'), res?.message || t('announcement.createError'));
      }
    } catch (error) {
      console.error(error);
      Alert.alert(t('announcement.error'), t('announcement.genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      t('announcement.deleteAnnouncement'),
      t('announcement.deleteConfirmation'),
      [
        { text: t('announcement.cancel'), style: 'cancel' },
        {
          text: t('announcement.delete'),
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              const res = await deleteAnnouncementApi(id, token);
              if (res?.success) {
                setAnnouncements(prev => prev.filter(a => a._id !== id));
              } else {
                Alert.alert(t('announcement.error'), res?.message || t('announcement.deleteAnnouncementError'));
              }
            } catch (error) {
              Alert.alert(t('announcement.error'), t('announcement.deleteAnnouncementError'));
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const getAudienceBadge = (audience: string) => {
    const opt = AUDIENCE_OPTIONS.find(o => o.key === audience);
    return opt || AUDIENCE_OPTIONS[0];
  };
const renderAnnouncementCard = ({ item }: { item: any }) => {
  const badge = getAudienceBadge(item.targetAudience);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="megaphone" size={24} color="#196F31" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        </View>

        <TouchableOpacity 
          style={styles.trashBtn} 
          activeOpacity={0.6} 
          onPress={() => handleDelete(item._id)}
          disabled={deletingId === item._id}
        >
          {deletingId === item._id ? (
            <ActivityIndicator size="small" color="#E24B4A" />
          ) : (
            <Ionicons name="trash-outline" size={18} color="#E24B4A" />
          )}
        </TouchableOpacity>
      </View>
      <Text style={styles.reportDetails}>{item.body}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.dateRow}>
          <Ionicons name="time-outline" size={16} color="#A0B4A5" />
          <Text style={styles.timestamp}>
            {item.createdAt ? new Date(item.createdAt).toLocaleDateString([], {
              month: 'short', day: 'numeric', year: 'numeric'
            }) : 'Date Unknown'}
          </Text>
        </View>
        <View style={[styles.priorityChip, { backgroundColor: badge.color + '15', borderColor: badge.color + '30' }]}>
          <Text style={[styles.priorityChipText, { color: badge.color }]}>
            {badge.label}
          </Text>
        </View>
      </View>
    </View>
  );
};

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="megaphone-outline" size={44} color="#6A8E75" />
      </View>
      <Text style={styles.emptyTitle}>{t('announcement.noAnnouncements')}</Text>
      <Text style={styles.emptySub}>
        {t('announcement.noAnnouncementsDescription')}
      </Text>
    </View>
  );

  const renderCreateForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.formSectionLabel}>{t('announcement.announcementDetails')}</Text>

          <Text style={styles.inputLabel}>{t('announcement.title')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('announcement.placeholderTitle')}
            placeholderTextColor="#A0B4A5"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />

          <Text style={styles.inputLabel}>{t('announcement.body')}</Text>
          <View style={styles.textAreaWrap}>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('announcement.placeholderBody')}
              placeholderTextColor="#A0B4A5"
              value={body}
              onChangeText={setBody}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text style={styles.charCount}>{body.length}/1000</Text>
          </View>

          <Text style={styles.formSectionLabel}>{t('announcement.targetAudience')}</Text>
          <View style={styles.audienceRow}>
            {AUDIENCE_OPTIONS.map(opt => {
              const active = targetAudience === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.audienceChip,
                    active && {
                      borderColor: opt.color,
                      backgroundColor: opt.color + '15',
                    },
                  ]}
                  onPress={() => setTargetAudience(opt.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={16}
                    color={active ? opt.color : '#6A8E75'}
                  />
                  <Text
                    style={[
                      styles.audienceChipText,
                      active && { color: opt.color, fontWeight: '800' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, (!title.trim() || !body.trim() || submitting) && styles.actionBtnDisabled]}
          onPress={handleCreate}
          disabled={submitting || !title.trim() || !body.trim()}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Text style={styles.actionBtnText}>{t('announcement.publishAnnouncement')}</Text>
              <Ionicons name="send" size={16} color="#FFF" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, activeView === 'list' && styles.activeSegmentButton]}
          onPress={() => setActiveView('list')}
          activeOpacity={1}
        >
          <Text style={[styles.segmentText, activeView === 'list' && styles.activeSegmentText]}>
            {t('announcement.allAnnouncements')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, activeView === 'create' && styles.activeSegmentButton]}
          onPress={() => setActiveView('create')}
          activeOpacity={1}
        >
          <Text style={[styles.segmentText, activeView === 'create' && styles.activeSegmentText]}>
            {t('announcement.createNew')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeView === 'create' ? (
        renderCreateForm()
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#196F31" />
          <Text style={styles.loadingText}>{t('announcement.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={item => item._id || Math.random().toString()}
          renderItem={renderAnnouncementCard}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => loadAnnouncements(true)}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9F4' },

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
  priorityChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1.5 },
  priorityChipText: { fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  trashBtn: { padding: 4, marginLeft: 8 },
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9F4' },
  loadingText: { marginTop: 12, color: '#6A8E75', fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 5 },
  segmentContainer: {
    flexDirection: 'row', backgroundColor: '#E8F3EB',
    marginHorizontal: 20, marginTop: 16, marginBottom: 6,
    borderRadius: 16, padding: 3, height: 44, alignItems: 'center'
  },
  segmentButton: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', borderRadius: 14 },
  activeSegmentButton: {
    backgroundColor: '#FFF', height: 38, elevation: 3,
    shadowColor: '#196F31', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4
  },
  segmentText: { fontSize: 13, fontWeight: '700', color: '#6A8E75' },
  activeSegmentText: { color: '#196F31', fontWeight: '800' },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  cardTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#123D1F',
    flex: 1
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#196F31',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    flexShrink: 1,
  },
  routeName: { fontSize: 13, fontWeight: '800', color: 'white' },
  heartBtn: { padding: 4, minWidth: 28, alignItems: 'center', marginLeft: 'auto' },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 5,
    marginLeft: 10,
  },
  liveStatusText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  
  pathText: { fontSize: 15, fontWeight: '600', color: '#4A6B54', lineHeight: 22, marginVertical: 14 },
  etaText: { fontSize: 13, color: '#6A8E75', fontWeight: '600' },
  etaMuted: { color: '#8E8E93', fontWeight: '700', fontSize: 13 },
  formContainer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 5 },
  formCard: {
    backgroundColor: '#fff', borderRadius: 24, padding: 20,
    borderWidth: 2, borderColor: '#E8F3EB',
    elevation: 4, shadowColor: '#196F31', shadowOpacity: 0.05, shadowRadius: 10,
  },
  formSectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#A0B4A5',
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginBottom: 14, marginTop: 6,
  },
  inputLabel: { fontSize: 14, fontWeight: '800', color: '#123D1F', marginBottom: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#123D1F', fontWeight: '700',
    borderWidth: 2, borderColor: '#E8F3EB',
    marginBottom: 16,
  },
  textAreaWrap: { position: 'relative' },
  textArea: { minHeight: 140, paddingTop: 14, paddingBottom: 30, textAlignVertical: 'top' },
  charCount: { position: 'absolute', bottom: 26, right: 14, fontSize: 11, color: '#A0B4A5', fontWeight: '600' },
  audienceRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  audienceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1.5,
    borderColor: '#E8F3EB', backgroundColor: '#fff',
  },
  audienceChipText: { fontSize: 13, fontWeight: '700', color: '#4A6B54' },
  actionBtn: { backgroundColor: '#196F31', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 20, elevation: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionBtnDisabled: { backgroundColor: '#A0B4A5', elevation: 0 },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12, marginTop: 80 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', borderWidth: 2, borderColor: '#E8F3EB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#123D1F', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingHorizontal: 32, fontWeight: '500' },
});

export default BroadcastStationView;