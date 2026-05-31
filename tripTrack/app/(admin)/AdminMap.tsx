  import React, { useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  StatusBar
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchRoutesApi } from '../../service/server'; 
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminMapScreen() {
  const router = useRouter();
  const { routeId } = useLocalSearchParams(); 
  const mapRef = useRef(null);

  // Fetch routes (assuming you pull all and filter, or you can use a specific getRouteById API)
  const { data: routes, isLoading } = useQuery({ 
    queryKey: ['routes', 'all'], 
    queryFn: fetchRoutesApi 
  });

  // Find the exact route passed from the previous screen
  const selectedRoute = useMemo(() => {
    if (!routes || !routeId) return null;
    return routes.find((r) => (r._id || r.id).toString() === routeId.toString());
  }, [routes, routeId]);

  // Fit map to markers whenever the route loads
  useEffect(() => {
    if (selectedRoute?.stops?.length > 0 && mapRef.current) {
      const coordinates = selectedRoute.stops.map(stop => ({
        latitude: parseFloat(stop.latitude),
        longitude: parseFloat(stop.longitude)
      }));

      // Add polyline coords to ensure the whole path fits in view
      if (selectedRoute.polyline?.length > 0) {
        selectedRoute.polyline.forEach(point => {
          coordinates.push({
            latitude: parseFloat(point.latitude),
            longitude: parseFloat(point.longitude)
          });
        });
      }

      // Small delay ensures the map is rendered before animating
      setTimeout(() => {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }, 500);
    }
  }, [selectedRoute]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#196F31" />
        <Text style={styles.loadingText}>Loading Route Data...</Text>
      </View>
    );
  }

  if (!selectedRoute) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="map-outline" size={60} color="#A0B4A5" />
        <Text style={styles.errorText}>Route details not found.</Text>
        <TouchableOpacity style={styles.backBtnFallback} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const routeColor = selectedRoute.color_hex || '#196F31';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <MapView 
        ref={mapRef} 
        style={styles.map} 
        provider={PROVIDER_GOOGLE} 
        initialRegion={{ 
          latitude: selectedRoute.stops?.[0]?.latitude || 24.8607, 
          longitude: selectedRoute.stops?.[0]?.longitude || 67.0011, 
          latitudeDelta: 0.05, 
          longitudeDelta: 0.05 
        }}
      >
        {/* Draw the Route Path */}
        {/* {selectedRoute.polyline && selectedRoute.polyline.length > 0 && (
          <Polyline
            coordinates={selectedRoute.polyline.map(p => ({
              latitude: parseFloat(p.latitude),
              longitude: parseFloat(p.longitude)
            }))}
            strokeColor={routeColor}
            strokeWidth={5}
            lineJoin="round"
            lineCap="round"
          />
        )} */}

        {/* Draw the Stops as Markers */}
        {selectedRoute.stops?.map((stop, index) => {
          const isOrigin = index === 0;
          const isDestination = index === selectedRoute.stops.length - 1;

          return (
            <Marker 
              key={index}
              coordinate={{
                latitude: parseFloat(stop.latitude),
                longitude: parseFloat(stop.longitude)
              }}
              title={stop.stop_name}
              description={isOrigin ? "Origin" : isDestination ? "Destination" : `Stop #${index + 1}`}
            >
              <View style={[
                styles.stopMarker, 
                { borderColor: routeColor },
                (isOrigin || isDestination) && { backgroundColor: routeColor }
              ]}>
                <Ionicons 
                  name={isOrigin ? "flag" : isDestination ? "location" : "bus"} 
                  size={14} 
                  color={(isOrigin || isDestination) ? "#FFF" : routeColor} 
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* ── TOP HEADER (Back Button) ── */}
      <SafeAreaView style={styles.headerPointer} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#196F31" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── BOTTOM ROUTE INFO CARD ── */}
      <View style={styles.bottomCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.routeBadge, { backgroundColor: `${routeColor}20` }]}>
            <Ionicons name="analytics" size={20} color={routeColor} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.routeTitle}>{selectedRoute.route_name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={[styles.colorIndicator, { backgroundColor: routeColor }]} />
              <Text style={styles.routeSubText}>Route Details</Text>
            </View>
          </View>
        </View>

        <View style={styles.pathContainer}>
          <View style={styles.pathNode}>
            <Ionicons name="radio-button-on" size={16} color={routeColor} />
            <Text style={styles.pathText}>{selectedRoute.origin}</Text>
          </View>
          <View style={[styles.pathLine, { borderLeftColor: routeColor }]} />
          <View style={styles.pathNode}>
            <Ionicons name="location" size={16} color={routeColor} />
            <Text style={styles.pathText}>{selectedRoute.destination}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Stops</Text>
            <Text style={[styles.statValue, { color: routeColor }]}>{selectedRoute.stops?.length || 0}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statValue, { color: routeColor }]}>Active</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9F4' },
  map: { flex: 1 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9F4' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '700', color: '#4A6B54' },
  
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9F4' },
  errorText: { fontSize: 18, fontWeight: '700', color: '#4A6B54', marginTop: 16, marginBottom: 24 },
  backBtnFallback: { backgroundColor: '#196F31', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  backBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

  // Floating Header
  headerPointer: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 10 },
  backBtn: { width: 48, height: 48, backgroundColor: '#FFF', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E8F3EB', elevation: 4, shadowColor: '#196F31', shadowOpacity: 0.1, shadowRadius: 10 },

  // Map Markers
  stopMarker: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 3, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },

  // Bottom Info Card
  bottomCard: { position: 'absolute', bottom: 30, left: 16, right: 16, backgroundColor: '#FFF', borderRadius: 28, padding: 20, borderWidth: 2, borderColor: '#E8F3EB', elevation: 10, shadowColor: '#196F31', shadowOpacity: 0.15, shadowRadius: 20 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  routeBadge: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  cardHeaderText: { flex: 1 },
  routeTitle: { fontSize: 20, fontWeight: '900', color: '#123D1F' },
  colorIndicator: { width: 10, height: 10, borderRadius: 5 },
  routeSubText: { fontSize: 13, color: '#A0B4A5', fontWeight: '700', textTransform: 'uppercase' },

  pathContainer: { backgroundColor: '#F0F9F4', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E8F3EB' },
  pathNode: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pathText: { fontSize: 15, fontWeight: '700', color: '#123D1F' },
  pathLine: { borderLeftWidth: 2, height: 20, marginLeft: 7, marginVertical: 4, borderStyle: 'dashed' },

  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: '#F8F9FA', padding: 12, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#EFEFEF' },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '900' },
}); 