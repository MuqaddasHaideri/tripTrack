import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux'; 
import { logout } from '../../redux/authSlice';

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: () => dispatch(logout()) }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {/* --- SECTION 1: DYNAMIC HEADER --- */}
      {user ? (
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name ? user.name[0].toUpperCase() : 'U'}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user.name || "User"}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.roleBadge}>{user.role ? user.role.toUpperCase() : "PASSENGER"}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.guestCard}>
          <Ionicons name="star" size={30} color="#FFD700" />
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.guestTitle}>Unlock Smart Features</Text>
            <Text style={styles.guestSubtitle}>Save routes & get alerts.</Text>
          </View>

<TouchableOpacity 
    style={styles.loginBtnSmall} 
    onPress={() => router.push('/passenger/login')} 
>
    <Text style={styles.loginBtnText}>Login</Text>
</TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <OptionItem 
          icon="heart-outline" 
          title="Favorite Routes" 
          subtitle={user ? "Manage your saved lines" : "Login to save routes"} 
        />
        <OptionItem 
          icon="alert-circle-outline" 
          title="Report Issue" 
          subtitle="Traffic, Accidents, Bugs" 
        />
        <OptionItem 
          icon="time-outline" 
          title="Schedules" 
          subtitle="View static time tables" 
        />
      </View>

      {(!user || user.role === 'driver') && (
        <>
          <Text style={styles.sectionHeader}>PARTNER AREA</Text>
          <View style={styles.section}>
            <TouchableOpacity style={styles.driverButton} onPress={() => router.push('/driver/login')}>
              <Ionicons name="bus" size={24} color="white" />
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.driverTitle}>Driver Mode</Text>
                <Text style={styles.driverSubtitle}>Broadcast live location</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* --- SECTION 4: LOGOUT --- */}
      {user && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.version}>MetroLive v1.0.0 (Beta)</Text>
    </ScrollView>
  );
}

function OptionItem({ icon, title, subtitle }) {
  return (
    <TouchableOpacity style={styles.optionItem}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color="#555" />
      </View>
      <View>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" style={{ marginLeft: 'auto' }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  
  section: { backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', marginBottom: 25 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 8, marginLeft: 5, letterSpacing: 0.5 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2
  },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  avatarText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  profileEmail: { color: '#666', fontSize: 13, marginBottom: 4 },
  badgeContainer: { flexDirection: 'row' },
  roleBadge: { backgroundColor: '#e8f5e9', color: '#00C853', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },

  guestCard: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3
  },
  guestTitle: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  guestSubtitle: { color: '#ccc', fontSize: 12 },
  loginBtnSmall: { backgroundColor: 'white', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  loginBtnText: { fontWeight: 'bold', color: '#333', fontSize: 12 },

  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  iconBox: { width: 40, alignItems: 'center', marginRight: 10 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  optionSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },

  driverButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    backgroundColor: '#00C853',
    borderRadius: 0, 
  },
  driverTitle: { fontSize: 16, fontWeight: 'bold', color: 'white' },
  driverSubtitle: { fontSize: 12, color: '#e0e0e0' },

  logoutButton: { marginTop: 10, alignItems: 'center', padding: 15, backgroundColor: '#fff', borderRadius: 12 },
  logoutText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 },

  version: { textAlign: 'center', color: '#bbb', marginTop: 30, marginBottom: 50, fontSize: 12 },
});