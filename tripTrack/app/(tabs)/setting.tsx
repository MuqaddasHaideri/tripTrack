import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { ThemedText } from '../../components/themed-text';
import { Colors } from '../../constants/theme';
import { logout } from '../../redux/authSlice';
import DriverButton from '@/components/ui/driverButton';


// Saved for later use
const GridOption = ({ title, icons, onPress }) => (
  <TouchableOpacity
    style={[styles.gridCard, { backgroundColor: '#0A2E1F' }]}
    onPress={onPress}
  >
    <View style={styles.gridIconRow}>
      {icons.map((icon, index) => (
        <View key={index} style={[styles.iconBadge, { backgroundColor: icon.bg }]}>
          <Ionicons name={icon.name} size={18} color="white" />
        </View>
      ))}
    </View>
    <ThemedText style={styles.gridTitle}>{title}</ThemedText>
  </TouchableOpacity>
);

const ListOption = ({ title, subtitle, icon, colors, onPress, isLast, isDestructive, showChevron = true }) => (
  <TouchableOpacity
    style={[
      styles.listRow,
      !isLast && { borderBottomWidth: 1, borderBottomColor: colors.separator }
    ]}
    onPress={onPress}
  >
    {icon && (
      <View style={styles.listIconBox}>
        <Ionicons name={icon} size={22} color={isDestructive ? '#FF3B30' : colors.icon} />
      </View>
    )}
    <View style={styles.listTextContent}>
      <ThemedText
        type="defaultSemiBold"
        style={[styles.listTitle, isDestructive && { color: '#FF3B30', textAlign: 'center', width: '100%' }]}
      >
        {title}
      </ThemedText>
      {subtitle && <ThemedText style={styles.listSubtitle}>{subtitle}</ThemedText>}
    </View>
    {!isDestructive && showChevron && (
      <Ionicons name="chevron-forward" size={20} color={colors.icon} style={{ opacity: 0.3 }} />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const theme = useColorScheme() ?? 'dark';
  const activeColors = Colors[theme];
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out", style: "destructive", onPress: () => {
          dispatch(logout());
          router.replace('/');
        }
      }
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: '#021a11' }]}
      contentContainerStyle={styles.contentContainer}
    >
      <ThemedText type="title" style={styles.header}>Settings</ThemedText>
       {user ? (
        <View style={[styles.profileCard, { backgroundColor: '#0A2E1F' }]}>
          <View style={styles.avatar}>

            <ThemedText style={styles.avatarText}>
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </ThemedText>
          </View>
          
          <View style={styles.userName}>
            <ThemedText type="subtitle">
              {user.name || "User"}
            </ThemedText>
            
            <ThemedText style={styles.userEmail}>
              {user.email}
            </ThemedText>
            
            <View style={styles.badgeContainer}>
              <ThemedText style={styles.roleText}>
                {user.role ? user.role.toUpperCase() : "PASSENGER"}
              </ThemedText>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.guestCard, { backgroundColor: '#0A2E1F' }]}>
          <Ionicons name="star" size={30} color="#FFD700" />
          <View style={styles.guestContent}>
            <ThemedText style={styles.guestTitle}>Unlock Smart Features</ThemedText>
            <ThemedText style={styles.guestSubtitle}>Save routes & get alerts.</ThemedText>
          </View>
          <TouchableOpacity
            style={styles.loginBtnSmall}
            onPress={() => router.push('/passenger/login')}
          >
            <ThemedText style={styles.loginBtnText}>Login</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Options List */}
      <View style={[styles.listCard, { backgroundColor: '#0A2E1F' }]}>
        <ListOption
          title="Favorite Routes"
          subtitle="Manage your saved lines"
          icon="heart-outline"
          colors={activeColors}
          // onPress={() router.push('/favorites')}
        />
        <ListOption
          title="Report Issue"
          subtitle="Traffic, Accidents, Bugs"
          icon="alert-circle-outline" 
          colors={activeColors}
        />
        <ListOption
          title="Schedules"
          subtitle="View static time tables"
          icon="time-outline" 
          colors={activeColors}
          isLast={true}
          onPress={() => router.push('/passenger/schedule')}
        />
      </View>

      {(!user || user.role === 'driver') && (
        <>
          <ThemedText style={styles.sectionHeader}>PARTNER AREA</ThemedText>
              <DriverButton onPress={() => router.push('/driver/login')} />
          {/* <View style={[styles.listCard, { backgroundColor: activeColors.primary || '#00C853' }]}>
            <TouchableOpacity
              style={styles.driverButton}
              onPress={() => router.push('/driver/login')}
            >
              <Ionicons name="bus" size={24} color="white" />
              <View style={styles.driverContent}>
                <ThemedText style={styles.driverTitle}>Driver Mode</ThemedText>
                <ThemedText style={styles.driverSubtitle}>Broadcast live location</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </TouchableOpacity>
          </View> */}
        </>
      )}

      {/* Log Out Button */}
      {user && (
        <View style={[styles.listCard, { backgroundColor: '#0A2E1F', marginTop: 10 }]}>
          <ListOption
            title="Log Out"
            colors={activeColors}
            isDestructive={true}
            isLast={true}
            onPress={handleLogout}
          />
        </View>
      )}

      <ThemedText style={styles.version}>MetroLive v1.0.0 (Beta)</ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20, paddingVertical: 60 },
  header: { marginBottom: 20, fontSize: 28, fontWeight: 'bold', color: 'white' },

  // Profile Styling
  profileCard: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 20, marginBottom: 25 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
  profileInfo: { flex: 1 },
  userName: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  userEmail: { color: '#81C784', fontSize: 13, marginBottom: 8 },
  roleBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 5, alignSelf: 'flex-start' },
  roleText: { color: '#00C853', fontSize: 10, fontWeight: 'bold' },

  // Guest Styling
  guestCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  guestContent: { flex: 1, marginLeft: 15 },
  guestTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  guestSubtitle: { color: '#81C784', fontSize: 12 },
  loginBtnSmall: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  loginBtnText: { fontWeight: 'bold', color: '#021a11', fontSize: 12 },

  // List Layout
  listCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 15 },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: 18, justifyContent: 'space-between' },
  listTextContent: { flex: 1 },
  listTitle: { fontSize: 16, color: 'white' },
  listSubtitle: { fontSize: 12, color: '#81C784', marginTop: 4 },
  listIconBox: { marginRight: 15 },

  // Driver Section
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#4CAF50', marginBottom: 8, marginLeft: 5, letterSpacing: 0.5 },
  driverButton: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  driverContent: { flex: 1, marginLeft: 15 },
  driverTitle: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  driverSubtitle: { fontSize: 12, color: '#e0e0e0' },

  // Grid (Hidden for now as requested)
  gridCard: { width: '48%', borderRadius: 20, padding: 16, marginBottom: 15, height: 110, justifyContent: 'flex-end' },
  gridTitle: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  gridIconRow: { flexDirection: 'row', position: 'absolute', top: 12, left: 12 },
  iconBadge: { padding: 5, borderRadius: 12, marginRight: -5, borderWidth: 2, borderColor: '#0A2E1F' },

  version: { textAlign: 'center', color: '#4CAF50', opacity: 0.5, marginTop: 20, fontSize: 12 }
});