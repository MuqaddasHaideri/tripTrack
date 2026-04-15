

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
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchRoutesApi, socket } from '../../service/server';
import { UserLocationMarker, StopMarker, TerminalMarker } from '../../components/ui/MapMarkers';
import LocationPermissionScreen from '../../components/ui/PermissionLocation';

// --- MATH HELPERS (Client-Side ETA) ---
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

const calculateETA = (distanceKm: number) => {
  const speedKmh = 20; // Avg Karachi bus speed
  const hours = distanceKm / speedKmh;
  return Math.max(1, Math.round(hours * 60)); 
};

// --- DARK MAP THEME ---
const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#021a11" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#81C784" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#021a11" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#81C784" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#0A2E1F" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#81C784" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#0A2E1F" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#81C784" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#0f3e2a" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#144d36" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#81C784" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#0A2E1F" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#01120b" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#81C784" }] }
];

export default function PassengerMap() {
  const mapRef = useRef(null);

  const [permissionState, setPermissionState] = useState('prompt');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<string | null>(null); 
  const [liveBuses, setLiveBuses] = useState<any>({}); 
  
  // UI States
  const [isRoutesModalVisible, setIsRoutesModalVisible] = useState(false);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Crowdsourcing States
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<any>(null);

  // --- LIVE SOCKET TRACKING ---
  useEffect(() => {
    socket.connect();
    socket.on('bus_moved', (busData) => {
      setLiveBuses((prevBuses: any) => ({
        ...prevBuses,
        [busData.busId]: busData, 
      }));
    });

    return () => {
      socket.off('bus_moved');
      socket.disconnect();
    };
  }, []);

  // Join/Leave rooms
  useEffect(() => {
    if (selectedRouteId) {
      setLiveBuses({}); 
      socket.emit('join_route', selectedRouteId); 
    }

    return () => {
      if (selectedRouteId) {
        socket.emit('leave_route', selectedRouteId);
      }
      // Stop crowdsourcing if they change routes
      if (locationSubscription) {
        locationSubscription.remove();
        setIsSharingLocation(false);
      }
    };
  }, [selectedRouteId]);

  // --- CROWDSOURCING LOGIC (Fallback sharing) ---
  const togglePassengerSharing = async () => {
    if (isSharingLocation) {
      if (locationSubscription) locationSubscription.remove();
      setIsSharingLocation(false);
      setLocationSubscription(null);
      Alert.alert("Sharing Stopped", "You are no longer sharing your location.");
    } else {
      if (!selectedRouteId) return;
      
      Alert.alert("Thank You!", "You are now broadcasting this bus's location to other passengers.");
      setIsSharingLocation(true);
      
      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
        (loc) => {
          if (socket.connected) {
            // Pretend to be the driver
            socket.emit("driver_location_update", {
              routeId: selectedRouteId,
              lat: loc.coords.latitude,
              lng: loc.coords.longitude
            });
          }
        }
      );
      setLocationSubscription(sub);
    }
  };

  const openAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      if (Platform.OS === 'android') await Linking.openURL('android.settings.APPLICATION_DETAILS_SETTINGS');
    }
  };

  const requestLocation = async () => {
    setPermissionState('loading');
    setErrorType(null); 
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionState('denied');
        setErrorType('permission'); 
        return;
      }

      const isGpsOn = await Location.hasServicesEnabledAsync();
      if (!isGpsOn) {
        setPermissionState('denied');
        setErrorType('gps'); 
        return;
      }
      
      let loc = await Location.getLastKnownPositionAsync({});
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }

      if (!loc) throw new Error('Location is null');

      setUserLocation(loc.coords);
      setPermissionState('granted');
      
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      }, 800);

    } catch (error: any) {
      setPermissionState('denied');
      setErrorMsg('Could not establish GPS connection. Are you indoors or on an emulator?');
    }
  };

  const denyLocation = () => {
    setPermissionState('denied');
    setErrorMsg('Location access denied. Enable it in Settings for full features.');
  };

  const { data: routes, isLoading: loadingRoutes } = useQuery({
    queryKey: ['routes', 'all'],
    queryFn:  fetchRoutesApi,
    staleTime: 1000 * 60 * 60,
  });

  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter((route: any) =>
      (route.origin && route.origin.toLowerCase().includes(routeSearchQuery.toLowerCase())) ||
      (route.destination && route.destination.toLowerCase().includes(routeSearchQuery.toLowerCase()))
    );
  }, [routeSearchQuery, routes]);

  const routeToDisplay = useMemo(() => {
    return routes?.find((r: any) => r._id === selectedRouteId);
  }, [selectedRouteId, routes]);

  const handleSelectRoute = (route: any) => {
    setSelectedRouteId(route._id);
    setIsRoutesModalVisible(false);

    if (route.stops && route.stops.length > 0) {
      const midIndex = Math.floor(route.stops.length / 2);
      const midStop = route.stops[midIndex];
      mapRef.current?.animateToRegion({
        latitude: midStop.lat ?? midStop.latitude,
        longitude: midStop.lng ?? midStop.longitude,
        latitudeDelta: 0.15,
        longitudeDelta: 0.15,
      }, 1000);
    }
  };

  const clearSelectedRoute = () => {
    setSelectedRouteId(null);
    setLiveBuses({}); 
    if (locationSubscription) {
      locationSubscription.remove();
      setIsSharingLocation(false);
    }
    recenterMap(); 
  };

  const recenterMap = () => {
    if (!userLocation) return;
    mapRef.current?.animateToRegion({ 
      latitude: userLocation.latitude, 
      longitude: userLocation.longitude, 
      latitudeDelta: 0.04, 
      longitudeDelta: 0.04 
    }, 600);
  };

  if (permissionState === 'prompt' || permissionState === 'denied') {
    return (
      <View style={{ flex: 1, backgroundColor: '#021a11' }}>
        <StatusBar barStyle="light-content" />
        <LocationPermissionScreen 
          onAllow={requestLocation} 
          onDeny={denyLocation}
          onOpenSettings={openAppSettings}
          errorType={errorType}
          errorMsg={errorMsg}
        />
      </View>
    );
  }

  if (permissionState === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#021a11' }}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={{ marginTop: 14, color: '#81C784', fontSize: 15 }}>Establishing GPS Connection…</Text>
      </View>
    );
  }

  const renderRouteItem = ({ item }: {item: any}) => {
    const isSelected = selectedRouteId === item._id;
    const color = item.color_hex || '#00C853';

    return (
      <TouchableOpacity 
        style={[styles.cardContainer, isSelected && { borderColor: color, borderWidth: 2 }]} 
        activeOpacity={0.7} 
        onPress={() => handleSelectRoute(item)}
      >
        <View style={[styles.cardIconBox, { backgroundColor: color }]}>
          <Ionicons name="bus" size={22} color="white" />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{item.origin || 'Start'} to {item.destination || 'End'} {item.route_name || ''}</Text>
          <Text style={styles.cardSubtitle}>{item.stops?.length || 0} Stops</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#81C784" />
      </TouchableOpacity>
    );
  };

  // Extract buses for the UI Card
  const liveBusesArray = Object.values(liveBuses);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude:      userLocation?.latitude  ?? 24.8607,
          longitude:     userLocation?.longitude ?? 67.0011,
          latitudeDelta:  0.08,
          longitudeDelta: 0.08,
        }}
        showsUserLocation={false} 
        showsCompass={false}
        showsMyLocationButton={false}
      >
        {userLocation && (
          <Marker 
            coordinate={{ latitude: userLocation.latitude, longitude: userLocation.longitude }} 
            anchor={{ x: 0.5, y: 0.5 }} 
            zIndex={100} 
            tracksViewChanges={false}
          >
            <UserLocationMarker />
          </Marker>
        )}

        {/* ── LIVE BUSES RENDER ── */}
        {liveBusesArray.map((bus: any) => (
          <Marker
            key={bus.busId}
            coordinate={{ latitude: bus.lat, longitude: bus.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={200}
            tracksViewChanges={false}
          >
            <View style={styles.liveBusMarker}>
              <Ionicons name="bus" size={18} color="white" />
            </View>
          </Marker>
        ))}

        {routeToDisplay && (() => {
          const color = routeToDisplay.color_hex || '#00C853';
          const polyCoords = routeToDisplay.polyline?.map((p:any) => ({ latitude: p.lat ?? p.latitude, longitude: p.lng ?? p.longitude })) 
                          || routeToDisplay.stops?.map((stop:any) => ({ latitude: stop.lat ?? stop.latitude, longitude: stop.lng ?? stop.longitude }));
          
          const first = routeToDisplay.stops?.[0] || null;
          const last  = routeToDisplay.stops?.[routeToDisplay.stops.length - 1];

          return (
            <React.Fragment key={routeToDisplay._id}>
              <Polyline
                coordinates={polyCoords}
                strokeColor={color}
                strokeWidth={5}
                strokeColors={[color]}
                lineJoin="round"
                lineCap="round"
              />

              {routeToDisplay.stops?.slice(1, -1).map((stop:any, idx:number) => (
                <Marker
                  key={`${routeToDisplay._id}-stop-${idx}`}
                  coordinate={{ latitude: stop.lat ?? stop.latitude, longitude: stop.lng ?? stop.longitude }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <StopMarker color={color} />
                </Marker>
              ))}

              {first && (
                <Marker
                  coordinate={{ latitude: first.lat ?? first.latitude, longitude: first.lng ?? first.longitude }}
                  anchor={{ x: 0.5, y: 1 }}
                  tracksViewChanges={false}
                >
                  <TerminalMarker label={routeToDisplay.origin || 'Start'} color={color} isEnd={false} />
                </Marker>
              )}

              {last && last !== first && (
                <Marker
                  coordinate={{ latitude: last.lat ?? last.latitude, longitude: last.lng ?? last.longitude }}
                  anchor={{ x: 0.5, y: 1 }}
                  tracksViewChanges={false}
                >
                  <TerminalMarker label={routeToDisplay.destination || 'End'} color={color} isEnd={true} />
                </Marker>
              )}
            </React.Fragment>
          );
        })()}
      </MapView>

      <View style={styles.topBarContainer}>
        <TouchableOpacity style={styles.searchContainer} onPress={() => setIsRoutesModalVisible(true)} activeOpacity={0.85}>
          <View style={styles.searchIconBox}>
            <Ionicons name="bus" size={16} color="white" />
          </View>
          <Text style={styles.searchText}>
            {selectedRouteId ? "Change Route" : "Select a Route"}
          </Text>
          <View style={styles.searchBadge}>
            <Ionicons name="chevron-down" size={16} color="#00C853" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapCtrlBtn} onPress={recenterMap}>
          <Ionicons name="locate" size={22} color="#00C853" />
        </TouchableOpacity>
      </View>

      {/* ── LIVE ETA TRACKER CARD ── */}
      {selectedRouteId && routeToDisplay && (
        <View style={styles.liveTrackerCard}>
          {liveBusesArray.length === 0 ? (
            <View style={styles.etaContainer}>
              <ActivityIndicator size="small" color="#00C853" style={{ marginBottom: 10 }} />
              <Text style={{ color: '#81C784', textAlign: 'center' }}>Waiting for live bus location...</Text>
            </View>
          ) : (
            liveBusesArray.map((bus: any) => {
              // 1. Find user's closest stop
              let userStop = routeToDisplay.stops?.[0];
              let minDistanceToUser = Infinity;
              let userStopIndex = 0;

              routeToDisplay.stops?.forEach((stop: any, index: number) => {
                const dist = getDistanceKm(userLocation?.latitude, userLocation?.longitude, stop.latitude, stop.longitude);
                if (dist < minDistanceToUser) {
                  minDistanceToUser = dist;
                  userStop = stop;
                  userStopIndex = index;
                }
              });

              // 2. Find bus's closest stop
              let busStop = routeToDisplay.stops?.[0];
              let minDistanceToBus = Infinity;
              let busStopIndex = 0;

              routeToDisplay.stops?.forEach((stop: any, index: number) => {
                const dist = getDistanceKm(bus.lat, bus.lng, stop.latitude, stop.longitude);
                if (dist < minDistanceToBus) {
                  minDistanceToBus = dist;
                  busStop = stop;
                  busStopIndex = index;
                }
              });

              // 3. The Math
              const stopsAway = Math.abs(userStopIndex - busStopIndex);
              const distanceToUserKm = getDistanceKm(bus.lat, bus.lng, userStop?.latitude, userStop?.longitude);
              const etaMinutes = calculateETA(distanceToUserKm);

              return (
                <View key={bus.busId} style={styles.etaContainer}>
                  <View style={styles.etaHeader}>
                    <Ionicons name="bus" size={20} color="white" />
                    <Text style={styles.etaTitle}>Bus {bus.busId || 'KHI-Live'}</Text>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </View>
                  </View>
                  
                  <View style={styles.etaBody}>
                    <Text style={styles.etaRow}>📍 Currently at: <Text style={styles.etaHighlight}>{busStop?.stop_name || 'En Route'}</Text></Text>
                    <Text style={styles.etaRow}>🛑 Your Stop: <Text style={styles.etaHighlight}>{userStop?.stop_name || 'Unknown'}</Text></Text>
                    <Text style={styles.etaRow}>
                      ⏳ Arriving in: <Text style={styles.etaTime}>{etaMinutes} mins</Text> <Text style={styles.etaSub}>({stopsAway} stops away)</Text>
                    </Text>
                  </View>
                </View>
              );
            })
          )}

          {/* Crowdsourcing Button */}
          <TouchableOpacity 
            style={[styles.shareBtn, isSharingLocation && styles.shareBtnActive]}
            onPress={togglePassengerSharing}
          >
            <Ionicons name={isSharingLocation ? "stop-circle" : "location"} size={16} color="white" />
            <Text style={styles.shareBtnText}>
              {isSharingLocation ? "Stop Sharing Location" : "I am on this bus (Share GPS)"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedRouteId && (
        <TouchableOpacity style={styles.clearRouteBtn} onPress={clearSelectedRoute}>
          <Ionicons name="close-circle" size={18} color="#FF3B30" />
          <Text style={styles.clearRouteText}>Clear Map</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={isRoutesModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsRoutesModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.dragHandle} />

          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsRoutesModalVisible(false)} style={styles.backBtn}>
              <Ionicons name="close" size={26} color="white" />
            </TouchableOpacity>
            <View style={styles.modalSearchBox}>
              <Ionicons name="search" size={18} color="#81C784" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search buses or areas..."
                placeholderTextColor="#81C784"
                value={routeSearchQuery}
                onChangeText={setRouteSearchQuery}
              />
              {routeSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setRouteSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#81C784" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.sheetBody}>
            <Text style={styles.sectionTitle}>All Routes ({filteredRoutes?.length || 0})</Text>
            
            {loadingRoutes ? (
              <ActivityIndicator size="large" color="#00C853" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={filteredRoutes}
                keyExtractor={(item:any) => item._id}
                renderItem={renderRouteItem}
                contentContainerStyle={styles.listContainer}
                keyboardShouldPersistTaps="always"
                ListEmptyComponent={
                  <Text style={{ textAlign: 'center', color: '#81C784', marginTop: 40 }}>No routes found.</Text>
                }
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#021a11' },
  map:       { width: '100%', height: '100%' },

  liveBusMarker: {
    backgroundColor: '#00C853',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },

  liveTrackerCard: {
    position: 'absolute',
    bottom: 90, 
    left: 14,
    right: 14,
    backgroundColor: '#0A2E1F',
    borderRadius: 16,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    borderWidth: 1,
    borderColor: '#00C853',
  },
  etaContainer: {
    marginBottom: 10,
  },
  etaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#021a11',
    paddingBottom: 10,
    marginBottom: 10,
  },
  etaTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    marginRight: 4,
  },
  liveText: {
    color: '#FF3B30',
    fontSize: 10,
    fontWeight: 'bold',
  },
  etaBody: {
    gap: 6,
  },
  etaRow: {
    color: '#81C784',
    fontSize: 14,
  },
  etaHighlight: {
    color: 'white',
    fontWeight: '600',
  },
  etaTime: {
    color: '#00C853',
    fontWeight: 'bold',
    fontSize: 16,
  },
  etaSub: {
    color: '#666',
    fontSize: 13,
  },
  shareBtn: {
    backgroundColor: '#00C853',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 5
  },
  shareBtnActive: {
    backgroundColor: '#FF3B30', 
  },
  shareBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14
  },

  topBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 32,
    left: 14, right: 14,
  },
  searchContainer: {
    backgroundColor: '#0A2E1F',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  searchIconBox: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#00C853',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  searchText:  { flex: 1, fontSize: 15, color: 'white', fontWeight: '600' },
  searchBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#021a11', alignItems: 'center', justifyContent: 'center' },

  mapControls: {
    position: 'absolute',
    right: 14,
    bottom: 250, 
    gap: 10,
    alignItems: 'center',
  },
  mapCtrlBtn: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#0A2E1F',
    alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },

  clearRouteBtn: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a0505',
    borderWidth: 1,
    borderColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6,
  },
  clearRouteText: { fontSize: 14, color: '#FF3B30', fontWeight: '700' },

  modalContainer: { flex: 1, backgroundColor: '#021a11' },
  dragHandle:     { width: 36, height: 4, backgroundColor: '#81C784', borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 6 },
  modalHeader:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10 },
  backBtn:        { marginRight: 10, padding: 4 },
  modalSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A2E1F',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  modalSearchInput: { flex: 1, fontSize: 15, color: 'white' },

  sheetBody:    { flex: 1, backgroundColor: '#021a11' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginLeft: 16, marginTop: 16, marginBottom: 12, color: '#81C784', letterSpacing: 0.8, textTransform: 'uppercase' },
  listContainer:{ paddingHorizontal: 14, paddingBottom: 30 },

  cardContainer:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A2E1F', borderRadius: 16, marginBottom: 10, padding: 13, elevation: 2, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
  cardIconBox:       { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTextContainer: { flex: 1 },
  cardTitle:         { fontSize: 15, fontWeight: '600', color: 'white' },
  cardSubtitle:      { fontSize: 13, color: '#81C784', marginTop: 3 },
});