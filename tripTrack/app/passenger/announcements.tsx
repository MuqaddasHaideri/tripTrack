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
import { useTranslation } from 'react-i18next';

const AUDIENCE_META: Record<string, { label: string; icon: string; color: string }> = {
  all: { label: 'Everyone', icon: 'people-outline', color: '#196F31' },
  passenger: { label: 'Passengers', icon: 'person-outline', color: '#2980B9' },
  driver: { label: 'Drivers', icon: 'car-outline', color: '#D35400' },
};

export default function AnnouncementsScreen() {
  const { t } = useTranslation();
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
          <View style={[styles.iconCircle, { backgroundColor: '#F0F9F4' }]}>
            <Ionicons name={badge.icon as any} size={24} color="#196F31" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.cardSub} numberOfLines={2}>{item.body}</Text>
            <View style={styles.cardMeta}>
              <View style={[styles.audienceTag, { backgroundColor: badge.color + '12' }]}>
                <Text style={[styles.audienceTagText, { color: badge.color }]}>
                  {badge.label}
                </Text>
              </View>
              <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#196F31" style={{ alignSelf: 'center' }} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBg}>
        <Ionicons name="megaphone" size={32} color="#196F31" />
      </View>
      <Text style={styles.emptyTitle}>{t("announcements.emptyTitle")}</Text>
      <Text style={styles.emptySub}>
        {t("announcements.emptySubtitle")}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerCircleBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("announcements.headerTitle")}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#196F31" />
          <Text style={styles.loadingText}>{t("announcements.loading")}</Text>
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
          showsVerticalScrollIndicator={false}
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
                    <TouchableOpacity onPress={() => setSelectedAnnouncement(null)}>
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
                      <Ionicons name="person-circle-outline" size={16} color="#A0B4A5" />
                      <Text style={styles.authorText}>
                        {t("announcements.postedBy")} {selectedAnnouncement.createdBy.name}
                      </Text>
                    </View>
                  )}

                  {/* Body */}
                  <View style={styles.textAreaWrap}>
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

  // Loading
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#4A6B54', fontSize: 13, fontWeight: '600' },

  // List
  listContent: { padding: 20, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#fff', padding: 20, borderRadius: 24,
    borderWidth: 2, borderColor: '#196F31',
    elevation: 4, shadowColor: '#196F31', shadowOpacity: 0.1, shadowRadius: 10,
    marginBottom: 16,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: '#F0F9F4', justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#123D1F', marginBottom: 4 },
  cardSub: { fontSize: 13, color: '#8E8E93', marginTop: 2, marginBottom: 10 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  audienceTag: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10,
  },
  audienceTagText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardDate: { fontSize: 11, color: '#A0B4A5', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },

  // Empty State
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyIconBg: {
    width: 68, height: 68, borderRadius: 34, backgroundColor: '#fff',
    alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 18,
    borderWidth: 2, borderColor: '#196F31',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#123D1F', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#4A6B54', textAlign: 'center', paddingHorizontal: 40, lineHeight: 20 },

  // Modal Sheet
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#F0F9F4', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#C5D9C9',
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '800', color: '#123D1F', flex: 1, marginRight: 12,
  },
  modalMetaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalDate: { fontSize: 11, color: '#A0B4A5', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  authorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16,
  },
  authorText: { fontSize: 12, color: '#4A6B54', fontWeight: '700' },
  textAreaWrap: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    borderWidth: 2, borderColor: '#196F31', minHeight: 120,
  },
  modalBody: { fontSize: 15, color: '#123D1F', lineHeight: 22 },
});