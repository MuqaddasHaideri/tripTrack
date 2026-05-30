import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  StatusBar, Alert, Platform, Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { logout } from '../../redux/authSlice';

// ─── TAB COMPONENT IMPORTS ────────────────────────────────────────────────────
// Each tab lives in its own file under components/admin/
// Add new tabs here — no other change needed in this file.
import { VerifyDriversView }    from '../../components/admin/VerifyDriversView';
import { TransitManagementView } from '../../components/admin/TransitManagementView';
import { UserReportsView }       from '../../components/admin/UserReportsView';
import { ProvisionAdminView }    from '../../components/admin/ProvisionAdminView';
import { BroadcastStationView }  from '../../components/admin/BroadcastStationView';

// ─── TAB CONFIG ───────────────────────────────────────────────────────────────

const TABS_CONFIG = [
  {
    id:        'verify',
    title:     'Driver Verification',
    label:     'Verify Drivers',
    icon:      'card-outline',
    component: VerifyDriversView,
    badge:     4,
  },
  {
    id:        'transit',
    title:     'Routes & Asset Management',
    label:     'Routes & Buses',
    icon:      'git-branch-outline',
    component: TransitManagementView,
    badge:     0,
  },
  {
    id:        'reports',
    title:     'User Reports Hub',
    label:     'User Reports',
    icon:      'chatbubbles-outline',
    component: UserReportsView,
    badge:     12,
  },
  {
    id:        'admin',
    title:     'Manage Administrative Staff',
    label:     'Add an Admin',
    icon:      'person-add-outline',
    component: ProvisionAdminView,
    badge:     0,
  },
  {
    id:        'broadcast',
    title:     'Global Announcements',
    label:     'Announcements',
    icon:      'megaphone-outline',
    component: BroadcastStationView,
    badge:     0,
  },
] as const;

type TabId = typeof TABS_CONFIG[number]['id'];

// ─── STAT CARD ────────────────────────────────────────────────────────────────

interface StatCardProps { label: string; value: string; icon: string; }

const StatCard = ({ label, value, icon }: StatCardProps) => (
  <View style={styles.statCard}>
    <View style={styles.statIconBg}>
      <Ionicons name={icon as any} size={18} color="#196F31" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// ─── SIDEBAR NAV ITEM ─────────────────────────────────────────────────────────

interface NavItemProps {
  title:   string;
  icon:    string;
  active:  boolean;
  badge?:  number;
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

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AdminDashboardScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state: any) => state.auth);

  const [activeTab, setActiveTab]     = useState<TabId>('verify');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentTab      = TABS_CONFIG.find(t => t.id === activeTab) ?? TABS_CONFIG[0];
  const ActiveComponent = currentTab.component;

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of TripTrack?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
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

      {/* ── FULL-SCREEN CONTENT ─────────────────────────────────────────── */}
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
              <Text style={styles.workspaceSub}>Management Workspace</Text>
            </View>
          </View>

          <View style={styles.topbarRight}>
            <TouchableOpacity style={styles.topbarIconBtn}>
              <Ionicons name="notifications-outline" size={20} color="#196F31" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.topbarIconBtn}>
              <Ionicons name="search-outline" size={20} color="#196F31" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Row */}
        {/* <View style={styles.statsRow}>
          <StatCard label="Verified"   value="2,841" icon="checkmark-circle-outline" />
          <StatCard label="Pending"    value="47"    icon="time-outline"             />
          <StatCard label="Routes"     value="128"   icon="bus-outline"              />
          <StatCard label="Passengers" value="94k"   icon="people-outline"           />
        </View> */}

        {/*
          ── ACTIVE TAB COMPONENT ─────────────────────────────────────────
          Rendered with flex: 1 so it fills remaining space.
          Components that use FlatList / ScrollView internally (like
          VerifyDriversView) handle their own scrolling — do NOT wrap
          them in another ScrollView here.
        */}
        <View style={styles.tabContent}>
          <ActiveComponent />
        </View>
      </View>

      {/* ── SIDEBAR OVERLAY ────────────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          {/* Dim backdrop — tap anywhere to close */}
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
                  TripTrack <Text style={styles.logoAccent}>Console</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSidebarOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color="#6A8E75" />
              </TouchableOpacity>
            </View>

            {/* Operations section */}
            <Text style={styles.navSectionLabel}>OPERATIONS</Text>
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
            <Text style={[styles.navSectionLabel, { marginTop: 10 }]}>ADMIN</Text>
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
            <View style={styles.sidebarFooter}>
              <View style={styles.userCard}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name ?? 'SuperAdmin'}
                  </Text>
                  <Text style={styles.userRole}>System Administrator</Text>
                </View>
                <View style={styles.onlineDot} />
              </View>

              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={16} color="#EF4444" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F0F9F4',
  },

  fullScreen: {
    flex: 1,
    backgroundColor: '#F0F9F4',
  },

  // ── Topbar ────────────────────────────────────────────────────────────────

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

  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // ── Stats Row ─────────────────────────────────────────────────────────────

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

  // ── Tab Content ───────────────────────────────────────────────────────────
  // flex: 1 so the component fills all remaining vertical space.
  // Components with FlatList/ScrollView will scroll inside this container.
  // Components that are purely static can add their own padding/scrolling.

  tabContent: {
    flex: 1,
  },

  // ── Overlay Sidebar ───────────────────────────────────────────────────────

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
    fontSize: 15,
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
  },

  signOutText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
});