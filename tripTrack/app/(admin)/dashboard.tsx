import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  StatusBar, Alert, Platform, Pressable, FlatList, Modal, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { logout } from '../../redux/authSlice';
import { fetchNotificationsApi, markAllNotificationsReadApi } from '../../service/server';

import { VerifyDriversView } from '../../components/admin/VerifyDriversView';
import { TransitManagementView } from '../../components/admin/TransitManagementView';
import { UserReportsView } from '../../components/admin/UserReportsView';
import { ProvisionAdminView } from '../../components/admin/ProvisionAdminView';
import { BroadcastStationView } from '../../components/admin/BroadcastStationView';
import { useTranslation } from 'react-i18next';
import i18n from '@/translation';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setLanguage } from '@/redux/languageSlice';

interface NavItemProps {
  title: string;
  icon: string;
  active: boolean;
  badge?: number;
  onPress: () => void;
}

const NavItem = ({ title, icon, active, badge, onPress }: NavItemProps) => (
  <TouchableOpacity
    style={[styles.navItem, active && styles.navItemActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >

    <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
      <Ionicons name={icon as any} size={18} color={active ? '#196F31' : '#6A8E75'} />
    </View>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{title}</Text>
    {!!badge && badge > 0 && (
      <View style={styles.badgePill}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    {active && <View style={styles.activeBar} />}
  </TouchableOpacity>
);

// ─── MAIN COMPONENT ──

export default function AdminDashboardScreen() {
  const { t } = useTranslation();
  const TABS_CONFIG = [
    {
      id: 'verify',
      title: t('adminDashboard.driverVerification'),
      label: t('adminDashboard.verifyDrivers'),
      icon: 'card-outline',
      component: VerifyDriversView,
      badge: 0,
    },
    {
      id: 'transit',
      title: t('adminDashboard.routesAssetManagement'),
      label: t('adminDashboard.routesBuses'),
      icon: 'git-branch-outline',
      component: TransitManagementView,
      badge: 0,
    },
    {
      id: 'reports',
      title: t('adminDashboard.userReportsHub'),
      label: t('adminDashboard.userReports'),
      icon: 'chatbubbles-outline',
      component: UserReportsView,
      badge: 0,
    },
    {
      id: 'admin',
      title: t('adminDashboard.manageAdministrativeStaff'),
      label: t('adminDashboard.addAdmin'),
      icon: 'person-add-outline',
      component: ProvisionAdminView,
      badge: 0,
    },
    {
      id: 'broadcast',
      title: t('adminDashboard.globalAnnouncements'),
      label: t('adminDashboard.announcements'),
      icon: 'megaphone-outline',
      component: BroadcastStationView,
      badge: 0,
    },
  ] as const;

  type TabId = typeof TABS_CONFIG[number]['id'];

  const router = useRouter();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: any) => state.auth);

  const [activeTab, setActiveTab] = useState<TabId>('verify');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const language = useSelector(
    (state) => state.language.language
  );
  const isUrdu = language === "ur";
  const loadNotifications = async () => {
    if (!token) return;
    const res = await fetchNotificationsApi(token);
    if (res?.success) {
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    }
  };

  const toggleLanguage = async () => {
    try {
      const newLanguage = language === "en" ? "ur" : "en";

      // Update Redux
      dispatch(setLanguage(newLanguage));

      // Update i18next
      await i18n.changeLanguage(newLanguage);

      // Save language
      await AsyncStorage.setItem("language", newLanguage);
    } catch (error) {
      console.log("Language change error:", error);
    }
  };
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem("language");

      if (savedLanguage) {
        dispatch(setLanguage(savedLanguage));
        await i18n.changeLanguage(savedLanguage);
      }
    };

    loadLanguage();
  }, []);

  useEffect(() => {
    loadNotifications();

    // Poll every 15 seconds for new notifications
    const pollInterval = setInterval(loadNotifications, 15000);

    return () => clearInterval(pollInterval);
  }, [token]);

  const currentTab = TABS_CONFIG.find(t => t.id === activeTab) ?? TABS_CONFIG[0];
  const ActiveComponent = currentTab.component;

  const handleLogout = () => {
    Alert.alert(t('adminDashboard.logoutTitle'), t('adminDashboard.logoutMessage'), [
      { text: t('adminDashboard.cancel'), style: 'cancel' },
      {
        text: t('adminDashboard.logout'),
        style: 'destructive',
        onPress: () => {
          dispatch(logout());
          router.replace('/');
        },
      },
    ]);
  };

  const initials = (user?.name ?? 'Super Admin')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0F9F4" />

      {/* ── FULL-SCREEN CONTENT ─ */}
      <View style={styles.fullScreen}>

        {/* Topbar */}
        <View style={styles.topbar}>
          <View style={styles.topbarLeft}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setSidebarOpen(true)}
              hitSlop={10}
            >
              <Ionicons name="menu" size={22} color="#123D1F" />
            </TouchableOpacity>
            <View>
              <Text style={styles.workspaceTitle}>{currentTab.title}</Text>
              <Text style={styles.workspaceSub}>{t('adminDashboard.managementWorkspace')}</Text>
            </View>
          </View>

          <View style={styles.topbarRight}>
            <TouchableOpacity
              style={styles.topbarIconBtn}
              onPress={() => {
                setNotifPanelOpen(true);
                if (unreadCount > 0 && token) {
                  markAllNotificationsReadApi(token).then(() => {
                    setUnreadCount(0);
                    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  });
                }
              }}
            >
              <Ionicons name="notifications-outline" size={20} color="#196F31" />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.topbarIconBtn}>
              <Ionicons name="search-outline" size={20} color="#196F31" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.tabContent}>
          <ActiveComponent />
        </View>
      </View>

      {/* ── SIDEBAR OVERLAY ──*/}
      {sidebarOpen && (
        <>
          {/* Dim backdrop — cloe when tap anywhere*/}
          <Pressable style={styles.backdrop} onPress={() => setSidebarOpen(false)} />

          {/* Sidebar panel */}
          <View style={styles.sidebar}>

            {/* Header */}
            <View style={styles.sidebarHeader}>
              <View style={styles.logoRow}>
                <View style={styles.logoIconBg}>
                  <Ionicons name="shield-checkmark" size={18} color="#196F31" />
                </View>
                <Text style={styles.logoText}>
                  TripTrack <Text style={styles.logoAccent}>{t('adminDashboard.console')}</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSidebarOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#6A8E75" />
              </TouchableOpacity>
            </View>

            {/* Operations section */}
            <Text style={styles.navSectionLabel}>{t('adminDashboard.operations')}</Text>
            {TABS_CONFIG.slice(0, 3).map(tab => (
              <NavItem
                key={tab.id}
                title={tab.label}
                icon={tab.icon}
                active={activeTab === tab.id}
                badge={tab.badge}
                onPress={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
              />
            ))}

            {/* Admin section */}
            <Text style={[styles.navSectionLabel, { marginTop: 10 }]}>{t('adminDashboard.admin')}</Text>
            {TABS_CONFIG.slice(3).map(tab => (
              <NavItem
                key={tab.id}
                title={tab.label}
                icon={tab.icon}
                active={activeTab === tab.id}
                badge={tab.badge}
                onPress={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
              />
            ))}

            {/* Footer */}
            <View style={styles.languageCard}>
              <View style={styles.languageInfo}>
                <Ionicons name="language-outline" size={20} color="#196F31" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.languageTitle}>
                    {t('settings.language')}
                  </Text>
                  <Text style={styles.languageSubtitle}>
                    {isUrdu ? 'اردو' : 'English'}
                  </Text>
                </View>
              </View>

              <Switch
                value={isUrdu}
                onValueChange={toggleLanguage}
                trackColor={{ false: '#D1E8D9', true: '#196F31' }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.sidebarFooter}>
              <View style={styles.userCard}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name ?? 'SuperAdmin'}
                  </Text>
                  <Text style={styles.userRole}>{user?.role ?? t('adminDashboard.administrator')}</Text>
                </View>
                <View style={styles.onlineDot} />
              </View>

              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                <Text style={styles.signOutText}>{t('adminDashboard.signOut')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
      {/* notification model */}
      <Modal
        visible={notifPanelOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setNotifPanelOpen(false)}
      >
        <View style={styles.notifModalOverlay}>
          <View style={styles.notifModalSheet}>
            <View style={styles.notifModalHeader}>
              <Text style={styles.notifModalTitle}>{t('adminDashboard.notifications')}</Text>
              <TouchableOpacity onPress={() => setNotifPanelOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#6A8E75" />
              </TouchableOpacity>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Ionicons name="notifications-off-outline" size={40} color="#A0B4A5" />
                <Text style={styles.notifEmptyText}>{t('adminDashboard.noNotifications')}</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item._id || Math.random().toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.notifItem, !item.isRead && { borderColor: '#196F31' }]}
                    onPress={() => {
                      setNotifPanelOpen(false);
                      if (item.type === 'driver_registration') setActiveTab('verify');
                      else if (item.type === 'user_report') setActiveTab('reports');
                    }}
                  >
                    <View style={[
                      styles.notifIconWrap,
                      item.type === 'driver_registration' ? { backgroundColor: '#E8F5E9' } : { backgroundColor: '#FEF9E7' }
                    ]}>
                      <Ionicons
                        name={item.type === 'driver_registration' ? 'car-outline' : 'warning-outline'}
                        size={18}
                        color={item.type === 'driver_registration' ? '#196F31' : '#D35400'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifItemTitle}>{item.title}</Text>
                      <Text style={styles.notifItemBody} numberOfLines={2}>{item.body}</Text>
                      <Text style={styles.notifItemTime}>
                        {new Date(item.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F0F9F4',
  },

  fullScreen: {
    flex: 1,
    backgroundColor: '#F0F9F4',
  },


  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D1E8D9',
    elevation: 4,
    shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },

  topbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F9F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1E8D9',
  },

  workspaceTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#123D1F',
  },

  workspaceSub: {
    fontSize: 11,
    color: '#6A8E75',
    fontWeight: '600',
    marginTop: 1,
  },

  topbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  topbarIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0F9F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1E8D9',
    position: 'relative',
  },

  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },


  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D1E8D9',
  },

  statCard: {
    flex: 1,
    backgroundColor: '#F0F9F4',
    borderRadius: 12,
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
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1E8D9',
  },

  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#123D1F',
    letterSpacing: -0.5,
  },

  statLabel: {
    fontSize: 10,
    color: '#6A8E75',
    fontWeight: '600',
    textAlign: 'center',
  },

  tabContent: {
    flex: 1,
  },


  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 61, 31, 0.45)',
    zIndex: 10,
  },

  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#FFFFFF',
    zIndex: 20,
    paddingTop: 20,
    paddingHorizontal: 14,
    paddingBottom: 16,
    borderRightWidth: 1.5,
    borderRightColor: '#196F31',
    ...Platform.select({
      ios: {
        shadowColor: '#196F31',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },

  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D1E8D9',
    marginBottom: 4,
    marginTop: 10,
    paddingVertical: 4,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  logoIconBg: {
    backgroundColor: '#F0F9F4',
    padding: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#D1E8D9',
  },

  logoText: {
    color: '#123D1F',
    fontSize: 20,
    fontWeight: '700',
  },

  logoAccent: {
    color: '#196F31',
    fontWeight: '400',
  },

  navSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#6A8E75',
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 6,
  },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 2,
    position: 'relative',
    overflow: 'hidden',
  },

  navItemActive: {
    backgroundColor: '#F0F9F4',
    borderWidth: 1,
    borderColor: '#D1E8D9',
  },

  navIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F0F9F4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1E8D9',
  },

  navIconWrapActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#196F31',
  },

  navLabel: {
    flex: 1,
    color: '#6A8E75',
    fontSize: 13.5,
    fontWeight: '600',
  },

  navLabelActive: {
    color: '#123D1F',
    fontWeight: '800',
  },

  activeBar: {
    position: 'absolute',
    left: 0,
    top: '20%',
    width: 3,
    height: '60%',
    backgroundColor: '#196F31',
    borderRadius: 2,
  },

  badgePill: {
    backgroundColor: '#196F31',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // ── Sidebar Footer ────────────────────────────────────────────────────────

  sidebarFooter: {
    marginTop: 'auto',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#D1E8D9',
    gap: 10,
    marginBottom: 18,
  },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F9F4',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#D1E8D9',
  },

  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#196F31',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  userName: {
    color: '#123D1F',
    fontSize: 13,
    fontWeight: '800',
  },

  userRole: {
    color: '#6A8E75',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#196F31',
  },

  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(239,68,68,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },

  signOutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Notification Panel Modal ─────────────────────────────────────────────

  notifModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },

  notifModalSheet: {
    backgroundColor: '#F0F9F4',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '70%',
  },

  notifModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D1E8D9',
  },

  notifModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#123D1F',
  },

  notifEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },

  notifEmptyText: {
    fontSize: 15,
    color: '#A0B4A5',
    fontWeight: '600',
  },

  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8F3EB',
  },

  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  notifItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#123D1F',
    marginBottom: 2,
  },

  notifItemBody: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },

  notifItemTime: {
    fontSize: 11,
    color: '#A0B4A5',
    marginTop: 4,
    fontWeight: '600',
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#196F31',
    alignSelf: 'center',
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F9F4',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#D1E8D9',
  },

  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  languageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#123D1F',
  },

  languageSubtitle: {
    fontSize: 11,
    color: '#6A8E75',
    marginTop: 2,
  },
});