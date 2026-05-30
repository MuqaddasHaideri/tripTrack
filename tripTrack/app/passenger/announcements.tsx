import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSelector } from 'react-redux';
import { fetchUserAnnouncementsApi } from '../../service/server';

const AUDIENCE_META: Record<string, { label: string; icon: string; color: string }> = {
  all: { label: 'Everyone', icon: 'people-outline', color: '#196F31' },
  passenger: { label: 'Passengers', icon: 'person-outline', color: '#2980B9' },
  driver: { label: 'Drivers', icon: 'car-outline', color: '#D35400' },
};

export default function AnnouncementsScreen() {
  const router = useRouter();
  const { token } = useSelector((state: any) => state.auth);

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      if (token) loadAnnouncements();
      else setIsLoading(false);
    }, [token])
  );

  const loadAnnouncements = async (isRefreshing = false) => {
    try {
      if (isRefreshing) setRefreshing(true);
      else setIsLoading(true);

      const res = await fetchUserAnnouncementsApi(token);
      if (res?.success && Array.isArray(res.announcements)) {
        setAnnouncements(res.announcements);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getBadge = (audience: string) => AUDIENCE_META[audience] || AUDIENCE_META.all;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFullDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString([], {
      weekday: 'long', month: 'long', day: 'numeric',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const renderCard = ({ item }: { item: any }) => {
    const badge = getBadge(item.targetAudience);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setSelectedAnnouncement(item)}
      >
        <View style={styles.cardRow}>
          <View style={[styles.iconWrap, { backgroundColor: badge.color + '15' }]}>
            <Ionicons name={badge.icon as any} size={22} color={badge.color} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardPreview} numberOfLines={2}>{item.body}</Text>
            <View style={styles.cardMeta}>
              <View style={[styles.audienceTag, { backgroundColor: badge.color + '12' }]}>
                <Text style={[styles.audienceTagText, { color: badge.color }]}>
                  {badge.label}
                </Text>
              </View>
              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#A0B4A5" style={{ alignSelf: 'center' }} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBg}>
        <Ionicons name="megaphone-outline" size={32} color="#196F31" />
      </View>
      <Text style={styles.emptyTitle}>No Announcements</Text>
      <Text style={styles.emptySub}>
        There are no announcements for you at this time. Check back later!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color="#123D1F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#196F31" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={item => item._id}
          renderItem={renderCard}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => loadAnnouncements(true)}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selectedAnnouncement}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedAnnouncement(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {selectedAnnouncement && (() => {
              const badge = getBadge(selectedAnnouncement.targetAudience);
              return (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Modal header */}
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedAnnouncement.title}</Text>
                    <TouchableOpacity onPress={() => setSelectedAnnouncement(null)} hitSlop={10}>
                      <Ionicons name="close-circle" size={28} color="#A0B4A5" />
                    </TouchableOpacity>
                  </View>

                  {/* Meta row */}
                  <View style={styles.modalMetaRow}>
                    <View style={[styles.audienceTag, { backgroundColor: badge.color + '12' }]}>
                      <Ionicons name={badge.icon as any} size={14} color={badge.color} style={{ marginRight: 4 }} />
                      <Text style={[styles.audienceTagText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                    <Text style={styles.modalDate}>
                      {formatFullDate(selectedAnnouncement.createdAt)}
                    </Text>
                  </View>

                  {selectedAnnouncement.createdBy?.name && (
                    <View style={styles.authorRow}>
                      <Ionicons name="person-circle-outline" size={16} color="#6A8E75" />
                      <Text style={styles.authorText}>
                        Posted by {selectedAnnouncement.createdBy.name}
                      </Text>
                    </View>
                  )}

                  {/* Body */}
                  <View style={styles.modalBodyWrap}>
                    <Text style={styles.modalBody}>{selectedAnnouncement.body}</Text>
                  </View>
                </ScrollView>
              );
            })()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9F4' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E8F3EB',
    elevation: 4, shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#F0F9F4', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#D1E8D9',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#123D1F' },

  // Loading
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6A8E75', fontSize: 13, fontWeight: '600' },

  // List
  listContent: { padding: 14, paddingBottom: 30 },

  // Card
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: '#E8F3EB',
    elevation: 2, shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#123D1F', marginBottom: 4 },
  cardPreview: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  audienceTag: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  audienceTagText: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 11, color: '#A0B4A5', fontWeight: '600' },

  // Empty
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyIconBg: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: '#E8F5E9',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    borderWidth: 2, borderColor: '#D1E8D9',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#123D1F', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6A8E75', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(18, 61, 31, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#D1E8D9', alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20, fontWeight: '800', color: '#123D1F', flex: 1, marginRight: 12,
  },
  modalMetaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalDate: { fontSize: 12, color: '#6A8E75', fontWeight: '600' },
  authorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16,
  },
  authorText: { fontSize: 13, color: '#6A8E75', fontWeight: '600' },
  modalBodyWrap: {
    backgroundColor: '#F0F9F4', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#D1E8D9',
  },
  modalBody: { fontSize: 15, color: '#333', lineHeight: 24 },
});
