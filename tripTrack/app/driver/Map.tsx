
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
export default function DriverMapScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<any>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoutesModalVisible, setIsRoutesModalVisible] = useState(false);
  const [routeSearchQuery, setRouteSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const locationSubscription = useRef<any>(null);
const { t } = useTranslation();
  const { data: routes } = useQuery({ queryKey: ['routes', 'all'], queryFn: fetchRoutesApi });

  const filteredRoutes = useMemo(() => {
    if (!routes) return [];
    return routes.filter((r: any) =>
      r.origin?.toLowerCase().includes(routeSearchQuery.toLowerCase()) ||
      r.destination?.toLowerCase().includes(routeSearchQuery.toLowerCase())
    );
  }, [routeSearchQuery, routes]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t("driverMap.Permission Denied"), t("driverMap.Location access is required for drivers."));
        return setIsLoading(false);
      }
      const initialLoc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(initialLoc.coords);
      setIsLoading(false);
      if (!socket.connected) socket.connect();
    })();

    return () => {
      stopBroadcasting();
    };
  }, []);

  const startBroadcasting = async () => {
    if (!selectedRoute) return Alert.alert(t("driverMap.Select Route first"));
    
    setIsBroadcasting(true);
    if (socket.connected) {
      socket.emit("driver_start_route", selectedRoute._id);
    }

    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 5 },
      (newLoc) => {
        const { latitude, longitude } = newLoc.coords;
        setLocation({ latitude, longitude });
        if (socket.connected) {
          socket.emit('driver_location_update', {
            routeId: selectedRoute._id,
            lat: latitude,
            lng: longitude,
            busId: selectedRoute.route_name 
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

    if (socket.connected && selectedRoute) {
      console.log("Emitting end_shift for route:", selectedRoute._id);
      socket.emit('end_shift', {
        routeId: selectedRoute._id,
        busId: selectedRoute.route_name 
      });
    }
  };

  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#00C853" /></View>;

 return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MapView 
        ref={mapRef} 
        style={styles.map} 
        provider={PROVIDER_GOOGLE} 
        initialRegion={{ 
          latitude: location?.latitude ?? 24.8607, 
          longitude: location?.longitude ?? 67.0011, 
          latitudeDelta: 0.01, 
          longitudeDelta: 0.01 
        }}
      >
        {location && (
          <Marker coordinate={location} anchor={{ x: 0.5, y: 0.5 }} zIndex={100}>
            <View style={[styles.driverMarker, isBroadcasting && styles.onlineMarker]}>
              <Ionicons 
          name={isBroadcasting ? "bus" : "navigate"} 
          size={isBroadcasting ? 22 : 20} 
          color={isBroadcasting ? "#FFFFFF" : "#F0F9F4"} 
        />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Floating Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#196F31" />
        </TouchableOpacity>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: isBroadcasting ? '#196F31' : '#FF3B30' }]} />
          <Text style={[styles.statusText, { color: isBroadcasting ? '#196F31' : '#FF3B30' }]}>
            {isBroadcasting ? t("driverMap.LIVE BROADCASTING") : t("driverMap.OFFLINE")}
          </Text>
        </View>
      </SafeAreaView>

      {/* Bottom Control Card */}
      <View style={styles.bottomCard}>
        <Text style={styles.cardLabel}>{t("driverMap.Active Shift Assignment")}</Text>
        
        <TouchableOpacity 
          style={[styles.routePicker, isBroadcasting && styles.disabledPicker]} 
          onPress={() => !isBroadcasting && setIsRoutesModalVisible(true)} 
          disabled={isBroadcasting}
        >
          <View style={styles.routeIconBox}>
             <Ionicons name="map-outline" size={20} color="#196F31" />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.routeMainText}>
              {selectedRoute ? `${selectedRoute.origin} ➔ ${selectedRoute.destination}` : t("driverMap.Select Assigned Route")}
            </Text>
            <Text style={styles.routeSubText}>
              {selectedRoute ? selectedRoute.route_name : t("driverMap.Tap to pick from list")}
            </Text>
          </View>
          {!isBroadcasting && <Ionicons name="chevron-forward" size={20} color="#196F31" />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: isBroadcasting ? '#FF3B30' : '#196F31' }]} 
          onPress={() => isBroadcasting ? stopBroadcasting() : startBroadcasting()}
        >
          <Ionicons name={isBroadcasting ? "stop-circle" : "play-circle"} size={24} color="white" />
          <Text style={styles.actionButtonText}>
            {isBroadcasting ? t("driverMap.END SHIFT") : t("driverMap.START SHIFT")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Route Selection Modal */}
      <Modal visible={isRoutesModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsRoutesModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#196F31" />
              <TextInput 
                style={styles.searchInput} 
                placeholder={t("driverMap.Search assigned routes...")}
                placeholderTextColor="#A0B4A5" 
                value={routeSearchQuery} 
                onChangeText={setRouteSearchQuery} 
              />
            </View>
          </View>
          <FlatList 
            data={filteredRoutes} 
            keyExtractor={(item) => item._id} 
            contentContainerStyle={{ padding: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.routeItem} onPress={() => { setSelectedRoute(item); setIsRoutesModalVisible(false); }}>
                <View style={[styles.routeItemIcon, { backgroundColor: item.color_hex || '#196F31' }]}>
                  <Ionicons name="bus" size={20} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeItemTitle}>{item.origin} {t("driverMap.to")} {item.destination}</Text>
                  <Text style={styles.routeItemSub}>{item.route_name}</Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color="#196F31" />
              </TouchableOpacity>
            )} 
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9F4' },
  map: { flex: 1 },
  header: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 44, height: 44, backgroundColor: 'white', borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#196F31', elevation: 4 },
  statusBadge: { flex: 1, marginLeft: 12, backgroundColor: 'white', paddingVertical: 10, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#196F31', elevation: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  statusText: { fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  
  driverMarker: { backgroundColor: '#196F31', padding: 8, borderRadius: 20, borderWidth: 3, borderColor: 'white', elevation: 10 },
  onlineMarker: { backgroundColor: '#196F31', borderColor: '#F0F9F4' },

  bottomCard: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: 'white', borderRadius: 28, padding: 20, borderWidth: 2, borderColor: '#196F31', elevation: 10, shadowColor: '#196F31', shadowOpacity: 0.2, shadowRadius: 10 },
  cardLabel: { color: '#A0B4A5', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 },
  
  routePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F9F4', padding: 14, borderRadius: 18, marginBottom: 20, borderWidth: 1, borderColor: '#196F31' },
  disabledPicker: { opacity: 0.6, borderColor: '#A0B4A5' },
  routeIconBox: { width: 40, height: 40, backgroundColor: 'white', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  routeInfo: { flex: 1 },
  routeMainText: { color: '#000', fontSize: 15, fontWeight: '800' },
  routeSubText: { color: '#4A6B54', fontSize: 12, fontWeight: '600' },

  actionButton: { paddingVertical: 16, borderRadius: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, elevation: 4 },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  modalContainer: { flex: 1, backgroundColor: '#F0F9F4' },
  modalHeader: { padding: 20, flexDirection: 'row', alignItems: 'center', gap: 10 },
  modalCloseBtn: { width: 44, height: 44, justifyContent: 'center' },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 15, borderRadius: 16, height: 50, borderWidth: 1.5, borderColor: '#196F31' },
  searchInput: { flex: 1, marginLeft: 10, color: '#000', fontWeight: '600' },

  routeItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 20, marginBottom: 12, borderWidth: 1.5, borderColor: '#196F31', elevation: 2 },
  routeItemIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  routeItemTitle: { color: '#000', fontWeight: '800', fontSize: 16 },
  routeItemSub: { color: '#8E8E93', fontSize: 13, fontWeight: '600' }
});                                                              