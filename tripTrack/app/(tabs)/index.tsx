import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  StatusBar
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query'; 
import { Ionicons } from '@expo/vector-icons';

import { fetchRoutesApi } from '../../service/server'; 

export default function PassengerMap() {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null); 

  // Dummy Data for Recent Locations
  const [recentLocations, setRecentLocations] = useState([
    { id: '1', name: 'SMIU City Campus', address: 'Aiwan-e-Tijarat Road, Karachi', icon: 'school', lat: 24.8504, lng: 67.0011 },
    { id: '2', name: 'Tower', address: 'M.A Jinnah Road, Karachi', icon: 'business', lat: 24.8485, lng: 66.9990 },
    { id: '3', name: 'Model Colony', address: 'Malir, Karachi', icon: 'home', lat: 24.9048, lng: 67.1950 }
  ]);

  const { data: routes, isLoading: loadingRoutes } = useQuery({
    queryKey: ['routes'],
    queryFn: fetchRoutesApi,
    staleTime: 1000 * 60 * 60, 
  });

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          return;
        }
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      } catch (err) {
        setErrorMsg('Error fetching location');
      }
    })();
  }, []);

  // --- FILTERED SEARCH LOGIC ---
  const filteredRecent = useMemo(() => {
    return recentLocations.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, recentLocations]);

  // --- HANDLERS ---
  const toggleMenu = (id) => setActiveMenuId(prevId => (prevId === id ? null : id));

  const handleDeleteLocation = (id) => {
    setRecentLocations(prev => prev.filter(loc => loc.id !== id));
    setActiveMenuId(null);
  };

  const handleSelectLocation = (loc) => {
    setIsSearchVisible(false);
    mapRef.current?.animateToRegion({
      latitude: loc.lat,
      longitude: loc.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  // --- RENDER RECENT ITEM ---
  const renderRecentItem = ({ item }) => {
    const isMenuOpen = activeMenuId === item.id;
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.cardRow} 
          activeOpacity={0.7}
          onPress={() => handleSelectLocation(item)}
        >
          <View style={styles.cardIconBox}>
            <Ionicons name={item.icon || "location"} size={22} color="#fff" />
          </View>
          <View style={styles.cardTextContainer}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>{item.address}</Text>
          </View>
          <TouchableOpacity style={styles.dotsButton} onPress={() => toggleMenu(item.id)}>
            <Ionicons name={isMenuOpen ? "chevron-up" : "ellipsis-vertical"} size={20} color="#888" />
          </TouchableOpacity>
        </TouchableOpacity>

        {isMenuOpen && (
          <View style={styles.gridOptionsContainer}>
            <TouchableOpacity style={[styles.gridBtn, styles.gridBtnPrimary]}>
              <Ionicons name="navigate" size={20} color="#fff" />
              <Text style={styles.gridBtnTextLight}>Direction</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridBtn}>
              <Ionicons name="bus" size={20} color="#00C853" />
              <Text style={styles.gridBtnTextDark}>Nearby</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridBtn}>
              <Ionicons name="heart" size={20} color="#00C853" />
              <Text style={styles.gridBtnTextDark}>Favorite</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gridBtn, styles.gridBtnDanger]} onPress={() => handleDeleteLocation(item.id)}>
              <Ionicons name="trash" size={20} color="#FF3B30" />
              <Text style={styles.gridBtnTextDanger}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MapView 
        ref={mapRef}
        style={styles.map} 
        provider={PROVIDER_GOOGLE} 
        initialRegion={{
          latitude: 24.8607, 
          longitude: 67.0011,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        showsUserLocation={true} 
      >
        {/* Render Routes & Stops */}
        {!loadingRoutes && routes?.map((route) => (
          <React.Fragment key={route._id}>
            <Polyline
              coordinates={route.polyline?.map(p => ({
                latitude: p.lat || p.latitude, 
                longitude: p.lng || p.longitude
              }))}
              strokeColor={route.color_hex || '#00C853'} 
              strokeWidth={5}
              lineJoin="round"
            />
            {/* Optional: Render Stop Markers */}
            {route.stops?.map((stop, idx) => (
              <Marker
                key={`${route._id}-stop-${idx}`}
                coordinate={{
                  latitude: stop.lat || stop.latitude,
                  longitude: stop.lng || stop.longitude
                }}
                tracksViewChanges={false}
              >
                <View style={[styles.stopDot, { borderColor: route.color_hex }]} />
              </Marker>
            ))}
          </React.Fragment>
        ))}
      </MapView>

      <TouchableOpacity 
        style={styles.searchContainer} 
        onPress={() => setIsSearchVisible(true)}
      >
        <Ionicons name="search" size={20} color="#00C853" style={styles.searchIcon} />
        <Text style={styles.searchText}>Where to?</Text>
      </TouchableOpacity>

      {loadingRoutes && (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="small" color="#00C853" />
          <Text style={styles.loadingText}>Updating Routes...</Text>
        </View>
      )}

      <Modal
        visible={isSearchVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsSearchVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.dragHandle} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsSearchVisible(false)} style={styles.backBtn}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.modalSearchBox}>
              <TextInput 
                style={styles.modalSearchInput}
                placeholder="Search destination"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#ccc" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.sheetBody}>
            <Text style={styles.sectionTitle}>Recent Locations</Text>
            <FlatList 
              data={filteredRecent}
              keyExtractor={(item) => item.id}
              renderItem={renderRecentItem}
              contentContainerStyle={styles.listContainer}
              keyboardShouldPersistTaps="always"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  map: { width: '100%', height: '100%' },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 15, right: 15,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  searchIcon: { marginRight: 10 },
  searchText: { fontSize: 16, color: '#666', fontWeight: '500' },
  loadingIndicator: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
  },
  loadingText: { marginLeft: 8, fontSize: 12, color: '#333' },
  
  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#F8F9FA' },
  dragHandle: { width: 35, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  backBtn: { marginRight: 10 },
  modalSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 45,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  modalSearchInput: { flex: 1, fontSize: 16, color: '#333' },
  sheetBody: { flex: 1 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', margin: 20, color: '#444' },
  listContainer: { paddingHorizontal: 15 },
  
  // Card Styles
  cardContainer: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  cardIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#00C853', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  cardSubtitle: { fontSize: 12, color: '#888' },
  dotsButton: { padding: 5 },
  
  // Grid Menu
  gridOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  gridBtn: { width: '48%', backgroundColor: '#F9F9F9', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 8 },
  gridBtnPrimary: { backgroundColor: '#00C853' },
  gridBtnDanger: { backgroundColor: '#FFF5F5' },
  gridBtnTextLight: { fontSize: 12, color: '#fff', marginTop: 4, fontWeight: '600' },
  gridBtnTextDark: { fontSize: 12, color: '#00C853', marginTop: 4, fontWeight: '600' },
  gridBtnTextDanger: { fontSize: 12, color: '#FF3B30', marginTop: 4, fontWeight: '600' }
});