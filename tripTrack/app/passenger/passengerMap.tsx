if (__DEV__) {
  require("../../reactotron");
}

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StatusBar,
  Alert,
  Platform,
  Linking,
  AppState
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as IntentLauncher from 'expo-intent-launcher';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';


// Service & Component Imports
import { fetchRoutesApi, socket } from '../../service/server';
import { UserLocationMarker, StopMarker } from '../../components/ui/MapMarkers';
import LocationPermissionScreen from '../../components/ui/PermissionLocation';


export default function PassengerMap() {
  const mapRef = useRef<MapView>(null);
  const appState = useRef(AppState.currentState);

  // --- STATE ---
  const [permissionState, setPermissionState] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [errorType, setErrorType] = useState<'permission' | 'gps' | null>(null);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [liveBuses, setLiveBuses] = useState<Record<string, any>>({});
  const [isRoutesModalVisible, setIsRoutesModalVisible] = useState(false);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // --- 1. LOCATION & PERMISSION LOGIC ---
  useEffect(() => {
    checkLocationStatus();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkLocationStatus();
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  const checkLocationStatus = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorType('permission');
        setPermissionState('denied');
        return;
      }

      const gpsEnabled = await Location.hasServicesEnabledAsync();
      if (!gpsEnabled) {
        setErrorType('gps');
        setPermissionState('denied');
        return;
      }

      setErrorType(null);
      await startTracking();
    } catch (err) {
      setPermissionState('denied');
    }
  };

  const startTracking = async () => {
    try {
      let loc = await Location.getLastKnownPositionAsync({});
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }

      setUserLocation(loc.coords);
      setPermissionState('granted');
      
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 1000);
    } catch (e) {
      setPermissionState('denied');
    }
  };

  // --- 2. ACTION HANDLERS ---
  const handlePrimaryAction = async () => {
    if (errorType === 'permission') {
      Linking.openSettings();
    } else if (errorType === 'gps') {
      if (Platform.OS === 'android') {
        IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS);
      } else {
        Linking.openURL('App-Prefs:Privacy&path=LOCATION');
      }
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') checkLocationStatus();
    }
  };

  const handleNotNow = () => {
    Alert.alert("TransitGo", "Nearby routes won't be visible without location.", [
      { text: "Cancel", style: "cancel" },
      { text: "Enable", onPress: handlePrimaryAction }
    ]);
  };

  const clearSelectedRoute = () => {
    if (selectedRouteId) socket.emit('leave_route', selectedRouteId);
    setSelectedRouteId(null);
    setLiveBuses({}); 
    recenterMap();
  };

  const recenterMap = () => {
    if (!userLocation) return;
    mapRef.current?.animateToRegion({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    }, 600);
  };

  // --- 3. SOCKET LOGIC ---
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleBusMoved = (busData: any) => {
      if (selectedRouteId && busData.routeId === selectedRouteId) {
        const busKey = busData.busId || busData.routeId || 'live';
        setLiveBuses((prev) => ({ ...prev, [busKey]: busData }));
      }
    };

    const handleBusOffline = (data: any) => {
      setLiveBuses((prev) => {
        const newBuses = { ...prev };
        const busKey = data.busId || 'live';
        delete newBuses[busKey];
        return newBuses;
      });
    };

    const handleReconnect = () => {
      if (selectedRouteId && socket.connected) {
        socket.emit('join_route', selectedRouteId);
      }
    };

    socket.on('bus_moved', handleBusMoved);
    socket.on('bus_offline', handleBusOffline);
    socket.on('connect', handleReconnect);

    if (selectedRouteId) {
      setLiveBuses({}); 
      if (socket.connected) socket.emit('join_route', selectedRouteId);
    }

    return () => {
      socket.off('bus_moved', handleBusMoved);
      socket.off('bus_offline', handleBusOffline);
      socket.off('connect', handleReconnect);
      if (selectedRouteId) socket.emit('leave_route', selectedRouteId);
    };
  }, [selectedRouteId]);

  // --- 4. DATA FETCHING ---
  const { data: routes } = useQuery({
    queryKey: ['routes', 'all'],
    queryFn: fetchRoutesApi,
    staleTime: 1000 * 60 * 60,
  });

  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter((r: any) =>
      r.origin?.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
      r.destination?.toLowerCase().includes(routeSearchQuery.toLowerCase())
    );
  }, [routeSearchQuery, routes]);

  const routeToDisplay = useMemo(
    () => routes?.find((r: any) => r._id === selectedRouteId),
    [selectedRouteId, routes]
  );

  // --- 5. RENDER CONDITIONALS ---
  if (permissionState === 'loading' && !userLocation) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#196F31" />
      </View>
    );
  }

  if (permissionState === 'denied') {
    return (
      <LocationPermissionScreen 
        errorType={errorType}
        onAllow={handlePrimaryAction}
        onDeny={handleNotNow}
        onOpenSettings={handlePrimaryAction} 
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{ latitude: 24.8607, longitude: 67.0011, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
      >
        {userLocation && (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} zIndex={100}>
            <UserLocationMarker />
          </Marker>
        )}

        {selectedRouteId && Object.entries(liveBuses).map(([busKey, bus]: [string, any]) => (
          <Marker
            key={busKey}
            coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
            zIndex={200}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.liveBusMarker}><Ionicons name="bus" size={18} color="white" /></View>
          </Marker>
        ))}

        {routeToDisplay && (
          <React.Fragment>
            <Polyline
              coordinates={routeToDisplay.polyline || routeToDisplay.stops?.map((s: any) => ({ latitude: s.latitude, longitude: s.longitude }))}
              strokeColor={routeToDisplay.color_hex || '#00C853'}
              strokeWidth={5}
            />
            {routeToDisplay.stops?.map((stop: any, idx: number) => (
              <Marker key={idx} coordinate={{ latitude: stop.latitude, longitude: stop.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
                <StopMarker color={routeToDisplay.color_hex} />
              </Marker>
            ))}
          </React.Fragment>
        )}
      </MapView>

      <View style={styles.topBarContainer}>
        <TouchableOpacity style={styles.searchContainer} onPress={() => setIsRoutesModalVisible(true)}>
          <View style={styles.searchIconBox}><Ionicons name="bus" size={16} color="white" /></View>
          <Text style={styles.searchText} numberOfLines={1}>
            {routeToDisplay ? `${routeToDisplay.origin} → ${routeToDisplay.destination}` : 'Select a Route'}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#00C853" />
        </TouchableOpacity>
      </View>

      {selectedRouteId && routeToDisplay && (
        <View style={styles.liveTrackerCard}>
          {Object.keys(liveBuses).length === 0 ? (
            <View style={styles.waitingRow}>
              <Ionicons name="radio-outline" size={16} color="#123D1F" />
              <Text style={styles.waitingText}>Waiting for live bus data...</Text>
            </View>
          ) : (
            Object.entries(liveBuses).map(([busKey, bus]: [string, any]) => (
              <View key={busKey} style={styles.etaContainer}>
                <View style={styles.etaHeader}>
                  <Ionicons name="radio" size={18} color="#FF3B30" />
                  <Text style={styles.etaTitle}>Live Update</Text>
                  {bus.busId && <Text style={styles.busIdBadge}>{bus.busId}</Text>}
                </View>
                <Text style={styles.backendMessage}>{bus.displayMessage || 'Connecting to bus GPS...'}</Text>
              </View>
            ))
          )}
          
          <TouchableOpacity style={styles.clearRouteBtnInCard} onPress={clearSelectedRoute}>
            <Ionicons name="close-circle" size={16} color="#FF3B30" />
            <Text style={styles.clearRouteText}>Clear Route</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={isRoutesModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsRoutesModalVisible(false)}><Ionicons name="close" size={28} color="#123D1F" /></TouchableOpacity>
            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={18} color="#123D1F" />
              <TextInput style={styles.modalSearchInput} placeholder="Search routes..." placeholderTextColor="#123D1F" value={routeSearchQuery} onChangeText={setRouteSearchQuery} />
            </View>
          </View>
          <FlatList
            data={filteredRoutes}
            keyExtractor={(item: any) => item._id}
            contentContainerStyle={{ padding: 14 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.cardContainer} onPress={() => { setSelectedRouteId(item._id); setIsRoutesModalVisible(false); }}>
                <View style={[styles.cardIconBox, { backgroundColor: item.color_hex || '#00C853' }]}><Ionicons name="bus" size={22} color="white" /></View>
                <View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.origin} to {item.destination}</Text><Text style={styles.cardSubtitle}>{item.stops?.length} Stops</Text></View>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main background (Mint)
  container: { flex: 1, backgroundColor: '#F0F9F4' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  map: { width: '100%', height: '100%' },

  // Markers - using the Primary Green
  liveBusMarker: { 
    backgroundColor: '#196F31', 
    padding: 8, 
    borderRadius: 20, 
    borderWidth: 2, 
    borderColor: 'white', 
    elevation: 5 
  },

  // Live Tracker Card (Now Light Themed to match)
  liveTrackerCard: { 
    position: 'absolute', 
    bottom: 140, 
    left: 14, 
    right: 14, 
    backgroundColor: '#FFFFFF', // Clean white card
    borderRadius: 16, 
    padding: 16, 
    borderLeftWidth: 4, 
    borderLeftColor: '#196F31', 
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waitingText: { color: '#123D1F', fontWeight: '500' },
  etaContainer: { marginBottom: 12 },
  etaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  etaTitle: { color: '#196F31', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  busIdBadge: { 
    color: '#FFFFFF', 
    fontSize: 12, 
    fontWeight: '700', 
    backgroundColor: '#196F31', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 6 
  },
  backendMessage: { color: '#123D1F', fontSize: 16, lineHeight: 22, fontWeight: '600' },

  // Top Search Bar
  topBarContainer: { position: 'absolute', top: 50, left: 14, right: 14 },
  searchContainer: { 
    backgroundColor: '#FFFFFF', 
    padding: 12, 
    borderRadius: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    elevation: 8,
    shadowColor: '#196F31',
    shadowOpacity: 0.15,
  },
  searchIconBox: { 
    width: 30, 
    height: 30, 
    borderRadius: 8, 
    backgroundColor: '#196F31', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  searchText: { flex: 1, fontSize: 15, color: '#123D1F', fontWeight: '600' },

  // Card Controls
  clearRouteBtnInCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6, 
    marginTop: 8, 
    paddingTop: 8, 
    borderTopWidth: 1, 
    borderTopColor: '#E0E0E0' 
  },
  clearRouteText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 13 },

  // Modal (Mint & White)
  modalContainer: { flex: 1, backgroundColor: '#F0F9F4' },
  modalHeader: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalSearchBox: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    height: 46,
    borderWidth: 1,
    borderColor: '#D1E8D9'
  },
  modalSearchInput: { flex: 1, color: '#123D1F', marginLeft: 8 },

  // List Cards (Light Theme for better readability)
  cardContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    marginBottom: 10, 
    padding: 13,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  cardIconBox: { 
    width: 42, 
    height: 42, 
    borderRadius: 12, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12 
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#123D1F' },
  cardSubtitle: { fontSize: 13, color: '#4A6B54' }, // Subtle green-grey
});