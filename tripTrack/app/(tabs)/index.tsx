if (__DEV__) {
  require("../../reactotron");
}

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useQuery } from '@tanstack/react-query'; 
import { fetchRoutesApi } from '../../service/server'; 

export default function PassengerMap() {
  const [userLocation, setUserLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const { data: routes, isLoading: loadingRoutes } = useQuery({
    queryKey: ['routes'],
    queryFn: fetchRoutesApi,
    staleTime: 1000 * 60 * 60, 
  });

  // Get User Permissions on Load
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

        {/* 
        {routes?.map(route => route.stops?.map((stop, i) => (
             <Marker 
               key={i}
               coordinate={{ latitude: stop.lat, longitude: stop.lng }}
               title={stop.name}
             />
        )))} 
        */}

      </MapView>

      {/* --- SEARCH BAR --- */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchText}>Where to?</Text>
      </View>

      {/* --- LOADING INDICATOR --- */}
      {loadingRoutes && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#00C853" />
          <Text style={{ fontSize: 10, marginTop: 4 }}>Loading Routes...</Text>
        </View>
      )}
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
  },
  searchText: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
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
  }
});