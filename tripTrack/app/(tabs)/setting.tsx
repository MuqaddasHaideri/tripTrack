import React, { useEffect } from 'react';
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
  Dimensions,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../redux/authSlice';
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../../translation/index";
import { setLanguage } from "../../redux/languageSlice";
import { useTranslation } from "react-i18next";
const { width } = Dimensions.get('window');

const ListOption = ({
  title,
  subtitle,
  icon,
  onPress,
  isLast,
  isDestructive,
  showChevron = true,
  rightComponent,
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    style={[
      styles.listRow,
      !isLast && {
        borderBottomWidth: 1,
        borderBottomColor: "#E8F3EB",
      },
    ]}
    onPress={onPress}
    disabled={!!rightComponent} // Prevent row press when switch exists
  >
    <View
      style={[
        styles.listIconBox,
        {
          backgroundColor: isDestructive ? "#FFF1F0" : "#F0F9F4",
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={isDestructive ? "#FF3B30" : "#196F31"}
      />
    </View>

    <View style={styles.listTextContent}>
      <Text
        style={[
          styles.listTitle,
          isDestructive && { color: "#FF3B30" },
        ]}
      >
        {title}
      </Text>

      {subtitle && (
        <Text style={styles.listSubtitle}>
          {subtitle}
        </Text>
      )}
    </View>

    {rightComponent ? (
      rightComponent
    ) : (
      !isDestructive &&
      showChevron && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color="#A0B4A5"
        />
      )
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
    const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isGuest } = useSelector((state) => state.auth);
  const language = useSelector(
    (state) => state.language.language
  );
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
  const handleLogout = () => {
    Alert.alert(t("settings.logoutTitle"), t("settings.logoutMessage"), [
      { text: t("settings.cancel"), style: "cancel" },
      {
        text: t("settings.logout"), style: "destructive", onPress: () => {
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

      <Text style={styles.header}>{t("settings.title")}</Text>

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
                <Ionicons name="person-outline" size={12} color="#196F31" style={{ marginRight: 4 }} />
                <Text style={styles.roleText}>
                  {user.role ? user.role.toUpperCase() : "PASSENGER"}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.guestCard} onPress={() => router.push('/(auth)/login')}>
          <View style={styles.guestIconCircle}>
            <Ionicons name="leaf" size={24} color="#196F31" />
          </View>
          <View style={styles.guestContent}>
            <Text style={styles.guestTitle}>{t("settings.guestTitle")}</Text>
            <Text style={styles.guestSubtitle}>{t("settings.guestSubtitle")}</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#196F31" />
        </TouchableOpacity>
      )}

      {/* --- MENU SECTIONS --- */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("settings.accountPreferences")}</Text>
        <View style={styles.cardGroup}>

          {/* Show Favorite Routes ONLY if logged in AND NOT a driver */}
          {user && user.role !== 'driver' && (
            <ListOption
              title={t("settings.favoriteRoutes")}
              subtitle={t("settings.favoriteRoutesSubtitle")}
              icon="heart-outline"
              onPress={() => router.push('/passenger/favouriteRoutes')}
            />
          )}

          {/* Schedule is visible to EVERYONE (Guests, Passengers, Drivers) */}
          <ListOption
            title={t("settings.schedules")}
            subtitle={t("settings.schedulesSubtitle")}
            icon="time-outline"
            isLast={false}
            onPress={() => router.push('/passenger/schedule')}
          />
          <ListOption
            title={t("settings.language")}
            subtitle={t("settings.languageSubtitle")}
            icon="language-outline"
            isLast={true}
            rightComponent={
              <Switch
                value={language === "ur"}
                onValueChange={toggleLanguage}
                trackColor={{
                  false: "#D1D5DB",
                  true: "#196F31",
                }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

      </View>

      {/* Show App & Support ONLY if logged in */}
      {user && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("settings.appSupport")}</Text>
          <View style={styles.cardGroup}>
            <ListOption
              title={t("settings.announcements")}
              subtitle={t("settings.announcementsSubtitle")}
              icon="megaphone-outline"
              onPress={() => router.push('/passenger/announcements')}
            />
            <ListOption
              title={t("settings.reportIssue")}
              subtitle={t("settings.reportIssueSubtitle")}
              icon="alert-circle-outline"
              isLast={true}
              onPress={() => router.push('/passenger/report-issue')}
            />
          </View>
        </View>
      )}

      {/* Show Sign Out ONLY if logged in */}
      {user && (
        <View style={[styles.cardGroup, { marginTop: 10, borderColor: '#FF3B30' }]}>
          <ListOption
            title={t("settings.signOut")}
            icon="power"
            isDestructive={true}
            isLast={true}
            showChevron={false}
            onPress={handleLogout}
          />
        </View>
      )}

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