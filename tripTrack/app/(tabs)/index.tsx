if (__DEV__) {
  require("../../reactotron");
}

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  FlatList,
  SafeAreaView
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query'; 
import { Ionicons } from '@expo/vector-icons';

import { fetchRoutesApi } from '../../service/server'; 

export default function PassengerMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null); 

  // Dummy Data for Recent Locations
  const [recentLocations, setRecentLocations] = useState([
    { id: '1', name: 'SMIU City Campus', address: 'Aiwan-e-Tijarat Road, Karachi' },
    { id: '2', name: 'Tower', address: 'M.A Jinnah Road, Karachi' },
    { id: '3', name: 'Model Colony', address: 'Malir, Karachi' }
  ]);

  const { data: routes, isLoading: loadingRoutes } = useQuery({
    queryKey: ['routes'],
    queryFn: fetchRoutesApi,
    staleTime: 1000 * 60 * 60, 
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);
    })();
  }, []);

  // --- HANDLERS FOR LOCATION MENU ---
  const toggleMenu = (id) => {
    setActiveMenuId(prevId => (prevId === id ? null : id));
  };

  const handleDeleteLocation = (id) => {
    setRecentLocations(prev => prev.filter(loc => loc.id !== id));
    setActiveMenuId(null);
  };

  // --- RENDER RECENT LOCATION ITEM ---
  const renderRecentItem = ({ item }) => {
    const isMenuOpen = activeMenuId === item.id;

    return (
      <View style={styles.recentItemContainer}>
        <View style={styles.recentItemRow}>
          <View style={styles.recentIconBox}>
            <Ionicons name="time-outline" size={20} color="#666" />
          </View>
          
          <View style={styles.recentTextContainer}>
            <Text style={styles.recentTitle}>{item.name}</Text>
            <Text style={styles.recentSubtitle}>{item.address}</Text>
          </View>

          <TouchableOpacity onPress={() => toggleMenu(item.id)} style={styles.dotsButton}>
            <Ionicons name="ellipsis-vertical" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* EXPANDABLE MENU ACTIONS */}
        {isMenuOpen && (
          <View style={styles.menuOptionsContainer}>
            <TouchableOpacity style={styles.menuOptionBtn}>
              <Ionicons name="navigate-circle-outline" size={18} color="#00C853" />
              <Text style={styles.menuOptionText}>Direction</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOptionBtn}>
              <Ionicons name="bus-outline" size={18} color="#00C853" />
              <Text style={styles.menuOptionText}>Nearby Buses</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuOptionBtn}>
              <Ionicons name="heart-outline" size={18} color="#00C853" />
              <Text style={styles.menuOptionText}>Favorite</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuOptionBtn} 
              onPress={() => handleDeleteLocation(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              <Text style={[styles.menuOptionText, { color: '#FF3B30' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        provider={PROVIDER_GOOGLE} 
        initialRegion={{
          latitude: 24.8607, 
          longitude: 67.0011,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true} 
        showsMyLocationButton={true}
      >
        {!loadingRoutes && routes?.map((route, index) => (
          <Polyline
            key={route._id || index}
            coordinates={route.polyline?.map(p => ({
              latitude: p.lat || p.latitude, 
              longitude: p.lng || p.longitude
            }))}
            strokeColor={route.color || "#FF0000"} 
            strokeWidth={4}
          />
        ))}
      </MapView>

      {/* --- FLOATING SEARCH BAR (TRIGGERS MODAL) --- */}
      <TouchableOpacity 
        style={styles.searchContainer} 
        activeOpacity={0.8}
        onPress={() => setIsSearchVisible(true)}
      >
        <Ionicons name="search" size={20} color="#555" style={styles.searchIcon} />
        <Text style={styles.searchText}>Where to?</Text>
      </TouchableOpacity>

      {/* --- LOADING INDICATOR --- */}
      {loadingRoutes && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#00C853" />
          <Text style={{ fontSize: 10, marginTop: 4 }}>Loading Routes...</Text>
        </View>
      )}

      {/* ========================================= */}
      {/* --- SLIDING SEARCH FULL-SCREEN MODAL ---- */}
      {/* ========================================= */}
      <Modal
        visible={isSearchVisible}
        animationType="slide"
        onRequestClose={() => setIsSearchVisible(false)} 
      >
        <SafeAreaView style={styles.modalContainer}>
          
          {/* Top Search Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsSearchVisible(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            
            <View style={styles.modalSearchBox}>
              <TextInput 
                style={styles.modalSearchInput}
                placeholder="Where do you want to go?"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true} 
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#ccc" />
                </TouchableOpacity>
              )}
            </View>
          </View>

        
          <Text style={styles.sectionTitle}>Recent Locations</Text>
          
          <FlatList 
            data={recentLocations}
            keyExtractor={(item) => item.id}
            renderItem={renderRecentItem}
            contentContainerStyle={styles.listContainer}
            keyboardShouldPersistTaps="handled" 
          />

        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5, 
    flexDirection: 'row',
    alignItems: 'center'
  },
  searchIcon: {
    marginRight: 10,
  },
  searchText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 20,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backBtn: {
    padding: 5,
    marginRight: 10,
  },
  modalSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 45,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  recentItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  recentIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  recentTextContainer: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recentSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  dotsButton: {
    padding: 10,
  },
  menuOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    marginBottom: 10,
  },
  menuOptionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    flex: 1,
  },
  menuOptionText: {
    fontSize: 10,
    marginTop: 4,
    color: '#00C853',
    fontWeight: '600'
  }
});