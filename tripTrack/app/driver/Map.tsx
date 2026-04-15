import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Platform
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { fetchRoutesApi, socket } from '../../service/server'; 

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#021a11" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#81C784" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#0A2E1F" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#01120b" }] }
];

export default function DriverMapScreen() {
  const router = useRouter();
  const mapRef = useRef(null);
  const [location, setLocation] = useState<any>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoutesModalVisible, setIsRoutesModalVisible] = useState(false);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  
  const locationSubscription = useRef<any>(null);

  const { data: routes, isLoading: loadingRoutes } = useQuery({
    queryKey: ['routes', 'all'],
    queryFn: fetchRoutesApi,
  });

  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter((r: any) =>
      (r.origin?.toLowerCase().includes(routeSearchQuery.toLowerCase())) ||
      (r.destination?.toLowerCase().includes(routeSearchQuery.toLowerCase()))
    );
  }, [routeSearchQuery, routes]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Drivers must allow location access.');
        setIsLoading(false);
        return;
      }

      const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(initialLoc.coords);
      setIsLoading(false);

      if (!socket.connected) socket.connect();
    })();

    return () => {
      stopBroadcasting();
      socket.disconnect();
    };
  }, []);

  const startBroadcasting = async () => {
    if (!selectedRoute) {
      Alert.alert("Select Route", "Please select a route before going online.");
      return;
    }

    setIsBroadcasting(true);
    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 10 },
      (newLocation) => {
        const { latitude, longitude } = newLocation.coords;
        setLocation({ latitude, longitude });

        if (socket.connected) {
          socket.emit('driver_location_update', {
            routeId: selectedRoute._id,
            lat: latitude,
            lng: longitude,
            busId: "BUS-KHI-01" 
          });
        }
      }
    );
  };

  const stopBroadcasting = () => {
    setIsBroadcasting(false);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const handleSelectRoute = (route: any) => {
    setSelectedRoute(route);
    setIsRoutesModalVisible(false);
    if (route.stops?.[0]) {
        mapRef.current?.animateToRegion({
            latitude: route.stops.latitude,
            longitude: route.stops.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        });
    }
  };

  if (isLoading) return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#00C853" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: location?.latitude ?? 24.8607,
          longitude: location?.longitude ?? 67.0011,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {location && (
          <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }} zIndex={100}>
            <View style={[styles.driverMarker, isBroadcasting && styles.onlineMarker]}>
              <Ionicons name="bus" size={20} color="white" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* --- HEADER --- */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: isBroadcasting ? '#00C853' : '#FF3B30' }]} />
          <Text style={styles.statusText}>{isBroadcasting ? 'LIVE BROADCASTING' : 'OFFLINE'}</Text>
        </View>
      </SafeAreaView>

      {/* --- BOTTOM SELECTION CARD --- */}
      <View style={styles.bottomCard}>
        <Text style={styles.cardLabel}>Current Shift</Text>
        <TouchableOpacity 
          style={styles.routePicker} 
          onPress={() => !isBroadcasting && setIsRoutesModalVisible(true)}
          disabled={isBroadcasting}
        >
          <View style={styles.routeInfo}>
            <Text style={styles.routeMainText}>
              {selectedRoute ? `${selectedRoute.origin} ➔ ${selectedRoute.destination}` : "Tap to Select Route"}
            </Text>
            <Text style={styles.routeSubText}>
              {selectedRoute ? selectedRoute.route_name : "Select your assigned path"}
            </Text>
          </View>
          {!isBroadcasting && <Ionicons name="chevron-forward" size={20} color="#81C784" />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isBroadcasting ? '#FF3B30' : '#00C853' }]}
          onPress={() => isBroadcasting ? stopBroadcasting() : startBroadcasting()}
        >
          <Text style={styles.actionButtonText}>{isBroadcasting ? "END SHIFT" : "START BROADCASTING"}</Text>
        </TouchableOpacity>
      </View>

      {/* --- ROUTE MODAL --- */}
      <Modal visible={isRoutesModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsRoutesModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#81C784" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search assigned route..."
                placeholderTextColor="#81C784"
                value={routeSearchQuery}
                onChangeText={setRouteSearchQuery}
              />
            </View>
          </View>

          <FlatList
            data={filteredRoutes}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.routeItem} onPress={() => handleSelectRoute(item)}>
                <View style={[styles.routeIcon, { backgroundColor: item.color_hex || '#00C853' }]}>
                  <Ionicons name="bus" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeItemTitle}>{item.origin} to {item.destination}</Text>
                  <Text style={styles.routeItemSub}>{item.route_name}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color="#00C853" />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ padding: 15 }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#021a11' },
  loadingContainer: { flex: 1, backgroundColor: '#021a11', justifyContent: 'center' },
  map: { flex: 1 },
  header: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 16, right: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 44, height: 44, backgroundColor: '#0A2E1F', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { flex: 1, marginLeft: 12, backgroundColor: '#0A2E1F', paddingVertical: 10, borderRadius: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { color: 'white', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  driverMarker: { backgroundColor: '#0A2E1F', padding: 10, borderRadius: 25, borderWidth: 2, borderColor: '#aaa' },
  onlineMarker: { borderColor: '#00C853' },
  bottomCard: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#0A2E1F', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#021a11' },
  cardLabel: { color: '#81C784', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 },
  routePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#021a11', padding: 16, borderRadius: 16, marginBottom: 20 },
  routeInfo: { flex: 1 },
  routeMainText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  routeSubText: { color: '#81C784', fontSize: 13, marginTop: 2 },
  actionButton: { paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  modalContainer: { flex: 1, backgroundColor: '#021a11' },
  modalHeader: { padding: 16, flexDirection: 'row', alignItems: 'center' },
  closeBtn: { marginRight: 15 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A2E1F', paddingHorizontal: 15, borderRadius: 12, height: 45 },
  searchInput: { flex: 1, marginLeft: 10, color: 'white' },
  routeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A2E1F', padding: 15, borderRadius: 16, marginBottom: 12 },
  routeIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  routeItemTitle: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  routeItemSub: { color: '#81C784', fontSize: 12, marginTop: 2 }
});