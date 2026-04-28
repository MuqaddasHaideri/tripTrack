import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Image,
  Text,
  Platform,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/authSlice';

const { width } = Dimensions.get('window');

const ListOption = ({ title, subtitle, icon, onPress, isLast, isDestructive, showChevron = true }) => (
  <TouchableOpacity
    activeOpacity={0.7}
    style={[
      styles.listRow,
      !isLast && { borderBottomWidth: 1, borderBottomColor: '#E8F3EB' }
    ]}
    onPress={onPress}
  >
    <View style={[styles.listIconBox, { backgroundColor: isDestructive ? '#FFF1F0' : '#F0F9F4' }]}>
      <Ionicons name={icon} size={20} color={isDestructive ? '#FF3B30' : '#196F31'} />
    </View>
    <View style={styles.listTextContent}>
      <Text style={[styles.listTitle, isDestructive && { color: '#FF3B30' }]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.listSubtitle}>{subtitle}</Text>}
    </View>
    {!isDestructive && showChevron && (
      <Ionicons name="chevron-forward" size={18} color="#A0B4A5" />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of TripTrack?", [
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
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" />
      
      <Text style={styles.header}>Settings</Text>

      {/* --- PREMIUM PROFILE SECTION --- */}
      {user ? (
   <TouchableOpacity 
          activeOpacity={0.9}
          onPress={() => router.push('/passenger/profileScreen')} 
          style={styles.profileCard}
        >
          <View style={styles.profileBackgroundDecor} />
          <View style={styles.profileInner}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarBorder}>
                <Image 
                  source={{ uri: user.profilePic || 'https://via.placeholder.com/150' }} 
                  style={styles.avatarImg} 
                />
              </View>
              <TouchableOpacity style={styles.editBadge}>
                <Ionicons name="camera" size={12} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name || "user"}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <View style={styles.roleTag}>
                <Ionicons name="person-outline" size={12} color="#196F31" style={{marginRight: 4}} />
                <Text style={styles.roleText}>
                  {user.role ? user.role.toUpperCase() : "PASSENGER"}
                </Text>
              </View>
            </View>
          </View>
       </TouchableOpacity >
      ) : (
        <TouchableOpacity style={styles.guestCard} onPress={() => router.push('/(auth)/login')}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="leaf" size={24} color="#196F31" />
          </View>
          <View style={styles.guestContent}>
            <Text style={styles.guestTitle}>Sign in to TripTrack</Text>
            <Text style={styles.guestSubtitle}>Track your routes & save favorite stops</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#196F31" />
        </TouchableOpacity>
      )}

      {/* --- MENU SECTIONS --- */}
      {user?.role !== 'driver' && (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT PREFERENCES</Text>
        <View style={styles.cardGroup}>
          <ListOption
            title="Favorite Routes"
            subtitle="Manage your saved bus lines"
            icon="heart-outline"
            //colors={activeColors}
          />
          <ListOption
            title="Schedules"
            subtitle="View static bus time-tables"
            icon="time-outline"
            isLast={true}
            onPress={() => router.push('/passenger/schedule')}
          />
        </View>
      </View>
      )}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>APP & SUPPORT</Text>
        <View style={styles.cardGroup}>
          <ListOption
            title="Report an Issue"
            subtitle="Traffic, bugs or suggestions"
            icon="alert-circle-outline"
          />
          {/* <ListOption
            title="Help Center"
            subtitle="FAQs and Guide"
            icon="help-circle-outline"
            isLast={true}
          /> */}
        </View>
      </View>

      {user && (
        <View style={[styles.cardGroup, { marginTop: 10, borderColor: '#FF3B30' }]}>
          <ListOption
            title="Sign Out"
            icon="power"
            isDestructive={true}
            isLast={true}
            showChevron={false}
            onPress={handleLogout}
          />
        </View>
      )}

      <Text style={styles.version}>tripTrack • v1.0.0 (Beta)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9F4' },
  contentContainer: { padding: 20, paddingVertical: 60 },
  header: { 
    fontSize: 34, 
    fontWeight: '900', 
    color: '#000', 
    marginBottom: 35,
    letterSpacing: -1,
  },

  // --- Profile Styling ---
  profileCard: { 
    backgroundColor: '#FFF',
    borderRadius: 28, 
    marginBottom: 35,
    borderWidth: 2,
    borderColor: '#196F31',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#196F31',
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  profileBackgroundDecor: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F0F9F4',
  },
  profileInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: { position: 'relative' },
  avatarBorder: { 
    width: 86, 
    height: 86, 
    borderRadius: 43, 
    borderWidth: 3,
    borderColor: '#196F31',
    padding: 3,
    backgroundColor: '#FFF'
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 40 },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#196F31',
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFF'
  },
  profileInfo: { flex: 1, marginLeft: 18 },
  userName: { color: '#000', fontSize: 24, fontWeight: '800', marginBottom: 2 },
  userEmail: { color: '#8E8E93', fontSize: 14, marginBottom: 12 },
  roleTag: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F0F9F4', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 10, 
    alignSelf: 'flex-start' 
  },
  roleText: { color: '#196F31', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  // --- List/Card Styling ---
  section: { marginBottom: 30 },
  sectionLabel: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: '#8E8E93', 
    marginBottom: 12, 
    marginLeft: 10, 
    letterSpacing: 1.2 
  },
  cardGroup: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    borderWidth: 2,
    borderColor: '#196F31',
    overflow: 'hidden',
  },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  listIconBox: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 16 
  },
  listTextContent: { flex: 1 },
  listTitle: { fontSize: 17, color: '#000', fontWeight: '700' },
  listSubtitle: { fontSize: 13, color: '#8E8E93', marginTop: 3 },

  // --- Guest ---
  guestCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 35,
    borderWidth: 2,
    borderColor: '#196F31'
  },
  guestIconCircle: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0F9F4', justifyContent: 'center', alignItems: 'center' },
  guestContent: { flex: 1, marginLeft: 16 },
  guestTitle: { color: '#000', fontWeight: '800', fontSize: 18 },
  guestSubtitle: { color: '#8E8E93', fontSize: 13, marginTop: 2 },

  version: { textAlign: 'center', color: '#A0B4A5', marginTop: 20, fontSize: 13, fontWeight: '700' }
});