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

const AUDIENCE_OPTIONS = [
  { key: 'all', label: 'All Users', icon: 'people-outline', color: '#196F31' },
  { key: 'passenger', label: 'Passengers', icon: 'person-outline', color: '#2980B9' },
  { key: 'driver', label: 'Drivers', icon: 'car-outline', color: '#D35400' },
];

export const BroadcastStationView = () => {
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
      Alert.alert('Error', 'Could not load announcements.');
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
      Alert.alert('Missing Field', 'Please enter a title.');
      return;
    }
    if (!body.trim()) {
      Alert.alert('Missing Field', 'Please enter the announcement body.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await createAnnouncementApi(
        { title: title.trim(), body: body.trim(), targetAudience },
        token
      );
      if (res?.success) {
        Alert.alert('Success', 'Announcement published successfully!');
        setTitle('');
        setBody('');
        setTargetAudience('all');
        setActiveView('list');
        loadAnnouncements();
      } else {
        Alert.alert('Error', res?.message || 'Failed to create announcement.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Announcement',
      'Are you sure you want to permanently delete this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(id);
            try {
              const res = await deleteAnnouncementApi(id, token);
              if (res?.success) {
                setAnnouncements(prev => prev.filter(a => a._id !== id));
              } else {
                Alert.alert('Error', res?.message || 'Failed to delete.');
              }
            } catch (error) {
              Alert.alert('Error', 'Could not delete announcement.');
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
          <View style={[styles.audienceIconWrap, { backgroundColor: badge.color + '15' }]}>
            <Ionicons name={badge.icon as any} size={20} color={badge.color} />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardBody} numberOfLines={3}>{item.body}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.audienceBadge, { backgroundColor: badge.color + '15' }]}>
            <Text style={[styles.audienceBadgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
          <Text style={styles.cardTimestamp}>
            {new Date(item.createdAt).toLocaleDateString([], {
              month: 'short', day: 'numeric', year: 'numeric'
            })}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item._id)}
          disabled={deletingId === item._id}
        >
          {deletingId === item._id ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <Ionicons name="trash-outline" size={15} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBg}>
        <Ionicons name="megaphone-outline" size={28} color="#196F31" />
      </View>
      <Text style={styles.emptyTitle}>No Announcements Yet</Text>
      <Text style={styles.emptySub}>
        Create your first announcement to broadcast to users.
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
      >
        <View style={styles.formCard}>
          <Text style={styles.formSectionLabel}>ANNOUNCEMENT DETAILS</Text>

          <Text style={styles.inputLabel}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Route 12 Maintenance Update"
            placeholderTextColor="#A0B4A5"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />

          <Text style={styles.inputLabel}>Body</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Write the full announcement details here..."
            placeholderTextColor="#A0B4A5"
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>{body.length}/1000</Text>

          <Text style={styles.formSectionLabel}>TARGET AUDIENCE</Text>
          <View style={styles.audienceRow}>
            {AUDIENCE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.audienceChip,
                  targetAudience === opt.key && {
                    borderColor: opt.color,
                    backgroundColor: opt.color + '12',
                  },
                ]}
                onPress={() => setTargetAudience(opt.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon as any}
                  size={16}
                  color={targetAudience === opt.key ? opt.color : '#6A8E75'}
                />
                <Text
                  style={[
                    styles.audienceChipText,
                    targetAudience === opt.key && { color: opt.color, fontWeight: '700' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.publishBtn, submitting && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#FFF" />
              <Text style={styles.publishBtnText}>Publish Announcement</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.container}>
      {/* Segment Toggle */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, activeView === 'list' && styles.activeSegmentButton]}
          onPress={() => setActiveView('list')}
          activeOpacity={0.9}
        >
          <Text style={[styles.segmentText, activeView === 'list' && styles.activeSegmentText]}>
            All Announcements
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentButton, activeView === 'create' && styles.activeSegmentButton]}
          onPress={() => setActiveView('create')}
          activeOpacity={0.9}
        >
          <Text style={[styles.segmentText, activeView === 'create' && styles.activeSegmentText]}>
            Create New
          </Text>
        </TouchableOpacity>
      </View>

      {activeView === 'create' ? (
        renderCreateForm()
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#196F31" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={item => item._id || Math.random().toString()}
          renderItem={renderAnnouncementCard}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => loadAnnouncements(true)}
        />
      )}
    </View>
  );
};

export default BroadcastStationView;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 10, color: '#666', fontSize: 13 },
  listContent: { paddingVertical: 12, paddingHorizontal: 14 },

  // Segment
  segmentContainer: {
    flexDirection: 'row', backgroundColor: '#EFEFEF',
    marginHorizontal: 14, marginTop: 14, marginBottom: 4,
    borderRadius: 10, padding: 4,
  },
  segmentButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 8,
  },
  activeSegmentButton: {
    backgroundColor: '#FFF', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1, shadowRadius: 2,
  },
  segmentText: { fontSize: 13, fontWeight: '600', color: '#666' },
  activeSegmentText: { color: '#123D1F', fontWeight: '700' },

  // Cards
  card: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 16,
    marginBottom: 12, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  audienceIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTextWrap: { marginLeft: 12, flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#123D1F', marginBottom: 4 },
  cardBody: { fontSize: 13, color: '#444', lineHeight: 18 },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  audienceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  audienceBadgeText: { fontSize: 11, fontWeight: '700' },
  cardTimestamp: { fontSize: 11, color: '#888' },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 9, borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  deleteBtnText: { color: '#EF4444', fontWeight: '600', fontSize: 13 },

  // Empty state
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIconBg: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#E8F5E9', alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 32 },

  // Create form
  formContainer: { padding: 14, paddingBottom: 40 },
  formCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 18,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  formSectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1,
    color: '#6A8E75', marginBottom: 12, marginTop: 4,
  },
  inputLabel: {
    fontSize: 13, fontWeight: '700', color: '#123D1F', marginBottom: 6,
  },
  input: {
    backgroundColor: '#F0F9F4', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#123D1F',
    borderWidth: 1, borderColor: '#D1E8D9',
    marginBottom: 14,
  },
  textArea: { minHeight: 120, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#A0B4A5', textAlign: 'right', marginTop: -10, marginBottom: 14 },

  audienceRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  audienceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5,
    borderColor: '#D1E8D9', backgroundColor: '#F0F9F4',
  },
  audienceChipText: { fontSize: 13, fontWeight: '600', color: '#6A8E75' },

  publishBtn: {
    backgroundColor: '#196F31', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12, gap: 8,
    marginTop: 20, elevation: 3,
    shadowColor: '#196F31', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 6,
  },
  publishBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
