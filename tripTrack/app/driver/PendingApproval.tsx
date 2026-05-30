import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { checkApprovalStatusApi } from '../../service/server';

const POLL_INTERVAL_MS = 15000;

export default function PendingApprovalScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [checking, setChecking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!email) return;

    const checkStatus = async () => {
      setChecking(true);
      try {
        const res = await checkApprovalStatusApi(email);
        if (res?.approved) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          Alert.alert(
            "Approved!",
            "Your account has been approved. Please log in to continue.",
            [{ text: "Go to Login", onPress: () => router.replace('/(auth)/login') }]
          );
        }
      } catch {
        // Silently ignore polling errors
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
    intervalRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [email]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircleOuter}>
            <View style={styles.iconCircleInner}>
              <Ionicons name="time-outline" size={48} color="#196F31" />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Application Under Review</Text>
        <Text style={styles.subtitle}>
          Your driver registration has been submitted successfully. Our admin team is currently reviewing your documents.
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#196F31" />
            <Text style={styles.infoText}>Your CNIC and license are being verified</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="notifications-outline" size={20} color="#196F31" />
            <Text style={styles.infoText}>You will be notified once approved</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Ionicons name="hourglass-outline" size={20} color="#196F31" />
            <Text style={styles.infoText}>This usually takes 24-48 hours</Text>
          </View>
        </View>

        <View style={styles.statusBadge}>
          {checking ? (
            <ActivityIndicator size="small" color="#D35400" />
          ) : (
            <View style={styles.statusDot} />
          )}
          <Text style={styles.statusText}>
            {checking ? 'Checking status...' : 'Status: Pending Approval'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={18} color="#196F31" />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9F4',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#196F31',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#123D1F',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#6A8E75',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#D1E8D9',
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8F3EB',
    marginVertical: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9E7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FAC775',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D35400',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#854F0B',
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 55,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#196F31',
    backgroundColor: '#fff',
  },
  backButtonText: {
    color: '#196F31',
    fontSize: 16,
    fontWeight: '700',
  },
});
