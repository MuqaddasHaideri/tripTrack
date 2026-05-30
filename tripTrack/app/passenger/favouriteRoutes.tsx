import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, 
  StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSelector } from 'react-redux';

// Service Imports (Make sure socket is exported from here)
import { fetchMyFavoritesApi, removeFavoriteApi, socket } from '../../service/server';

export default function FavoriteRoutesScreen() {
  const router = useRouter();
  const { token } = useSelector((state: any) => state.auth);

  // --- STATE ---
  const [favoriteRoutes, setFavoriteRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  
  const [activeDriverRoutes, setActiveDriverRoutes] = useState<Record<string, boolean>>({});

  // Fetch static favorite data array from database
  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadFavorites();
      } else {
        setIsLoading(false);
      }
    }, [token])
  );

  const loadFavorites = async () => {
    try {
      const data = await fetchMyFavoritesApi(token);
      if (data.success && data.favorites) {
        setFavoriteRoutes(data.favorites);
      }
    } catch (e) {
      console.log("Error loading favorite routes:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // --- REAL-TIME SOCKET LISTENER FOR DRIVER ACTIVITY ---
  useEffect(() => {
    if (!socket.connected) socket.connect();

    // When any bus moves across Karachi, it shouts its routeId
    const handleGlobalBusTracking = (busData: any) => {
      if (busData.routeId) {
        setActiveDriverRoutes((prev) => ({
          ...prev,
          [busData.routeId]: true, 
        }));
      }
    };

    // driver turns off location or disconnects
    const handleGlobalBusOffline = (data: any) => {
      if (data.routeId) {
        setActiveDriverRoutes((prev) => ({
          ...prev,
          [data.routeId]: false, 
        }));
      }
    };

    socket.on('bus_moved', handleGlobalBusTracking);
    socket.on('bus_offline', handleGlobalBusOffline);

    return () => {
      socket.off('bus_moved', handleGlobalBusTracking);
      socket.off('bus_offline', handleGlobalBusOffline);
    };
  }, []);

  const handleDelete = (routeId: string, name: string) => {
    Alert.alert(
      "Remove Favorite", 
      `Are you sure you want to remove ${name} from your shortcuts?`, 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => executeRemoval(routeId) 
        }
      ]
    );
  };

  const executeRemoval = async (routeId: string) => {
    setIsDeletingId(routeId);
    try {
      const data = await removeFavoriteApi(routeId, token);
      if (data.success) {
        setFavoriteRoutes(prev => prev.filter(route => route._id !== routeId));
      } else {
        Alert.alert("Error", data.message || "Failed to remove route.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Could not connect to transit server cluster.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const renderRouteCard = ({ item }: { item: any }) => {
    const isDelayed = item.status === 'Delayed';
    const routeTitle = item.route_name || 'Active Route';
    
    // Check if socket coordinates are currently broadcasting for this route item ID
    const isDriverActive = !!activeDriverRoutes[item._id];

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/(tabs)/index', params: { activeRouteId: item._id } })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
            <Ionicons name="bus" size={16} color="white" />
            <Text style={styles.routeName}>{routeTitle}</Text>
          </View>

          {/* DYNAMIC LIVE DRIVER ACTIVITY INDICATOR */}
          <View style={[styles.liveStatusBadge, isDriverActive ? styles.activeLiveBg : styles.offlineLiveBg]}>
            <View style={[styles.liveDot, { backgroundColor: isDriverActive ? '#00C853' : '#8E8E93' }]} />
            <Text style={[styles.liveStatusText, { color: isDriverActive ? '#123D1F' : '#666' }]}>
              {isDriverActive ? 'LIVE' : 'OFFLINE'}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => handleDelete(item._id, routeTitle)} 
            style={styles.heartBtn}
            disabled={isDeletingId === item._id}
          >
            {isDeletingId === item._id ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <Ionicons name="heart" size={26} color="#FF3B30" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.pathText}>
          {item.origin || 'Start'} ➔ {item.destination || 'End'}
        </Text>

        <View style={styles.cardFooter}>
          {/* <View style={[styles.statusIndicator, isDelayed && styles.statusDelayedBg]}>
            <Text style={[styles.statusText, isDelayed && styles.statusDelayedText]}>
              {item.status || 'On Time'}
            </Text>
          </View> */}
          <Text style={styles.etaText}>
            {isDriverActive ? (
              <>Tracking Status: <Text style={styles.etaHighlight}>Active on Map</Text></>
            ) : (
              <>Next Bus: <Text style={styles.etaMuted}>No driver tracking</Text></>
            )}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#196F31" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Favorite Routes</Text>
          <Text style={styles.headerSubtitle}>Quick access to your regular transits</Text>
        </View>
      </View>

      {favoriteRoutes.length > 0 ? (
        <FlatList
          data={favoriteRoutes}
          keyExtractor={(item) => item._id}
          renderItem={renderRouteCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-outline" size={44} color="#6A8E75" />
          </View>
          <Text style={styles.emptyTitle}>Your shortcuts list is empty</Text>
          <Text style={styles.emptySub}>Save your daily commute lines from the map tracking panel to see them here.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.replace('/(tabs)/.')}>
            <Text style={styles.actionBtnText}>Explore Live Routes</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9F4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9F4' },
  
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },

  list: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 5 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#196F31',
    elevation: 4,
    shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#196F31',
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    gap: 6 
  },
  routeName: { fontSize: 13, fontWeight: '800', color: 'white' },
  heartBtn: { padding: 4, minWidth: 28, alignItems: 'center', marginLeft: 'auto' },
  
  // NEW ACTIVE LIVE BADGE STYLES
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
    marginLeft: 10
  },
  activeLiveBg: { backgroundColor: '#E1F5EE' },
  offlineLiveBg: { backgroundColor: '#EFEFEF' },
  liveStatusText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5 },

  pathText: { fontSize: 17, fontWeight: '800', color: '#000000', marginVertical: 14 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, borderTopColor: '#F0F9F4', paddingTop: 12 },
  statusIndicator: { backgroundColor: '#E1F5EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#0F6E56' },
  statusDelayedBg: { backgroundColor: '#FFF3E0' },
  statusDelayedText: { color: '#E65100' },
  
  etaText: { fontSize: 13, color: '#6A8E75', fontWeight: '600' },
  etaHighlight: { color: '#00C853', fontWeight: '900', fontSize: 14 },
  etaMuted: { color: '#8E8E93', fontWeight: '700', fontSize: 13 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12, marginBottom: 80 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E8F3EB', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: '#123D1F' },
  emptySub: { fontSize: 14, color: '#6A8E75', textAlign: 'center', lineHeight: 22 },
  actionBtn: { backgroundColor: '#196F31', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 10, elevation: 2 },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 }
});