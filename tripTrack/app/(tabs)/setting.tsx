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
import { ThemedView } from '../../components/themed-view';
import { Colors } from '../../constants/theme';
import { logout } from '../../redux/authSlice';

export default function SettingsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const theme = useColorScheme() ?? 'light';
  const activeColors = Colors[theme];
  
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure?",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Log Out", 
          style: "destructive", 
          onPress: () => {
            dispatch(logout());
            router.replace('/'); 
          }
        }
      ]
    );
  };

  
  return (
    <ScrollView 
      style={[
        styles.container, 
        { backgroundColor: activeColors.screenBackground }
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      <ThemedText type="title" style={styles.header}>
        Settings
      </ThemedText>

      {user ? (
        <View 
          style={[
            styles.profileCard, 
            { backgroundColor: activeColors.cardBackground }
          ]}
        >
          <View style={styles.avatar}>

            <ThemedText style={styles.avatarText}>
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </ThemedText>
          </View>
          
          <View style={styles.profileInfo}>
            <ThemedText type="subtitle">
              {user.name || "User"}
            </ThemedText>
            
            <ThemedText style={styles.profileEmail}>
              {user.email}
            </ThemedText>
            
            <View style={styles.badgeContainer}>
              <ThemedText style={styles.roleBadge}>
                {user.role ? user.role.toUpperCase() : "PASSENGER"}
              </ThemedText>
            </View>
          </View>
        </View>
      ) : (
        <View 
          style={[
            styles.guestCard,
            { backgroundColor: activeColors.guestCardBackground }
          ]}
        >
          <Ionicons 
            name="star" 
            size={30} 
            color={activeColors.warning} 
          />
          <View style={styles.guestContent}>
            <ThemedText style={styles.guestTitle}>
              Unlock Smart Features
            </ThemedText>
            <ThemedText style={styles.guestSubtitle}>
              Save routes & get alerts.
            </ThemedText>
          </View>

          <TouchableOpacity 
            style={styles.loginBtnSmall} 
            onPress={() => router.push('/passenger/login')} 
          >
            <ThemedText style={styles.loginBtnText}>
              Login
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <View 
        style={[
          styles.section, 
          { backgroundColor: activeColors.cardBackground }
        ]}
      >
        <OptionItem 
          icon="heart-outline" 
          title="Favorite Routes" 
          subtitle={user ? "Manage your saved lines" : "Login to save routes"} 
          colors={activeColors}
          separatorColor={activeColors.separator}
        />
        <OptionItem 
          icon="alert-circle-outline" 
          title="Report Issue" 
          subtitle="Traffic, Accidents, Bugs" 
          colors={activeColors}
          separatorColor={activeColors.separator}
        />
        <OptionItem 
          icon="time-outline" 
          title="Schedules" 
          subtitle="View static time tables" 
          colors={activeColors}
          separatorColor={activeColors.separator}
          isLast={true} 
        />
      </View>

      {(!user || user.role === 'driver') && (
        <>
          <ThemedText style={styles.sectionHeader}>
            PARTNER AREA
          </ThemedText>
          
          <View 
            style={[
              styles.section, 
              { backgroundColor: activeColors.cardBackground }
            ]}
          >
            <TouchableOpacity 
              style={[
                styles.driverButton, 
                { backgroundColor: activeColors.primary }
              ]} 
              onPress={() => router.push('/driver/login')}
            >
              <Ionicons 
                name="bus" 
                size={24} 
                color="white" 
              />
              <View style={styles.driverContent}>
                <ThemedText style={styles.driverTitle}>
                  Driver Mode
                </ThemedText>
                <ThemedText style={styles.driverSubtitle}>
                  Broadcast live location
                </ThemedText>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color="white" 
                style={styles.chevronRight} 
              />
            </TouchableOpacity>
          </View>
        </>
      )}

      {user && (
        <TouchableOpacity 
          style={[
            styles.logoutButton, 
            { backgroundColor: activeColors.cardBackground }
          ]} 
          onPress={handleLogout}
        >
          <ThemedText style={styles.logoutText}>
            Log Out
          </ThemedText>
        </TouchableOpacity>
      )}

      <ThemedText style={styles.version}>
        MetroLive v1.0.0 (Beta)
      </ThemedText>
    </ScrollView>
  );
}

function OptionItem({ icon, title, subtitle, colors, separatorColor, isLast }) {
  return (
    <TouchableOpacity 
      style={[
        styles.optionItem,
        !isLast && { borderBottomWidth: 1, borderBottomColor: separatorColor }
      ]}
    >
      <View style={styles.iconBox}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={colors.icon} 
        />
      </View>
      <View>
        <ThemedText type="defaultSemiBold">
          {title}
        </ThemedText>
        <ThemedText 
          style={[
            styles.optionSubtitle, 
            { color: colors.icon }
          ]}
        >
          {subtitle}
        </ThemedText>
      </View>
      <Ionicons 
        name="chevron-forward" 
        size={20} 
        color={colors.icon} 
        style={[styles.chevronRight, { opacity: 0.3 }]} 
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  contentContainer: {
    padding: 20
  },
  header: {
    marginBottom: 20
  },
  
  section: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 2
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.6,
    marginBottom: 8,
    marginLeft: 5,
    letterSpacing: 0.5
  },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2
    },
    elevation: 2
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00C853',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold'
  },
  profileInfo: {
    flex: 1
  },
  profileEmail: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 4
  },
  badgeContainer: {
    flexDirection: 'row'
  },
  roleBadge: {
    backgroundColor: '#e8f5e9',
    color: '#00C853',
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden'
  },

  guestCard: {
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 4
    },
    elevation: 3
  },
  guestContent: {
    flex: 1,
    marginLeft: 15
  },
  guestTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  guestSubtitle: {
    color: '#ccc',
    fontSize: 12
  },
  loginBtnSmall: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  loginBtnText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 12
  },

  
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16
  },
  iconBox: {
    width: 40,
    alignItems: 'center',
    marginRight: 10
  },
  optionSubtitle: {
    fontSize: 12,
    marginTop: 2
  },
  chevronRight: {
    marginLeft: 'auto'
  },

  driverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 0
  },
  driverContent: {
    marginLeft: 15
  },
  driverTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white'
  },
  driverSubtitle: {
    fontSize: 12,
    color: '#e0e0e0'
  },

  // Logout
  logoutButton: {
    marginTop: 10,
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 16
  },

  version: {
    textAlign: 'center',
    opacity: 0.4,
    marginTop: 20,
    marginBottom: 50,
    fontSize: 12
  }
});