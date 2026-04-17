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
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
  Linking
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchRoutesApi, socket } from '../../service/server';
import { UserLocationMarker, StopMarker } from '../../components/ui/MapMarkers';
import LocationPermissionScreen from '../../components/ui/PermissionLocation';

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#021a11" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#81C784" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#021a11" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#0A2E1F" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#01120b" }] }
];

export default function PassengerMap() {
  const mapRef = useRef<MapView>(null);

  const [permissionState, setPermissionState] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [liveBuses, setLiveBuses] = useState<Record<string, any>>({});
  const [isRoutesModalVisible, setIsRoutesModalVisible] = useState(false);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  useEffect(() => {
    requestLocation();
  }, []);

  // --- SOCKET: ROOM MANAGEMENT & LIVE BUS UPDATES ---
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleBusMoved = (busData: any) => {
  
      if (selectedRouteId && busData.routeId === selectedRouteId) {
        const busKey = busData.busId || busData.routeId || 'live';
        setLiveBuses((prev) => ({
          ...prev,
          [busKey]: busData,
        }));
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

  const requestLocation = async () => {
    setPermissionState('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return setPermissionState('denied');
      const isGpsOn = await Location.hasServicesEnabledAsync();
      if (!isGpsOn) return setPermissionState('denied');
      let loc = await Location.getLastKnownPositionAsync({});
      if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation(loc.coords);
      setPermissionState('granted');
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 800);
    } catch { setPermissionState('denied'); }
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

  if (permissionState === 'denied') {
    return <LocationPermissionScreen onAllow={requestLocation} onDeny={() => setPermissionState('denied')} onOpenSettings={() => Linking.openSettings()} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={{ latitude: 24.8607, longitude: 67.0011, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
      >
        {userLocation && (
          <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }} zIndex={100}><UserLocationMarker /></Marker>
        )}

        {/* Render live buses only if a route is active */}
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
              <Ionicons name="radio-outline" size={16} color="#81C784" />
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
            <TouchableOpacity onPress={() => setIsRoutesModalVisible(false)}><Ionicons name="close" size={26} color="white" /></TouchableOpacity>
            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={18} color="#81C784" />
              <TextInput style={styles.modalSearchInput} placeholder="Search routes..." placeholderTextColor="#81C784" value={routeSearchQuery} onChangeText={setRouteSearchQuery} />
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
  container: { flex: 1, backgroundColor: '#021a11' },
  map: { width: '100%', height: '100%' },
  liveBusMarker: { backgroundColor: '#00C853', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white', elevation: 5 },
  liveTrackerCard: { position: 'absolute', bottom: 30, left: 14, right: 14, backgroundColor: '#0A2E1F', borderRadius: 16, padding: 16, borderLeftWidth: 4, borderLeftColor: '#00C853', elevation: 10 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waitingText: { color: '#81C784', fontWeight: '500' },
  etaContainer: { marginBottom: 12 },
  etaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  etaTitle: { color: 'white', fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase' },
  busIdBadge: { color: '#00C853', fontSize: 12, fontWeight: '600', backgroundColor: '#021a11', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  backendMessage: { color: 'white', fontSize: 16, lineHeight: 22, fontWeight: '500' },
  topBarContainer: { position: 'absolute', top: 50, left: 14, right: 14 },
  searchContainer: { backgroundColor: '#0A2E1F', padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 10, elevation: 5 },
  searchIconBox: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#00C853', alignItems: 'center', justifyContent: 'center' },
  searchText: { flex: 1, fontSize: 15, color: 'white', fontWeight: '600' },
  clearRouteBtnInCard: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#021a11' },
  clearRouteText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 13 },
  modalContainer: { flex: 1, backgroundColor: '#021a11' },
  modalHeader: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalSearchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A2E1F', borderRadius: 12, paddingHorizontal: 12, height: 46 },
  modalSearchInput: { flex: 1, color: 'white', marginLeft: 8 },
  cardContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A2E1F', borderRadius: 16, marginBottom: 10, padding: 13 },
  cardIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: 'white' },
  cardSubtitle: { fontSize: 13, color: '#81C784' },
});