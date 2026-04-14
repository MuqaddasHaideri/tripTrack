if (__DEV__) {
  require("../../reactotron");
}

import React, { useState, useRef, useMemo } from 'react';
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
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { fetchRoutesApi } from '../../service/server';
import { UserLocationMarker, StopMarker, TerminalMarker } from '../../components/ui/MapMarkers';
import LocationPermissionScreen from '../../components/ui/PermissionLocation';

export default function PassengerMap() {
  const mapRef = useRef(null);

  const [permissionState, setPermissionState] = useState('prompt');
  const [userLocation, setUserLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [errorType, setErrorType] = useState(null); 
  
  // UI States
  const [isRoutesModalVisible, setIsRoutesModalVisible] = useState(false);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  const openAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch (error) {
      if (Platform.OS === 'android') {
        await Linking.openURL('android.settings.APPLICATION_DETAILS_SETTINGS');
      }
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
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, 
        });
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

    } catch (error) {
      console.warn('Location Error:', error.message);
      setPermissionState('denied');
      setErrorMsg('Could not establish GPS connection. Are you indoors or on an emulator?');
    }
  };

  const denyLocation = () => {
    setPermissionState('denied');
    setErrorMsg('Location access denied. Enable it in Settings for full features.');
  };

  // ── FETCH ALL ROUTES ──
  const { data: routes, isLoading: loadingRoutes } = useQuery({
    queryKey: ['routes', 'all'],
    queryFn:  fetchRoutesApi,
    staleTime: 1000 * 60 * 60,
  });

  // Filter routes
  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter(route =>
      (route.origin && route.origin.toLowerCase().includes(routeSearchQuery.toLowerCase())) ||
      (route.destination && route.destination.toLowerCase().includes(routeSearchQuery.toLowerCase()))
    );
  }, [routeSearchQuery, routes]);

  const routeToDisplay = useMemo(() => {
    return routes?.find(r => r._id === selectedRouteId);
  }, [selectedRouteId, routes]);

  const handleSelectRoute = (route) => {
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

  const renderRouteItem = ({ item }) => {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude:      userLocation?.latitude  ?? 24.8607,
          longitude:     userLocation?.longitude ?? 67.0011,
          latitudeDelta:  0.08,
          longitudeDelta: 0.08,
        }}
        showsUserLocation={true} 
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

        {routeToDisplay && (() => {
          const color = routeToDisplay.color_hex || '#00C853';
          const polyCoords = routeToDisplay.polyline?.map(p => ({ latitude: p.lat ?? p.latitude, longitude: p.lng ?? p.longitude })) 
                          || routeToDisplay.stops?.map(stop => ({ latitude: stop.lat ?? stop.latitude, longitude: stop.lng ?? stop.longitude }));
          
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

              {routeToDisplay.stops?.slice(1, -1).map((stop, idx) => (
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
        {loadingRoutes && (
          <View style={styles.mapCtrlBtn}>
            <ActivityIndicator size="small" color="#00C853" />
          </View>
        )}
      </View>

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
                keyExtractor={item => item._id}
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
    bottom: 110,
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